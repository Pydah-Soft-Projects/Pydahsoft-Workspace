import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

// Lazy-loaded page components for ultra-fast loading and bundle optimization
const DashboardOverview = lazy(() => import('./pages/Dashboard/DashboardOverview'));
const UserManagement = lazy(() => import('./pages/UserManagement/UserManagement'));
const EmployeeManagement = lazy(() => import('./pages/Employees/EmployeeManagement'));
const ProjectsAndModules = lazy(() => import('./pages/Projects/ProjectsAndModules'));
const TeamsAndTasks = lazy(() => import('./pages/Teams/TeamsAndTasks'));
const TimeTracker = lazy(() => import('./pages/TimeTracking/TimeTracker'));
const TaskReviewQueue = lazy(() => import('./pages/Reviews/TaskReviewQueue'));
const DailyWorkPlans = lazy(() => import('./pages/DailyPlans/DailyWorkPlans'));
const PerformanceAndReports = lazy(() => import('./pages/Analytics/PerformanceAndReports'));
const AuditLogsView = lazy(() => import('./pages/AuditLogs/AuditLogsView'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

// Fast loading spinner fallback
const PageLoader = () => (
  <div className="p-8 text-center text-xs font-semibold text-gray-400 animate-pulse">
    Loading page view...
  </div>
);

function DashboardLayout({ user, onLogout }) {
  const navigate = useNavigate();

  // Determine initial tab from location hash, pathname, or localStorage for perfect refresh persistence
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    const stored = localStorage.getItem('pydahsoft_active_tab');
    if (stored) return stored;
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [subTab, setSubTab] = useState('default');

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('pydahsoft_active_tab', tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    localStorage.setItem('pydahsoft_active_tab', activeTab);
    window.location.hash = activeTab;

    if (activeTab === 'projects') setSubTab('projects');
    else if (activeTab === 'teams') setSubTab('teams');
    else if (activeTab === 'analytics') setSubTab('analytics');
    else setSubTab('default');
  }, [activeTab]);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'users': return 'User Accounts & Credentials Management';
      case 'employees': return 'Employee Directory & Staff Profiles';
      case 'projects': return 'Projects & Modules Breakdown';
      case 'teams': return 'Teams & Tasks Management';
      case 'time-tracker': return 'Interactive Time Tracking & Task Submission';
      case 'reviews': return 'Task Review & Quality Approval Queue';
      case 'daily-plans': return 'Daily Work Plan Assignment';
      case 'analytics': return 'Performance Analytics & Reports Generator';
      case 'audit-logs': return 'System Audit Trail Logs';
      case 'settings': return 'System Settings & Role Default Privileges';
      default: return 'Workspace Dashboard';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={() => {
          onLogout();
          navigate('/');
        }}
      />

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40 shadow-xs">
          {activeTab === 'overview' ? (
            <div>
              <h1 className="text-xl font-black text-[#09233d] tracking-tight">
                Welcome back, <span className="text-[#10b981]">{user.name}!</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Here's what's happening with your work today.
              </p>
            </div>
          ) : (
            <h1 className="text-lg font-black text-[#09233d]">
              {getTabTitle(activeTab)}
            </h1>
          )}

          {/* Sub-tab Pill Switcher in Header Top Right */}
          <div className="flex items-center gap-3 text-xs">
            {activeTab === 'projects' && (
              <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setSubTab('projects')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'projects'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Projects Lifecycle
                </button>
                <button
                  onClick={() => setSubTab('modules')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'modules'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Modules Breakdown
                </button>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setSubTab('teams')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'teams'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Teams & Roster
                </button>
                <button
                  onClick={() => setSubTab('tasks')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'tasks'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Tasks Management
                </button>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setSubTab('analytics')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'analytics'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Performance Analytics
                </button>
                <button
                  onClick={() => setSubTab('reports')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    subTab === 'reports'
                      ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Executive Reports
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          <Suspense fallback={<PageLoader />}>
            {activeTab === 'overview' && (
              <DashboardOverview user={user} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'users' && <UserManagement currentUser={user} />}
            {activeTab === 'employees' && <EmployeeManagement currentUser={user} />}
            {activeTab === 'projects' && <ProjectsAndModules currentUser={user} activeSubTab={subTab} />}
            {activeTab === 'teams' && <TeamsAndTasks currentUser={user} activeSubTab={subTab} />}
            {activeTab === 'time-tracker' && <TimeTracker currentUser={user} />}
            {activeTab === 'reviews' && <TaskReviewQueue currentUser={user} />}
            {activeTab === 'daily-plans' && <DailyWorkPlans currentUser={user} />}
            {activeTab === 'analytics' && <PerformanceAndReports currentUser={user} activeSubTab={subTab} />}
            {activeTab === 'audit-logs' && <AuditLogsView currentUser={user} />}
            {activeTab === 'settings' && <SettingsPage currentUser={user} />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('pydahsoft_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('pydahsoft_user');
    localStorage.removeItem('pydahsoft_token');
    localStorage.removeItem('pydahsoft_active_tab');
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={<Landing user={user} />} />
      <Route
        path="/login"
        element={<Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />}
      />
      <Route
        path="/dashboard/*"
        element={
          user ? (
            <DashboardLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
