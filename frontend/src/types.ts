export type Role =
'Admin' |
'Project Manager' |
'Developer' |
'Tester' |
'Business Analyst';

export type Specialization =
'Front-end Developer' |
'Back-end Developer' |
'Automation Tester' |
'Manual Tester' |
'Business Analyst';

export type ExperienceLevel = 'Junior' | 'Middle' | 'Senior';

export type ProjectStatus = 'Planned' | 'Active' | 'Completed' | 'Extended';

export type AllocationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Released';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: 'Active' | 'Inactive';
}

export interface Allocation {
  id: string;
  projectId: string;
  employeeId: string;
  allocatedEffort: number; // 0-100
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AllocationStatus;
}

export interface Employee {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  contractStartDate: string; // YYYY-MM-DD
  specialization: Specialization;
  allocations: Allocation[];
  experienceLevel?: ExperienceLevel;
  availableEffort?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pmId: string;
}