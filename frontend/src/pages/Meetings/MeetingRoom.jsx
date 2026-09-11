import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../config/api';
import { getSocket } from '../../config/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Sub-component to render Remote Participant Video Streams cleanly with WebRTC srcObject
function RemoteVideoTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative bg-[#09233d] border border-[#13523c] rounded-2xl overflow-hidden aspect-video shadow-xl flex flex-col items-center justify-center group">
      {/* Remote Video Stream or Camera Off Avatar */}
      {peer.videoOn && peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-b from-[#0b2844] to-[#061829]">
          <div className={`w-20 h-20 rounded-full ${peer.bgColor || 'bg-[#09233d]'} text-white font-black text-2xl flex items-center justify-center ring-4 ring-emerald-500/30 shadow-2xl animate-pulse`}>
            {(peer.name || 'P').split(' ').map((n) => n[0]).join('').toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-emerald-200 mt-3">Camera Disabled</span>
        </div>
      )}

      {/* Role Badge */}
      <p className="absolute top-3 left-3 text-[10px] font-bold text-emerald-300 bg-[#072b1e]/80 px-2 py-0.5 rounded-lg border border-[#0e4733]">
        {peer.role || 'Live Participant'}
      </p>

      {/* Participant Footer Info */}
      <div className="absolute bottom-3 left-3 bg-[#072b1e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0e4733] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
        <span className="text-xs font-extrabold text-white">{peer.name}</span>
        {peer.handRaised && (
          <svg className="w-3.5 h-3.5 text-amber-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
          </svg>
        )}
      </div>

      {/* Mic Status Indicator Icon */}
      <div className="absolute top-3 right-3 bg-[#072b1e]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#0e4733]">
        {peer.micOn ? (
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
}

export default function MeetingRoom({ meeting, currentUser, onLeave }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'people'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveMeetingData, setLiveMeetingData] = useState(meeting);
  const [chatMessages, setChatMessages] = useState(meeting?.inMeetingMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [toastNotification, setToastNotification] = useState(null);

  // WebRTC Remote Peers State: socketId -> { socketId, userId, name, role, stream, micOn, videoOn, handRaised, bgColor }
  const [remotePeers, setRemotePeers] = useState({});

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // socketId -> RTCPeerConnection
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  const getLiveMeetingUrl = () => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId || 'meet-room';
    return `${window.location.origin}/meetings/${meetingCode}`;
  };

  // Helper to create WebRTC peer connection
  const createPeerConnection = (targetSocketId, targetUserName) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    // Add local media tracks to peer connection
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStreamRef.current);
      });
    }

    // ICE Candidates Handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track Handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemotePeers((prev) => ({
          ...prev,
          [targetSocketId]: {
            ...prev[targetSocketId],
            socketId: targetSocketId,
            name: targetUserName || prev[targetSocketId]?.name || 'Remote Participant',
            role: 'Live Participant',
            stream: remoteStream,
            micOn: prev[targetSocketId]?.micOn ?? true,
            videoOn: prev[targetSocketId]?.videoOn ?? true,
            handRaised: prev[targetSocketId]?.handRaised ?? false,
            bgColor: prev[targetSocketId]?.bgColor || 'bg-[#09233d]'
          }
        }));
      }
    };

    // Connection state log
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(targetSocketId);
      }
    };

    return pc;
  };

  // Remove peer connection
  const removePeer = (targetSocketId) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      peerConnectionsRef.current[targetSocketId].close();
      delete peerConnectionsRef.current[targetSocketId];
    }
    setRemotePeers((prev) => {
      const updated = { ...prev };
      delete updated[targetSocketId];
      return updated;
    });
  };

  // Step 1: Initialize local user camera & mic media stream
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
        console.warn('Webcam/Mic stream initialization warning:', err);
      }
    }

    initMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Step 2: Initialize Socket.io connection & WebRTC Signaling
  useEffect(() => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (!meetingCode) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    // Join Room
    socket.emit('join-room', {
      meetingId: meetingCode,
      userId: currentUser?._id,
      userName: currentUser?.name || 'Participant'
    });

    // Receive list of all existing peers in the room
    socket.on('all-users', (existingPeers) => {
      existingPeers.forEach(async (peer) => {
        if (peer.socketId === socket.id) return;

        setRemotePeers((prev) => ({
          ...prev,
          [peer.socketId]: {
            socketId: peer.socketId,
            userId: peer.userId,
            name: peer.userName,
            role: 'Live Participant',
            stream: null,
            micOn: peer.micOn,
            videoOn: peer.videoOn,
            handRaised: peer.handRaised,
            bgColor: 'bg-[#09233d]'
          }
        }));

        // Initiate WebRTC call (Create Offer)
        const pc = createPeerConnection(peer.socketId, peer.userName);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            targetSocketId: peer.socketId,
            offer,
            callerName: currentUser?.name || 'Participant'
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      });
    });

    // Handle New User Joined
    socket.on('user-joined', (newPeer) => {
      if (newPeer.socketId === socket.id) return;

      setToastNotification(`${newPeer.userName} has joined the meeting!`);
      setTimeout(() => setToastNotification(null), 4000);

      setRemotePeers((prev) => ({
        ...prev,
        [newPeer.socketId]: {
          socketId: newPeer.socketId,
          userId: newPeer.userId,
          name: newPeer.userName,
          role: 'Live Participant',
          stream: null,
          micOn: newPeer.micOn,
          videoOn: newPeer.videoOn,
          handRaised: newPeer.handRaised,
          bgColor: 'bg-[#09233d]'
        }
      }));
    });

    // Handle Incoming WebRTC Offer
    socket.on('offer', async ({ offer, callerSocketId, callerName }) => {
      const pc = createPeerConnection(callerSocketId, callerName);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', {
          targetSocketId: callerSocketId,
          answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Handle Incoming WebRTC Answer
    socket.on('answer', async ({ answer, responderSocketId }) => {
      const pc = peerConnectionsRef.current[responderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    // Handle ICE Candidate
    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Handle Peer Toggles
    socket.on('user-toggled-audio', ({ socketId, micOn }) => {
      setRemotePeers((prev) => prev[socketId] ? { ...prev, [socketId]: { ...prev[socketId], micOn } } : prev);
    });

    socket.on('user-toggled-video', ({ socketId, videoOn }) => {
      setRemotePeers((prev) => prev[socketId] ? { ...prev, [socketId]: { ...prev[socketId], videoOn } } : prev);
    });

    socket.on('user-toggled-hand', ({ socketId, handRaised }) => {
      setRemotePeers((prev) => prev[socketId] ? { ...prev, [socketId]: { ...prev[socketId], handRaised } } : prev);
    });

    // Handle User Leaving
    socket.on('user-left', ({ socketId, userName }) => {
      if (userName) {
        setToastNotification(`${userName} left the meeting`);
        setTimeout(() => setToastNotification(null), 3000);
      }
      removePeer(socketId);
    });

    return () => {
      socket.emit('leave-room', { meetingId: meetingCode });
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-toggled-audio');
      socket.off('user-toggled-video');
      socket.off('user-toggled-hand');
      socket.off('user-left');

      // Close all WebRTC peer connections
      Object.keys(peerConnectionsRef.current).forEach((key) => {
        peerConnectionsRef.current[key].close();
      });
      peerConnectionsRef.current = {};
    };
  }, [meeting?.meetingId, liveMeetingData?.meetingId, currentUser?._id, currentUser?.name]);

  // Periodic HTTP Polling for Chat & Database Sync
  useEffect(() => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (!meetingCode) return;

    const fetchLatestState = () => {
      fetchApi(`/meetings/${meetingCode}`)
        .then((res) => {
          if (res.data) {
            setLiveMeetingData(res.data);
            if (res.data.inMeetingMessages) {
              setChatMessages(res.data.inMeetingMessages);
            }
          }
        })
        .catch(() => {});
    };

    fetchLatestState();
    const interval = setInterval(fetchLatestState, 3000);
    return () => clearInterval(interval);
  }, [meeting?.meetingId, liveMeetingData?.meetingId]);

  // Microphone Toggle Handler
  const toggleMic = () => {
    const nextState = !micOn;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setMicOn(nextState);
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (socketRef.current) {
      socketRef.current.emit('toggle-audio', { meetingId: meetingCode, micOn: nextState });
    }
  };

  // Camera Toggle Handler
  const toggleCamera = () => {
    const nextState = !videoOn;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
    setVideoOn(nextState);
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (socketRef.current) {
      socketRef.current.emit('toggle-video', { meetingId: meetingCode, videoOn: nextState });
    }
  };

  // Raise Hand Toggle Handler
  const toggleHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (socketRef.current) {
      socketRef.current.emit('toggle-hand', { meetingId: meetingCode, handRaised: nextState });
    }
  };

  // Native Screen Sharing Handler using getDisplayMedia
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace camera video track with screen track in all peer connections
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
        setScreenSharing(false);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Revert video track in peer connections to camera track
    const cameraVideoTrack = mediaStreamRef.current ? mediaStreamRef.current.getVideoTracks()[0] : null;
    if (cameraVideoTrack) {
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraVideoTrack);
        }
      });
    }

    if (localVideoRef.current && mediaStreamRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }

    setScreenSharing(false);
  };

  // Graceful Leave Call
  const handleLeaveCall = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (socketRef.current && meetingCode) {
      socketRef.current.emit('leave-room', { meetingId: meetingCode });
    }
    if (meetingCode) {
      try {
        await fetchApi(`/meetings/${meetingCode}/leave`, { method: 'POST' });
      } catch (e) {}
    }
    onLeave();
  };

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

    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (meetingCode) {
      fetchApi(`/meetings/${meetingCode}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: item.message })
      }).catch(() => {});
    }
  };

  const remotePeerList = Object.values(remotePeers);
  const totalParticipantsCount = remotePeerList.length + 1; // Remote peers + Local user

  return (
    <div className="fixed inset-0 z-50 bg-[#041a12] text-white flex flex-col overflow-hidden font-sans relative">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#20b875] text-white px-5 py-2.5 rounded-2xl shadow-2xl font-extrabold text-xs flex items-center gap-2.5 border border-emerald-300 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#072b1e] border-b border-[#0e4733] px-4 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#20b875] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-[#20b875]/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {liveMeetingData?.title || 'Live Video Conference'}
              </h1>
              <span className="bg-[#20b875]/20 text-[#4ade80] border border-[#20b875]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span> HD WEBRTC LIVE
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-mono truncate max-w-md">
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
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
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
            <span className="hidden sm:inline">People ({totalParticipantsCount})</span>
          </button>
        </div>
      </header>

      {/* Main Video Call View Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col justify-center items-center">
          <div className={`w-full max-w-6xl grid gap-4 ${
            totalParticipantsCount === 1
              ? 'grid-cols-1 max-w-2xl'
              : totalParticipantsCount === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          }`}>
            {/* LOCAL USER VIDEO TILE */}
            <div className="relative bg-[#09233d] border-2 border-[#20b875] rounded-2xl overflow-hidden aspect-video shadow-2xl flex items-center justify-center group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform ${
                  screenSharing ? 'scale-100' : '-scale-x-100'
                } ${videoOn ? 'block' : 'hidden'}`}
              />

              {!videoOn && (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-[#20b875] text-white font-black text-2xl flex items-center justify-center ring-4 ring-[#4ade80]/30 shadow-lg">
                    {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-emerald-200">Camera Off</span>
                </div>
              )}

              {/* Local Participant Info */}
              <div className="absolute bottom-3 left-3 bg-[#072b1e]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#0e4733] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                <span className="text-xs font-extrabold text-white">
                  {currentUser?.name || 'You'} (You) {screenSharing ? '[Sharing Screen]' : ''}
                </span>
                {handRaised && (
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
                  </svg>
                )}
              </div>

              {/* Local Mic Status */}
              <div className="absolute top-3 right-3 bg-[#072b1e]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#0e4733]">
                {micOn ? (
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

            {/* REMOTE PEERS WEBRTC LIVE VIDEO TILES */}
            {remotePeerList.map((peer) => (
              <RemoteVideoTile key={peer.socketId} peer={peer} />
            ))}

            {/* Quick Copy Link Card if only 1 participant */}
            {totalParticipantsCount === 1 && (
              <div
                onClick={handleCopyLink}
                className="relative bg-[#072b1e]/60 border-2 border-dashed border-[#20b875]/40 hover:border-[#20b875] rounded-2xl overflow-hidden aspect-video shadow-lg flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-[#072b1e]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#20b875]/20 text-[#4ade80] flex items-center justify-center font-bold text-2xl mb-3">
                  <svg className="w-7 h-7 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h4 className="text-sm font-extrabold text-white">Invite Colleagues to Join</h4>
                <p className="text-xs text-gray-300 font-medium mt-1 max-w-xs">
                  Share the live room link with your team members to start instant WebRTC video stream.
                </p>
                <span className="mt-4 px-4 py-2 bg-[#20b875] text-white font-extrabold text-xs rounded-xl shadow-md">
                  {copiedLink ? 'Link Copied!' : 'Copy Room Link'}
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
                  People ({totalParticipantsCount})
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

            {/* Chat Tab */}
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

            {/* People Tab */}
            {activeTab === 'people' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-[#4ade80] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4ade80]"></span>
                    <span>Joined Live Members ({totalParticipantsCount})</span>
                  </div>
                  <div className="space-y-2">
                    {/* Local User */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b3828] border border-[#13523c]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#20b875] text-white font-bold text-xs flex items-center justify-center">
                          {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">
                            {currentUser?.name || 'You'} (You)
                          </span>
                          <span className="text-[10px] text-emerald-300 font-medium">Host / Local</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {micOn ? (
                          <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Remote Peers */}
                    {remotePeerList.map((p) => (
                      <div key={p.socketId} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b3828] border border-[#13523c]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                            {(p.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                            <span className="text-[10px] text-emerald-300 font-medium">{p.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.micOn ? (
                            <svg className="w-4 h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Control Toolbar */}
      <footer className="bg-[#072b1e] border-t border-[#0e4733] px-4 py-3 flex items-center justify-center gap-3 sm:gap-4 shrink-0 shadow-2xl">
        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleMic}
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
          onClick={toggleCamera}
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

        {/* Native Screen Share Button */}
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            screenSharing
              ? 'bg-[#20b875] border-[#4ade80] text-white animate-pulse'
              : 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
          }`}
        >
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">{screenSharing ? 'Stop Share' : 'Share Screen'}</span>
        </button>

        {/* Raise Hand Button */}
        <button
          type="button"
          onClick={toggleHand}
          className={`flex flex-col items-center gap-1 p-3 sm:px-4 sm:py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
            handRaised
              ? 'bg-amber-500 border-amber-400 text-white'
              : 'bg-[#0b3828] border-[#166046] text-white hover:bg-[#13523c]'
          }`}
        >
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
          </svg>
          <span className="hidden sm:inline">{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>

        {/* Leave Call Button */}
        <button
          type="button"
          onClick={handleLeaveCall}
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
