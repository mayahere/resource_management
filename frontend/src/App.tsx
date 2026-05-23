import { useState, useEffect } from 'react';
import { Dashboard } from './views/Dashboard';
import { Projects } from './views/Projects';
import { EmployeesView } from './views/EmployeesView';
import { Login } from './views/Login';
import { Employee, Project, User } from './types';
import { Loader2, LayoutDashboard, FolderKanban, Users, LogOut } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees, projects, and requests from backend
  const fetchData = async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);
    try {
      // Fetch employees
      const empRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!empRes.ok) throw new Error('Failed to fetch employees');
      const empData = await empRes.json();
      setEmployees(empData);

      // Fetch projects
      const projRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!projRes.ok) throw new Error('Failed to fetch projects');
      const projData = await projRes.json();
      setProjects(projData);

      // Fetch allocations/requests if PM or Admin
      if (currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager') {
        const reqRes = await fetch('/api/resource-requests', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          // Filter down to only Pending requests for the dashboard approvals
          setPendingRequests(reqData.filter((r: any) => r.status === 'Pending'));
        }
      }
    } catch (err) {
      console.error('Error fetching system data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && currentUser) {
      fetchData(token);
    }
  }, [token, currentUser?.id]);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setCurrentUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setEmployees([]);
    setProjects([]);
    setPendingRequests([]);
    setActiveTab('dashboard');
  };

  // Handle resource request submission to the backend API
  const handleRequestResource = async (
    projectId: string,
    employeeId: string,
    effort: number,
    startDate: string,
    endDate: string
  ) => {
    if (!token) return;
    try {
      const response = await fetch('/api/resource-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
          employeeId,
          allocatedEffort: effort,
          startDate,
          endDate
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit resource request');
      }

      await fetchData();
      alert(`Resource request submitted successfully! Status is currently: ${data.status}`);
    } catch (error: any) {
      alert(`Error requesting resource: ${error.message}`);
    }
  };

  // Admin approvals
  const handleApproveRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/resource-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve request');
      
      await fetchData();
      alert('Request approved successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/resource-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject request');

      await fetchData();
      alert('Request rejected successfully.');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Render Login view if unauthenticated
  if (!token || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Sticky Top Header Navigation */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left: Brand/Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                HR
              </div>
              <div className="flex flex-col">
                <span className="text-slate-900 font-bold leading-tight tracking-tight text-lg">HRRAMS</span>
                <span className="text-[10px] text-slate-400 font-medium">Resource Management</span>
              </div>
            </div>

            {/* Center: Tabs */}
            <nav className="flex space-x-1 sm:space-x-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'projects'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <FolderKanban size={16} />
                Projects
              </button>
              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === 'employees'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users size={16} />
                  Employees
                </button>
              )}
            </nav>

            {/* Right: Account & Signout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading && employees.length === 0 && projects.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-screen">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <p className="text-slate-500 text-sm">Loading system data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                employees={employees} 
                currentUser={currentUser}
                pendingRequests={pendingRequests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                token={token}
                onRefreshData={() => fetchData()}
              />
            )}
            {activeTab === 'projects' && (
              <Projects
                currentUser={currentUser}
                token={token}
                projects={projects}
                employees={employees}
                onRequestResource={handleRequestResource}
                onRefreshProjects={() => fetchData()}
              />
            )}
            {activeTab === 'employees' && (
              <EmployeesView
                currentUser={currentUser}
                token={token}
                onRefreshNeeded={() => fetchData()}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}