import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';

export default function ReportGenerator({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [filters, setFilters] = useState({
    projectId: '',
    teamId: '',
    employeeId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [projRes, teamRes, empRes] = await Promise.all([
        fetchApi('/projects'),
        fetchApi('/teams'),
        fetchApi('/employees')
      ]);
      setProjects(projRes.data || []);
      setTeams(teamRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Failed to load report filter options:', err);
    }
  };

  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.teamId) queryParams.append('teamId', filters.teamId);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const res = await fetchApi(`/reports/generate?${queryParams.toString()}`);
      setReportData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate filter-driven report');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      projectId: '',
      teamId: '',
      employeeId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setReportData(null);
  };

  const formatHours = (hrs) => {
    const totalMins = Math.round((hrs || 0) * 60);
    if (totalMins < 60) return `${totalMins} mins`;
    return `${(hrs || 0).toFixed(2)} hours`;
  };

  return (
    <div className="space-y-6">
      {/* FILTER CONTROLS PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3 border-gray-100">
          <h3 className="text-sm font-bold text-[#09233d] uppercase tracking-wider flex items-center gap-2">
            <Icon name="dashboard" className="w-4 h-4" /> Filter-Driven Performance Report Generator
          </h3>
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-gray-500 hover:text-gray-700 underline"
          >
            Reset All Filters
          </button>
        </div>

        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">1. Project</label>
              <select
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">2. Team</label>
              <select
                value={filters.teamId}
                onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
              >
                <option value="">All Teams</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">3. Employee</label>
              <select
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">4. Task Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted for Review">Submitted for Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">5. Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">6. End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#20b875] hover:bg-[#169e63] text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? 'Generating Report...' : <><Icon name="search" className="w-3.5 h-3.5" /> Generate Filtered Report</>}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {/* REPORT RESULTS DISPLAY */}
      {reportData && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 border-gray-100 gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#09233d]">Filtered Performance Summary Report</h2>
              <p className="text-xs text-gray-500">
                Generated on: <strong className="text-gray-800">{new Date(reportData.generatedAt).toLocaleString()}</strong>
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
            >
              <Icon name="printer" className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
              <span className="text-[11px] text-blue-700 font-bold uppercase block mb-1">Total Filtered Tasks</span>
              <strong className="text-xl font-extrabold text-[#09233d]">{reportData.summary?.totalTasks || 0}</strong>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-bold uppercase block mb-1">Approved Tasks</span>
              <strong className="text-xl font-extrabold text-[#20b875]">{reportData.summary?.approvedTasks || 0}</strong>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
              <span className="text-[11px] text-purple-700 font-bold uppercase block mb-1">Completion Rate</span>
              <strong className="text-xl font-extrabold text-purple-900">{reportData.summary?.completionRate || 0}%</strong>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
              <span className="text-[11px] text-amber-700 font-bold uppercase block mb-1">Tracked Duration</span>
              <strong className="text-xl font-extrabold text-amber-900">
                {formatHours(Number(reportData.summary?.totalActHours || 0))}
              </strong>
            </div>
          </div>

          {/* DETAILED TASKS TABLE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Detailed Tasks Breakdown</h4>
            {reportData.tasks && reportData.tasks.length > 0 ? (
              <div className="space-y-3">
                {/* MOBILE CARDS VIEW (< md) */}
                <div className="grid grid-cols-1 gap-2.5 md:hidden">
                  {reportData.tasks.map((task) => (
                    <div key={task._id} className="p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm space-y-1.5 text-xs">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-[#20b875] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {task.taskId || 'TSK'}
                          </span>
                          <strong className="text-[#09233d] font-bold text-xs">{task.title}</strong>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                          task.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          task.status === 'Submitted for Review' ? 'bg-amber-100 text-amber-800' :
                          task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Project: <strong className="text-gray-800">{task.project?.name || 'N/A'}</strong></span>
                        <span>Module: <strong className="text-gray-800">{task.module?.name || 'N/A'}</strong></span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                        <span>Assigned: <strong className="text-gray-800">{task.assignedTo?.name || 'Unassigned'}</strong></span>
                        <span>Est/Act: <strong>{task.estimatedHours || 0}h / <span className="text-[#20b875]">{formatHours(task.actualHours)}</span></strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP TABLE VIEW (>= md) */}
                <div className="hidden md:block overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold uppercase text-gray-500 border-b border-gray-100">
                        <th className="p-3">Task ID & Title</th>
                        <th className="p-3">Project & Module</th>
                        <th className="p-3">Team & Assigned Staff</th>
                        <th className="p-3">Est / Act Hours</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {reportData.tasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50/60">
                          <td className="p-3">
                            <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded mr-1">
                              {task.taskId || 'TSK'}
                            </span>
                            <strong className="text-[#09233d] font-bold">{task.title}</strong>
                          </td>
                          <td className="p-3 text-gray-700">
                            <strong className="block text-gray-900">{task.project?.name || 'N/A'}</strong>
                            <span className="text-[10px] text-gray-400">{task.module?.name || 'N/A'}</span>
                          </td>
                          <td className="p-3 text-gray-700">
                            <strong className="block text-gray-900">{task.assignedTo?.name || 'Unassigned'}</strong>
                            <span className="text-[10px] text-purple-700 font-semibold">{task.team?.name || 'General Team'}</span>
                          </td>
                          <td className="p-3 font-semibold text-gray-700">
                            {task.estimatedHours || 0}h / <span className="text-[#20b875]">{formatHours(task.actualHours)}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              task.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              task.status === 'Submitted for Review' ? 'bg-amber-100 text-amber-800' :
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                No tasks match the selected filter criteria.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
