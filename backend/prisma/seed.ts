import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.resourceAllocation.deleteMany();
  await prisma.projectRequirement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@hrrams.local',
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      fullName: 'PM User 1 (Alice)',
      email: 'alice.pm@hrrams.local',
      password: hashedPassword,
      role: 'Project Manager',
      status: 'Active',
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      fullName: 'PM User 2 (Bob)',
      email: 'bob.pm@hrrams.local',
      password: hashedPassword,
      role: 'Project Manager',
      status: 'Active',
    },
  });

  const userA = await prisma.user.create({
    data: {
      fullName: 'Nguyen Van A',
      email: 'a.nguyen@hrrams.local',
      password: hashedPassword,
      role: 'Developer',
      status: 'Active',
    },
  });

  const userB = await prisma.user.create({
    data: {
      fullName: 'Tran Thi B',
      email: 'b.tran@hrrams.local',
      password: hashedPassword,
      role: 'Developer',
      status: 'Active',
    },
  });

  const userC = await prisma.user.create({
    data: {
      fullName: 'Le Van C',
      email: 'c.le@hrrams.local',
      password: hashedPassword,
      role: 'Tester',
      status: 'Active',
    },
  });

  const userD = await prisma.user.create({
    data: {
      fullName: 'Pham Thi D',
      email: 'd.pham@hrrams.local',
      password: hashedPassword,
      role: 'Business Analyst',
      status: 'Active',
    },
  });

  // Create Employees
  const empA = await prisma.employee.create({
    data: {
      userId: userA.id,
      contractStartDate: new Date('2020-03-15'),
      specialization: 'Back-end Developer',
      availableEffort: 100, // will be computed but set default
    },
  });

  const empB = await prisma.employee.create({
    data: {
      userId: userB.id,
      contractStartDate: new Date('2023-01-10'),
      specialization: 'Front-end Developer',
      availableEffort: 100,
    },
  });

  const empC = await prisma.employee.create({
    data: {
      userId: userC.id,
      contractStartDate: new Date('2025-02-01'),
      specialization: 'Manual Tester',
      availableEffort: 100,
    },
  });

  const empD = await prisma.employee.create({
    data: {
      userId: userD.id,
      contractStartDate: new Date('2018-11-01'),
      specialization: 'Business Analyst',
      availableEffort: 100,
    },
  });

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Fintech Mobile App',
      description: 'Core banking mobile application for iOS and Android.',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      originalEndDate: new Date('2026-12-31'),
      pmId: pm1.id,
      status: 'Active',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'B2B e-commerce web platform migration.',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-08-31'),
      originalEndDate: new Date('2026-08-31'),
      pmId: pm2.id,
      status: 'Active',
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Internal HR System',
      description: 'Resource allocation and tracking system.',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      originalEndDate: new Date('2026-06-30'),
      pmId: pm1.id,
      status: 'Active',
    },
  });

  // Create Project Requirements
  await prisma.projectRequirement.createMany({
    data: [
      { projectId: project1.id, specialization: 'Back-end Developer', requiredEffort: 300 },
      { projectId: project1.id, specialization: 'Front-end Developer', requiredEffort: 150 },
      { projectId: project1.id, specialization: 'Manual Tester', requiredEffort: 50 },
      { projectId: project2.id, specialization: 'Business Analyst', requiredEffort: 100 },
    ],
  });

  // Create Resource Allocations
  // empA allocated to project 1 (50%) and project 3 (30%)
  await prisma.resourceAllocation.create({
    data: {
      projectId: project1.id,
      employeeId: empA.id,
      allocatedEffort: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'Approved',
    },
  });

  await prisma.resourceAllocation.create({
    data: {
      projectId: project3.id,
      employeeId: empA.id,
      allocatedEffort: 30,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      status: 'Approved',
    },
  });

  // empB allocated to project 1 (100%), but released (finished)
  await prisma.resourceAllocation.create({
    data: {
      projectId: project1.id,
      employeeId: empB.id,
      allocatedEffort: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'Released',
    },
  });

  // empD allocated to project 2 (80%)
  await prisma.resourceAllocation.create({
    data: {
      projectId: project2.id,
      employeeId: empD.id,
      allocatedEffort: 80,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-08-31'),
      status: 'Approved',
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
