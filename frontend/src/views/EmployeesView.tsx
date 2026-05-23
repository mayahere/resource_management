import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, User as UserIcon, RefreshCw, X } from 'lucide-react';
import { User, Employee, Specialization, Role } from '../types';
import { Badge } from '../components/Badge';

interface EmployeesViewProps {
  currentUser: User;
  token: string;
  onRefreshNeeded: () => void;
}

export function EmployeesView({ currentUser, token, onRefreshNeeded }: EmployeesViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add Form Inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Developer');
  const [specialization, setSpecialization] = useState<Specialization>('Back-end Developer');
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Form Inputs
  const [editRole, setEditRole] = useState<Role>('Developer');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editPassword, setEditPassword] = useState('');

  const fetchUsersAndEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Users
      const usersRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      // 2. Fetch Employees
      const empRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!empRes.ok) throw new Error('Failed to fetch employees');
      const empData = await empRes.json();
      setEmployees(empData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndEmployees();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
          specialization,
          contractStartDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create user');

      setShowAddModal(false);
      // Reset inputs
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('Developer');
      setSpecialization('Back-end Developer');
      setContractStartDate(new Date().toISOString().split('T')[0]);

      fetchUsersAndEmployees();
      onRefreshNeeded();
      alert('User created successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    try {
      const body: any = { role: editRole, status: editStatus };
      if (editPassword) body.password = editPassword;

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user');

      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsersAndEmployees();
      onRefreshNeeded();
      alert('User updated successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClick = async (userId: string) => {
    if (!confirm('Are you sure you want to soft-delete this user? (Status will be set to Inactive)')) return;
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user');

      fetchUsersAndEmployees();
      onRefreshNeeded();
      alert('User soft-deleted successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (currentUser.role !== 'Admin') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          <Shield className="mx-auto text-slate-400 mb-2" size={40} />
          <h2 className="text-lg font-semibold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-1">
            Only administrators are authorized to manage employees and users.
          </p>
        </div>
      </div>
    );
  }

  // Find employee profile mapping for users
  const getEmployeeProfile = (userId: string) => {
    return employees.find((emp) => emp.userId === userId);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee & User Management</h1>
          <p className="text-slate-500 mt-1">
            CRUD operations, role management, and specializations for system accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsersAndEmployees}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Create User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Contract Start</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => {
                  const emp = getEmployeeProfile(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          {user.role === 'Admin' ? (
                            <Shield size={14} className="text-indigo-500" />
                          ) : (
                            <UserIcon size={14} className="text-slate-400" />
                          )}
                          {user.fullName}
                        </div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {emp ? emp.specialization : 'N/A (Non-resource)'}
                      </td>
                      <td className="px-6 py-4">
                        {emp ? (
                          <Badge
                            variant={
                              emp.experienceLevel === 'Senior'
                                ? 'primary'
                                : emp.experienceLevel === 'Middle'
                                ? 'info'
                                : 'neutral'
                            }
                          >
                            {emp.experienceLevel}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {emp ? emp.contractStartDate : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.status === 'Active' ? 'success' : 'neutral'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={16} />
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteClick(user.id)}
                              className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                              title="Soft Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create User Account</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Min 6 chars"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="Business Analyst">Business Analyst</option>
                </select>
              </div>

              {['Developer', 'Tester', 'Business Analyst'].includes(role) && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <h3 className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
                    Employee Resource Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-950 mb-1">
                        Specialization
                      </label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value as Specialization)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="Front-end Developer">Front-end Developer</option>
                        <option value="Back-end Developer">Back-end Developer</option>
                        <option value="Automation Tester">Automation Tester</option>
                        <option value="Manual Tester">Manual Tester</option>
                        <option value="Business Analyst">Business Analyst</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-950 mb-1">
                        Contract Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={contractStartDate}
                        onChange={(e) => setContractStartDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit User: {selectedUser.fullName}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Admin">Admin</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="Business Analyst">Business Analyst</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="New password"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
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
      )}
    </div>
  );
}
