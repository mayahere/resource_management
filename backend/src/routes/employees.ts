import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All employee routes require authentication
router.use(authenticateJWT);

// Helper function to calculate experience level
const getExperienceLevel = (contractStartDate: Date): string => {
  const start = new Date(contractStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

  if (diffYears < 2) return 'Junior';
  if (diffYears <= 5) return 'Middle';
  return 'Senior';
};

// Helper function to calculate available effort at a specific date or date range
const calculateAvailableEffort = (allocations: any[], targetDate: Date = new Date()): number => {
  const now = new Date(targetDate);
  now.setHours(0, 0, 0, 0);

  const activeAllocations = allocations.filter((a) => {
    if (a.status !== 'Approved') return false;
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    return start <= now && end >= now;
  });

  const totalAllocated = activeAllocations.reduce((sum, a) => sum + a.allocatedEffort, 0);
  return Math.max(0, 100 - totalAllocated);
};

// GET / - Read employees list
router.get('/', async (req, res) => {
  const { specialization, level, available, startDate, endDate } = req.query;

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            status: true,
          },
        },
        allocations: true,
      },
      where: {
        user: {
          status: 'Active',
        },
      },
    });

    // Map and calculate dynamic fields
    let mappedEmployees = employees.map((emp) => {
      const expLevel = getExperienceLevel(emp.contractStartDate);
      const availEffort = calculateAvailableEffort(emp.allocations);

      return {
        id: emp.id,
        userId: emp.userId,
        fullName: emp.user.fullName,
        email: emp.user.email,
        contractStartDate: emp.contractStartDate.toISOString().split('T')[0],
        specialization: emp.specialization,
        experienceLevel: expLevel,
        availableEffort: availEffort,
        allocations: emp.allocations.map(a => ({
          ...a,
          startDate: a.startDate.toISOString().split('T')[0],
          endDate: a.endDate.toISOString().split('T')[0],
        })),
      };
    });

    // Apply filters if provided via query parameters
    if (specialization && specialization !== 'All') {
      mappedEmployees = mappedEmployees.filter(
        (e) => e.specialization.toLowerCase() === (specialization as string).toLowerCase()
      );
    }

    if (level && level !== 'All') {
      mappedEmployees = mappedEmployees.filter(
        (e) => e.experienceLevel.toLowerCase() === (level as string).toLowerCase()
      );
    }

    if (available) {
      const minAvail = parseInt(available as string, 10);
      if (!isNaN(minAvail)) {
        mappedEmployees = mappedEmployees.filter((e) => e.availableEffort >= minAvail);
      }
    }

    // Filter by overlapping date range if requested
    if (startDate && endDate) {
      const filterStart = new Date(startDate as string);
      const filterEnd = new Date(endDate as string);

      mappedEmployees = mappedEmployees.map((emp) => {
        // Calculate max concurrent allocation during this date range
        // Find allocations that overlap with the filtered range
        const overlapping = emp.allocations.filter((a) => {
          if (a.status !== 'Approved') return false;
          const aStart = new Date(a.startDate);
          const aEnd = new Date(a.endDate);
          return filterStart <= aEnd && filterEnd >= aStart;
        });

        // Sum effort of overlapping allocations
        const totalOverlappingEffort = overlapping.reduce((sum, a) => sum + a.allocatedEffort, 0);
        const rangeAvail = Math.max(0, 100 - totalOverlappingEffort);

        return {
          ...emp,
          availableEffort: rangeAvail, // Override available effort for this range
        };
      });
    }

    res.json(mappedEmployees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create or initialize employee profile manually
router.post('/', async (req, res) => {
  const { userId, contractStartDate, specialization } = req.body;

  if (!userId || !contractStartDate || !specialization) {
    return res.status(400).json({ error: 'userId, contractStartDate, and specialization are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await prisma.employee.findUnique({ where: { userId } });
    if (existing) {
      return res.status(400).json({ error: 'Employee profile already exists for this user' });
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        contractStartDate: new Date(contractStartDate),
        specialization,
        availableEffort: 100,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id - Update employee contract/specialization
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { contractStartDate, specialization } = req.body;

  try {
    const data: any = {};
    if (contractStartDate) data.contractStartDate = new Date(contractStartDate);
    if (specialization) data.specialization = specialization;

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
