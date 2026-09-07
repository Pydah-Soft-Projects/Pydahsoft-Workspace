import { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import Icon from '../../components/Icon';

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
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [teamsRes, usersRes] = await Promise.all([
        fetchApi('/teams'),
        fetchApi('/employees')
      ]);
      setTeams(teamsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load teams data');
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
        <div className="flex justify-end">
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
        <div className="p-8 text-center text-xs font-semibold text-gray-500">Loading teams...</div>
      ) : displayedTeams.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-xs font-medium text-gray-500">
          No assigned teams found for your employee profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedTeams.map((team) => (
            <div key={team._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b pb-3 border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-[#20b875] bg-emerald-50 px-2 py-0.5 rounded">
                    {team.teamId || 'TEAM'}
                  </span>
                  <h3 className="text-sm font-bold text-[#09233d] mt-1">{team.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                    {team.status || 'Active'}
                  </span>
                  {isManager && (
                    <>
                      <button
                        onClick={() => setEditingTeam({ ...team })}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-bold"
                      >
                        <span className="inline-flex items-center gap-1"><Icon name="edit" className="w-3.5 h-3.5" /> Edit Team</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team._id, team.name)}
                        className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-bold"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Team Lead:</span>
                  <strong className="text-[#09233d] font-bold">
                    {team.teamLead?.name || 'Unassigned'} {team.teamLead?.role ? `(${team.teamLead.role})` : ''}
                  </strong>
                </div>

                <div className="pt-2">
                  <span className="text-gray-500 font-medium block mb-1">Members ({team.members?.length || 0}):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.members?.map((m) => (
                      <span key={m._id || m} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-medium">
                        {m.name || m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
