import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Employee, Project, Allocation } from '../types';
import { validateAllocation } from '../utils';

interface EditResourceAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  allocation: Allocation & { employee: Employee };
  onSubmit: (
    allocationId: string,
    effort: number,
    startDate: string,
    endDate: string
  ) => void;
}

export function EditResourceAllocationModal({
  isOpen,
  onClose,
  project,
  allocation,
  onSubmit
}: EditResourceAllocationModalProps) {
  const [effort, setEffort] = useState<number>(allocation.allocatedEffort);
  const [startDate, setStartDate] = useState<string>(allocation.startDate);
  const [endDate, setEndDate] = useState<string>(allocation.endDate);
  const [error, setError] = useState<string | null>(null);

  // Update form inputs when selected allocation changes
  useEffect(() => {
    if (allocation) {
      setEffort(allocation.allocatedEffort);
      setStartDate(allocation.startDate);
      setEndDate(allocation.endDate);
      setError(null);
    }
  }, [allocation]);

  if (!isOpen || !allocation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (effort <= 0 || effort > 100) {
      setError('Effort must be between 1 and 100%.');
      return;
    }

    // Rule 2: Date within Project Period
    if (
      new Date(startDate) < new Date(project.startDate) ||
      new Date(endDate) > new Date(project.endDate)
    ) {
      setError(
        `Allocation period must be within project dates (${project.startDate} to ${project.endDate}).`
      );
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    // Filter out this allocation itself from existing allocations when validating overlap
    const otherAllocations = allocation.employee.allocations.filter(
      (a) => a.id !== allocation.id
    );

    const validation = validateAllocation(
      {
        projectId: project.id,
        employeeId: allocation.employeeId,
        allocatedEffort: effort,
        startDate,
        endDate
      },
      otherAllocations
    );

    if (!validation.valid) {
      setError(validation.reason || 'Invalid allocation.');
      return;
    }

    onSubmit(allocation.id, effort, startDate, endDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Edit Resource Allocation
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <p className="text-sm font-medium text-slate-800">
              Project: <span className="font-semibold">{project.name}</span>
            </p>
            <p className="text-xs text-slate-500">
              Project Duration: {project.startDate} to {project.endDate}
            </p>
            <div className="h-px bg-slate-200 my-2" />
            <p className="text-sm font-medium text-slate-800">
              Resource: <span className="font-semibold">{allocation.employee.fullName}</span>
            </p>
            <p className="text-xs text-slate-500">
              Role: {allocation.employee.specialization}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Allocated Effort (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                required
                value={effort}
                onChange={(e) => setEffort(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                %
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={project.startDate}
                max={project.endDate}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={project.endDate}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
