import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import LoadingSpinner from '../../components/Loader/LoadingSpinner';
import Icon from '../../components/Icon';

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

export default function TeamManagement({ currentUser }) {
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    teamLead: '',
    members: []
  });

  useEffect(() => {
    loadData();

    const handleOpenModal = () => setShowCreateModal(true);
    window.addEventListener('open-create-team-modal', handleOpenModal);
    return () => window.removeEventListener('open-create-team-modal', handleOpenModal);
  }, []);

  const loadData = async () => {
    if (!teams || teams.length === 0) setLoading(true);
    setError('');
    try {
      const [teamsRes, usersRes] = await Promise.all([
        fetchApi('/teams'),
        fetchApi('/employees')
      ]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      if (!teams || teams.length === 0) setError(err.message || 'Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/teams', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', teamLead: '', members: [] });
      loadData();
    } catch (err) {
      alert(`Failed to create team: ${err.message}`);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      const payload = {
        name: editingTeam.name,
        teamLead: typeof editingTeam.teamLead === 'object' ? editingTeam.teamLead?._id : editingTeam.teamLead,
        members: editingTeam.members.map((m) => (typeof m === 'object' ? m._id : m))
      };
      await fetchApi(`/teams/${editingTeam._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setEditingTeam(null);
      loadData();
    } catch (err) {
      alert(`Failed to update team: ${err.message}`);
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete team '${teamName}'?`)) return;
    try {
      await fetchApi(`/teams/${teamId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(`Failed to delete team: ${err.message}`);
    }
  };

  const isManager = currentUser?.role === 'superior' || currentUser?.role === 'superadmin';
  const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

  const displayedTeams = isManager
    ? teams
    : teams.filter((team) => {
        const leadId = (typeof team.teamLead === 'object' ? team.teamLead?._id : team.teamLead)?.toString();
        const memberIds = (team.members || []).map((m) => (typeof m === 'object' ? m?._id : m)?.toString());
        return (leadId && leadId === currentUserId) || (memberIds && memberIds.includes(currentUserId));
      });

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="hidden md:flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#169e63]"
          >
            + Create New Team
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading teams..." />
      ) : displayedTeams.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-xs font-medium text-gray-500">
          No assigned teams found for your employee profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {displayedTeams.map((team, idx) => {
            const teamBadgeStyle = getKeyBadgeColor(team.teamId, idx);
            return (
              <div key={team._id} className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm space-y-2 sm:space-y-3">
                <div className="flex justify-between items-start border-b pb-1.5 sm:pb-3 border-gray-100 gap-2">
                  <div>
                    <span className={`text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border ${teamBadgeStyle}`}>
                      {team.teamId || 'TEAM'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-[#09233d] mt-0.5 sm:mt-1">{team.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full uppercase">
                      {team.status || 'Active'}
                    </span>
                    {isManager && (
                      <>
                        <button
                          onClick={() => setEditingTeam({ ...team })}
                          className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold"
                        >
                          <span className="inline-flex items-center gap-0.5 sm:gap-1"><Icon name="edit" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> Edit Team</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id, team.name)}
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold"
                        >
                          <Icon name="trash" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[10px] sm:text-xs space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 font-medium shrink-0">Team Lead:</span>
                    <div className="text-right truncate">
                      <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-extrabold border inline-block max-w-[130px] sm:max-w-none truncate align-middle ${getKeyBadgeColor(team.teamLead?.name || 'Unassigned', 0)}`}>
                        {team.teamLead?.name || 'Unassigned'}
                      </span>
                      {team.teamLead?.role ? <span className="text-gray-400 font-medium text-[9px] sm:text-[11px] ml-1">({team.teamLead.role})</span> : ''}
                    </div>
                  </div>

                  <div className="pt-1.5 sm:pt-2 border-t border-gray-100">
                    <span className="text-gray-500 font-medium block mb-1 sm:mb-1.5">Members ({team.members?.length || 0}):</span>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {team.members?.map((m, mIdx) => {
                        const memberName = typeof m === 'object' ? m.name : m;
                        const memberBadgeStyle = getKeyBadgeColor(memberName, mIdx + 1);
                        return (
                          <span key={typeof m === 'object' ? m._id : m} className={`px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-extrabold border ${memberBadgeStyle}`}>
                            {memberName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Core Platform Team"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assign Team Lead (Any Role)</label>
                <select
                  required
                  value={createForm.teamLead}
                  onChange={(e) => setCreateForm({ ...createForm, teamLead: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Team Lead</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role?.toUpperCase() || 'EMPLOYEE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Team Members</label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {allUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 text-xs text-gray-700 p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={createForm.members.includes(u._id)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...createForm.members, u._id]
                            : createForm.members.filter((id) => id !== u._id);
                          setCreateForm({ ...createForm, members: updated });
                        }}
                      />
                      <span>{u.name} <small className="text-gray-400">({u.role})</small></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-[#09233d] mb-4">Edit Team: {editingTeam.name}</h3>
            <form onSubmit={handleUpdateTeam} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={editingTeam.name}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Assign Team Lead (Any Role)</label>
                <select
                  required
                  value={typeof editingTeam.teamLead === 'object' ? editingTeam.teamLead?._id : editingTeam.teamLead}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamLead: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:border-[#20b875] focus:outline-none bg-white"
                >
                  <option value="">Select Team Lead</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role?.toUpperCase() || 'EMPLOYEE'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Select Team Members</label>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {allUsers.map((u) => {
                    const currentMemberIds = editingTeam.members.map((m) => (typeof m === 'object' ? m._id : m));
                    const isChecked = currentMemberIds.includes(u._id);

                    return (
                      <label key={u._id} className="flex items-center gap-2 text-xs text-gray-700 p-1 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedMembers = e.target.checked
                              ? [...currentMemberIds, u._id]
                              : currentMemberIds.filter((id) => id !== u._id);
                            setEditingTeam({ ...editingTeam, members: updatedMembers });
                          }}
                        />
                        <span>{u.name} <small className="text-gray-400">({u.role})</small></span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#20b875] text-white rounded-xl text-xs font-bold hover:bg-[#169e63]"
                >
                  Save Team Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
