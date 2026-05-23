import { ExperienceLevel, ProjectStatus, Allocation, Project } from './types';

// Calculate experience level based on contract start date
export const calculateExperienceLevel = (
contractStartDate: string)
: ExperienceLevel => {
  const start = new Date(contractStartDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

  if (diffYears < 2) return 'Junior';
  if (diffYears <= 5) return 'Middle';
  return 'Senior';
};

// Calculate available effort for an employee at the current date
export const calculateAvailableEffort = (allocations: Allocation[]): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activeAllocations = allocations.filter((a) => {
    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    return a.status === 'Approved' && start <= now && end >= now;
  });

  const totalAllocated = activeAllocations.reduce(
    (sum, a) => sum + a.allocatedEffort,
    0
  );
  return Math.max(0, 100 - totalAllocated);
};

// Determine project status based on dates
export const getProjectStatus = (project: Project): ProjectStatus => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  if (now < start) return 'Planned';
  if (now >= start && now <= end) return 'Active';
  return 'Completed';
};

// Format date to readable string
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Check if an allocation overlaps and exceeds 100% capacity
export const validateAllocation = (
newAllocation: Omit<Allocation, 'id' | 'status'>,
existingAllocations: Allocation[])
: {valid: boolean;reason?: string;} => {
  const newStart = new Date(newAllocation.startDate);
  const newEnd = new Date(newAllocation.endDate);

  if (newStart > newEnd) {
    return { valid: false, reason: 'Start date must be before end date.' };
  }

  // Find overlapping allocations
  const overlapping = existingAllocations.filter((a) => {
    if (a.status !== 'Approved') return false;
    const aStart = new Date(a.startDate);
    const aEnd = new Date(a.endDate);
    return newStart <= aEnd && newEnd >= aStart;
  });

  // Calculate max concurrent effort during this period (simplified for prototype)
  // In a real system, we'd check every day in the range. Here we just sum overlapping.
  const totalOverlappingEffort = overlapping.reduce(
    (sum, a) => sum + a.allocatedEffort,
    0
  );

  if (totalOverlappingEffort + newAllocation.allocatedEffort > 100) {
    return {
      valid: false,
      reason: `Over-allocation detected. Employee only has ${100 - totalOverlappingEffort}% available during this period.`
    };
  }

  return { valid: true };
};