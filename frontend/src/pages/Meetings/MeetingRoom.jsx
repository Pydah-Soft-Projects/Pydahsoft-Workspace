import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../config/api';

export default function MeetingRoom({ meeting, currentUser, onLeave }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'people'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState(meeting?.inMeetingMessages || []);
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chatEndRef = useRef(null);

  // Always compute dynamic URL based on current live host
  const getLiveMeetingUrl = () => {
    const meetingCode = meeting?.meetingId || 'meet-room';
    return `${window.location.origin}/meetings/${meetingCode}`;
  };

  // Initialize webcam & mic stream if supported
  useEffect(() => {
    let activeStream = null;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          mediaStreamRef.current = stream;
          activeStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Webcam/Mic stream notice:', err);
      }
    }

    initMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync video/mic tracks with state
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = videoOn;
      });
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
    }
  }, [videoOn, micOn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCopyLink = () => {
    const link = getLiveMeetingUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const item = {
      senderId: currentUser?._id,
      senderName: currentUser?.name || 'You',
      message: newMessage.trim(),
      sentAt: new Date()
    };

    setChatMessages((prev) => [...prev, item]);
    setNewMessage('');

    if (meeting?.meetingId) {
      fetchApi(`/meetings/${meeting.meetingId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: item.message })
      }).catch(() => {});
    }
  };

  // Build Real Participants array based ONLY on host + selected/invited members (NO sample names)
  const currentUserId = String(currentUser?._id || '');

  const hostTile = {
    id: currentUserId || 'host-me',
    name: `${currentUser?.name || meeting?.hostName || 'Host'} (You)`,
    role: currentUser?.role || meeting?.hostRole || 'Meeting Host',
    isMe: true,
    micOn: micOn,
    videoOn: videoOn,
    handRaised: handRaised,
    bgColor: 'bg-[#20b875]'
  };

  const otherTiles = [];
  const seenUserIds = new Set([currentUserId, (currentUser?.name || '').toLowerCase()]);

  // Add Invited Members selected by user
  if (meeting?.invitedUsers && Array.isArray(meeting.invitedUsers)) {
    meeting.invitedUsers.forEach((u, i) => {
      const uNameKey = (u.name || '').toLowerCase();
      const uIdKey = String(u.userId || u._id || `inv-${i}`);
      if (!seenUserIds.has(uIdKey) && !seenUserIds.has(uNameKey)) {
        seenUserIds.add(uIdKey);
        seenUserIds.add(uNameKey);
        otherTiles.push({
          id: uIdKey,
          name: u.name,
          role: 'Invited Staff',
          isMe: false,
          micOn: true,
          videoOn: false,
          handRaised: false,
          bgColor: ['bg-[#09233d]', 'bg-[#0d3b2b]', 'bg-[#13523c]'][i % 3]
        });
      }
    });
  }

  // Add Active Participants from DB
  if (meeting?.activeParticipants && Array.isArray(meeting.activeParticipants)) {
    meeting.activeParticipants.forEach((u, i) => {
      const uNameKey = (u.name || '').toLowerCase();
      const uIdKey = String(u.userId || u._id || `act-${i}`);
      if (!seenUserIds.has(uIdKey) && !seenUserIds.has(uNameKey)) {
        seenUserIds.add(uIdKey);
        seenUserIds.add(uNameKey);
        otherTiles.push({
          id: uIdKey,
          name: u.name,
          role: 'Participant',
          isMe: false,
          micOn: true,
          videoOn: true,
          handRaised: false,
          bgColor: 'bg-[#09233d]'
        });
      }
    });
  }

  const allParticipants = [hostTile, ...otherTiles];

  return (
    <div className="fixed inset-0 z-50 bg-[#041a12] text-white flex flex-col overflow-hidden font-sans">
      {/* Top PydahSoft Teams Bar */}
      <header className="bg-[#072b1e] border-b border-[#0e4733] px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#20b875] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-[#20b875]/20">
            📹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {meeting?.title || 'Live Video Conference'}
              </h1>
              <span className="bg-[#20b875]/20 text-[#4ade80] border border-[#20b875]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span> LIVE SESSION
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-mono">
              Room Link: <span className="text-[#4ade80] font-bold">{getLiveMeetingUrl()}</span>
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 bg-[#0b3828] hover:bg-[#13523c] border border-[#166046] text-[#4ade80] text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{copiedLink ? 'Live Link Copied!' : 'Copy Live Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setActiveTab('chat');
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sidebarOpen && activeTab === 'chat'
                ? 'bg-[#20b875] text-white border-[#20b875] shadow-md'
                : 'bg-[#0b3828] text-gray-200 hover:text-white border-[#166046]'
            }`}
            title="In-Meeting Chat"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setActiveTab('people');
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sidebarOpen && activeTab === 'people'
                ? 'bg-[#20b875] text-white border-[#20b875] shadow-md'
                : 'bg-[#0b3828] text-gray-200 hover:text-white border-[#166046]'
            }`}
            title="Participants List"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="hidden sm:inline">People ({allParticipants.length})</span>
          </button>
        </div>
      </header>

      {/* Main Call View Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Tiles Canvas */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-center items-center">
          <div className={`w-full max-w-6xl grid gap-4 ${
            allParticipants.length === 1
              ? 'grid-cols-1 max-w-2xl'
              : allParticipants.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          }`}>
            {allParticipants.map((p) => {
              if (p.isMe) {
                return (
                  <div
                    key={p.id}
                    className="relative bg-[#09233d] border-2 border-[#20b875] rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center group"
                  >
                    {/* Real Video Stream if active */}
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform -scale-x-100 ${
                        videoOn ? 'block' : 'hidden'
                      }`}
                    />

                    {/* Camera Off Avatar Screen */}
                    {!videoOn && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-[#20b875] text-white font-black text-2xl flex items-center justify-center ring-4 ring-[#4ade80]/30 shadow-lg">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-emerald-200">Camera Off</span>
                      </div>
                    )}

                    {/* Participant Info Overlay */}
                    <div className="absolute bottom-3 left-3 bg-[#072b1e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0e4733] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                      <span className="text-xs font-extrabold text-white">{p.name}</span>
                      {p.handRaised && <span className="text-xs">✋</span>}
                    </div>

                    {/* Mic Indicator Icon */}
                    <div className="absolute top-3 right-3 bg-[#072b1e]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#0e4733]">
                      {micOn ? (
                        <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              }

              // Selected Participant Tiles ONLY
              return (
                <div
                  key={p.id}
                  className="relative bg-[#09233d] border border-[#13523c] rounded-2xl overflow-hidden aspect-video shadow-xl flex flex-col items-center justify-center group"
                >
                  <div className={`w-20 h-20 rounded-full ${p.bgColor} text-white font-black text-2xl flex items-center justify-center ring-4 ring-emerald-500/20 shadow-lg`}>
                    {p.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </div>

                  <p className="mt-3 text-xs font-bold text-emerald-200">{p.role}</p>

                  {/* Remote Participant Footer */}
                  <div className="absolute bottom-3 left-3 bg-[#072b1e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0e4733] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                    <span className="text-xs font-extrabold text-white">{p.name}</span>
                    {p.handRaised && <span className="text-xs animate-bounce">✋</span>}
                  </div>

                  {/* Mic Indicator Icon */}
                  <div className="absolute top-3 right-3 bg-[#072b1e]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#0e4733]">
                    {p.micOn ? (
                      <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Copy Link Card if only host is in call */}
            {allParticipants.length === 1 && (
              <div
                onClick={handleCopyLink}
                className="relative bg-[#072b1e]/60 border-2 border-dashed border-[#20b875]/40 hover:border-[#20b875] rounded-2xl overflow-hidden aspect-video shadow-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#072b1e]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#20b875]/20 text-[#4ade80] flex items-center justify-center font-bold text-2xl mb-3">
                  🔗
                </div>
                <h4 className="text-sm font-extrabold text-white">Invite Colleagues to Join</h4>
                <p className="text-xs text-gray-300 font-medium mt-1 max-w-xs">
                  Click to copy the live meeting link and share it with your team members.
                </p>
                <span className="mt-4 px-4 py-2 bg-[#20b875] text-white font-extrabold text-xs rounded-xl shadow-md">
                  {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Meeting Link'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: In-Meeting Chat & Participants */}
        {sidebarOpen && (
          <aside className="w-80 bg-[#072b1e] border-l border-[#0e4733] flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-[#0e4733] flex items-center justify-between bg-[#0b3828]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'chat' ? 'bg-[#20b875] text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Meeting Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('people')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'people' ? 'bg-[#20b875] text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  People
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat Tab Content */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden p-3.5">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-emerald-200/60 text-xs font-medium">
                      No messages yet. Send a message to start meeting chat!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className="bg-[#0b3828] p-3 rounded-xl border border-[#13523c]">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#4ade80]">
                          <span>{msg.senderName}</span>
                          <span className="text-[9px] text-gray-400 font-mono">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-white mt-1 leading-relaxed">{msg.message}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-3 border-t border-[#0e4733]">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type meeting message..."
                    className="flex-1 bg-[#0b3828] border border-[#166046] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#20b875]"
                  />
                  <button
                    type="submit"
                    className="bg-[#20b875] hover:bg-[#189960] text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* People Tab Content */}
            {activeTab === 'people' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-[#4ade80] uppercase tracking-wider mb-2">
                  Call Members ({allParticipants.length})
                </div>
                {allParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b3828] border border-[#13523c]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#20b875] text-white font-bold text-xs flex items-center justify-center">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-emerald-300 font-medium">{p.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.micOn ? (
                        <span className="text-[#4ade80] text-xs">🎙️</span>
                      ) : (
                        <span className="text-rose-400 text-xs">🔇</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom PydahSoft Control Toolbar */}
      <footer className="bg-[#072b1e] border-t border-[#0e4733] px-4 py-3 flex items-center justify-center gap-3 sm:gap-4 shrink-0 shadow-2xl">
        {/* Mic Button */}
        <button
          type="button"
          onClick={() => setMicOn(!micOn)}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            micOn
              ? 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
              : 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
          }`}
        >
          {micOn ? (
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
          <span className="hidden sm:inline">{micOn ? 'Mute' : 'Unmute'}</span>
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={() => setVideoOn(!videoOn)}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            videoOn
              ? 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
              : 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
          }`}
        >
          {videoOn ? (
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
          <span className="hidden sm:inline">{videoOn ? 'Stop Video' : 'Start Video'}</span>
        </button>

        {/* Screen Share Button */}
        <button
          type="button"
          onClick={() => setScreenSharing(!screenSharing)}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            screenSharing
              ? 'bg-[#20b875] border-[#4ade80] text-white'
              : 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
          }`}
        >
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">{screenSharing ? 'Sharing Screen' : 'Share Screen'}</span>
        </button>

        {/* Raise Hand Button */}
        <button
          type="button"
          onClick={() => setHandRaised(!handRaised)}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            handRaised
              ? 'bg-amber-500 border-amber-400 text-white'
              : 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
          }`}
        >
          <span className="text-base leading-none">✋</span>
          <span className="hidden sm:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>

        {/* Leave / End Call Button */}
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 ml-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
          </svg>
          <span className="text-xs uppercase tracking-wider">Leave Call</span>
        </button>
      </footer>
    </div>
  );
}
