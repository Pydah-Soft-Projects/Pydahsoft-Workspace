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

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('pydahsoft_active_tab', tab);
    window.location.hash = tab;
  };

  useEffect(() => {
    localStorage.setItem('pydahsoft_active_tab', activeTab);
    window.location.hash = activeTab;
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
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-[#20b875]/10 border border-[#20b875]/30 text-[#09233d] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#20b875]" />
              User: <strong className="text-[#20b875]">{user.name}</strong> ({user.role?.toUpperCase()})
            </span>
          </div>
        </header>

        <div className="p-6">
          <Suspense fallback={<PageLoader />}>
            {activeTab === 'overview' && (
              <DashboardOverview user={user} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'users' && <UserManagement currentUser={user} />}
            {activeTab === 'employees' && <EmployeeManagement currentUser={user} />}
            {activeTab === 'projects' && <ProjectsAndModules currentUser={user} />}
            {activeTab === 'teams' && <TeamsAndTasks currentUser={user} />}
            {activeTab === 'time-tracker' && <TimeTracker currentUser={user} />}
            {activeTab === 'reviews' && <TaskReviewQueue currentUser={user} />}
            {activeTab === 'daily-plans' && <DailyWorkPlans currentUser={user} />}
            {activeTab === 'analytics' && <PerformanceAndReports currentUser={user} />}
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
