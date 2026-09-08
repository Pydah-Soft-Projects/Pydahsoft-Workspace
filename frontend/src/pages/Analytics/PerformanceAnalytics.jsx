import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';

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
        <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading performance data...</div>
      ) : displayedRecords.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-xs font-medium text-gray-500">
          No performance records found for your employee profile.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                {displayedRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50/60">
                    <td className="p-4">
                      <strong className="block text-[#09233d] font-bold">{rec.employee?.name}</strong>
                      <span className="text-[11px] text-gray-400">@{rec.employee?.username}</span>
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
      )}
    </div>
  );
}
