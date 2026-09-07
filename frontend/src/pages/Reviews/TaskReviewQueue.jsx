import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';

export default function TaskReviewQueue({ currentUser }) {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectModalTask, setRejectModalTask] = useState(null);
  const [rejectComments, setRejectComments] = useState('');

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi('/reviews/pending');
      setPendingTasks(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load pending task review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId) => {
    try {
      await fetchApi('/reviews/approve', {
        method: 'POST',
        body: JSON.stringify({ taskId, comments: 'Approved by Team Lead/Superior' })
      });
      loadPendingReviews();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModalTask || !rejectComments) return;
    try {
      await fetchApi('/reviews/reject', {
        method: 'POST',
        body: JSON.stringify({
          taskId: rejectModalTask._id,
          comments: rejectComments
        })
      });
      setRejectModalTask(null);
      setRejectComments('');
      loadPendingReviews();
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading pending reviews...</div>
      ) : pendingTasks.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-xs font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5"><Icon name="check" className="w-4 h-4" /> No pending tasks waiting for approval in the review queue.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTasks.map((task) => (
            <div key={task._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded">
                    {task.taskId || 'TSK'}
                  </span>
                  <h3 className="text-sm font-bold text-[#09233d]">{task.title}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Assigned Employee: <strong className="text-gray-800 font-bold">{task.assignedTo?.name}</strong> | Project:{' '}
                  <strong className="text-gray-800">{task.project?.name || 'General'}</strong>
                </p>
                {task.remarks && (
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-xs text-amber-900 mt-2">
                    <strong>Submitter Remarks:</strong> {task.remarks}
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setRejectModalTask(task)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-200"
                >
                  <span className="inline-flex items-center gap-1"><Icon name="close" className="w-3.5 h-3.5" /> Reject for Rework</span>
                </button>
                <button
                  onClick={() => handleApprove(task._id)}
                  className="px-4 py-2 bg-[#20b875] text-white hover:bg-[#169e63] rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <span className="inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" /> Approve & Roll-Up Progress</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Task Modal */}
      {rejectModalTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-2">Reject Task: {rejectModalTask.title}</h3>
            <p className="text-xs text-gray-500 mb-4">Specify mandatory rework reasons and feedback for the employee.</p>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Rework Comments / Reasons</label>
                <textarea
                  required
                  rows={3}
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  placeholder="e.g. Unit tests failing on boundary cases. Please fix and resubmit."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRejectModalTask(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
