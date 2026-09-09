import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import { fetchApi } from './config/api';
import './App.css';

// Lazy-loaded page components for ultra-fast loading and bundle optimization
const DashboardOverview = lazy(() => import('./pages/Dashboard/DashboardOverview'));
const TeamChatPage = lazy(() => import('./pages/Chat/TeamChatPage'));
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

import LoadingSpinner from './components/Loader/LoadingSpinner';

// Fast loading spinner fallback
const PageLoader = () => <LoadingSpinner />;

function HeaderEmployeeSelector({ employeeList, viewAsEmployeeId, setViewAsEmployeeId }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmp = employeeList.find((e) => String(e._id) === String(viewAsEmployeeId));
  const filteredEmployees = employeeList.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="dashboard-filter-button flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-emerald-300 hover:border-[#20b875] rounded-xl text-xs font-bold text-[#09233d] shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#20b875]/30 cursor-pointer transition-all min-w-[240px] justify-between group"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedEmp ? (
            <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
          <span className="truncate">
            {selectedEmp
              ? `${selectedEmp.name} (${selectedEmp.username || selectedEmp.employeeId || 'Staff'})`
              : 'Company Overview (Super Admin)'}
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-[#20b875] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
            dropdownOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <div className="dashboard-filter-menu absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-emerald-200 shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 pb-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[11px] font-black text-[#09233d] uppercase tracking-wider">
              Select Staff Member
            </span>
            <span className="text-[10px] text-gray-400 font-medium">{employeeList.length} Members</span>
          </div>

          {employeeList.length > 5 && (
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#20b875]"
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            <button
              type="button"
              onClick={() => {
                setViewAsEmployeeId(null);
                setDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                !viewAsEmployeeId
                  ? 'bg-emerald-50 text-[#20b875] border-l-4 border-[#20b875]'
                  : 'text-[#09233d] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="truncate">Company Overview (Super Admin)</span>
              </div>
              {!viewAsEmployeeId && (
                <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {filteredEmployees.map((emp) => {
              const isSelected = String(viewAsEmployeeId) === String(emp._id);
              return (
                <button
                  key={emp._id}
                  type="button"
                  onClick={() => {
                    setViewAsEmployeeId(emp._id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-[#20b875] border-l-4 border-[#20b875]'
                      : 'text-[#09233d] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#20b875] flex items-center justify-center font-bold text-[10px] shrink-0">
                      {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div className="truncate">
                      <span className="block text-xs font-bold text-[#09233d] truncate">{emp.name}</span>
                      <span className="block text-[10px] text-gray-400 font-medium truncate">
                        @{emp.username || emp.employeeId || 'staff'}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardLayout({ user, onLogout }) {
  const navigate = useNavigate();

  // Determine initial tab from localStorage for perfect refresh persistence
  const getInitialTab = () => {
    const stored = localStorage.getItem('pydahsoft_active_tab');
    if (stored) return stored;
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [subTab, setSubTab] = useState('default');
  const [viewAsEmployeeId, setViewAsEmployeeId] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([getInitialTab()]));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (!prev.has(activeTab)) {
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      }
      return prev;
    });
  }, [activeTab]);

  useEffect(() => {
    if (user?.role === 'superadmin' || user?.role === 'superior') {
      fetchApi('/employees')
        .then((res) => setEmployeeList(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('pydahsoft_active_tab', tab);
  };

  useEffect(() => {
    localStorage.setItem('pydahsoft_active_tab', activeTab);

    if (activeTab === 'projects') setSubTab('projects');
    else if (activeTab === 'teams') setSubTab('teams');
    else if (activeTab === 'analytics') setSubTab('analytics');
    else setSubTab('default');

    const tabDocumentTitles = {
      overview: 'PydahSoft | Dashboard Overview',
      chat: 'PydahSoft | Team Chat Box',
      users: 'PydahSoft | User Accounts',
      employees: 'PydahSoft | Employee Directory',
      projects: 'PydahSoft | Projects & Modules',
      teams: 'PydahSoft | Teams & Tasks',
      'time-tracker': 'PydahSoft | Time Tracker',
      reviews: 'PydahSoft | Task Review Queue',
      'daily-plans': 'PydahSoft | Daily Work Plans',
      analytics: 'PydahSoft | Performance & Reports',
      'audit-logs': 'PydahSoft | Audit Logs',
      settings: 'PydahSoft | Settings',
    };
    document.title = tabDocumentTitles[activeTab] || 'PydahSoft | Dashboard';
  }, [activeTab]);

  const getMobileTabTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'chat': return 'Team Chat';
      case 'users': return 'Users';
      case 'employees': return 'Employees';
      case 'projects': return 'Projects';
      case 'teams': return 'Teams';
      case 'time-tracker': return 'Time Tracker';
      case 'reviews': return 'Reviews';
      case 'daily-plans': return 'Daily Plans';
      case 'analytics': return 'Analytics';
      case 'audit-logs': return 'Audit Logs';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'chat': return 'Team Chat Box & Direct Messaging Hub';
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
    <div className="dashboard-shell flex h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans relative">
      {/* Mobile Drawer Dark Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onLogout={() => {
          onLogout();
          navigate('/');
        }}
      />

      <main className="flex-1 h-screen overflow-y-auto w-full">
        <header className="dashboard-header bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3.5 flex flex-wrap gap-3 justify-between items-center sticky top-0 z-30 shadow-xs">
          <div className="dashboard-header__title flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#09233d] hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shrink-0"
              title="Toggle sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {activeTab === 'overview' ? (
              <div>
                <h1 className="dashboard-header__heading text-base md:text-xl font-black text-[#09233d] tracking-tight whitespace-normal">
                  Welcome back, <span className="text-[#10b981]">{user.name}!</span>
                </h1>
                <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 truncate hidden sm:block">
                  {viewAsEmployeeId
                    ? `Currently inspecting employee dashboard for: ${employeeList.find((e) => e._id === viewAsEmployeeId)?.name || 'Selected Staff'}`
                    : "Here's what's happening with your work today."}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="dashboard-header__heading text-sm md:text-lg font-black text-[#09233d] whitespace-normal">
                  {getTabTitle(activeTab)}
                </h1>
                {activeTab === 'audit-logs' && (
                  <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 hidden sm:block">
                    Track every change made across the platform.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sub-tab Pill Switcher & Employee Inspector Filter in Header Top Right */}
          <div className="dashboard-header__controls flex items-center gap-3 text-xs" aria-label="Dashboard filters and view controls">
            {activeTab === 'overview' && (user?.role === 'superadmin' || user?.role === 'superior') && employeeList.length > 0 && (
              <HeaderEmployeeSelector
                employeeList={employeeList}
                viewAsEmployeeId={viewAsEmployeeId}
                setViewAsEmployeeId={setViewAsEmployeeId}
              />
            )}
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
                <div className="bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                  <button
                    onClick={() => setSubTab('teams')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      subTab === 'teams'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks Management
                  </button>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 flex items-center gap-1 shadow-2xs">
                  <button
                    onClick={() => setSubTab('analytics')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      subTab === 'analytics'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Executive Reports
                  </button>
                </div>
              )}
            </div>

          {/* Mobile Sub-pages Bar (Rendered BELOW header title on Mobile view only) */}
          {['projects', 'teams', 'analytics'].includes(activeTab) && (
            <div className="sm:hidden pt-2 mt-2 border-t border-gray-100 flex items-center justify-center">
              {activeTab === 'projects' && (
                <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 shadow-2xs w-full">
                  <button
                    onClick={() => setSubTab('projects')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'projects'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Projects Lifecycle
                  </button>
                  <button
                    onClick={() => setSubTab('modules')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'modules'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Modules Breakdown
                  </button>
                </div>
              )}
              {activeTab === 'teams' && (
                <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 shadow-2xs w-full">
                  <button
                    onClick={() => setSubTab('teams')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'teams'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Teams & Roster
                  </button>
                  <button
                    onClick={() => setSubTab('tasks')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'tasks'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks Management
                  </button>
                </div>
              )}
              {activeTab === 'analytics' && (
                <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 shadow-2xs w-full">
                  <button
                    onClick={() => setSubTab('analytics')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'analytics'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-[#20b875] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Analytics
                  </button>
                  <button
                    onClick={() => setSubTab('reports')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      subTab === 'reports'
                        ? 'bg-white text-[#09233d] shadow-xs border border-slate-200/60'
                        : 'text-slate-600 hover:text-[#09233d] hover:bg-white/50 font-semibold'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Executive Reports
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="dashboard-content p-3 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            {visitedTabs.has('overview') && (
              <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                <DashboardOverview
                  user={user}
                  setActiveTab={setActiveTab}
                  viewAsEmployeeId={viewAsEmployeeId}
                  setViewAsEmployeeId={setViewAsEmployeeId}
                  employeeList={employeeList}
                />
              </div>
            )}
            {visitedTabs.has('chat') && (
              <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
                <TeamChatPage currentUser={user} />
              </div>
            )}
            {visitedTabs.has('users') && (
              <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
                <UserManagement currentUser={user} />
              </div>
            )}
            {visitedTabs.has('employees') && (
              <div style={{ display: activeTab === 'employees' ? 'block' : 'none' }}>
                <EmployeeManagement currentUser={user} />
              </div>
            )}
            {visitedTabs.has('projects') && (
              <div style={{ display: activeTab === 'projects' ? 'block' : 'none' }}>
                <ProjectsAndModules currentUser={user} activeSubTab={subTab} />
              </div>
            )}
            {visitedTabs.has('teams') && (
              <div style={{ display: activeTab === 'teams' ? 'block' : 'none' }}>
                <TeamsAndTasks currentUser={user} activeSubTab={subTab} />
              </div>
            )}
            {visitedTabs.has('time-tracker') && (
              <div style={{ display: activeTab === 'time-tracker' ? 'block' : 'none' }}>
                <TimeTracker currentUser={user} />
              </div>
            )}
            {visitedTabs.has('reviews') && (
              <div style={{ display: activeTab === 'reviews' ? 'block' : 'none' }}>
                <TaskReviewQueue currentUser={user} />
              </div>
            )}
            {visitedTabs.has('daily-plans') && (
              <div style={{ display: activeTab === 'daily-plans' ? 'block' : 'none' }}>
                <DailyWorkPlans currentUser={user} />
              </div>
            )}
            {visitedTabs.has('analytics') && (
              <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
                <PerformanceAndReports currentUser={user} activeSubTab={subTab} />
              </div>
            )}
            {visitedTabs.has('audit-logs') && (
              <div style={{ display: activeTab === 'audit-logs' ? 'block' : 'none' }}>
                <AuditLogsView currentUser={user} />
              </div>
            )}
            {visitedTabs.has('settings') && (
              <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
                <SettingsPage currentUser={user} />
              </div>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('pydahsoft_user') || localStorage.getItem('pydahsoft_user');
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
    sessionStorage.removeItem('pydahsoft_user');
    sessionStorage.removeItem('pydahsoft_token');
    localStorage.removeItem('pydahsoft_user');
    localStorage.removeItem('pydahsoft_token');
    localStorage.removeItem('pydahsoft_active_tab');
    setUser(null);
  };

  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener('pydahsoft:session-expired', handleSessionExpired);
    return () => window.removeEventListener('pydahsoft:session-expired', handleSessionExpired);
  }, []);

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
