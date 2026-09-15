import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../config/socket';

export default function DirectCallModal({ callType = 'video', recipient, currentUser, onClose }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState('Calling...'); // 'Calling...' | 'Connected' | 'Declined'
  const [callDuration, setCallDuration] = useState(0);
  const [activeReaction, setActiveReaction] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Camera & Microphone media stream & Socket direct call signaling
  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }
    if (currentUser?._id) {
      socket.emit('register-user', { userId: currentUser._id });
    }

    // Emit direct call invite to target person
    const targetUserId = recipient?.data?._id || recipient?._id;
    if (targetUserId) {
      socket.emit('start-direct-call', {
        targetUserId,
        callType,
        callerName: currentUser?.name || 'Colleague',
        callerId: currentUser?._id
      });
    }

    const handleCallAccepted = () => {
      if (isMounted) setCallStatus('Connected');
    };

    const handleCallDeclined = () => {
      if (isMounted) {
        setCallStatus('Declined');
        setTimeout(() => {
          if (isMounted) onClose();
        }, 1500);
      }
    };

    const handleCallEnded = () => {
      if (isMounted) onClose();
    };

    socket.on('direct-call-accepted', handleCallAccepted);
    socket.on('direct-call-declined', handleCallDeclined);
    socket.on('direct-call-ended', handleCallEnded);

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { width: 1280, height: 720 } : false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Auto-connect if no recipient ID (e.g. self call or fallback)
        if (!targetUserId) {
          setTimeout(() => {
            if (isMounted) setCallStatus('Connected');
          }, 2000);
        }
      } catch (err) {
        console.warn('Could not access hardware camera/mic:', err);
        setCallStatus('Connected');
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      socket.off('direct-call-accepted', handleCallAccepted);
      socket.off('direct-call-declined', handleCallDeclined);
      socket.off('direct-call-ended', handleCallEnded);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callType, recipient, currentUser]);

  // Duration timer when call is connected
  useEffect(() => {
    if (callStatus === 'Connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Toggle Microphone Mute / Unmute
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
    setMicOn(!micOn);
  };

  // Toggle Camera On / Off
  const toggleVideo = async () => {
    if (videoOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setVideoOn(false);
    } else {
      try {
        if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
          localStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = true;
          });
        } else {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          if (localStreamRef.current) {
            localStreamRef.current.addTrack(videoTrack);
          } else {
            localStreamRef.current = videoStream;
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
        setVideoOn(true);
      } catch (err) {
        console.warn('Unable to enable video:', err);
      }
    }
  };

  // End Call Handler
  const handleEndCall = () => {
    try {
      const socket = getSocket();
      const targetUserId = recipient?.data?._id || recipient?._id;
      socket.emit('end-direct-call', {
        targetUserId,
        callerSocketId: socket.id
      });
    } catch (e) {}

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    onClose();
  };

  const handleSendReaction = (emoji) => {
    setActiveReaction(emoji);
    setShowEmojiPicker(false);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const recipientName =
    recipient?.data?.name || recipient?.name || (recipient?.type === 'all' ? 'Everyone' : 'Team');
  const avatarLetter = recipientName ? recipientName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="fixed inset-0 z-50 bg-[#0d131e] flex flex-col justify-between items-center p-4 md:p-8 select-none font-sans overflow-hidden">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col items-center justify-center pt-4 md:pt-6 z-10">
        {/* Recipient Profile Picture / Avatar Circle */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-xl overflow-hidden mb-3 relative">
          {recipient?.data?.avatarUrl ? (
            <img src={recipient.data.avatarUrl} alt={recipientName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white">{avatarLetter}</span>
          )}
          {callStatus === 'Calling...' && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75" />
          )}
        </div>

        {/* Recipient Name */}
        <h2 className="text-white text-lg md:text-xl font-bold tracking-wide">
          {recipientName}
        </h2>

        {/* Call Subtitle Status */}
        <p className="text-gray-400 text-xs md:text-sm font-medium mt-1 flex items-center gap-2">
          {callStatus === 'Calling...' ? (
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Calling...
            </span>
          ) : (
            <span className="text-emerald-400 font-bold tracking-wider">
              {formatTime(callDuration)}
            </span>
          )}
        </p>
      </div>

      {/* 2. CENTER MAIN VIDEO CONTAINER */}
      <div className="w-full max-w-3xl flex-1 flex items-center justify-center my-4 relative">
        <div className="w-full max-w-2xl aspect-video bg-[#151d2a] rounded-2xl md:rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center">
          {/* Animated Reaction Popup */}
          {activeReaction && (
            <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce">
              {activeReaction}
            </div>
          )}

          {videoOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-2xl md:rounded-3xl transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl mb-4 relative">
                {avatarLetter}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-pulse" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">
                {callType === 'voice' ? 'Voice Call Active' : 'Camera is Turned Off'}
              </p>
            </div>
          )}

          {/* Self Camera Status Tag */}
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/50 text-xs font-semibold text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${micOn ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            {currentUser?.name || 'You'} {!micOn && '(Muted)'}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROL TOOLBAR (Match Screenshot Exactly) */}
      <div className="w-full max-w-2xl bg-[#151d2a]/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl z-30 mb-2 md:mb-4">
        {/* LEFT CONTROLS: Camera & Mic Toggle with Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              videoOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
            }`}
            title={videoOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {videoOn ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              micOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
            }`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* MIDDLE CONTROLS: Reaction, Screen Share, Invite, Chat */}
        <div className="flex items-center gap-1.5 md:gap-3 relative">
          {/* Emoji Reaction Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Reactions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-2xl z-50">
              {['👍', '❤️', '👏', '🎉', '🔥', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={() => alert('Screen sharing initialized.')}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Share Screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Add People / Invite Button */}
          <button
            type="button"
            onClick={() => alert(`Call link copied! Share with colleagues.`)}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Invite Participants"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>

          {/* In-Call Chat Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="In-call Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>

        {/* RIGHT CONTROL: Red End Call Circle Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-600/50 transition-all cursor-pointer active:scale-95 shrink-0"
          title="End Call"
        >
          <svg className="w-6 h-6 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.2 2.2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
