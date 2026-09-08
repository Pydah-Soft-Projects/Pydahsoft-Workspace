import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';

export default function TaskManagement({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Re-assign Task Modal State
  const [reassigningTask, setReassigningTask] = useState(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'superior';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    module: '',
    assignedTo: '',
    priority: 'Medium',
    estimatedHours: 8,
    dueDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!tasks || tasks.length === 0) setLoading(true);
    setError('');
    try {
      const [taskRes, empRes, projRes, modRes] = await Promise.all([
        fetchApi('/tasks'),
        fetchApi('/employees'),
        fetchApi('/projects'),
        fetchApi('/modules')
      ]);
      setTasks(taskRes.data);
      setEmployees(empRes.data);
      setProjects(projRes.data);
      setModules(modRes.data);
    } catch (err) {
      if (!tasks || tasks.length === 0) setError(err.message || 'Failed to load task data');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSelect = (modId) => {
    const selectedMod = modules.find((m) => m._id === modId);
    const parentProjId = selectedMod ? (typeof selectedMod.project === 'object' ? selectedMod.project?._id : selectedMod.project) : '';
    setFormData((prev) => ({
      ...prev,
      module: modId,
      project: parentProjId || prev.project
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.module) {
      alert('Please select a parent module');
      return;
    }
    try {
      await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        project: '',
        module: '',
        assignedTo: '',
        priority: 'Medium',
        estimatedHours: 8,
        dueDate: ''
      });
      loadData();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassigningTask || !selectedAssigneeId) return;
    try {
      await fetchApi(`/tasks/${reassigningTask._id}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedTo: selectedAssigneeId })
      });
      setReassigningTask(null);
      setSelectedAssigneeId('');
      loadData();
    } catch (err) {
      alert(`Failed to re-assign task: ${err.message}`);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await fetchApi(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  const canCreateTasks = isManager || currentUser?.permissions?.canCreateTasks !== false;
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const displayedTasks = isManager
    ? tasks
    : tasks.filter((task) => {
        const assigneeId = (typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo)?.toString();
        const creatorId = (typeof task.createdBy === 'object' ? task.createdBy?._id : task.createdBy)?.toString();
        return (assigneeId && assigneeId === currentUserId) || (creatorId && creatorId === currentUserId);
      });

  return (
    <div className="space-y-4">
      {canCreateTasks && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (modules.length > 0 && !formData.module) {
                handleModuleSelect(modules[0]._id);
              }
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63]"
          >
            + Create & Assign Task
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading tasks...</div>
      ) : displayedTasks.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-xs font-medium text-gray-500">
          No assigned tasks found for your employee profile.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="p-4">Task ID & Title</th>
                  <th className="p-4">Parent Module / Project</th>
                  <th className="p-4">Team & Assigned Person</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Est / Act Hours</th>
                  <th className="p-4">Lifecycle Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {displayedTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50/60">
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded mr-1">
                        {task.taskId || 'TSK'}
                      </span>
                      <strong className="text-[#09233d] font-bold">{task.title}</strong>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      <strong className="text-[#09233d] block">{task.module?.name || 'General Module'}</strong>
                      <small className="text-[10px] text-gray-400">Project: {task.project?.name || 'N/A'}</small>
                    </td>
                    <td className="p-4">
                      <strong className="text-gray-800 block">{task.assignedTo?.name || 'Unassigned'}</strong>
                      <small className="text-[10px] text-purple-700 font-semibold">{task.team?.name || 'Team Assigned'}</small>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        task.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {task.estimatedHours || 0}h / <span className="text-[#20b875]">{task.actualHours || 0}h</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        task.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'Submitted for Review' ? 'bg-amber-100 text-amber-800' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {canCreateTasks && (
                        <button
                          onClick={() => {
                            setReassigningTask(task);
                            setSelectedAssigneeId(task.assignedTo?._id || '');
                          }}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-200"
                        >
                          <span className="inline-flex items-center gap-1"><Icon name="activity" className="w-3.5 h-3.5" /> Re-assign</span>
                        </button>
                      )}

                      {!isManager && (
                        <>
                          {task.status === 'Not Started' && (
                            <button
                              onClick={() => updateStatus(task._id, 'In Progress')}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold hover:bg-blue-100"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'In Progress' && (
                            <>
                              <button
                                onClick={() => updateStatus(task._id, 'Paused')}
                                className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[11px] font-bold hover:bg-amber-100"
                              >
                                Pause
                              </button>
                              <button
                                onClick={() => updateStatus(task._id, 'Submitted for Review')}
                                className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[11px] font-bold hover:bg-emerald-100"
                              >
                                Submit
                              </button>
                            </>
                          )}
                          {task.status === 'Paused' && (
                            <button
                              onClick={() => updateStatus(task._id, 'In Progress')}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold hover:bg-blue-100"
                            >
                              Resume
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Re-assign Task Modal */}
      {reassigningTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-[#09233d]">Assign / Re-assign Task</h3>
            <p className="text-xs text-gray-500">Re-assign task <strong className="text-gray-800">{reassigningTask.title}</strong> to the next level team member</p>

            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Assignee (Next Level)</label>
                <select
                  required
                  value={selectedAssigneeId}
                  onChange={(e) => setSelectedAssigneeId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Assignee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setReassigningTask(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Create Sub-module / Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Parent Module</label>
                <select
                  required
                  value={formData.module}
                  onChange={(e) => handleModuleSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Parent Module</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.assignedTeam?.name ? `Team: ${m.assignedTeam.name}` : 'Unassigned Team'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Sub-module / Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. JWT Token Validation Logic"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assign to (Next Level)</label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Assignee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
