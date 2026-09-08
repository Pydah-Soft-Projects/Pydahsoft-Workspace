import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import EmployeeDashboardView from './EmployeeDashboardView';
import Icon from '../../components/Icon';

export default function DashboardOverview({
  user,
  setActiveTab,
  viewAsEmployeeId: propViewAsEmployeeId,
  setViewAsEmployeeId: propSetViewAsEmployeeId,
  employeeList: propEmployeeList,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localViewAsEmployeeId, setLocalViewAsEmployeeId] = useState(null);
  const [localEmployeeList, setLocalEmployeeList] = useState([]);

  const viewAsEmployeeId = propViewAsEmployeeId !== undefined ? propViewAsEmployeeId : localViewAsEmployeeId;
  const setViewAsEmployeeId = propSetViewAsEmployeeId || setLocalViewAsEmployeeId;
  const employeeList = propEmployeeList || localEmployeeList;

  useEffect(() => {
    if ((user.role === 'superadmin' || user.role === 'superior') && !propEmployeeList) {
      fetchApi('/employees')
        .then((res) => setLocalEmployeeList(res.data || []))
        .catch(() => {});
    }
  }, [user, propEmployeeList]);

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
      <div className="min-h-[calc(100vh-8rem)] p-8 text-center text-sm font-semibold text-gray-600">
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

  // If an employee is logged in directly
  if (user.role === 'employee') {
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
              <span className="inline-flex items-center gap-1.5"><Icon name="arrowLeft" className="w-3.5 h-3.5" /> Back to Overview</span>
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

  // Superior / Super Admin Dashboard
  if (user.role === 'superior' || user.role === 'superadmin') {
    const summary = data?.summary || {};
    const timeData = data?.timeUtilization || {};
    const activeProjects = data?.activeProjects || [];

    // Calculate project statuses for Pie / Donut Chart
    const totalProj = activeProjects.length || summary.totalProjects || 0;
    const completedProj = activeProjects.filter((p) => (p.progress || 0) >= 100).length;
    const inProgressProj = activeProjects.filter((p) => (p.progress || 0) > 0 && (p.progress || 0) < 100).length;
    const notStartedProj = activeProjects.filter((p) => (p.progress || 0) === 0).length;
    const atRiskProj = summary.projectsAtRisk || 0;

    // Donut chart calculations
    const donutData = [
      { label: 'In Progress', count: inProgressProj, color: '#20b875' },
      { label: 'Completed', count: completedProj, color: '#09233d' },
      { label: 'Not Started', count: notStartedProj, color: '#94a3b8' },
      { label: 'At Risk', count: atRiskProj, color: '#e11d48' },
    ];
    const validDonutTotal = donutData.reduce((acc, curr) => acc + curr.count, 0) || 1;

    // SVG Donut Path calculations
    let cumulativePercent = 0;
    const donutSlices = donutData.map((item) => {
      const percent = item.count / validDonutTotal;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      return {
        ...item,
        percent,
        dashArray: `${percent * 283} 283`,
        dashOffset: -startPercent * 283,
      };
    });

    // Fix Org Efficiency display calculation
    const estHours = timeData.totalEstimatedHours || 0;
    const actHours = timeData.totalActualHours || 0;
    let safeEfficiency = 100;
    if (actHours > 0 && estHours > 0) {
      if (actHours <= estHours) {
        safeEfficiency = 100;
      } else {
        safeEfficiency = Math.max(0, Math.round((estHours / actHours) * 100));
      }
    }

    return (
      <div className="space-y-6">
        {/* Admin Employee Dashboard Inspector Bar */}
        {employeeList.length > 0 && (
          <div className="dashboard-section-hover bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
          {/* Active Projects Card */}
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Projects</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#20b875] flex items-center justify-center font-bold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#09233d]">{totalProj}</span>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-bold text-[#20b875] hover:underline flex items-center gap-1"
              >
                <span className="inline-flex items-center gap-1">View All <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
              </button>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#20b875] h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Total Teams & Staff Card */}
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teams & Members</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#09233d]">
                {summary.totalTeams || 0}{' '}
                <small className="text-xs font-semibold text-gray-400">Teams</small>
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {summary.totalEmployees || 0} Members
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          {/* Projects At Risk Card */}
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects At Risk</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-rose-600">{summary.projectsAtRisk || 0}</span>
              <span className="text-xs font-medium text-gray-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {summary.delayedTasksCount || 0} Delayed / {summary.blockedTasksCount || 0} Blocked
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${summary.projectsAtRisk > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: summary.projectsAtRisk > 0 ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          {/* Org Efficiency Card */}
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Org Efficiency</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">{safeEfficiency}%</span>
              <span className="text-xs font-medium text-gray-500">
                Est: {estHours}h / Act: {actHours}h
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, safeEfficiency)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Visual Graphical Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Project Status & Risk Allocation Donut Chart */}
          <div className="dashboard-section-hover bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-[#09233d]">Project Status & Risk Breakdown</h2>
                <p className="text-xs text-gray-400">Distribution of projects across lifecycle stages</p>
              </div>
              <span className="text-xs font-bold text-[#20b875] bg-emerald-50 px-2.5 py-1 rounded-lg">
                Pie / Donut Graph
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
              {/* SVG Donut Chart */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="10"
                      strokeDasharray={slice.dashArray}
                      strokeDashoffset={slice.dashOffset}
                      className="transition-all duration-700 ease-out hover:opacity-90"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#09233d]">{totalProj}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Projects</span>
                </div>
              </div>

              {/* Legend & Breakdown Stats */}
              <div className="space-y-3 w-full sm:w-auto">
                {donutData.map((item, idx) => {
                  const pct = Math.round((item.count / validDonutTotal) * 100);
                  return (
                    <div key={idx} className="flex items-center justify-between gap-4 p-2 rounded-lg bg-gray-50 border border-gray-100 min-w-[170px]">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-gray-700">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#09233d] block">{item.count}</span>
                        <span className="text-[10px] font-medium text-gray-400">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart 2: Resource Time Utilization Bar Graph */}
          <div className="dashboard-section-hover bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-[#09233d]">Resource Time Allocation Graph</h2>
                <p className="text-xs text-gray-400">Comparison of Estimated vs Actual logged hours</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Bar Chart
              </span>
            </div>

            <div className="py-2 space-y-6">
              {/* Estimated Hours Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span> Total Estimated Hours
                  </span>
                  <span className="text-[#09233d] font-black">{estHours} Hours</span>
                </div>
                <div className="w-full bg-gray-100 h-6 rounded-xl overflow-hidden p-1 border border-gray-100 flex items-center">
                  <div
                    className="bg-blue-500 h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                    style={{ width: `${estHours > 0 ? 100 : 5}%` }}
                  >
                    {estHours}h
                  </div>
                </div>
              </div>

              {/* Actual Logged Hours Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#20b875] inline-block"></span> Total Actual Logged Hours
                  </span>
                  <span className="text-[#09233d] font-black">{actHours} Hours</span>
                </div>
                <div className="w-full bg-gray-100 h-6 rounded-xl overflow-hidden p-1 border border-gray-100 flex items-center">
                  <div
                    className="bg-[#20b875] h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                    style={{
                      width: `${estHours > 0 ? Math.min(100, Math.max(5, (actHours / estHours) * 100)) : 5}%`,
                    }}
                  >
                    {actHours}h
                  </div>
                </div>
              </div>

              {/* Summary Indicator Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-emerald-900 block">Execution Status</strong>
                    <span className="text-[11px] text-emerald-700">
                      {actHours <= estHours ? 'Project work is within allocated budget limits.' : 'Actual hours exceed estimated allocation.'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  {safeEfficiency}% Efficiency
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Project Lifecycle Progress Section */}
        <div className="dashboard-section-hover bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-[#09233d]">Live Project Lifecycle Progress</h2>
              <p className="text-xs text-gray-400">Visual progress indicators for active company projects</p>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs font-bold text-[#20b875] hover:underline"
            >
              <span className="inline-flex items-center gap-1">Manage Projects <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
            </button>
          </div>

          <div className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No active projects created yet.
              </p>
            ) : (
              activeProjects.map((proj) => {
                const prog = proj.progress || 0;
                return (
                  <div key={proj._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#20b875] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          {proj.projectId || 'PRJ'}
                        </span>
                        <strong className="text-sm font-bold text-[#09233d]">{proj.name}</strong>
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                        {prog}% Completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-[#20b875] to-emerald-400 h-full transition-all duration-700 rounded-full"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                );
              })
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
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tasks</span>
            <p className="text-3xl font-black text-[#09233d] mt-2">{stats.totalTasks || 0}</p>
          </div>
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approvals</span>
            <p className="text-3xl font-black text-amber-600 mt-2">{stats.pendingReviewsCount || 0}</p>
          </div>
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">In Progress</span>
            <p className="text-3xl font-black text-blue-600 mt-2">{stats.inProgressCount || 0}</p>
          </div>
          <div className="dashboard-section-hover bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved Tasks</span>
            <p className="text-3xl font-black text-emerald-600 mt-2">{stats.approvedCount || 0}</p>
          </div>
        </div>

        <div className="dashboard-section-hover bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
                    <span className="inline-flex items-center gap-1">Review Task <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
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
