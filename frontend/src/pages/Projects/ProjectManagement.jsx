import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';

const KEY_BADGE_COLORS = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

const getKeyBadgeColor = (keyStr, index = 0) => {
  if (!keyStr) return KEY_BADGE_COLORS[index % KEY_BADGE_COLORS.length];
  let hash = 0;
  for (let i = 0; i < keyStr.length; i++) {
    hash = keyStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % KEY_BADGE_COLORS.length;
  return KEY_BADGE_COLORS[colorIndex];
};

export default function ProjectManagement({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: 'Internal',
    assignedTeam: '',
    priority: 'Medium',
    deadline: ''
  });

  useEffect(() => {
    loadData();

    const handleOpenModal = () => setShowModal(true);
    window.addEventListener('open-create-project-modal', handleOpenModal);
    return () => window.removeEventListener('open-create-project-modal', handleOpenModal);
  }, []);

  const loadData = async () => {
    if (!projects || projects.length === 0) setLoading(true);
    setError('');
    try {
      const [projRes, teamRes] = await Promise.all([
        fetchApi('/projects'),
        fetchApi('/teams')
      ]);
      setProjects(projRes.data);
      setTeams(teamRes.data);
    } catch (err) {
      if (!projects || projects.length === 0) setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        client: 'Internal',
        assignedTeam: '',
        priority: 'Medium',
        deadline: ''
      });
      loadData();
    } catch (err) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {(currentUser?.role === 'superior' || currentUser?.role === 'superadmin') && (
        <div className="hidden md:flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63]"
          >
            + Create New Project
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading projects..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {projects.map((proj, idx) => {
            const keyBadgeStyle = getKeyBadgeColor(proj.projectId, idx);
            return (
              <div key={proj._id} className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm space-y-2 sm:space-y-3">
                <div className="flex justify-between items-start border-b pb-1.5 sm:pb-3 border-gray-100">
                  <div>
                    <span className={`text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border ${keyBadgeStyle}`}>
                      {proj.projectId || 'PRJ'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#09233d] mt-0.5 sm:mt-1">{proj.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">{proj.description}</p>
                  </div>
                  <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase shrink-0 ${
                    proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    proj.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] sm:text-xs font-bold text-gray-600 mb-0.5 sm:mb-1">
                    <span>Progress Roll-up</span>
                    <span>{proj.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 sm:h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#20b875] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${proj.progress || 0}%` }}
                    />
                  </div>
                </div>

                <div className="text-[9px] sm:text-xs space-y-0.5 sm:space-y-1 pt-1 text-gray-500 border-t border-gray-50 flex flex-wrap justify-between gap-1">
                  <span>Assigned Team: <strong className="text-gray-700">{proj.assignedTeam?.name || 'Unassigned'}</strong></span>
                  <span>Priority: <strong className="text-gray-700">{proj.priority}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Enterprise Cloud Platform"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assign Team</label>
                <select
                  value={formData.assignedTeam}
                  onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Team</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                  />
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
