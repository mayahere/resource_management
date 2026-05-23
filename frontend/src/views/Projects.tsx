import React, { useState, useEffect } from 'react';
import { Project, Employee, User, Specialization } from '../types';
import { getProjectStatus, formatDate } from '../utils';
import { Badge } from '../components/Badge';
import { Plus, Users, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { ResourceRequestModal } from '../components/ResourceRequestModal';
import { EditResourceAllocationModal } from '../components/EditResourceAllocationModal';

interface ProjectsProps {
  currentUser: User;
  token: string;
  projects: Project[];
  employees: Employee[];
  onRequestResource: (
    projectId: string,
    employeeId: string,
    effort: number,
    startDate: string,
    endDate: string
  ) => void;
  onRefreshProjects: () => void;
}

export function Projects({
  currentUser,
  token,
  projects,
  employees,
  onRequestResource,
  onRefreshProjects
}: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pmUsers, setPmUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedAllocationToEdit, setSelectedAllocationToEdit] = useState<any | null>(null);
  const [projectForEdit, setProjectForEdit] = useState<Project | null>(null);

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!confirm('Are you sure you want to remove this resource from the project?')) return;
    try {
      const response = await fetch(`/api/resource-requests/${allocationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove resource');
      alert('Resource removed successfully!');
      onRefreshProjects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditAllocationSubmit = async (
    allocationId: string,
    effort: number,
    startDate: string,
    endDate: string
  ) => {
    try {
      const response = await fetch(`/api/resource-requests/${allocationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          allocatedEffort: effort,
          startDate,
          endDate
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update allocation');
      alert(`Allocation updated successfully! Status is currently: ${data.status}`);
      setSelectedAllocationToEdit(null);
      setProjectForEdit(null);
      onRefreshProjects();
    } catch (err: any) {
      alert(`Error updating allocation: ${err.message}`);
    }
  };

  // New Project Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pmId, setPmId] = useState('');
  const [requirements, setRequirements] = useState<{ specialization: Specialization; requiredEffort: number }[]>([
    { specialization: 'Back-end Developer', requiredEffort: 100 }
  ]);

  // Fetch Project Managers for PM selection dropdown
  const fetchPMs = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const pms = data.filter((u: User) => u.role === 'Project Manager' && u.status === 'Active');
        setPmUsers(pms);
        if (pms.length > 0) setPmId(pms[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch PMs', err);
    }
  };

  useEffect(() => {
    if (showCreateModal && currentUser.role === 'Admin') {
      fetchPMs();
    }
  }, [showCreateModal]);

  const handleRequestSubmit = (
    employeeId: string,
    effort: number,
    startDate: string,
    endDate: string
  ) => {
    if (selectedProject) {
      onRequestResource(
        selectedProject.id,
        employeeId,
        effort,
        startDate,
        endDate
      );
      setSelectedProject(null);
    }
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, { specialization: 'Back-end Developer', requiredEffort: 100 }]);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, field: string, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    const totalEffort = requirements.reduce((sum, r) => sum + r.requiredEffort, 0);
    if (totalEffort <= 0) {
      setError('Total project requirements must be greater than 0%.');
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          startDate,
          endDate,
          pmId,
          requirements: requirements.map(r => ({
            specialization: r.specialization,
            requiredEffort: Number(r.requiredEffort)
          }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create project');

      // Reset Form
      setName('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setRequirements([{ specialization: 'Back-end Developer', requiredEffort: 100 }]);
      setShowCreateModal(false);

      onRefreshProjects();
      alert('Project created successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">
            Manage projects and allocate resources.
          </p>
        </div>
        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const status = getProjectStatus(project);
          // Find allocations for this project
          const projectAllocations = employees.flatMap((emp) =>
            emp.allocations
              .filter((a) => a.projectId === project.id)
              .map((a) => ({
                ...a,
                employee: emp
              }))
          );

          // Only PM assigned to the project or Admin can request resource
          // Wait, check pmId:
          const isPM = currentUser.role === 'Project Manager' && (project as any).pmId === currentUser.id;
          const isAdmin = currentUser.role === 'Admin';
          const canRequest = isAdmin || isPM;

          return (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-slate-900 text-lg leading-tight">
                    {project.name}
                  </h3>
                  <Badge
                    variant={
                      status === 'Active'
                        ? 'success'
                        : status === 'Planned'
                        ? 'info'
                        : status === 'Extended'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {project.description}
                </p>

                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Requirements
                  </span>
                  {(project as any).requirements && (project as any).requirements.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(project as any).requirements.map((req: any) => (
                        <span key={req.id} className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {req.specialization}: {req.requiredEffort}%
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None defined</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="block font-medium text-slate-700 mb-0.5">
                      Start Date
                    </span>
                    {formatDate(project.startDate)}
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <span className="block font-medium text-slate-700 mb-0.5">
                      End Date
                    </span>
                    {formatDate(project.endDate)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <Users size={16} className="text-slate-400" />
                    Allocated Resources ({projectAllocations.length})
                  </span>
                </div>

                {projectAllocations.length > 0 ? (
                  <div className="space-y-2 mb-4 max-h-32 overflow-y-auto pr-2">
                    {projectAllocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex items-center justify-between text-sm bg-white p-2 rounded border border-slate-100"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {alloc.employee.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {alloc.employee.specialization}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              alloc.status === 'Approved'
                                ? 'success'
                                : alloc.status === 'Pending'
                                ? 'warning'
                                : alloc.status === 'Rejected'
                                ? 'danger'
                                : 'neutral'
                            }
                          >
                            {alloc.status}
                          </Badge>
                          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                            {alloc.allocatedEffort}%
                          </span>
                          {canRequest && (
                            <div className="flex gap-1 ml-1">
                              <button
                                onClick={() => {
                                  setSelectedAllocationToEdit(alloc);
                                  setProjectForEdit(project);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Edit Allocation"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAllocation(alloc.id)}
                                className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                                title="Remove Resource"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic mb-4">
                    No resources allocated yet.
                  </p>
                )}

                {canRequest ? (
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="w-full py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Request Resource
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-400 italic py-2">
                    PMs can only request resources for their own projects.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <ResourceRequestModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          employees={employees}
          onSubmit={handleRequestSubmit}
        />
      )}

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-200">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. NextGen Web Portal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                  placeholder="Briefly describe the project scope..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Project Manager</label>
                <select
                  value={pmId}
                  onChange={(e) => setPmId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="" disabled>-- Select Project Manager --</option>
                  {pmUsers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.fullName} ({pm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">Resource Requirements</span>
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Role Requirement
                  </button>
                </div>
                <div className="space-y-3">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={req.specialization}
                        onChange={(e) => handleRequirementChange(index, 'specialization', e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="Front-end Developer">Front-end Developer</option>
                        <option value="Back-end Developer">Back-end Developer</option>
                        <option value="Automation Tester">Automation Tester</option>
                        <option value="Manual Tester">Manual Tester</option>
                        <option value="Business Analyst">Business Analyst</option>
                      </select>
                      <div className="relative w-24">
                        <input
                          type="number"
                          required
                          min="10"
                          max="1000"
                          step="10"
                          value={req.requiredEffort}
                          onChange={(e) => handleRequirementChange(index, 'requiredEffort', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 pr-6 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                      </div>
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAllocationToEdit && projectForEdit && (
        <EditResourceAllocationModal
          isOpen={!!selectedAllocationToEdit}
          onClose={() => {
            setSelectedAllocationToEdit(null);
            setProjectForEdit(null);
          }}
          project={projectForEdit}
          allocation={selectedAllocationToEdit}
          onSubmit={handleEditAllocationSubmit}
        />
      )}
    </div>
  );
}