import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { authenticateJWT, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All user routes require authentication and Admin role
router.use(authenticateJWT, requireRole(['Admin']));

// GET /api/users - Get all users
router.use('/users', router); // we will map this in index.ts, so paths here will be relative to /api/users.
// Wait, to prevent path double nesting, let's write routes directly matching /:id or /:
// In index.ts, we mount this at /api/users. So '/' means GET all, etc.

// GET / - Read all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST / - Create User
router.post('/', async (req, res) => {
  const { fullName, email, password, role, contractStartDate, specialization } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'fullName, email, password, and role are required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          role,
          status: 'Active',
        },
      });

      // If the role implies an employee, create the employee profile
      const employeeRoles = ['Developer', 'Tester', 'Business Analyst'];
      if (employeeRoles.includes(role)) {
        let mappedSpec = specialization;
        if (!mappedSpec) {
          if (role === 'Developer') mappedSpec = 'Back-end Developer';
          else if (role === 'Tester') mappedSpec = 'Manual Tester';
          else mappedSpec = 'Business Analyst';
        }

        await tx.employee.create({
          data: {
            userId: user.id,
            contractStartDate: contractStartDate ? new Date(contractStartDate) : new Date(),
            specialization: mappedSpec,
            availableEffort: 100,
          },
        });
      }

      return user;
    });

    const { password: _, ...userSansPassword } = result;
    res.status(201).json(userSansPassword);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id - Update User (Role, Status, Password)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { role, status, password } = req.body;

  try {
    const data: any = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (password !== undefined) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    const { password: _, ...userSansPassword } = user;
    res.json(userSansPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id - Soft delete User (mark as Inactive)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status: 'Inactive' },
    });

    res.json({ message: 'User soft-deleted successfully', user: { id: user.id, status: user.status } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
