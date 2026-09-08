import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

export default function DailyWorkPlans({ currentUser }) {
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [createMode, setCreateMode] = useState('existing'); // 'existing' or 'new'

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    employee: '',
    selectedTaskId: '',
    // For new task option:
    newTaskTitle: '',
    parentModuleId: '',
    plannedHours: 4,
    priority: 'Medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!plans || plans.length === 0) setLoading(true);
    try {
      const [plansRes, empRes, tasksRes, modRes] = await Promise.all([
        fetchApi('/daily-plans'),
        fetchApi('/employees'),
        fetchApi('/tasks'),
        fetchApi('/modules')
      ]);
      setPlans(plansRes.data || []);
      setEmployees(empRes.data || []);
      setTasks(tasksRes.data || []);
      setModules(modRes.data || []);
    } catch (err) {
      console.error('Error loading daily plans data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!formData.employee) {
      alert('Please select an employee');
      return;
    }

    try {
      let targetTaskId = formData.selectedTaskId;

      // If user chose to create a new task title, create the Task document first in MongoDB
      if (createMode === 'new') {
        if (!formData.newTaskTitle || !formData.parentModuleId) {
          alert('Please enter task title and select parent module');
          return;
        }

        const selectedMod = modules.find((m) => m._id === formData.parentModuleId);
        const parentProjId = selectedMod ? (typeof selectedMod.project === 'object' ? selectedMod.project?._id : selectedMod.project) : '';

        const newTaskRes = await fetchApi('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: formData.newTaskTitle,
            module: formData.parentModuleId,
            project: parentProjId,
            assignedTo: formData.employee,
            priority: formData.priority,
            estimatedHours: formData.plannedHours
          })
        });

        targetTaskId = newTaskRes.data._id;
      }

      if (!targetTaskId) {
        alert('Please select or specify a task');
        return;
      }

      await fetchApi('/daily-plans', {
        method: 'POST',
        body: JSON.stringify({
          date: formData.date,
          employee: formData.employee,
          tasks: [
            {
              task: targetTaskId,
              plannedHours: formData.plannedHours,
              priority: formData.priority
            }
          ]
        })
      });

      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        employee: '',
        selectedTaskId: '',
        newTaskTitle: '',
        parentModuleId: '',
        plannedHours: 4,
        priority: 'Medium'
      });
      loadData();
    } catch (err) {
      alert(`Failed to create daily work plan: ${err.message}`);
    }
  };

  const isManager = currentUser?.role === 'teamlead' || currentUser?.role === 'superior' || currentUser?.role === 'superadmin';

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              if (modules.length > 0 && !formData.parentModuleId) {
                setFormData(prev => ({ ...prev, parentModuleId: modules[0]._id }));
              }
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63]"
          >
            + Create Daily Work Plan
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading daily work plans..." />
      ) : plans.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-xs font-semibold text-gray-500">
          No daily work plans generated yet. Click "+ Create Daily Work Plan" to schedule items.
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-[#09233d]">Employee: {plan.employee?.name}</span>
                  <small className="text-gray-400 block">Date: {new Date(plan.date).toLocaleDateString()}</small>
                </div>
                <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded">
                  Plan ID: {plan.planId || 'DPL'}
                </span>
              </div>

              <div className="space-y-2">
                {plan.tasks?.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-[#09233d] font-bold">{item.task?.title || 'Daily Planned Task'}</strong>
                      <span className="text-[11px] text-gray-500 block">
                        Planned Target: {item.plannedHours}h | Priority: {item.priority}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] uppercase">
                      {item.task?.status || item.status || 'Assigned & Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Daily Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-[#09233d]">Create Daily Work Plan</h3>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assigned Employee</label>
                  <select
                    required
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggle Mode: Existing Task vs New Task */}
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCreateMode('existing')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    createMode === 'existing' ? 'bg-white text-[#09233d] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Select Existing Task
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('new')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    createMode === 'new' ? 'bg-white text-[#09233d] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  + Create New Task
                </button>
              </div>

              {createMode === 'existing' ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Active Task</label>
                  <select
                    required
                    value={formData.selectedTaskId}
                    onChange={(e) => setFormData({ ...formData, selectedTaskId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                  >
                    <option value="">Select Task from Project List</option>
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title} ({t.module?.name || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">New Sub-module / Task Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daily Standup API Integration"
                      value={formData.newTaskTitle}
                      onChange={(e) => setFormData({ ...formData, newTaskTitle: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Parent Module</label>
                    <select
                      required
                      value={formData.parentModuleId}
                      onChange={(e) => setFormData({ ...formData, parentModuleId: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                    >
                      <option value="">Select Parent Module</option>
                      {modules.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Planned Hours</label>
                  <input
                    type="number"
                    value={formData.plannedHours}
                    onChange={(e) => setFormData({ ...formData, plannedHours: Number(e.target.value) })}
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

              <div className="flex justify-end gap-2 pt-3 border-t">
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
                  Save & Assign Daily Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
