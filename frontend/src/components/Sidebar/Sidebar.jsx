import React from 'react';

// SVG Icons Component
const Icon = ({ name, className = "w-4 h-4" }) => {
  switch (name) {
    case 'overview':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'employees':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'projects':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'teams':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'time-tracker':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'reviews':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'daily-plans':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'analytics':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      );
    case 'audit-logs':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const ALL_SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Dashboard Overview', permKey: 'canViewOverview', icon: 'overview' },
  { id: 'chat', label: 'Team Chat Box', permKey: 'canViewChat', icon: 'chat' },
  { id: 'employees', label: 'Employee Directory', permKey: 'canViewEmployees', icon: 'employees' },
  { id: 'projects', label: 'Projects & Modules', permKey: 'canViewProjects', icon: 'projects' },
  { id: 'teams', label: 'Teams & Tasks', permKey: 'canViewTeams', icon: 'teams' },
  { id: 'time-tracker', label: 'Time Tracker', permKey: 'canViewTimeTracker', icon: 'time-tracker' },
  { id: 'reviews', label: 'Task Approvals Queue', permKey: 'canViewReviews', icon: 'reviews' },
  { id: 'daily-plans', label: 'Daily Work Plans', permKey: 'canViewDailyPlans', icon: 'daily-plans' },
  { id: 'analytics', label: 'Performance & Reports', permKey: 'canViewAnalytics', icon: 'analytics' },
  { id: 'users', label: 'User Accounts', permKey: 'canViewUsers', icon: 'users' },
  { id: 'audit-logs', label: 'Audit Trail Logs', permKey: 'canViewAuditLogs', icon: 'audit-logs' },
  { id: 'settings', label: 'System Settings', permKey: 'canViewSettings', icon: 'settings' }
];

const getRoleMenuItems = (user) => {
  if (!user) return ALL_SIDEBAR_ITEMS;
  if (user.role === 'superadmin') return ALL_SIDEBAR_ITEMS;

  const perms = user.permissions || {};

  const allowed = ALL_SIDEBAR_ITEMS.filter((item) => {
    const val = perms[item.permKey];
    if (val !== undefined && val !== null) {
      return val !== 'none' && val !== false;
    }
    if (user.role === 'superior') return true;
    if (user.role === 'teamlead') {
      return ['overview', 'chat', 'users', 'projects', 'teams', 'time-tracker', 'reviews', 'daily-plans', 'analytics'].includes(item.id);
    }
    return ['overview', 'chat', 'teams', 'time-tracker', 'daily-plans', 'analytics'].includes(item.id);
  });

  return allowed.length > 0 ? allowed : ALL_SIDEBAR_ITEMS.slice(0, 1);
};

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, mobileOpen, setMobileOpen }) {
  const menuItems = getRoleMenuItems(user);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#072b1e] text-[#ffffff] flex flex-col justify-between h-screen p-4 border-r border-[#0e4733] shrink-0 shadow-xl transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } md:sticky md:top-0`}
    >
      {/* Scrollable Top Header & Navigation Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0e4733]">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#20b875] text-[#ffffff] font-extrabold px-2.5 py-1 rounded-lg text-xs shadow-md shadow-[#20b875]/20">&lt;&gt;</span>
            <div>
              <span className="font-extrabold text-base block leading-tight tracking-wide text-white">PydahSoft</span>
              <span className="text-[10px] text-[#4ade80] font-bold tracking-widest uppercase">
                Management Platform
              </span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#20b875] text-[#ffffff] font-bold shadow-md shadow-[#20b875]/30'
                    : 'text-[#e5e7eb] hover:bg-[#0d3b2b] hover:text-[#ffffff]'
                }`}
              >
                <Icon name={item.icon} className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#4ade80]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Constantly Fixed / Pinned Bottom User Profile Card */}
      <div className="pt-3 mt-2 border-t border-[#0e4733] shrink-0">
        <div className="flex items-center justify-between p-2.5 bg-[#0b3828] rounded-xl border border-[#13523c] shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-[#20b875] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {/* User Details */}
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[#4ade80] capitalize font-medium leading-tight mt-0.5">
                {user?.role || 'Employee'}
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-600/30 rounded-lg transition-colors shrink-0 ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
