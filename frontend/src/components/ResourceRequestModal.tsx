import React, { useMemo, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Employee, Project } from '../types';
import {
  calculateAvailableEffort,
  validateAllocation,
  calculateExperienceLevel } from
'../utils';
interface ResourceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  employees: Employee[];
  onSubmit: (
  employeeId: string,
  effort: number,
  startDate: string,
  endDate: string)
  => void;
}
export function ResourceRequestModal({
  isOpen,
  onClose,
  project,
  employees,
  onSubmit
}: ResourceRequestModalProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [effort, setEffort] = useState<number>(50);
  const [startDate, setStartDate] = useState<string>(project.startDate);
  const [endDate, setEndDate] = useState<string>(project.endDate);
  const [error, setError] = useState<string | null>(null);
  // Only show employees who have some availability
  const availableEmployees = useMemo(() => {
    return employees.filter((e) => calculateAvailableEffort(e.allocations) > 0);
  }, [employees]);
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId);
  }, [employees, selectedEmpId]);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }
    if (effort <= 0 || effort > 100) {
      setError('Effort must be between 1 and 100%.');
      return;
    }
    // Rule 2: Date within Project Period
    if (
    new Date(startDate) < new Date(project.startDate) ||
    new Date(endDate) > new Date(project.endDate))
    {
      setError(
        `Allocation period must be within project dates (${project.startDate} to ${project.endDate}).`
      );
      return;
    }
    // Rule 1 & 3: Available Effort Check & Overlapping
    const validation = validateAllocation(
      {
        projectId: project.id,
        employeeId: selectedEmpId,
        allocatedEffort: effort,
        startDate,
        endDate
      },
      selectedEmployee.allocations
    );
    if (!validation.valid) {
      setError(validation.reason || 'Invalid allocation.');
      return;
    }
    onSubmit(selectedEmpId, effort, startDate, endDate);
    // Reset form
    setSelectedEmpId('');
    setEffort(50);
    setStartDate(project.startDate);
    setEndDate(project.endDate);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Request Resource
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors">
            
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
            <p className="text-sm font-medium text-slate-700">
              Project: {project.name}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Period: {project.startDate} to {project.endDate}
            </p>
          </div>

          {error &&
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          }

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Employee
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              
              <option value="">-- Select an available employee --</option>
              {availableEmployees.map((emp) => {
                const avail = calculateAvailableEffort(emp.allocations);
                const level = calculateExperienceLevel(emp.contractStartDate);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.specialization} - {level}) - {avail}%
                    Available
                  </option>);

              })}
            </select>
          </div>

          {selectedEmployee &&
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Requested Effort (%)
                </label>
                <div className="relative">
                  <input
                  type="number"
                  min="1"
                  max="100"
                  value={effort}
                  onChange={(e) => setEffort(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Max available:{' '}
                  {calculateAvailableEffort(selectedEmployee.allocations)}%
                </p>
              </div>
            </div>
          }

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={project.startDate}
                max={project.endDate}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={project.endDate}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
              
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>);

}