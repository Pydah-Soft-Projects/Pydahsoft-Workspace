import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

export default function TaskAssignment() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredTasks = filterStatus === 'All'
    ? tasks
    : tasks.filter((t) => t.status === filterStatus);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#09233d]">Task Assignments ("Tasks Giving to Users")</h2>
        <button
          onClick={fetchTasks}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-3 py-1.5 rounded text-xs"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-white p-4 rounded border border-gray-300 flex items-center gap-3 text-sm">
        <span className="font-bold text-gray-700">Filter by Status:</span>
        {['All', 'Pending', 'In Progress', 'Under Review', 'Completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded text-xs font-bold ${
              filterStatus === s ? 'bg-[#09233d] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded border border-gray-300 shadow-sm">
        {loading ? (
          <LoadingSpinner />
        ) : filteredTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No assigned tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="p-3 font-bold">Task Title</th>
                  <th className="p-3 font-bold">Project</th>
                  <th className="p-3 font-bold">Assigned User</th>
                  <th className="p-3 font-bold">Priority</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-bold text-[#09233d]">{t.title}</p>
                      {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                    </td>
                    <td className="p-3 text-gray-700 font-medium">{t.project}</td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-800">
                        {t.assignedTo ? t.assignedTo.name : 'Unassigned'}
                      </span>
                      {t.assignedTo && <p className="text-[11px] text-gray-500">{t.assignedTo.role}</p>}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        t.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        t.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                        className="border border-gray-300 rounded p-1 text-xs bg-white font-semibold text-gray-800"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
