import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import MeetingRoom from './MeetingRoom';

export default function MeetingsPage({ currentUser, directMeetingId, preJoinedMeeting }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(() => {
    // Priority 1: a meeting was pre-joined from a direct link click while already logged in
    if (preJoinedMeeting) return preJoinedMeeting;
    // Priority 2: previously cached active meeting in localStorage
    try {
      const cached = localStorage.getItem('pydahsoft_active_meeting_data');
      const parsed = cached ? JSON.parse(cached) : null;
      return parsed?.status === 'ended' ? null : parsed;
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

    // Listen for top header action events
    const handleStartInstantEvent = () => handleStartInstantMeeting();
    const handleOpenScheduleEvent = () => {
      setMeetingType('scheduled');
      setIsModalOpen(true);
    };

    window.addEventListener('start-instant-meeting', handleStartInstantEvent);
    window.addEventListener('open-schedule-meeting-modal', handleOpenScheduleEvent);

    // Restore active meeting session on F5 refresh or direct URL navigation
    const savedMeetingId = directMeetingId || localStorage.getItem('pydahsoft_active_meeting_id');
    if (savedMeetingId) {
      fetchApi(`/meetings/${savedMeetingId}/join`, { method: 'POST' })
        .then((res) => {
          if (res.data && res.data.status !== 'ended') {
            enterMeetingRoom(res.data);
          } else {
            throw new Error('This meeting has ended');
          }
        })
        .catch(() => {
          fetchApi(`/meetings/${savedMeetingId}`)
            .then((res) => {
              if (res.data && res.data.status !== 'ended') {
                enterMeetingRoom(res.data);
              } else {
                throw new Error('This meeting has ended');
              }
            })
            .catch(() => {
              localStorage.removeItem('pydahsoft_active_meeting_id');
              localStorage.removeItem('pydahsoft_active_meeting_data');
            });
        });
    }

    // Auto-poll meetings list every 8 seconds when document is visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        fetchApi('/meetings')
          .then((res) => setMeetings(res.data || []))
          .catch(() => {});
      }
    }, 8000);

    return () => {
      window.removeEventListener('start-instant-meeting', handleStartInstantEvent);
      window.removeEventListener('open-schedule-meeting-modal', handleOpenScheduleEvent);
      clearInterval(pollInterval);
    };
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

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to remove this meeting room?')) return;
    try {
      await fetchApi(`/meetings/${meetingId}`, { method: 'DELETE' });
      loadMeetings();
    } catch (err) {
      alert(err.message || 'Failed to remove meeting');
    }
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
  const pastCalls = meetings.filter((m) => m.status === 'ended');

  return (
    <div className="meetings-container max-w-7xl mx-auto space-y-6">

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
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs sm:text-base font-black text-[#09233d] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Active Live Video Meetings ({activeCalls.length})</span>
          </h2>
          <button
            type="button"
            onClick={loadMeetings}
            className="bg-[#20b875]/10 hover:bg-[#20b875]/20 text-[#20b875] border border-[#20b875]/30 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 active:scale-95"
            title="Refresh Meetings List"
          >
            <svg className="w-3.5 h-3.5 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh List</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs font-medium">
            Loading live meetings...
          </div>
        ) : activeCalls.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 sm:p-8 text-center space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 text-[#20b875] flex items-center justify-center font-bold mx-auto text-lg sm:text-xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#20b875]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-700">No active meetings right now</h4>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Start an instant meeting above or share a meeting link with your team members to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {activeCalls.map((meetingItem) => (
              <div
                key={meetingItem._id}
                className="bg-white rounded-2xl border border-emerald-200/80 p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active Call
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-[#09233d] mt-1.5 sm:mt-2 leading-tight">
                        {meetingItem.title}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 sm:mt-1">
                        Hosted by: <span className="text-gray-900 font-bold">{meetingItem.hostName}</span>
                      </p>
                    </div>

                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono bg-slate-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shrink-0">
                      {meetingItem.meetingId}
                    </span>
                  </div>

                  {/* Active Participants counter */}
                  <div className="mt-2.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                    <div className="flex -space-x-2 overflow-hidden">
                      {meetingItem.activeParticipants?.map((p, idx) => (
                        <div
                          key={idx}
                          className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white bg-[#20b875] text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center"
                          title={p.name}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                      {meetingItem.activeParticipants?.length || 1} participant(s) inside
                    </span>
                  </div>
                </div>

                <div className="mt-3 sm:mt-5 flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => enterMeetingRoom(meetingItem)}
                    className="flex-1 bg-[#20b875] hover:bg-[#179c62] text-white font-extrabold text-[11px] sm:text-xs py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 sm:gap-2 cursor-pointer"
                  >
                    <span>Join Meeting</span>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(meetingItem)}
                    className="bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors cursor-pointer border border-gray-200 shrink-0"
                    title="Copy Shareable Link"
                  >
                    {copiedId === meetingItem._id ? 'Copied!' : 'Copy Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(meetingItem.meetingId || meetingItem._id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-colors cursor-pointer border border-rose-200 flex items-center gap-1 shrink-0"
                    title="Remove Meeting Room"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled & Past Meetings Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-black text-[#09233d]">Upcoming Scheduled Meetings ({upcomingCalls.length})</h3>

        {upcomingCalls.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium">No upcoming scheduled meetings.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingCalls.map((meetingItem) => (
              <div key={meetingItem._id} className="py-2.5 sm:py-3 flex items-center justify-between flex-wrap gap-2 sm:gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-[#09233d]">{meetingItem.title}</h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">
                    Scheduled for: {new Date(meetingItem.scheduledAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => enterMeetingRoom(meetingItem)}
                    className="bg-[#20b875] text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-[#189960] cursor-pointer"
                  >
                    Start Call
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(meetingItem)}
                    className="bg-slate-100 text-gray-700 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer"
                  >
                    {copiedId === meetingItem._id ? 'Copied' : 'Share Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(meetingItem.meetingId || meetingItem._id)}
                    className="bg-rose-50 text-rose-600 font-bold text-[11px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center gap-1"
                    title="Remove Meeting"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past & Inactive Meetings */}
      {pastCalls.length > 0 && (
        <div className="bg-slate-50 rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            <span>Past & Inactive Meetings ({pastCalls.length})</span>
          </h3>

          <div className="divide-y divide-gray-200/60 max-h-60 overflow-y-auto custom-scrollbar">
            {pastCalls.map((meetingItem) => (
              <div key={meetingItem._id} className="py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Ended
                    </span>
                    <h4 className="text-xs font-bold text-gray-700">{meetingItem.title}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    Host: {meetingItem.hostName} &bull; Room Code: <code className="font-mono">{meetingItem.meetingId}</code>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(meetingItem.meetingId || meetingItem._id)}
                    className="bg-gray-200 hover:bg-rose-100 hover:text-rose-600 text-gray-600 font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Remove record"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
