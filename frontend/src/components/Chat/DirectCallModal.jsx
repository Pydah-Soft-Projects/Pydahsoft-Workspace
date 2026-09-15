import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../config/socket';

function RemoteVideoTile({ peer, fallbackName }) {
  const [hasVideo, setHasVideo] = useState(false);
  const name = peer?.name || fallbackName || 'Group Member';
  const letter = name ? name.charAt(0).toUpperCase() : 'M';

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
      <video
        ref={(el) => {
          if (el && peer?.stream && el.srcObject !== peer.stream) {
            el.srcObject = peer.stream;
            el.muted = false;
            el.volume = 1.0;
            el.play().catch(() => {});
            setHasVideo(true);
          }
        }}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${hasVideo ? 'block' : 'hidden'}`}
      />
      {!hasVideo && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-white text-lg font-bold shadow-md mb-1.5 relative">
            {letter}
            <div className="absolute inset-0 rounded-full border border-emerald-500 animate-pulse" />
          </div>
          <p className="text-white text-xs font-bold truncate max-w-[120px]">{name}</p>
          <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">Live Participant</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-extrabold text-white flex items-center gap-1.5 border border-slate-700/50 z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {name}
      </div>
    </div>
  );
}

export default function DirectCallModal({ callType = 'video', recipient, currentUser, isIncoming = false, onClose }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(callType === 'video');
  const [callStatus, setCallStatus] = useState(isIncoming ? 'Connected' : 'Calling...'); // 'Calling...' | 'Connected' | 'Declined'
  const [callDuration, setCallDuration] = useState(0);
  const [activeReaction, setActiveReaction] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [remotePeers, setRemotePeers] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const peersMapRef = useRef(new Map());
  const remoteStreamRef = useRef(null);
  const remoteCallerSocketIdRef = useRef(recipient?.socketId || null);
  const pendingCandidatesRef = useRef(new Map());
  const timerRef = useRef(null);

  // Store active call in sessionStorage so refresh (F5) doesn't re-trigger incoming call banner ring popup
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'pydahsoft_active_direct_call',
        JSON.stringify({ type: callType, recipient, isIncoming })
      );
    } catch (e) {}
  }, [callType, recipient, isIncoming]);

  // Process buffered ICE candidates once remote description is set
  const processPendingCandidates = async (pc, key = 'direct') => {
    if (!pc || !pc.remoteDescription) return;
    const list = pendingCandidatesRef.current.get(key) || [];
    while (list.length > 0) {
      const candidate = list.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Buffered ICE candidate error:', e);
      }
    }
  };

  // Initialize Camera & Microphone media stream & Socket direct call signaling ONLY ONCE on mount
  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }
    if (currentUser?._id) {
      socket.emit('register-user', { userId: currentUser._id });
    }

    const pcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:openrelay.metered.ca:80' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turns:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all'
    };
    const pc = new RTCPeerConnection(pcConfig);
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1.0;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (isMounted) setHasRemoteVideo(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const targetUserId = recipient?.data?._id || recipient?._id;
        socket.emit('webrtc-candidate', {
          targetUserId,
          targetSocketId: remoteCallerSocketIdRef.current,
          candidate: event.candidate
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
      }
    };

    // Emit direct call invite to target person or broadcast to group/everyone if caller
    const targetUserId = recipient?.data?._id || recipient?._id;
    const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
    if (!isIncoming) {
      socket.emit('start-direct-call', {
        targetUserId,
        isGroupCall,
        recipientType: recipient?.type || 'user',
        callType,
        callerName: currentUser?.name || 'Colleague',
        callerId: currentUser?._id
      });
    }

    const getOrCreatePeerConnection = (socketId, peerName) => {
      if (peersMapRef.current.has(socketId)) {
        return peersMapRef.current.get(socketId);
      }
      const pc = new RTCPeerConnection(pcConfig);
      peersMapRef.current.set(socketId, pc);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          if (isMounted) {
            setRemotePeers((prev) => {
              const exists = prev.some((p) => p.id === socketId);
              if (exists) {
                return prev.map((p) => (p.id === socketId ? { ...p, stream, name: peerName || p.name } : p));
              }
              return [...prev, { id: socketId, name: peerName || `Member ${prev.length + 1}`, stream }];
            });
            setHasRemoteVideo(true);
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-candidate', {
            targetSocketId: socketId,
            candidate: event.candidate
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          if (typeof pc.restartIce === 'function') {
            pc.restartIce();
          }
        }
      };

      return pc;
    };

    const handleUserJoinedGroupCall = async ({ socketId, userName }) => {
      try {
        const pc = getOrCreatePeerConnection(socketId, userName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { targetSocketId: socketId, offer, callerName: currentUser?.name });
      } catch (e) {
        console.warn('Error creating offer for joined user:', e);
      }
    };

    const handleCallAccepted = async ({ responderName, callerSocketId } = {}) => {
      if (isMounted) setCallStatus('Connected');
      if (callerSocketId) remoteCallerSocketIdRef.current = callerSocketId;
      try {
        if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              const senders = peerConnectionRef.current.getSenders();
              const exists = senders.some((s) => s.track && s.track.id === track.id);
              if (!exists) {
                peerConnectionRef.current.addTrack(track, localStreamRef.current);
              }
            });
          }
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('webrtc-offer', { targetUserId, targetSocketId: callerSocketId, offer, callerName: currentUser?.name });
        }
      } catch (e) {
        console.warn('Error creating WebRTC offer:', e);
      }
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

    const handleGroupPeerLeft = ({ socketId }) => {
      if (socketId && peersMapRef.current.has(socketId)) {
        try {
          peersMapRef.current.get(socketId).close();
        } catch (e) {}
        peersMapRef.current.delete(socketId);
      }
      if (isMounted) {
        setRemotePeers((prev) => prev.filter((p) => p.id !== socketId));
      }
    };

    const handleWebRtcOffer = async ({ offer, callerSocketId, callerName }) => {
      try {
        if (callerSocketId) remoteCallerSocketIdRef.current = callerSocketId;
        const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
        const pc = (isGroupCall && callerSocketId) ? getOrCreatePeerConnection(callerSocketId, callerName) : peerConnectionRef.current;
        if (pc && pc.signalingState !== 'closed') {
          if (pc.signalingState !== 'stable') {
            try {
              await pc.setLocalDescription({ type: 'rollback' });
            } catch (e) {}
          }
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              const senders = pc.getSenders();
              const exists = senders.some((s) => s.track && s.track.id === track.id);
              if (!exists) {
                try { pc.addTrack(track, localStreamRef.current); } catch (e) {}
              }
            });
          }
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await processPendingCandidates(pc, isGroupCall ? callerSocketId : 'direct');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc-answer', { callerSocketId, answer });
          if (isMounted) setCallStatus('Connected');
        }
      } catch (err) {
        console.warn('WebRTC offer error:', err);
      }
    };

    const handleWebRtcAnswer = async ({ answer, responderSocketId }) => {
      try {
        if (responderSocketId) remoteCallerSocketIdRef.current = responderSocketId;
        const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
        const pc = (isGroupCall && responderSocketId) ? getOrCreatePeerConnection(responderSocketId) : peerConnectionRef.current;
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await processPendingCandidates(pc, isGroupCall ? responderSocketId : 'direct');
          if (isMounted) setCallStatus('Connected');
        }
      } catch (err) {
        console.warn('WebRTC answer error:', err);
      }
    };

    const handleWebRtcCandidate = async ({ candidate, callerSocketId }) => {
      try {
        if (callerSocketId) remoteCallerSocketIdRef.current = callerSocketId;
        const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
        const pc = (isGroupCall && callerSocketId) ? getOrCreatePeerConnection(callerSocketId) : peerConnectionRef.current;
        const key = (isGroupCall && callerSocketId) ? callerSocketId : 'direct';

        if (candidate && pc) {
          if (pc.remoteDescription && pc.signalingState !== 'closed') {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            if (!pendingCandidatesRef.current.has(key)) {
              pendingCandidatesRef.current.set(key, []);
            }
            pendingCandidatesRef.current.get(key).push(candidate);
          }
        }
      } catch (err) {
        console.warn('WebRTC candidate error:', err);
      }
    };

    const handleIncomingReaction = ({ emoji }) => {
      if (isMounted) {
        setActiveReaction(emoji);
        setTimeout(() => setActiveReaction(null), 2500);
      }
    };

    socket.on('direct-call-accepted', handleCallAccepted);
    socket.on('direct-call-declined', handleCallDeclined);
    socket.on('direct-call-ended', handleCallEnded);
    socket.on('group-peer-left', handleGroupPeerLeft);
    socket.on('user-joined-group-call', handleUserJoinedGroupCall);
    socket.on('webrtc-offer', handleWebRtcOffer);
    socket.on('webrtc-answer', handleWebRtcAnswer);
    socket.on('webrtc-candidate', handleWebRtcCandidate);
    socket.on('incoming-call-reaction', handleIncomingReaction);

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

        if (peerConnectionRef.current) {
          stream.getTracks().forEach((track) => {
            const senders = peerConnectionRef.current.getSenders();
            const exists = senders.some((s) => s.track && s.track.id === track.id);
            if (!exists) {
              peerConnectionRef.current.addTrack(track, stream);
            }
          });
        }

        peersMapRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            try { pc.addTrack(track, stream); } catch (e) {}
          });
        });

        const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
        if (isGroupCall) {
          socket.emit('join-group-call', { userName: currentUser?.name || 'Colleague' });
        } else {
          // 1-on-1 Call: Send WebRTC offer with local tracks attached IF signaling state is stable
          if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
            try {
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              socket.emit('webrtc-offer', {
                targetUserId,
                targetSocketId: remoteCallerSocketIdRef.current,
                offer,
                callerName: currentUser?.name
              });
            } catch (e) {
              console.warn('Error creating WebRTC offer on init:', e);
            }
          }
        }

        if (isGroupCall || !targetUserId) {
          setTimeout(() => {
            if (isMounted) setCallStatus('Connected');
          }, 1000);
        }
      } catch (err) {
        console.warn('Could not access hardware camera/mic:', err);
        setCallStatus('Connected');
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      try { sessionStorage.removeItem('pydahsoft_active_direct_call'); } catch (e) {}
      socket.off('direct-call-accepted', handleCallAccepted);
      socket.off('direct-call-declined', handleCallDeclined);
      socket.off('direct-call-ended', handleCallEnded);
      socket.off('group-peer-left', handleGroupPeerLeft);
      socket.off('user-joined-group-call', handleUserJoinedGroupCall);
      socket.off('webrtc-offer', handleWebRtcOffer);
      socket.off('webrtc-answer', handleWebRtcAnswer);
      socket.off('webrtc-candidate', handleWebRtcCandidate);
      socket.off('incoming-call-reaction', handleIncomingReaction);

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      peersMapRef.current.forEach((pc) => {
        try { pc.close(); } catch (e) {}
      });
      peersMapRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Run ONLY once on mount // Run ONLY once on mount

  // Bind video srcObject whenever video element mounts or videoOn/isScreenSharing changes
  useEffect(() => {
    if (localVideoRef.current && (videoOn || isScreenSharing)) {
      if (isScreenSharing && screenStreamRef.current) {
        localVideoRef.current.srcObject = screenStreamRef.current;
      } else if (localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [videoOn, isScreenSharing]);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Toggle Microphone Mute / Unmute
  const toggleMic = (e) => {
    if (e) e.stopPropagation();
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micOn;
      });
    }
    setMicOn(!micOn);
    showToast(!micOn ? 'Microphone unmuted' : 'Microphone muted');
  };

  // Toggle Camera On / Off
  const toggleVideo = async (e) => {
    if (e) e.stopPropagation();
    if (videoOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setVideoOn(false);
      showToast('Camera turned off');
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
        showToast('Camera turned on');
      } catch (err) {
        console.warn('Unable to enable video:', err);
      }
    }
  };

  // Screen Sharing Toggle
  const toggleScreenShare = async (e) => {
    if (e) e.stopPropagation();
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
      showToast('Screen sharing stopped');
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
        showToast('Screen sharing active');

        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // ONLY this function ends/cuts the call
  const handleEndCall = (e) => {
    if (e) e.stopPropagation();
    try {
      sessionStorage.removeItem('pydahsoft_active_direct_call');
      const socket = getSocket();
      const targetUserId = recipient?.data?._id || recipient?._id;
      const isGroupCall = recipient?.type === 'all' || recipient?.type === 'team';
      socket.emit('end-direct-call', {
        targetUserId,
        callerSocketId: socket.id,
        isGroupCall
      });
    } catch (err) {}

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    onClose();
  };

  const handleSendReaction = (emoji, e) => {
    if (e) e.stopPropagation();
    setActiveReaction(emoji);
    setShowEmojiPicker(false);
    setTimeout(() => setActiveReaction(null), 2500);

    try {
      const socket = getSocket();
      const targetUserId = recipient?.data?._id || recipient?._id;
      if (targetUserId) {
        socket.emit('send-call-reaction', { targetUserId, emoji });
      }
    } catch (err) {
      console.warn('Error sending reaction socket event:', err);
    }
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
    <div
      className="fixed inset-0 z-50 bg-[#0d131e] flex flex-col justify-between items-center p-3 md:p-8 select-none font-sans overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col items-center justify-center pt-2 md:pt-6 z-10">
        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white font-black text-xl md:text-3xl shadow-xl overflow-hidden mb-2 md:mb-3 relative">
          {recipient?.data?.avatarUrl ? (
            <img src={recipient.data.avatarUrl} alt={recipientName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white">{avatarLetter}</span>
          )}
          {callStatus === 'Calling...' && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-75" />
          )}
        </div>

        <h2 className="text-white text-base md:text-xl font-bold tracking-wide">
          {recipientName}
        </h2>

        <p className="text-gray-400 text-xs md:text-sm font-medium mt-0.5 md:mt-1 flex items-center gap-2">
          {callStatus === 'Calling...' ? (
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Calling...
            </span>
          ) : callStatus === 'Declined' ? (
            <span className="text-rose-400 font-bold">Call Declined</span>
          ) : (
            <span className="text-emerald-400 font-bold tracking-wider">
              {formatTime(callDuration)}
            </span>
          )}
        </p>
      </div>

      {/* Emoji Picker Floating Popup (Front of screen z-[100]) */}
      {showEmojiPicker && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2.5 flex gap-2 sm:gap-3 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-150">
          {['👍', '❤️', '👏', '🎉', '🔥', '😂'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => handleSendReaction(emoji, e)}
              className="text-2xl hover:scale-130 active:scale-95 transition-transform p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* 2. CENTER MAIN CONTAINER (MAIN REMOTE VIDEO + FLOATING LOCAL SELF VIDEO) */}
      <div className="w-full max-w-4xl flex-1 flex items-center justify-center my-2 md:my-4 relative gap-4">
        {/* Main Remote & Self Video View Container */}
        <div className="w-full max-w-2xl aspect-video bg-[#151d2a] rounded-2xl md:rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center flex-1">
          {/* Reaction Floating Popup */}
          {activeReaction && (
            <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl animate-bounce">
              {activeReaction}
            </div>
          )}

          {/* GROUP / EVERYONE CALL MULTI-FRAME SPLIT GRID LAYOUT */}
          {(recipient?.type === 'all' || recipient?.type === 'team') ? (
            <div className={`w-full h-full grid gap-3 p-3 overflow-y-auto custom-scrollbar ${
              remotePeers.length >= 2 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {/* Frame 1: Local Self User */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                {videoOn || isScreenSharing ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                    className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform -scale-x-100'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white text-lg font-bold shadow-md mb-1.5">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'Y'}
                    </div>
                    <p className="text-white text-xs font-bold">{currentUser?.name || 'You'}</p>
                    <p className="text-slate-400 text-[10px]">Camera Off</p>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-extrabold text-white flex items-center gap-1.5 border border-slate-700/50">
                  <span className={`w-1.5 h-1.5 rounded-full ${micOn ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {currentUser?.name || 'You'} (Self)
                </div>
              </div>

              {/* Dynamic Remote Peers Video Cards for 3+ members */}
              {remotePeers.map((peer) => (
                <RemoteVideoTile key={peer.id} peer={peer} fallbackName={recipientName} />
              ))}

              {/* Default Remote Peer Frame (Fallback if remotePeers list is empty) */}
              {remotePeers.length === 0 && (
                <div className="bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
                  <video
                    ref={(el) => {
                      remoteVideoRef.current = el;
                      if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                        el.srcObject = remoteStreamRef.current;
                        el.muted = false;
                        el.volume = 1.0;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    onLoadedMetadata={(e) => {
                      e.target.muted = false;
                      e.target.volume = 1.0;
                      e.target.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover ${hasRemoteVideo ? 'block' : 'hidden'}`}
                  />
                  {!hasRemoteVideo && (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-white text-lg font-bold shadow-md mb-1.5 relative">
                        {avatarLetter}
                        <div className="absolute inset-0 rounded-full border border-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-white text-xs font-bold">{recipientName}</p>
                      <p className="text-emerald-400 text-[10px] font-semibold mt-0.5">Group Call Member</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-extrabold text-white flex items-center gap-1.5 border border-slate-700/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {recipientName}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 1-ON-1 DIRECT CALL DUAL VIEW (MAIN REMOTE + FLOATING SELF INSET) */
            <>
              {/* 1. MAIN VIEW: REMOTE PARTICIPANT STREAM */}
              <video
                ref={(el) => {
                  remoteVideoRef.current = el;
                  if (el && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                    el.srcObject = remoteStreamRef.current;
                    el.muted = false;
                    el.volume = 1.0;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                onLoadedMetadata={(e) => {
                  e.target.muted = false;
                  e.target.volume = 1.0;
                  e.target.play().catch(() => {});
                }}
                className={`w-full h-full object-cover rounded-2xl md:rounded-3xl ${hasRemoteVideo ? 'block' : 'hidden'}`}
              />

              {!hasRemoteVideo && (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-white text-3xl md:text-4xl font-extrabold shadow-2xl mb-4 relative">
                    {avatarLetter}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-pulse" />
                  </div>
                  <p className="text-white text-base md:text-lg font-black tracking-wide">
                    {recipientName}
                  </p>
                  <p className="text-slate-400 text-xs md:text-sm font-semibold mt-1">
                    {callStatus === 'Connected' ? 'Connecting live 1-on-1 video & audio...' : 'Calling participant...'}
                  </p>
                </div>
              )}

              {/* Remote User Name Badge */}
              <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50 text-[10px] md:text-xs font-semibold text-white flex items-center gap-1.5 z-20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {recipientName}
              </div>

              {/* 2. FLOATING INSET VIEW: SELF LOCAL CAMERA PREVIEW */}
              <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-28 sm:w-36 md:w-44 aspect-video bg-slate-900/90 rounded-xl border-2 border-emerald-500/80 shadow-2xl overflow-hidden z-20 transition-all hover:scale-105">
                {videoOn || isScreenSharing ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      e.target.play().catch(() => {});
                    }}
                    className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform -scale-x-100'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-[10px] font-bold p-1 text-center h-full">
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1 left-1.5 text-[8px] md:text-[9px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  {currentUser?.name ? 'You' : 'Self'} {!micOn && '(Muted)'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. BOTTOM CONTROL TOOLBAR (RESPONSIVE FOR MOBILE VIEW) */}
      <div
        className="w-full max-w-2xl bg-[#151d2a]/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-2xl z-30 mb-1 sm:mb-3 gap-1 sm:gap-3 overflow-x-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT CONTROLS: Camera & Mic Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
              videoOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
            }`}
            title={videoOn ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {videoOn ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            <svg className="w-3 h-3 text-gray-400 hidden sm:inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
              micOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30'
            }`}
            title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micOn ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
            <svg className="w-3 h-3 text-gray-400 hidden sm:inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* MIDDLE CONTROLS: Reaction, Screen Share, Invite */}
        <div className="flex items-center gap-1 sm:gap-2.5 relative shrink-0">
          {/* Emoji Reaction Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="p-1.5 sm:p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Reactions"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-1.5 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Invite Participants Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showToast('Call invite sent to recipient');
            }}
            className="p-1.5 sm:p-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Invite Participants"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
        </div>

        {/* RIGHT CONTROL: Red End Call Circle Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-600/50 transition-all cursor-pointer active:scale-95 shrink-0"
          title="End Call"
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.21.49 2.53.76 3.88.76a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 14.84 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.27 1.11l-2.2 2.2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
