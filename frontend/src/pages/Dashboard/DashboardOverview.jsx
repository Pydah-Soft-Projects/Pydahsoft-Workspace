import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import EmployeeDashboardView from './EmployeeDashboardView';

export default function DashboardOverview({ user, setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewAsEmployeeId, setViewAsEmployeeId] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);

  useEffect(() => {
    if (user.role === 'superadmin' || user.role === 'superior') {
      fetchApi('/employees')
        .then((res) => setEmployeeList(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [user, viewAsEmployeeId]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/dashboard/employee';
      if (viewAsEmployeeId) {
        endpoint = `/dashboard/employee?employeeId=${viewAsEmployeeId}`;
      } else if (user.role === 'superior' || user.role === 'superadmin') {
        endpoint = '/dashboard/superior';
      } else if (user.role === 'teamlead') {
        endpoint = '/dashboard/teamlead';
      }

      const res = await fetchApi(endpoint);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-gray-600">
        Loading workspace dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
        {error}
        <button
          onClick={loadDashboard}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // If an employee is logged in, or an admin selected an employee to inspect
  if (viewAsEmployeeId || user.role === 'employee') {
    return (
      <div className="space-y-4">
        {viewAsEmployeeId && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-[#09233d]">
            <span>
              Inspecting Individual Employee Dashboard for:{' '}
              <strong className="text-[#10b981]">
                {data?.employeeProfile?.name || 'Selected Employee'}
              </strong>
            </span>
            <button
              onClick={() => setViewAsEmployeeId(null)}
              className="px-3 py-1.5 bg-[#072b1e] text-white rounded-xl hover:bg-[#0d3b2b] transition-colors"
            >
              ← Back to Overview
            </button>
          </div>
        )}
        <EmployeeDashboardView
          user={user}
          data={data}
          setActiveTab={setActiveTab}
          reloadDashboard={loadDashboard}
        />
      </div>
    );
  }

  // Superior Dashboard
  if (user.role === 'superior' || user.role === 'superadmin') {
    const summary = data?.summary || {};
    const timeData = data?.timeUtilization || {};

    return (
      <div className="space-y-6">
        {/* Admin Employee Dashboard Inspector Bar */}
        {employeeList.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#09233d] block">
                Individual Employee Dashboard Viewer
              </span>
              <span className="text-[11px] text-gray-400">
                Inspect live performance, donut charts, and trend analytics for any staff member
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setViewAsEmployeeId(e.target.value);
                }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#10b981]"
              >
                <option value="">-- Inspect Employee Dashboard --</option>
                {employeeList.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.username || emp.employeeId || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Projects</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#09233d]">{summary.totalProjects || 0}</span>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-bold text-[#20b875] hover:underline"
              >
                View All →
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Teams & Staff</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#09233d]">
                {summary.totalTeams || 0} <small className="text-xs font-semibold text-gray-400">Teams</small>
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {summary.totalEmployees || 0} Members
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects At Risk</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-600">{summary.projectsAtRisk || 0}</span>
              <span className="text-xs font-medium text-gray-500">
                {summary.delayedTasksCount || 0} Delayed / {summary.blockedTasksCount || 0} Blocked
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Org Efficiency</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">
                {timeData.orgEfficiencyPercentage || 100}%
              </span>
              <span className="text-xs font-medium text-gray-500">
                Est: {timeData.totalEstimatedHours || 0}h / Act: {timeData.totalActualHours || 0}h
              </span>
            </div>
          </div>
        </div>

        {/* Active Projects List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-[#09233d]">Live Project Lifecycle Progress</h2>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs font-bold text-[#20b875] hover:underline"
            >
              Manage Projects
            </button>
          </div>

          <div className="space-y-4">
            {data?.activeProjects?.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">No active projects created yet.</p>
            ) : (
              data?.activeProjects?.map((proj) => (
                <div key={proj._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded mr-2">
                        {proj.projectId || 'PRJ'}
                      </span>
                      <strong className="text-sm font-bold text-[#09233d]">{proj.name}</strong>
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {proj.progress || 0}% Completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#20b875] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Team Lead Dashboard
  if (user.role === 'teamlead') {
    const stats = data?.taskStats || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tasks</span>
            <p className="text-3xl font-black text-[#09233d] mt-2">{stats.totalTasks || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
            <p className="text-3xl font-black text-amber-600 mt-2">{stats.pendingReviewsCount || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Progress</span>
            <p className="text-3xl font-black text-blue-600 mt-2">{stats.inProgressCount || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Tasks</span>
            <p className="text-3xl font-black text-emerald-600 mt-2">{stats.approvedCount || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-[#09233d] mb-4">Pending Task Review Queue</h2>
          {data?.pendingReviewQueue?.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No tasks waiting for review.</p>
          ) : (
            <div className="space-y-3">
              {data?.pendingReviewQueue?.map((t) => (
                <div key={t._id} className="flex justify-between items-center p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div>
                    <strong className="text-xs font-bold text-[#09233d] block">{t.title}</strong>
                    <span className="text-[11px] text-gray-500">Assigned To: {t.assignedTo?.name}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="px-3 py-1.5 bg-[#20b875] text-white text-xs font-bold rounded-lg hover:bg-[#169e63]"
                  >
                    Review Task →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to Employee Dashboard
  return (
    <EmployeeDashboardView
      user={user}
      data={data}
      setActiveTab={setActiveTab}
      reloadDashboard={loadDashboard}
    />
  );
}
