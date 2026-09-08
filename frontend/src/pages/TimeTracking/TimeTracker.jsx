import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';

export const formatTrackedTime = (hours) => {
  const h = Number(hours) || 0;
  const totalMins = Math.round(h * 60);
  if (totalMins < 60) {
    return `${totalMins} mins`;
  }
  return `${h.toFixed(2)} hours`;
};

export default function TimeTracker({ currentUser }) {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitRemarks, setSubmitRemarks] = useState('');

  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'superior';

  useEffect(() => {
    loadTimeData();
  }, []);

  const loadTimeData = async () => {
    if (!assignedTasks || assignedTasks.length === 0) setLoading(true);
    try {
      const [tasksRes, timerRes] = await Promise.all([
        fetchApi('/tasks'),
        !isManager ? fetchApi('/time/my-active') : Promise.resolve({ data: null })
      ]);
      setAssignedTasks(tasksRes.data);
      if (!isManager) {
        setActiveTimer(timerRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Record Start Date & Time
  const handleStartTimer = async (taskId) => {
    try {
      const res = await fetchApi('/time/start', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
      setActiveTimer(res.data);
      loadTimeData();
    } catch (err) {
      alert(`Start time recording failed: ${err.message}`);
    }
  };

  // Record End Date & Time & Calculate Duration
  const handleEndTimer = async (taskId) => {
    try {
      await fetchApi('/time/stop', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
      setActiveTimer(null);
      loadTimeData();
    } catch (err) {
      alert(`End time recording failed: ${err.message}`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await fetchApi('/reviews/submit', {
        method: 'POST',
        body: JSON.stringify({
          taskId: selectedTask._id,
          remarks: submitRemarks
        })
      });
      setSelectedTask(null);
      setSubmitRemarks('');
      loadTimeData();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading time tracking tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedTasks.map((task) => {
            const est = task.estimatedHours || 0;
            const act = task.actualHours || 0;
            const efficiency = act > 0 ? Number(((est / act) * 100).toFixed(2)) : (est > 0 ? 100 : 0);

            const isRunning = activeTimer && activeTimer.task?._id === task._id;
            const isApproved = task.status === 'Approved';
            const isSubmitted = task.status === 'Submitted for Review';

            return (
              <div key={task._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3 border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded">
                      {task.taskId || 'TSK'}
                    </span>
                    <h3 className="text-sm font-bold text-[#09233d] mt-1">{task.title}</h3>
                    {isManager && task.assignedTo && (
                      <p className="text-[11px] text-gray-500 mt-0.5">Assigned Employee: <strong className="text-gray-700">{task.assignedTo.name}</strong></p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    isApproved ? 'bg-emerald-100 text-emerald-800' :
                    isSubmitted ? 'bg-amber-100 text-amber-800' :
                    isRunning ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {isRunning ? 'Tracking Started' : task.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Estimated</span>
                    <strong className="text-gray-800 font-bold">{est}h</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Tracked Duration</span>
                    <strong className="text-[#20b875] font-bold">{formatTrackedTime(act)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Efficiency</span>
                    <strong className={`font-bold ${efficiency >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {efficiency}%
                    </strong>
                  </div>
                </div>

                {/* Show recorded Start Time if active */}
                {isRunning && activeTimer?.startTime && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-gray-600">Start Time Recorded:</span>
                    <strong className="text-blue-900 font-mono font-bold">
                      {new Date(activeTimer.startTime).toLocaleTimeString()}
                    </strong>
                  </div>
                )}

                {/* Simplified Controls (Start -> End -> Submit) */}
                {!isManager && (
                  <div className="flex justify-between items-center pt-2">
                    {isApproved ? (
                      <div className="w-full flex justify-between items-center bg-emerald-50 px-3 py-2 rounded-xl text-emerald-800 font-bold text-xs">
                        <span className="inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" /> Task Approved & Completed</span>
                        <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded text-emerald-900 font-bold">Closed</span>
                      </div>
                    ) : isSubmitted ? (
                      <div className="w-full text-center bg-amber-50 py-2 rounded-xl text-amber-800 font-bold text-xs">
                        Submitted for Quality Review
                      </div>
                    ) : isRunning ? (
                      /* Step 2: Running -> Show End Time button */
                      <button
                        onClick={() => handleEndTimer(task._id)}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="inline-flex items-center gap-1.5"><Icon name="stop" className="w-3.5 h-3.5" /> End Time & Calculate Duration</span>
                      </button>
                    ) : act > 0 ? (
                      /* Step 3: End Time recorded (act > 0) -> Show Submit for Review button */
                      <div className="w-full flex justify-between items-center gap-2">
                        <button
                          onClick={() => handleStartTimer(task._id)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                        >
                          <span className="inline-flex items-center gap-1"><Icon name="arrowRight" className="w-3.5 h-3.5" /> Restart Time</span>
                        </button>
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="flex-1 py-2 bg-[#20b875] hover:bg-[#169e63] text-white rounded-xl text-xs font-bold shadow-md transition-all text-center"
                        >
                          <span className="inline-flex items-center gap-1">Submit for Review <Icon name="arrowRight" className="w-3.5 h-3.5" /></span>
                        </button>
                      </div>
                    ) : (
                      /* Step 1: Not Started -> Show Start Time button */
                      <button
                        onClick={() => handleStartTimer(task._id)}
                        className="w-full py-2.5 bg-[#20b875] hover:bg-[#169e63] text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="inline-flex items-center gap-1.5"><Icon name="arrowRight" className="w-3.5 h-3.5" /> Start Time</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit for Review Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-2">Submit Task: {selectedTask.title}</h3>
            <p className="text-xs text-gray-500 mb-4">Add completion remarks before sending to Team Lead for quality review.</p>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Completion Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={submitRemarks}
                  onChange={(e) => setSubmitRemarks(e.target.value)}
                  placeholder="e.g. Unit tests written, code reviewed, ready for verification."
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
