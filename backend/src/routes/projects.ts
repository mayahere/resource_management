import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All project routes require authentication
router.use(authenticateJWT);

// Helper function to calculate project status dynamically
const getProjectStatus = (project: { startDate: Date; endDate: Date; originalEndDate: Date; status?: string }): string => {
  if (project.status === 'Deleted') return 'Deleted';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const originalEnd = new Date(project.originalEndDate);

  if (end.getTime() > originalEnd.getTime()) {
    return 'Extended';
  }
  if (now < start) {
    return 'Planned';
  }
  if (now >= start && now <= end) {
    return 'Active';
  }
  return 'Completed';
};

// GET / - Read all active projects (filtering out Deleted)
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        status: {
          not: 'Deleted',
        },
      },
      include: {
        pm: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        requirements: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const mappedProjects = projects.map((proj) => {
      const computedStatus = getProjectStatus(proj);
      return {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        startDate: proj.startDate.toISOString().split('T')[0],
        endDate: proj.endDate.toISOString().split('T')[0],
        originalEndDate: proj.originalEndDate.toISOString().split('T')[0],
        pmId: proj.pmId,
        pmName: proj.pm.fullName,
        pmEmail: proj.pm.email,
        status: computedStatus,
        requirements: proj.requirements.map((req) => ({
          id: req.id,
          specialization: req.specialization,
          requiredEffort: req.requiredEffort,
        })),
      };
    });

    res.json(mappedProjects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create Project (Admin only)
router.post('/', requireRole(['Admin']), async (req, res) => {
  const { name, description, startDate, endDate, pmId, requirements } = req.body;

  if (!name || !description || !startDate || !endDate || !pmId) {
    return res.status(400).json({ error: 'name, description, startDate, endDate, and pmId are required' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return res.status(400).json({ error: 'Start date must be before or equal to end date' });
  }

  try {
    // Validate PM
    const pmUser = await prisma.user.findUnique({ where: { id: pmId } });
    if (!pmUser || pmUser.role !== 'Project Manager' || pmUser.status === 'Inactive') {
      return res.status(400).json({ error: 'Assigned PM must be an active user with Project Manager role' });
    }

    // Validate requirements if provided
    if (requirements && Array.isArray(requirements)) {
      let totalEffort = 0;
      for (const reqItem of requirements) {
        if (!reqItem.specialization || typeof reqItem.requiredEffort !== 'number' || reqItem.requiredEffort <= 0) {
          return res.status(400).json({ error: 'Invalid project requirements' });
        }
        totalEffort += reqItem.requiredEffort;
      }
      if (totalEffort <= 0) {
        return res.status(400).json({ error: 'Total resource requirements effort must be greater than 0' });
      }
    }

    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          name,
          description,
          startDate: start,
          endDate: end,
          originalEndDate: end, // Init to same as end date
          pmId,
          status: 'Planned', // prisma requires status field, will be calculated dynamically on get
        },
      });

      if (requirements && Array.isArray(requirements) && requirements.length > 0) {
        await tx.projectRequirement.createMany({
          data: requirements.map((reqItem) => ({
            projectId: newProj.id,
            specialization: reqItem.specialization,
            requiredEffort: reqItem.requiredEffort,
          })),
        });
      }

      return newProj;
    });

    const status = getProjectStatus(project);
    res.status(201).json({ ...project, status });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id - Update Project (Admin only)
router.put('/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { description, endDate, pmId, requirements } = req.body;

  try {
    const existing = await prisma.project.findUnique({
      where: { id },
      include: { requirements: true },
    });
    if (!existing || existing.status === 'Deleted') {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data: any = {};
    if (description !== undefined) data.description = description;
    if (endDate !== undefined) {
      const newEnd = new Date(endDate);
      if (existing.startDate > newEnd) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
      data.endDate = newEnd;
    }
    if (pmId !== undefined) {
      const pmUser = await prisma.user.findUnique({ where: { id: pmId } });
      if (!pmUser || pmUser.role !== 'Project Manager' || pmUser.status === 'Inactive') {
        return res.status(400).json({ error: 'Assigned PM must be an active Project Manager' });
      }
      data.pmId = pmId;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.update({
        where: { id },
        data,
      });

      if (requirements && Array.isArray(requirements)) {
        // Simple strategy: delete existing requirements and recreate
        await tx.projectRequirement.deleteMany({ where: { projectId: id } });
        if (requirements.length > 0) {
          await tx.projectRequirement.createMany({
            data: requirements.map((reqItem) => ({
              projectId: id,
              specialization: reqItem.specialization,
              requiredEffort: reqItem.requiredEffort,
            })),
          });
        }
      }

      return proj;
    });

    const status = getProjectStatus(updated);
    res.json({ ...updated, status });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Soft Delete Project (Admin only)
router.delete('/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.project.update({
      where: { id },
      data: { status: 'Deleted' },
    });
    res.json({ message: 'Project soft-deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
