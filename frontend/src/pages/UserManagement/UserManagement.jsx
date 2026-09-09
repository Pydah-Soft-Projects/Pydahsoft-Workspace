import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

const PrivilegeIcon = ({ icon, className = "w-3.5 h-3.5 text-[#20b875]" }) => {
  switch (icon) {
    case 'overview':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
    case 'audit-logs':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      );
    default:
      return null;
  }
};

const PAGE_PRIVILEGES_LIST = [
  { key: 'canViewOverview', label: 'Dashboard Overview Page', icon: 'overview', path: '/dashboard/overview' },
  { key: 'canViewUsers', label: 'User Accounts & Credentials Page', icon: 'users', path: '/dashboard/users' },
  { key: 'canViewEmployees', label: 'Employee Directory & Staff Profiles Page', icon: 'employees', path: '/dashboard/employees' },
  { key: 'canViewProjects', label: 'Projects & Modules Page', icon: 'projects', path: '/dashboard/projects' },
  { key: 'canViewTeams', label: 'Teams & Tasks Management Page', icon: 'teams', path: '/dashboard/teams' },
  { key: 'canViewTimeTracker', label: 'Interactive Time Tracker Page', icon: 'time-tracker', path: '/dashboard/time-tracker' },
  { key: 'canViewReviews', label: 'Task Approvals & Reviews Queue Page', icon: 'reviews', path: '/dashboard/reviews' },
  { key: 'canViewDailyPlans', label: 'Daily Work Plans Page', icon: 'daily-plans', path: '/dashboard/daily-plans' },
  { key: 'canViewAnalytics', label: 'Performance Analytics & Reports Page', icon: 'analytics', path: '/dashboard/analytics' },
  { key: 'canViewAuditLogs', label: 'System Audit Trail Logs Page', icon: 'audit-logs', path: '/dashboard/audit-logs' },
  { key: 'canViewSettings', label: 'System Settings & Role Privileges Page', icon: 'settings', path: '/dashboard/settings' }
];

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserPrivileges, setSelectedUserPrivileges] = useState(null);

  // User Creation Form State
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    role: 'employee',
    password: '',
    status: 'Active'
  });

  // Custom Role Creation Form State
  const [roleForm, setRoleForm] = useState({
    name: '',
    label: '',
    defaultPermissions: {
      canViewOverview: 'write',
      canViewUsers: 'none',
      canViewEmployees: 'none',
      canViewProjects: 'write',
      canViewTeams: 'write',
      canViewTimeTracker: 'write',
      canViewReviews: 'read',
      canViewDailyPlans: 'read',
      canViewAnalytics: 'read',
      canViewAuditLogs: 'none',
      canViewSettings: 'none'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!users || users.length === 0) setLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetchApi('/users'),
        fetchApi('/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      if (rolesRes.data.length > 0 && !createForm.role) {
        setCreateForm(prev => ({ ...prev, role: rolesRes.data[0].name }));
      }
    } catch (err) {
      if (!users || users.length === 0) setError(err.message || 'Failed to fetch user accounts and dynamic roles');
    } finally {
      setLoading(false);
    }
  };

  const getEffectivePermissions = (userObj, rolesList) => {
    const roleName = (userObj.role || 'employee').toLowerCase();
    const roleDoc = rolesList.find(r => r.name.toLowerCase() === roleName);
    const defaults = roleDoc?.defaultPermissions || {};
    return {
      ...defaults,
      ...(userObj.permissions || {})
    };
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      setShowCreateModal(false);
      setCreateForm({
        employeeId: '',
        name: '',
        username: '',
        email: '',
        phone: '',
        department: 'Engineering',
        designation: 'Software Engineer',
        joiningDate: new Date().toISOString().split('T')[0],
        role: roles[0]?.name || 'employee',
        password: '',
        status: 'Active'
      });
      loadData();
    } catch (err) {
      alert(`Failed to create user account: ${err.message}`);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/roles', {
        method: 'POST',
        body: JSON.stringify(roleForm)
      });
      setShowRoleModal(false);
      setRoleForm({
        name: '',
        label: '',
        defaultPermissions: {
          canViewOverview: 'write',
          canViewUsers: 'none',
          canViewEmployees: 'none',
          canViewProjects: 'write',
          canViewTeams: 'write',
          canViewTimeTracker: 'write',
          canViewReviews: 'read',
          canViewDailyPlans: 'read',
          canViewAnalytics: 'read',
          canViewAuditLogs: 'none',
          canViewSettings: 'none'
        }
      });
      loadData();
    } catch (err) {
      alert(`Failed to create custom role: ${err.message}`);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await fetchApi(`/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(editingUser)
      });
      setEditingUser(null);
      loadData();
    } catch (err) {
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const handleSavePermissions = async (userId, updatedPermissions) => {
    try {
      await fetchApi(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: updatedPermissions })
      });
      setSelectedUserPrivileges(null);
      loadData();
    } catch (err) {
      alert(`Failed to update privileges: ${err.message}`);
    }
  };

  const setBulkUserPermissions = (level) => {
    if (!selectedUserPrivileges) return;
    const updated = { ...selectedUserPrivileges.permissions };
    PAGE_PRIVILEGES_LIST.forEach((p) => {
      updated[p.key] = level;
    });
    setSelectedUserPrivileges({ ...selectedUserPrivileges, permissions: updated });
  };

  const setUserPermissionLevel = (permissionKey, level) => {
    if (!selectedUserPrivileges) return;
    setSelectedUserPrivileges({
      ...selectedUserPrivileges,
      permissions: {
        ...selectedUserPrivileges.permissions,
        [permissionKey]: level
      }
    });
  };

  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'Inactive' ? 'Active' : 'Inactive';
    if (newStatus === 'Inactive' && !window.confirm(`Deactivate @${userObj.username}'s account?`)) return;
    try {
      await fetchApi(`/users/${userObj._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert(`Error changing account status: ${err.message}`);
    }
  };

  const isManager = currentUser?.role === 'superior' || currentUser?.role === 'superadmin';

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5"
          >
            + Add Custom Role
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63] transition-all flex items-center gap-1.5"
          >
            + Create User Account
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading user accounts..." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4">Emp ID</th>
                  <th className="p-4">Full Name & Username</th>
                  <th className="p-4">Department & Role</th>
                  <th className="p-4">Allowed Sidebar Pages</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users.map((u) => {
                  const isSuperAdmin = u.role === 'superadmin';
                  const perms = getEffectivePermissions(u, roles);
                  const activePermCount = isSuperAdmin ? 11 : PAGE_PRIVILEGES_LIST.filter(p => perms[p.key] !== 'none' && perms[p.key] !== false).length;
                  const isInactive = u.status === 'Inactive';

                  return (
                    <tr key={u._id} className="hover:bg-gray-50/60">
                      <td className="p-4 font-bold text-[#20b875]">{u.employeeId || 'EMP-000'}</td>
                      <td className="p-4">
                        <strong className="block text-[#09233d] font-bold">{u.name}</strong>
                        <span className="text-[11px] text-gray-400">@{u.username}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-700 block">{u.department || 'Engineering'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-0.5 inline-block ${
                          u.role === 'superior' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'teamlead' ? 'bg-blue-100 text-blue-800' :
                          isSuperAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-[10px]">
                          <span className="inline-flex items-center gap-1"><Icon name="shield" className="w-3.5 h-3.5" /> {activePermCount} / 11 Pages {isSuperAdmin ? '(Full Access)' : 'Allowed'}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          !isInactive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {u.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <span className="inline-flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" /> View</span>
                        </button>

                        {isManager && (
                          <button
                            onClick={() => setEditingUser({ ...u })}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <span className="inline-flex items-center gap-1"><Icon name="edit" className="w-3.5 h-3.5" /> Edit</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedUserPrivileges({
                            ...u,
                            permissions: getEffectivePermissions(u, roles)
                          })}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-200 inline-flex items-center gap-1"
                        >
                          <span className="inline-flex items-center gap-1"><Icon name="settings" className="w-3.5 h-3.5" /> Page Privileges</span>
                        </button>

                        {isManager && !isSuperAdmin && (
                          isInactive ? (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200"
                            >
                              <span className="inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" /> Activate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold"
                            >
                              Deactivate
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIDEBAR PAGE ACCESS CONTROL MODAL */}
      {selectedUserPrivileges && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-[#09233d]">Sidebar Page Access: {selectedUserPrivileges.name}</h3>
                <p className="text-[11px] text-gray-500">Configure Read vs Write permission levels for @{selectedUserPrivileges.username}</p>
              </div>
              <button onClick={() => setSelectedUserPrivileges(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600" aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>

            {selectedUserPrivileges.role === 'superadmin' ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-semibold space-y-1">
                <p className="font-bold"><span className="inline-flex items-center gap-1"><Icon name="award" className="w-3.5 h-3.5" /> Full SuperAdmin Access Enabled</span></p>
                <p className="text-[11px] text-amber-800">SuperAdmin accounts possess unrestricted Read & Write access to all system pages.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Master Bulk Control Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                  <span className="font-bold text-gray-700 text-[11px] shrink-0">Master Toggles:</span>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setBulkUserPermissions('read')}
                      className="flex-1 sm:flex-none justify-center px-2 sm:px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap transition-all"
                    >
                      <span className="inline-flex items-center gap-1"><Icon name="eye" className="w-3 h-3 shrink-0" /> Select All Read</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkUserPermissions('write')}
                      className="flex-1 sm:flex-none justify-center px-2 sm:px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap transition-all"
                    >
                      <span className="inline-flex items-center gap-1"><Icon name="edit" className="w-3 h-3 shrink-0" /> Select All Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkUserPermissions('none')}
                      className="flex-1 sm:flex-none justify-center px-2 sm:px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                    >
                      <span className="inline-flex items-center gap-1"><Icon name="close" className="w-3 h-3 shrink-0" /> Clear All</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
                  {PAGE_PRIVILEGES_LIST.map((page) => {
                    const rawVal = selectedUserPrivileges.permissions?.[page.key];
                    const currentLevel = rawVal === 'write' || rawVal === true ? 'write' : (rawVal === 'read' ? 'read' : 'none');

                    return (
                      <div key={page.key} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100/80 border border-gray-100">
                        <div>
                          <span className="font-bold text-gray-900 block">{page.label}</span>
                          <small className="text-gray-400 font-mono text-[10px]">{page.path}</small>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setUserPermissionLevel(page.key, 'none')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentLevel === 'none' ? 'bg-gray-300 text-gray-800 shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            None
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserPermissionLevel(page.key, 'read')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentLevel === 'read' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            Read
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserPermissionLevel(page.key, 'write')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                              currentLevel === 'write' ? 'bg-[#20b875] text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            Write
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedUserPrivileges(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Close
              </button>
              {selectedUserPrivileges.role !== 'superadmin' && (
                <button
                  type="button"
                  onClick={() => handleSavePermissions(selectedUserPrivileges._id, selectedUserPrivileges.permissions)}
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Save Page Access Privileges
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM ROLE MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-[#09233d]">Create Custom Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600" aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Role Key Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. qa_engineer"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Role Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QA & Test Engineer"
                  value={roleForm.label}
                  onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-2">Default Sidebar Page Privileges</label>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                  {PAGE_PRIVILEGES_LIST.map((page) => (
                    <label key={page.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <PrivilegeIcon icon={page.icon} />
                        <span className="font-semibold text-gray-800">{page.label}</span>
                      </div>
                      <select
                        value={roleForm.defaultPermissions[page.key] || 'none'}
                        onChange={(e) => setRoleForm({
                          ...roleForm,
                          defaultPermissions: { ...roleForm.defaultPermissions, [page.key]: e.target.value }
                        })}
                        className="text-xs border rounded p-1"
                      >
                        <option value="none">None</option>
                        <option value="read">Read</option>
                        <option value="write">Write</option>
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md"
                >
                  Save Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Create New User Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">1. Employee ID</label>
                  <input
                    type="text"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    placeholder="e.g. EMP005 (Auto if blank)"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">2. Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">3. Username</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. johndoe"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">4. Email Address</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="john@pydahsoft.com"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">5. Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">6. Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    placeholder="Engineering"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">7. Designation</label>
                  <input
                    type="text"
                    value={createForm.designation}
                    onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">8. Joining Date</label>
                  <input
                    type="date"
                    value={createForm.joiningDate}
                    onChange={(e) => setCreateForm({ ...createForm, joiningDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">9. System Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>{r.label || r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">10. Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">11. Account Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-[#09233d]">User Details: {viewingUser.name}</h3>
              <button onClick={() => setViewingUser(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600" aria-label="Close"><Icon name="close" className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Employee ID:</span><strong className="text-[#20b875]">{viewingUser.employeeId || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Username:</span><strong className="text-gray-800">@{viewingUser.username}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Email:</span><strong className="text-gray-800">{viewingUser.email || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Phone:</span><strong className="text-gray-800">{viewingUser.phone || 'N/A'}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Department:</span><strong className="text-gray-800">{viewingUser.department}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Designation:</span><strong className="text-gray-800">{viewingUser.designation}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">Joining Date:</span><strong className="text-gray-800">{new Date(viewingUser.joiningDate || viewingUser.createdAt).toLocaleDateString()}</strong></div>
              <div className="flex justify-between py-1 border-b"><span className="text-gray-500 font-medium">System Role:</span><span className="font-bold text-purple-700 uppercase">{viewingUser.role}</span></div>
              <div className="flex justify-between py-1"><span className="text-gray-500 font-medium">Account Status:</span><span className="font-bold text-emerald-700">{viewingUser.status || 'Active'}</span></div>
            </div>
            <button onClick={() => setViewingUser(null)} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs">Close</button>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Edit User Account</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    value={editingUser.designation || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, designation: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">System Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.name} value={r.name}>{r.label || r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Account Status</label>
                  <select
                    value={editingUser.status || 'Active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
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
