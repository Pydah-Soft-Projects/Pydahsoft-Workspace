import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

const EMPLOYEE_NAME_COLORS = [
  'text-emerald-800 bg-emerald-100/90 border-emerald-300',
  'text-blue-800 bg-blue-100/90 border-blue-300',
  'text-purple-800 bg-purple-100/90 border-purple-300',
  'text-amber-800 bg-amber-100/90 border-amber-300',
  'text-indigo-800 bg-indigo-100/90 border-indigo-300',
  'text-rose-800 bg-rose-100/90 border-rose-300',
  'text-teal-800 bg-teal-100/90 border-teal-300',
  'text-cyan-800 bg-cyan-100/90 border-cyan-300',
  'text-fuchsia-800 bg-fuchsia-100/90 border-fuchsia-300',
  'text-orange-800 bg-orange-100/90 border-orange-300',
  'text-violet-800 bg-violet-100/90 border-violet-300',
  'text-sky-800 bg-sky-100/90 border-sky-300',
];

const getEmployeeColor = (nameStr = '', index = 0) => {
  if (!nameStr) return EMPLOYEE_NAME_COLORS[index % EMPLOYEE_NAME_COLORS.length];
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % EMPLOYEE_NAME_COLORS.length;
  return EMPLOYEE_NAME_COLORS[colorIndex];
};

export default function PerformanceAnalytics({ currentUser }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    if (!records || records.length === 0) setLoading(true);
    setError('');
    try {
      const res = await fetchApi('/analytics/performance');
      setRecords(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      if (!records || records.length === 0) setError(err.message || 'Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  const isManager = currentUser?.role === 'superior' || currentUser?.role === 'superadmin';
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const displayedRecords = isManager
    ? records
    : records.filter((rec) => {
        if (currentUser?.role === 'employee') {
          const empId = (typeof rec.employee === 'object' ? rec.employee?._id : rec.employee)?.toString();
          return empId === currentUserId;
        }
        return true;
      });

  return (
    <div className="space-y-4">

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading performance data..." />
      ) : displayedRecords.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-xs font-medium text-gray-500">
          No performance records found for your employee profile.
        </div>
      ) : (
        <div className="space-y-4">
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {displayedRecords.map((rec, idx) => (
              <div key={rec._id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm space-y-2">
                {/* Employee Header Row */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border inline-block shadow-2xs ${getEmployeeColor(rec.employee?.name || rec.employee?.username, idx)}`}>
                      {rec.employee?.name || rec.employee?.username || 'Employee'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">@{rec.employee?.username}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-gray-400 uppercase block">Score</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#20b875] font-black rounded-full text-xs inline-block">
                      {rec.performanceScore || 100}
                    </span>
                  </div>
                </div>

                {/* Department Row */}
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-medium">Department:</span>
                  <span className="font-semibold text-gray-700">{rec.employee?.department || 'General'}</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-1 bg-gray-50/80 p-2 rounded-lg border border-gray-100 text-center text-[9.5px]">
                  <div>
                    <span className="text-gray-400 font-medium block text-[8px] uppercase">Tasks Done</span>
                    <strong className="text-gray-800 font-bold">{rec.completedTasks || 0} / {rec.totalTasks || 0}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[8px] uppercase">Completion</span>
                    <strong className="text-blue-600 font-bold">{rec.completionRate || 0}%</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[8px] uppercase">On-Time</span>
                    <strong className="text-purple-600 font-bold">{rec.onTimeRate || 0}%</strong>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="flex justify-between items-center text-[9.5px] pt-1 text-gray-500">
                  <span>Efficiency: <strong className="text-amber-600 font-bold">{rec.efficiencyPercentage || 100}%</strong></span>
                  <span>Rejections: <strong className="text-rose-600 font-bold">{rec.rejectionsCount || 0}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Tasks Completed</th>
                    <th className="p-4">Completion Rate</th>
                    <th className="p-4">On-Time Rate</th>
                    <th className="p-4">Efficiency</th>
                    <th className="p-4">Rejections</th>
                    <th className="p-4 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {displayedRecords.map((rec, idx) => (
                    <tr key={rec._id} className="hover:bg-gray-50/60">
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border inline-block shadow-2xs ${getEmployeeColor(rec.employee?.name || rec.employee?.username, idx)}`}>
                          {rec.employee?.name || rec.employee?.username || 'Employee'}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">@{rec.employee?.username}</span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">{rec.employee?.department}</td>
                      <td className="p-4 font-semibold text-gray-800">
                        {rec.completedTasks || 0} / {rec.totalTasks || 0}
                      </td>
                      <td className="p-4 font-bold text-blue-600">{rec.completionRate || 0}%</td>
                      <td className="p-4 font-bold text-purple-600">{rec.onTimeRate || 0}%</td>
                      <td className="p-4 font-bold text-amber-600">{rec.efficiencyPercentage || 100}%</td>
                      <td className="p-4 font-semibold text-rose-600">{rec.rejectionsCount || 0}</td>
                      <td className="p-4 text-right">
                        <span className="px-3 py-1 bg-emerald-50 text-[#20b875] font-black rounded-full text-sm">
                          {rec.performanceScore || 100}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
