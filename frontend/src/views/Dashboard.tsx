import { useMemo, useState } from 'react';
import { Employee, User } from '../types';
import { calculateAvailableEffort, calculateExperienceLevel } from '../utils';
import { Badge } from '../components/Badge';
import { Search, Filter, Check, X, Plus } from 'lucide-react';
import { AddResourceModal } from '../components/AddResourceModal';

interface DashboardProps {
  employees: Employee[];
  currentUser: User;
  pendingRequests?: any[];
  onApproveRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
  token?: string;
  onRefreshData?: () => void;
}

export function Dashboard({
  employees,
  currentUser,
  pendingRequests = [],
  onApproveRequest,
  onRejectRequest,
  token,
  onRefreshData
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpec, setFilterSpec] = useState<string>('All');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);

  const specializations = [
    'All',
    ...Array.from(new Set(employees.map((e) => e.specialization)))
  ];

  const levels = ['All', 'Junior', 'Middle', 'Senior'];

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = emp.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSpec =
        filterSpec === 'All' || emp.specialization === filterSpec;
      const level = calculateExperienceLevel(emp.contractStartDate);
      const matchesLevel = filterLevel === 'All' || level === filterLevel;
      return matchesSearch && matchesSpec && matchesLevel;
    });
  }, [employees, searchTerm, filterSpec, filterLevel]);

  // Calculate high-level stats
  const totalEmployees = employees.length;
  const totalAvailable = employees.filter(
    (e) => calculateAvailableEffort(e.allocations) > 0
  ).length;
  const fullyAllocated = employees.filter(
    (e) => calculateAvailableEffort(e.allocations) === 0
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resource Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Overview of employee availability and allocations.
        </p>
      </div>

      {/* Admin Pending Requests Panel */}
      {currentUser.role === 'Admin' && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-5 border-b border-slate-200 bg-amber-50/30 flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
            <h2 className="font-semibold text-slate-800 text-base">
              Pending Resource Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {req.employeeName}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({req.specialization})
                    </span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {req.allocatedEffort}% Effort
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Requested for Project:{' '}
                    <span className="font-medium text-slate-700">{req.projectName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Duration: {req.startDate} to {req.endDate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveRequest && onApproveRequest(req.id)}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => onRejectRequest && onRejectRequest(req.id)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Total Resources</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {totalEmployees}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Available Resources</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalAvailable}
          </p>
          <p className="text-xs text-slate-400 mt-1">Have &gt;0% capacity</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-500">Fully Allocated</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {fullyAllocated}
          </p>
          <p className="text-xs text-slate-400 mt-1">At 100% capacity</p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterSpec}
              onChange={(e) => setFilterSpec(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              {specializations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700"
            >
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {currentUser.role === 'Admin' && (
              <button
                onClick={() => setShowAddResourceModal(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                Add Resource
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4">Allocated</th>
                <th className="px-6 py-4">Available</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEmployees.map((emp) => {
                const level = calculateExperienceLevel(emp.contractStartDate);
                const available = calculateAvailableEffort(emp.allocations);
                const allocated = 100 - available;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{emp.fullName}</div>
                      <div className="text-slate-500 text-xs">{emp.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp.specialization}</td>
                    <td className="px-6 py-4">
                      <Badge variant={level === 'Senior' ? 'primary' : level === 'Middle' ? 'info' : 'neutral'}>
                        {level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${allocated}%` }}
                          />
                        </div>
                        <span className="text-slate-600 font-medium">{allocated}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${available > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {available}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {available === 0 ? (
                        <Badge variant="warning">Fully Allocated</Badge>
                      ) : available === 100 ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="info">Partially Allocated</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No employees found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {currentUser.role === 'Admin' && token && onRefreshData && (
        <AddResourceModal
          isOpen={showAddResourceModal}
          onClose={() => setShowAddResourceModal(false)}
          token={token}
          onSuccess={() => {
            onRefreshData();
          }}
        />
      )}
    </div>
  );
}