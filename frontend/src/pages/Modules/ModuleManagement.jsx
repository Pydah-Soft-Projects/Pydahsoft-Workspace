import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';
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

export default function ModuleManagement({ currentUser }) {
  const [modules, setModules] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  
  // Assign Team Modal State
  const [assigningModule, setAssigningModule] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project: '',
    assignedTeam: '',
    estimatedHours: 10,
    expectedCompletionDate: ''
  });

  useEffect(() => {
    loadData();

    const handleOpenModal = () => {
      setFormData(prev => ({ ...prev, project: projects[0]?._id || '' }));
      setShowModal(true);
    };
    window.addEventListener('open-create-module-modal', handleOpenModal);
    return () => window.removeEventListener('open-create-module-modal', handleOpenModal);
  }, [projects]);

  const loadData = async () => {
    if (!modules || modules.length === 0) setLoading(true);
    setError('');
    try {
      const [modRes, projRes, teamRes] = await Promise.all([
        fetchApi('/modules'),
        fetchApi('/projects'),
        fetchApi('/teams')
      ]);
      setModules(modRes.data);
      setProjects(projRes.data);
      setTeams(teamRes.data);
    } catch (err) {
      if (!modules || modules.length === 0) setError(err.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/modules', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        project: '',
        assignedTeam: '',
        estimatedHours: 10,
        expectedCompletionDate: ''
      });
      loadData();
    } catch (err) {
      alert(`Failed to create module: ${err.message}`);
    }
  };

  const handleAssignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!assigningModule) return;
    try {
      await fetchApi(`/modules/${assigningModule._id}/assign-team`, {
        method: 'PUT',
        body: JSON.stringify({ teamId: selectedTeamId })
      });
      setAssigningModule(null);
      setSelectedTeamId('');
      loadData();
    } catch (err) {
      alert(`Failed to assign team: ${err.message}`);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      await fetchApi(`/modules/${moduleId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(`Failed to remove module: ${err.message}`);
    }
  };

  const openCreateForProject = (projId) => {
    setFormData((prev) => ({ ...prev, project: projId }));
    setShowModal(true);
  };

  const getModulesForProject = (projId) => {
    return modules.filter((m) => {
      const pId = typeof m.project === 'object' ? m.project?._id : m.project;
      return pId === projId;
    });
  };

  const standaloneModules = modules.filter((m) => !m.project);

  const filteredProjects = selectedProjectId === 'ALL' 
    ? projects 
    : projects.filter(p => p._id === selectedProjectId);

  const canManageModules = currentUser?.role === 'superadmin' || currentUser?.permissions?.canCreateModules !== false;

  return (
    <div className="space-y-4">
      <div className="bg-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center gap-2 min-w-0">
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="border border-gray-200/90 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-gray-700 bg-gray-50/80 hover:bg-gray-50 focus:border-[#20b875] focus:outline-none min-w-0 flex-1 sm:flex-none max-w-[160px] sm:max-w-none truncate transition-all cursor-pointer"
        >
          <option value="ALL">All Projects ({projects.length})</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {canManageModules && (
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, project: projects[0]?._id || '' }));
              setShowModal(true);
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#20b875] text-white rounded-lg sm:rounded-xl text-xs font-bold shadow-xs hover:bg-[#169e63] transition-all whitespace-nowrap shrink-0"
          >
            + Create Module
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading project modules..." />
      ) : (
        <div className="space-y-6">
          {filteredProjects.length === 0 && standaloneModules.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 text-xs font-semibold text-gray-500">
              No projects or modules created yet.
            </div>
          ) : (
            filteredProjects.map((proj, pIdx) => {
              const projMods = getModulesForProject(proj._id);
              const projBadgeStyle = getKeyBadgeColor(proj.projectId, pIdx);

              return (
                <div key={proj._id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-2 sm:space-y-4 p-2.5 sm:p-5">
                  {/* Project Header Banner */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent sm:bg-gray-50/80 p-0 sm:p-4 rounded-none sm:rounded-xl border-0 border-b sm:border border-gray-100 pb-2 sm:pb-4 gap-2 sm:gap-3">
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={`text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border uppercase ${projBadgeStyle}`}>
                          {proj.projectId || 'PRJ'}
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-[#09233d]">{proj.name}</h3>
                        <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 bg-gray-200 px-1.5 sm:px-2 py-0.5 rounded-full uppercase">
                          {proj.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-500">{proj.description || 'Project module functional group'}</p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-400 block">Project Progress</span>
                        <strong className="text-xs sm:text-sm font-black text-[#20b875]">{proj.progress || 0}%</strong>
                      </div>

                      {canManageModules && (
                        <button
                          onClick={() => openCreateForProject(proj._id)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#20b875] border border-emerald-200 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl"
                        >
                          + Add Module
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Modules Breakdown Grid */}
                  {projMods.length === 0 ? (
                    <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-gray-400 font-medium bg-gray-50/30 rounded-lg sm:rounded-xl border border-dashed border-gray-200">
                      No modules added to {proj.name} yet. Click "+ Add Module" above to add functional breakdown modules.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                      {projMods.map((mod, mIdx) => {
                        const modBadgeStyle = getKeyBadgeColor(mod.moduleId, mIdx);
                        return (
                          <div key={mod._id} className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-200/70 shadow-sm hover:border-[#20b875]/40 transition-all space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border ${modBadgeStyle}`}>
                                  {mod.moduleId || 'MOD'}
                                </span>
                                <h4 className="text-[11px] sm:text-xs font-bold text-[#09233d] mt-0.5 sm:mt-1">{mod.name}</h4>
                              </div>
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold uppercase shrink-0 ${
                                mod.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                mod.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {mod.status}
                              </span>
                            </div>

                            {/* Assigned Team Info */}
                            <div className="p-2 sm:p-2.5 bg-gray-50 rounded-lg sm:rounded-xl text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Assigned Team:</span>
                                <strong className="text-[#09233d] font-bold">
                                  {mod.assignedTeam?.name || 'Unassigned'}
                                </strong>
                              </div>
                              {mod.assignedTeam?.teamLead && (
                                <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                                  <span className="text-gray-400">Team Lead:</span>
                                  <span className="font-semibold text-purple-700">{mod.assignedTeam.teamLead.name}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-gray-600 mb-0.5 sm:mb-1">
                                <span>Module Progress</span>
                                <span className="text-[#20b875]">{mod.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 sm:h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#20b875] h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${mod.progress || 0}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-gray-100 text-[10px] sm:text-[11px]">
                              <span className="text-gray-500">Est: <strong className="text-gray-700">{mod.estimatedHours || 0}h</strong></span>
                              {canManageModules && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setAssigningModule(mod);
                                      setSelectedTeamId(mod.assignedTeam?._id || '');
                                    }}
                                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md sm:rounded-lg font-bold text-[9px] sm:text-[10px]"
                                  >
                                    <span className="inline-flex items-center gap-0.5 sm:gap-1"><Icon name="handshake" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> Assign Team</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteModule(mod._id)}
                                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md sm:rounded-lg font-bold border border-red-100 text-[9px] sm:text-[10px]"
                                    title="Remove Module"
                                  >
                                    <span className="inline-flex items-center gap-0.5 sm:gap-1"><Icon name="trash" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> Remove</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Create Module Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Create Project Module</h3>
            <form onSubmit={handleCreateModule} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Project</label>
                <select
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Module Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Authentication Module"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assign to Team (Optional)</label>
                <select
                  value={formData.assignedTeam}
                  onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} (Lead: {t.teamLead?.name || 'None'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Estimated Hours</label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
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
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {assigningModule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-base font-bold text-[#09233d]">Assign Module to Team</h3>
            <p className="text-xs text-gray-500">Assign module <strong className="text-gray-800">{assigningModule.name}</strong> to a team for Team Lead breakdown</p>

            <form onSubmit={handleAssignTeamSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Team</label>
                <select
                  required
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (Lead: {t.teamLead?.name || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAssigningModule(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Confirm Team Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
