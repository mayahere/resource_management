import { Employee, Project, User } from './types';

export const mockCurrentUser: User = {
  id: 'u1',
  fullName: 'Admin User',
  email: 'admin@hrrams.local',
  role: 'Admin',
  status: 'Active'
};

export const mockProjects: Project[] = [
{
  id: 'p1',
  name: 'Fintech Mobile App',
  description: 'Core banking mobile application for iOS and Android.',
  startDate: '2024-01-01',
  endDate: '2026-12-31',
  pmId: 'u2'
},
{
  id: 'p2',
  name: 'E-commerce Platform',
  description: 'B2B e-commerce web platform migration.',
  startDate: '2025-06-01',
  endDate: '2026-08-31',
  pmId: 'u3'
},
{
  id: 'p3',
  name: 'Internal HR System',
  description: 'Resource allocation and tracking system.',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  pmId: 'u2'
}];


export const mockEmployees: Employee[] = [
{
  id: 'e1',
  userId: 'u4',
  fullName: 'Nguyen Van A',
  email: 'a.nguyen@hrrams.local',
  contractStartDate: '2020-03-15',
  specialization: 'Back-end Developer',
  allocations: [
  {
    id: 'a1',
    projectId: 'p1',
    employeeId: 'e1',
    allocatedEffort: 50,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    status: 'Approved'
  },
  {
    id: 'a2',
    projectId: 'p3',
    employeeId: 'e1',
    allocatedEffort: 30,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    status: 'Approved'
  }]

},
{
  id: 'e2',
  userId: 'u5',
  fullName: 'Tran Thi B',
  email: 'b.tran@hrrams.local',
  contractStartDate: '2023-01-10',
  specialization: 'Front-end Developer',
  allocations: [
  {
    id: 'a3',
    projectId: 'p1',
    employeeId: 'e2',
    allocatedEffort: 100,
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    status: 'Released'
  }]

},
{
  id: 'e3',
  userId: 'u6',
  fullName: 'Le Van C',
  email: 'c.le@hrrams.local',
  contractStartDate: '2025-02-01',
  specialization: 'Manual Tester',
  allocations: []
},
{
  id: 'e4',
  userId: 'u7',
  fullName: 'Pham Thi D',
  email: 'd.pham@hrrams.local',
  contractStartDate: '2018-11-01',
  specialization: 'Business Analyst',
  allocations: [
  {
    id: 'a4',
    projectId: 'p2',
    employeeId: 'e4',
    allocatedEffort: 80,
    startDate: '2025-06-01',
    endDate: '2026-08-31',
    status: 'Approved'
  }]

}];