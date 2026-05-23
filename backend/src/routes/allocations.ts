import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper to auto-release expired allocations
export const releaseExpiredAllocations = async () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  try {
    const result = await prisma.resourceAllocation.updateMany({
      where: {
        status: 'Approved',
        endDate: {
          lt: now,
        },
      },
      data: {
        status: 'Released',
      },
    });
    if (result.count > 0) {
      console.log(`Auto-released ${result.count} expired allocations.`);
    }
  } catch (error) {
    console.error('Error auto-releasing allocations:', error);
  }
};

// All resource-request routes require authentication
router.use(authenticateJWT);

// GET / - Read all resource requests
// Admins see everything. PMs see requests for projects they manage.
router.get('/', async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  // Perform lazy auto release before fetching
  await releaseExpiredAllocations();

  try {
    let whereClause: any = {};
    
    // If PM, restrict to projects they manage
    if (req.user.role === 'Project Manager') {
      whereClause = {
        project: {
          pmId: req.user.id,
        },
      };
    } else if (req.user.role !== 'Admin') {
      // Developers/Testers/BAs can only see their own allocations
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (!employee) {
        return res.json([]);
      }
      whereClause = {
        employeeId: employee.id,
      };
    }

    const allocations = await prisma.resourceAllocation.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            pmId: true,
          },
        },
        employee: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const mapped = allocations.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      projectName: a.project.name,
      employeeId: a.employeeId,
      employeeName: a.employee.user.fullName,
      employeeEmail: a.employee.user.email,
      specialization: a.employee.specialization,
      allocatedEffort: a.allocatedEffort,
      startDate: a.startDate.toISOString().split('T')[0],
      endDate: a.endDate.toISOString().split('T')[0],
      status: a.status,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create Resource Request (PM or Admin only)
router.post('/', requireRole(['Admin', 'Project Manager']), async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const { projectId, employeeId, allocatedEffort, startDate, endDate } = req.body;

  if (!projectId || !employeeId || !allocatedEffort || !startDate || !endDate) {
    return res.status(400).json({ error: 'projectId, employeeId, allocatedEffort, startDate, and endDate are required' });
  }

  const effort = parseInt(allocatedEffort, 10);
  if (isNaN(effort) || effort <= 0 || effort > 100) {
    return res.status(400).json({ error: 'Effort must be between 1 and 100%' });
  }

  const reqStart = new Date(startDate);
  const reqEnd = new Date(endDate);

  if (reqStart > reqEnd) {
    return res.status(400).json({ error: 'Start date must be before or equal to end date' });
  }

  // Auto-release before checks
  await releaseExpiredAllocations();

  try {
    // 1. Validate project existence and PM assignment
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status === 'Deleted') {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role === 'Project Manager' && project.pmId !== req.user.id) {
      return res.status(403).json({ error: 'You can only request resources for projects you manage' });
    }

    // Rule 2: Date within Project Period
    if (reqStart < project.startDate || reqEnd > project.endDate) {
      return res.status(400).json({
        error: `Allocation period must be within project duration (${project.startDate.toISOString().split('T')[0]} to ${project.endDate.toISOString().split('T')[0]})`
      });
    }

    // 2. Validate employee existence
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { allocations: true },
    });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Rule 3: No Overlapping Over-allocation
    // Find all approved allocations that overlap with the new request period
    const overlapping = employee.allocations.filter((a) => {
      if (a.status !== 'Approved') return false;
      const aStart = new Date(a.startDate);
      const aEnd = new Date(a.endDate);
      return reqStart <= aEnd && reqEnd >= aStart;
    });

    const totalOverlappingEffort = overlapping.reduce((sum, a) => sum + a.allocatedEffort, 0);

    if (totalOverlappingEffort + effort > 100) {
      return res.status(400).json({
        error: `Over-allocation detected. Employee only has ${100 - totalOverlappingEffort}% available effort during this overlapping period.`
      });
    }

    // Create request with 'Pending' status. (PM creates request, Admin must approve)
    // Wait, if it's the Admin creating it directly, we can auto-approve it.
    const initialStatus = req.user.role === 'Admin' ? 'Approved' : 'Pending';

    const allocation = await prisma.resourceAllocation.create({
      data: {
        projectId,
        employeeId,
        allocatedEffort: effort,
        startDate: reqStart,
        endDate: reqEnd,
        status: initialStatus,
      },
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error('Create resource request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id/approve - Approve Request (Admin only)
router.put('/:id/approve', requireRole(['Admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await releaseExpiredAllocations();

  try {
    const request = await prisma.resourceAllocation.findUnique({
      where: { id },
      include: {
        employee: {
          include: { allocations: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Resource request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot approve allocation with status: ${request.status}` });
    }

    // Re-verify constraints in case another allocation was approved in the meantime
    const reqStart = new Date(request.startDate);
    const reqEnd = new Date(request.endDate);

    const overlapping = request.employee.allocations.filter((a) => {
      if (a.status !== 'Approved') return false;
      const aStart = new Date(a.startDate);
      const aEnd = new Date(a.endDate);
      return reqStart <= aEnd && reqEnd >= aStart;
    });

    const totalOverlappingEffort = overlapping.reduce((sum, a) => sum + a.allocatedEffort, 0);

    if (totalOverlappingEffort + request.allocatedEffort > 100) {
      return res.status(400).json({
        error: `Cannot approve. This request would over-allocate the employee. Available effort is only ${100 - totalOverlappingEffort}%.`
      });
    }

    const updated = await prisma.resourceAllocation.update({
      where: { id },
      data: { status: 'Approved' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id/reject - Reject Request (Admin only)
router.put('/:id/reject', requireRole(['Admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const request = await prisma.resourceAllocation.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Resource request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot reject allocation with status: ${request.status}` });
    }

    const updated = await prisma.resourceAllocation.update({
      where: { id },
      data: { status: 'Rejected' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id - Edit Resource Allocation (Admin or PM only)
router.put('/:id', requireRole(['Admin', 'Project Manager']), async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { allocatedEffort, startDate, endDate } = req.body;

  if (!allocatedEffort || !startDate || !endDate) {
    return res.status(400).json({ error: 'allocatedEffort, startDate, and endDate are required' });
  }

  const effort = parseInt(allocatedEffort, 10);
  if (isNaN(effort) || effort <= 0 || effort > 100) {
    return res.status(400).json({ error: 'Effort must be between 1 and 100%' });
  }

  const reqStart = new Date(startDate);
  const reqEnd = new Date(endDate);

  if (reqStart > reqEnd) {
    return res.status(400).json({ error: 'Start date must be before or equal to end date' });
  }

  // Auto-release before checks
  await releaseExpiredAllocations();

  try {
    const allocation = await prisma.resourceAllocation.findUnique({
      where: { id },
      include: {
        project: true,
        employee: {
          include: { allocations: true },
        },
      },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Permission check: Admin or PM of the project
    if (req.user.role === 'Project Manager' && allocation.project.pmId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit allocations for projects you manage' });
    }

    // Rule 2: Date within Project Period
    if (reqStart < allocation.project.startDate || reqEnd > allocation.project.endDate) {
      return res.status(400).json({
        error: `Allocation period must be within project duration (${allocation.project.startDate.toISOString().split('T')[0]} to ${allocation.project.endDate.toISOString().split('T')[0]})`
      });
    }

    // Rule 3: No Overlapping Over-allocation
    // Find all approved allocations that overlap, excluding the current one
    const overlapping = allocation.employee.allocations.filter((a) => {
      if (a.id === id) return false; // exclude current
      if (a.status !== 'Approved') return false;
      const aStart = new Date(a.startDate);
      const aEnd = new Date(a.endDate);
      return reqStart <= aEnd && reqEnd >= aStart;
    });

    const totalOverlappingEffort = overlapping.reduce((sum, a) => sum + a.allocatedEffort, 0);

    if (totalOverlappingEffort + effort > 100) {
      return res.status(400).json({
        error: `Over-allocation detected. Employee only has ${100 - totalOverlappingEffort}% available effort during this overlapping period.`
      });
    }

    // Admin updates are Approved; PM updates become Pending
    const updatedStatus = req.user.role === 'Admin' ? 'Approved' : 'Pending';

    const updated = await prisma.resourceAllocation.update({
      where: { id },
      data: {
        allocatedEffort: effort,
        startDate: reqStart,
        endDate: reqEnd,
        status: updatedStatus,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update allocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Delete/Remove Resource Allocation (Admin or PM only)
router.delete('/:id', requireRole(['Admin', 'Project Manager']), async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const allocation = await prisma.resourceAllocation.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    // Permission check: Admin or PM of the project
    if (req.user.role === 'Project Manager' && allocation.project.pmId !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove allocations for projects you manage' });
    }

    await prisma.resourceAllocation.delete({
      where: { id },
    });

    res.json({ message: 'Allocation removed successfully' });
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

