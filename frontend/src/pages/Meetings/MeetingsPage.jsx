import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import MeetingRoom from './MeetingRoom';

export default function MeetingsPage({ currentUser, directMeetingId }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(() => {
    try {
      const cached = localStorage.getItem('pydahsoft_active_meeting_data');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Scheduling / Creating Meeting
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState('instant');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creating, setCreating] = useState(false);

  // Helper to persist active meeting room state & object in localStorage across F5 page refreshes for 0ms load speed
  const enterMeetingRoom = (meetingData) => {
    setActiveMeeting(meetingData);
    if (meetingData?.meetingId) {
      localStorage.setItem('pydahsoft_active_meeting_id', meetingData.meetingId);
      localStorage.setItem('pydahsoft_active_meeting_data', JSON.stringify(meetingData));
    }
  };

  const leaveMeetingRoom = async () => {
    const currentMeetingId = activeMeeting?.meetingId || localStorage.getItem('pydahsoft_active_meeting_id');
    if (currentMeetingId) {
      try {
        await fetchApi(`/meetings/${currentMeetingId}/leave`, { method: 'POST' });
      } catch (err) {
        console.warn('Error sending leave meeting notification:', err);
      }
    }
    setActiveMeeting(null);
    localStorage.removeItem('pydahsoft_active_meeting_id');
    localStorage.removeItem('pydahsoft_active_meeting_data');
    loadMeetings();
  };

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/meetings');
      setMeetings(res.data || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
    fetchApi('/employees')
      .then((res) => setEmployeeList(res.data || []))
      .catch(() => {});

    // Restore active meeting session on F5 refresh or direct URL navigation
    const savedMeetingId = directMeetingId || localStorage.getItem('pydahsoft_active_meeting_id');
    if (savedMeetingId) {
      fetchApi(`/meetings/${savedMeetingId}/join`, { method: 'POST' })
        .then((res) => {
          if (res.data) {
            enterMeetingRoom(res.data);
          }
        })
        .catch(() => {
          fetchApi(`/meetings/${savedMeetingId}`)
            .then((res) => {
              if (res.data) enterMeetingRoom(res.data);
            })
            .catch(() => {
              localStorage.removeItem('pydahsoft_active_meeting_id');
              localStorage.removeItem('pydahsoft_active_meeting_data');
            });
        });
    }
  }, [directMeetingId]);

  const handleStartInstantMeeting = async () => {
    try {
      setCreating(true);
      const res = await fetchApi('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: `${currentUser?.name || 'User'}'s Instant Meeting`,
          type: 'instant'
        })
      });

      if (res.data) {
        enterMeetingRoom(res.data);
        loadMeetings();
      }
    } catch (err) {
      alert(err.message || 'Failed to start instant meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateScheduledMeeting = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      let scheduledAt = new Date();
      if (scheduledDate && scheduledTime) {
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      }

      const res = await fetchApi('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: meetingTitle.trim() || 'Scheduled Conference Call',
          type: meetingType,
          scheduledAt,
          invitedUserIds: selectedUserIds
        })
      });

      if (res.data) {
        setIsModalOpen(false);
        setMeetingTitle('');
        setSelectedUserIds([]);
        loadMeetings();
        if (meetingType === 'instant') {
          enterMeetingRoom(res.data);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to schedule meeting');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    let code = joinCodeInput.trim();
    if (code.includes('/meetings/')) {
      code = code.split('/meetings/')[1];
    }

    fetchApi(`/meetings/${code}/join`, { method: 'POST' })
      .then((res) => {
        if (res.data) {
          enterMeetingRoom(res.data);
        }
      })
      .catch((err) => {
        alert(err.message || 'Unable to join meeting with provided code/link');
      });
  };

  const handleCopyLink = (meetingItem) => {
    const link = `${window.location.origin}/#/meetings/${meetingItem.meetingId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(meetingItem._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If inside an active call, show the Teams Video Room interface
  if (activeMeeting) {
    return (
      <MeetingRoom
        meeting={activeMeeting}
        currentUser={currentUser}
        onLeave={leaveMeetingRoom}
      />
    );
  }

  const activeCalls = meetings.filter((m) => m.status === 'active');
  const upcomingCalls = meetings.filter((m) => m.status === 'scheduled');

  return (
    <div className="meetings-container max-w-7xl mx-auto space-y-6">
      {/* Top Banner Hero */}
      <div className="bg-gradient-to-r from-[#09233d] via-[#0d3459] to-[#072b1e] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Teams HD Video & Audio Meetings
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Instant Video Meetings & Virtual Conference Rooms
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2 leading-relaxed">
            Create instant shareable meeting links, invite colleagues directly, and collaborate with HD video, screen sharing, and live in-meeting chat.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleStartInstantMeeting}
              disabled={creating}
              className="bg-[#20b875] hover:bg-[#189b62] text-white font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-[#20b875]/30 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{creating ? 'Starting Room...' : 'Start Instant Meeting'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMeetingType('scheduled');
                setIsModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule Meeting</span>
            </button>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:block opacity-20 pointer-events-none">
          <div className="w-64 h-64 border-4 border-dashed border-emerald-400 rounded-full animate-spin-slow"></div>
        </div>
      </div>

      {/* Join Meeting Box & Quick Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#20b875] flex items-center justify-center font-bold shrink-0">
            <svg className="w-5 h-5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#09233d]">Have a Meeting Link or Code?</h3>
            <p className="text-[11px] text-gray-500 font-medium">Paste the meeting code or URL to join instantly</p>
          </div>
        </div>

        <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. meet-a8f2-9c1e"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#20b875]/40"
          />
          <button
            type="submit"
            className="bg-[#09233d] hover:bg-[#0f3459] text-white font-bold text-xs px-4 py-2 rounded-xl shrink-0 transition-colors cursor-pointer"
          >
            Join Room
          </button>
        </form>
      </div>

      {/* Active Meetings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#09233d] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Live Video Meetings ({activeCalls.length})
          </h2>
          <button
            type="button"
            onClick={loadMeetings}
            className="text-xs text-[#20b875] font-bold hover:underline"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs font-medium">
            Loading live meetings...
          </div>
        ) : activeCalls.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#20b875] flex items-center justify-center font-bold mx-auto text-xl">
              <svg className="w-6 h-6 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-700">No active meetings right now</h4>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Start an instant meeting above or share a meeting link with your team members to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCalls.map((meetingItem) => (
              <div
                key={meetingItem._id}
                className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active Call
                      </span>
                      <h3 className="text-sm font-black text-[#09233d] mt-2 leading-tight">
                        {meetingItem.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-1">
                        Hosted by: <span className="text-gray-900 font-bold">{meetingItem.hostName}</span>
                      </p>
                    </div>

                    <span className="text-[10px] text-gray-400 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                      {meetingItem.meetingId}
                    </span>
                  </div>

                  {/* Active Participants counter */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="flex -space-x-2 overflow-hidden">
                      {meetingItem.activeParticipants?.map((p, idx) => (
                        <div
                          key={idx}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#20b875] text-white font-bold text-[10px] flex items-center justify-center"
                          title={p.name}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {meetingItem.activeParticipants?.length || 1} participant(s) inside
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => enterMeetingRoom(meetingItem)}
                    className="flex-1 bg-[#20b875] hover:bg-[#179c62] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Join Meeting Room</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(meetingItem)}
                    className="bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-gray-200"
                    title="Copy Shareable Link"
                  >
                    {copiedId === meetingItem._id ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled & Past Meetings Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-[#09233d]">Upcoming Scheduled Meetings ({upcomingCalls.length})</h3>

        {upcomingCalls.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">No upcoming scheduled meetings.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingCalls.map((meetingItem) => (
              <div key={meetingItem._id} className="py-3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-[#09233d]">{meetingItem.title}</h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Scheduled for: {new Date(meetingItem.scheduledAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => enterMeetingRoom(meetingItem)}
                    className="bg-[#20b875] text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#189960]"
                  >
                    Start Call Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meetingItem)}
                    className="bg-slate-100 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-gray-200"
                  >
                    {copiedId === meetingItem._id ? 'Copied' : 'Share Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-base font-black text-[#09233d]">
                {meetingType === 'scheduled' ? 'Schedule Team Conference' : 'Start Instant Meeting'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-black p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheduledMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Meeting Subject / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Engineering Sync"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                />
              </div>

              {meetingType === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#20b875]"
                    />
                  </div>
                </div>
              )}

              {/* Select Invitees */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Invite Teammates ({selectedUserIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl p-2 bg-slate-50 divide-y divide-gray-100">
                  {employeeList.map((emp) => {
                    const isChecked = selectedUserIds.includes(emp._id);
                    return (
                      <label key={emp._id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-white rounded-lg cursor-pointer text-xs font-semibold text-gray-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, emp._id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== emp._id));
                            }
                          }}
                          className="rounded text-[#20b875] focus:ring-[#20b875]"
                        />
                        <span>{emp.name} ({emp.department || 'Staff'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#20b875] text-white font-extrabold text-xs rounded-xl hover:bg-[#16995f] shadow-md shadow-[#20b875]/30"
                >
                  {creating ? 'Creating...' : 'Create & Generate Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
