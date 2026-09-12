import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { fetchApi } from '../../config/api';
import { getSocket } from '../../config/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'stun:openrelay.metered.ca:80',
        'stun:openrelay.metered.ca:443'
      ]
    },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay'
    }
  ]
};

// Helper to generate a dynamic, high-motion virtual video stream when hardware camera is locked by another browser window on the same machine
function createSyntheticMediaStream(userName) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  let frame = 0;

  // Initialize random particle positions for dynamic background motion
  const particles = Array.from({ length: 25 }, () => ({
    x: Math.random() * 640,
    y: Math.random() * 480,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    radius: Math.random() * 4 + 2,
    color: ['#4ade80', '#20b875', '#38bdf8', '#a855f7'][Math.floor(Math.random() * 4)]
  }));

  function draw() {
    frame++;
    const time = frame * 0.04;

    // Dynamic Shifting Plasma Background
    const g1X = 320 + Math.sin(time * 0.7) * 200;
    const g1Y = 240 + Math.cos(time * 0.5) * 150;
    const bgGradient = ctx.createRadialGradient(g1X, g1Y, 30, 320, 240, 400);
    bgGradient.addColorStop(0, '#0c382e');
    bgGradient.addColorStop(0.5, '#072035');
    bgGradient.addColorStop(1, '#04101d');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 640, 480);

    // Grid Overlay
    ctx.strokeStyle = 'rgba(32, 184, 117, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 480);
      ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Moving Particles
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > 640) p.vx *= -1;
      if (p.y < 0 || p.y > 480) p.vy *= -1;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Orbiting Glowing Rings & Central Orb
    const centerX = 320;
    const centerY = 210;

    // Pulsing Outer Ring
    ctx.strokeStyle = '#20b875';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80 + Math.sin(time * 2) * 8, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary Spinning Arc
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 95, time * 1.5, time * 1.5 + Math.PI * 1.2);
    ctx.stroke();

    // Central Avatar Node
    const orbGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 65);
    orbGradient.addColorStop(0, '#34d399');
    orbGradient.addColorStop(1, '#059669');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 65, 0, Math.PI * 2);
    ctx.fill();

    // User Initials inside Central Orb
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 38px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((userName || 'User').substring(0, 2).toUpperCase(), centerX, centerY - 2);

    // Live Camera Viewfinder Corner Crosshairs
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    const margin = 30;
    const lineLen = 20;

    // Top-Left Corner
    ctx.beginPath();
    ctx.moveTo(margin, margin + lineLen);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + lineLen, margin);
    ctx.stroke();

    // Top-Right Corner
    ctx.beginPath();
    ctx.moveTo(640 - margin - lineLen, margin);
    ctx.lineTo(640 - margin, margin);
    ctx.lineTo(640 - margin, margin + lineLen);
    ctx.stroke();

    // Bottom-Left Corner
    ctx.beginPath();
    ctx.moveTo(margin, 480 - margin - lineLen);
    ctx.lineTo(margin, 480 - margin);
    ctx.lineTo(margin + lineLen, 480 - margin);
    ctx.stroke();

    // Bottom-Right Corner
    ctx.beginPath();
    ctx.moveTo(640 - margin - lineLen, 480 - margin);
    ctx.lineTo(640 - margin, 480 - margin);
    ctx.lineTo(640 - margin, 480 - margin - lineLen);
    ctx.stroke();

    // Top Header HUD Tag: Red REC dot & LIVE Timestamp
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 100)}`;

    // Red Recording Dot
    ctx.fillStyle = Math.floor(frame / 15) % 2 === 0 ? '#ef4444' : '#991b1b';
    ctx.beginPath();
    ctx.arc(margin + 15, margin + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`REC LIVE WEBRTC STREAM | ${timeStr}`, margin + 30, margin + 15);

    // Bottom Audio Equalizer Waveform Bars
    const barCount = 20;
    const barWidth = 12;
    const barGap = 6;
    const startX = 320 - (barCount * (barWidth + barGap)) / 2;
    const baseBarY = 380;

    for (let i = 0; i < barCount; i++) {
      const height = Math.abs(Math.sin(time * 3 + i * 0.4)) * 35 + 8;
      const x = startX + i * (barWidth + barGap);

      const barGrad = ctx.createLinearGradient(0, baseBarY - height, 0, baseBarY);
      barGrad.addColorStop(0, '#4ade80');
      barGrad.addColorStop(1, '#059669');

      ctx.fillStyle = barGrad;
      ctx.fillRect(x, baseBarY - height, barWidth, height);
    }

    // Participant Name Banner Below Audio Spectrum
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(userName || 'Live Participant', 320, 415);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Single-PC Virtual Multi-Window Stream', 320, 438);
  }

  // Use setInterval so canvas continues 30fps rendering even when browser window is unfocused
  const intervalId = setInterval(draw, 1000 / 30);
  draw();

  const stream = canvas.captureStream(30);
  stream.canvasIntervalId = intervalId;

  // Add silent audio track using AudioContext oscillator
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      gain.gain.value = 0; // silent
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }
  } catch (e) {}

  return stream;
}

// Helper to generate dynamic 30fps HTML5 Canvas Presentation Stream for mobile devices where getDisplayMedia is restricted by iOS/Android OS
function createMobilePresentationStream(presenterName, meetingTitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  let frame = 0;

  function draw() {
    frame++;
    const bgGrad = ctx.createLinearGradient(0, 0, 1280, 720);
    bgGrad.addColorStop(0, '#041527');
    bgGrad.addColorStop(0.5, '#072b1e');
    bgGrad.addColorStop(1, '#020b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Presentation Grid Overlay
    ctx.strokeStyle = 'rgba(32, 184, 117, 0.12)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 1280; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 0; y < 720; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = '#20b875';
    ctx.fillRect(40, 40, 1200, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📱 LIVE MOBILE PRESENTATION STREAM', 65, 85);

    // Content Box
    ctx.fillStyle = 'rgba(9, 35, 61, 0.85)';
    ctx.strokeStyle = '#20b875';
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(40, 140, 1200, 520, 24);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(40, 140, 1200, 520);
    }

    // Presenter Info
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Presenter: ${presenterName || 'Mobile Presenter'}`, 640, 320);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Meeting: ${meetingTitle || 'Live Video Conference'}`, 640, 380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px monospace';
    const now = new Date();
    ctx.fillText(`Status: Mobile Live Broadcast • ${now.toLocaleTimeString()}`, 640, 440);

    // Animated Live Indicator Dot
    ctx.fillStyle = Math.floor(frame / 15) % 2 === 0 ? '#ef4444' : '#991b1b';
    ctx.beginPath();
    ctx.arc(640, 520, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const intervalId = setInterval(draw, 1000 / 30);
  draw();

  const stream = canvas.captureStream(30);
  stream.canvasIntervalId = intervalId;
  return stream;
}

// Sub-component to render Remote Participant Video Streams cleanly with WebRTC srcObject
// Wrapped in memo with custom comparator: only re-renders when peer props that AFFECT the visual change.
// This prevents the video tile from being torn down & rebuilt every time any other peer updates,
// which was the primary cause of frame lag / stutter in multi-participant meetings.
const RemoteVideoTile = memo(function RemoteVideoTile({ peer, layout, isFeatured, onPin, isPinned }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      // Only update srcObject if the stream reference actually changed
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => console.warn('Remote stream play notice:', err));
      }
    }
  }, [peer.stream]);

  const hasVideoStream = peer.stream && peer.stream.getVideoTracks().length > 0 && peer.videoOn !== false;

  // Responsive Avatar Size & Text
  const avatarSize = layout === 'compact' ? 'w-10 h-10 text-xs' : isFeatured ? 'w-20 h-20 text-2xl' : 'w-12 h-12 text-sm sm:w-16 sm:h-16 sm:text-xl';
  const nameFontSize = layout === 'compact' ? 'text-[9px]' : 'text-[10px] sm:text-xs';
  const badgePadding = layout === 'compact' ? 'px-1.5 py-0.5' : 'px-2 py-0.5 sm:px-3 sm:py-1';

  return (
    <div className={`relative bg-[#09233d] border ${isFeatured ? 'border-2 border-[#20b875]' : 'border border-[#13523c]'} rounded-xl sm:rounded-2xl overflow-hidden aspect-video shadow-lg flex flex-col items-center justify-center group w-full h-full`}>
      {/* Remote Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Pin to Entire Screen Hover Action Overlay Button */}
      {onPin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="absolute inset-0 m-auto w-max h-max opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#072b1e]/95 hover:bg-[#20b875] text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black shadow-2xl border border-emerald-400/50 flex items-center gap-1.5 backdrop-blur-md cursor-pointer z-30 transform hover:scale-105 active:scale-95"
          title={isPinned ? 'Unpin from entire screen' : `Pin ${peer.name} to entire screen`}
        >
          <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
          </svg>
          <span>{isPinned ? 'Unpin Screen' : 'Pin to Entire Screen'}</span>
        </button>
      )}

      {/* Camera Off / Waiting Avatar Overlay */}
      {!hasVideoStream && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b2844] to-[#061829] p-2">
          <div className={`${avatarSize} rounded-full ${peer.bgColor || 'bg-[#09233d]'} text-white font-black flex items-center justify-center ring-2 sm:ring-4 ring-emerald-500/30 shadow-xl`}>
            {(peer.name || 'P').split(' ').map((n) => n[0]).join('').toUpperCase()}
          </div>
          {layout !== 'compact' && (
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-200 mt-1 sm:mt-2 hidden xs:block">Camera Off</span>
          )}
        </div>
      )}

      {/* Role Badge — hidden on mobile to prevent tile clutter */}
      {layout !== 'compact' && (
        <p className="hidden sm:block absolute top-2 left-2 z-20 text-[9px] font-bold text-emerald-300 bg-[#072b1e]/80 px-2 py-0.5 rounded-md border border-[#0e4733]">
          {peer.role || 'Live Participant'}
        </p>
      )}

      {/* Participant Footer Info */}
      <div className={`absolute bottom-1.5 left-1.5 z-20 bg-[#072b1e]/90 backdrop-blur-md ${badgePadding} rounded-lg border border-[#0e4733] flex items-center gap-1 max-w-[85%]`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0"></span>
        <span className={`${nameFontSize} font-extrabold text-white truncate`}>{peer.name}</span>
        {peer.handRaised && (
          <svg className="w-3 h-3 text-amber-400 animate-bounce shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
          </svg>
        )}
      </div>

      {/* Mic Status Indicator Icon */}
      <div className="absolute top-1.5 right-1.5 z-20 bg-[#072b1e]/90 backdrop-blur-md p-1 rounded-md border border-[#0e4733]">
        {peer.micOn ? (
          <svg className="w-3 h-3 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </div>
    </div>
  );
},
// Custom equality: only re-render when visible peer state changes
(prevProps, nextProps) => {
  const pp = prevProps.peer;
  const np = nextProps.peer;
  return (
    pp.stream === np.stream &&
    pp.micOn === np.micOn &&
    pp.videoOn === np.videoOn &&
    pp.handRaised === np.handRaised &&
    pp.name === np.name &&
    pp.bgColor === np.bgColor &&
    prevProps.layout === nextProps.layout &&
    prevProps.isFeatured === nextProps.isFeatured &&
    prevProps.isPinned === nextProps.isPinned
  );
});


export default function MeetingRoom({ meeting, currentUser, onLeave }) {
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'people'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [liveMeetingData, setLiveMeetingData] = useState(meeting);
  const [chatMessages, setChatMessages] = useState(meeting?.inMeetingMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [toastNotification, setToastNotification] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [layout, setLayout] = useState('gallery');
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [chatNotification, setChatNotification] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [pinnedPeerId, setPinnedPeerId] = useState(null);

  // WebRTC Remote Peers State: socketId -> { socketId, userId, name, role, stream, micOn, videoOn, handRaised, bgColor }
  const [remotePeers, setRemotePeers] = useState({});

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // socketId -> RTCPeerConnection
  const iceCandidateQueueRef = useRef({}); // socketId -> Array of candidate objects
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const lastChatMessageRef = useRef(null);
  const chatNotificationTimerRef = useRef(null);

  // Lock body scroll so outer application headers/sidebar are completely hidden under portal overlay
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const getLiveMeetingUrl = () => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId || 'meet-room';
    return `${window.location.origin}/#/meetings/${meetingCode}`;
  };

  const isHost = String(liveMeetingData?.host) === String(currentUser?._id);

  // Process queued ICE candidates after remote description is set
  const processCandidateQueue = async (targetSocketId, pc) => {
    const queue = iceCandidateQueueRef.current[targetSocketId] || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('Error adding queued ICE candidate:', e);
      }
    }
  };

  // Helper to create WebRTC peer connection
  const createPeerConnection = (targetSocketId, targetUserName) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    // Add local media tracks directly to peer connection with mediaStreamRef.current
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

    // Robust Remote Track Handler - Gather receivers and create fresh MediaStream object for React state
    pc.ontrack = (event) => {
      setRemotePeers((prev) => {
        const existing = prev[targetSocketId];

        // Gather all active tracks from receivers
        const receivers = pc.getReceivers();
        const activeTracks = receivers.map((r) => r.track).filter(Boolean);
        const freshStream = new MediaStream(activeTracks.length > 0 ? activeTracks : [event.track]);

        return {
          ...prev,
          [targetSocketId]: {
            ...existing,
            socketId: targetSocketId,
            name: targetUserName || existing?.name || 'Remote Participant',
            role: 'Live Participant',
            stream: freshStream,
            micOn: existing?.micOn ?? true,
            videoOn: freshStream.getVideoTracks().length > 0,
            handRaised: existing?.handRaised ?? false,
            bgColor: existing?.bgColor || 'bg-[#09233d]'
          }
        };
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetSocketId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
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
    delete iceCandidateQueueRef.current[targetSocketId];
    setRemotePeers((prev) => {
      const updated = { ...prev };
      delete updated[targetSocketId];
      return updated;
    });
  };

  // Step 1: Initialize local user camera & mic media stream BEFORE socket connection
  useEffect(() => {
    let activeStream = null;

    async function initMedia() {
      try {
        let stream = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true
            });
          } catch (hardwareErr) {
            console.warn('Hardware camera unavailable (busy or denied), fallback to synthetic video stream:', hardwareErr);
            // Fallback for 2 browser tabs on same PC where hardware webcam is locked by tab 1
            stream = createSyntheticMediaStream(currentUser?.name || 'User');
          }

          mediaStreamRef.current = stream;
          activeStream = stream;

          if (stream) {
            // Default audio & video to OFF upon joining room as requested
            stream.getAudioTracks().forEach((track) => (track.enabled = false));
            stream.getVideoTracks().forEach((track) => (track.enabled = false));
          }

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Webcam/Mic stream initialization warning:', err);
      } finally {
        setMediaReady(true);
      }
    }

    initMedia();

    return () => {
      if (activeStream) {
        if (activeStream.canvasIntervalId) {
          clearInterval(activeStream.canvasIntervalId);
        }
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentUser?.name]);

  // Step 2: Initialize Socket.io connection & WebRTC Signaling AFTER media is ready
  useEffect(() => {
    if (!mediaReady) return;

    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (!meetingCode) return;

    const socket = getSocket();
    socketRef.current = socket;

    const emitJoinRoom = () => {
      socket.emit('join-room', {
        meetingId: meetingCode,
        userId: currentUser?._id,
        userName: currentUser?.name || 'Participant'
      });
    };

    if (socket.connected) {
      emitJoinRoom();
    } else {
      socket.connect();
    }

    socket.on('connect', emitJoinRoom);
    socket.on('reconnect', emitJoinRoom);

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
        await processCandidateQueue(callerSocketId, pc);

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
          await processCandidateQueue(responderSocketId, pc);
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    // Handle ICE Candidate with Queueing
    socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
      const pc = peerConnectionsRef.current[senderSocketId];
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        if (!iceCandidateQueueRef.current[senderSocketId]) {
          iceCandidateQueueRef.current[senderSocketId] = [];
        }
        iceCandidateQueueRef.current[senderSocketId].push(candidate);
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
      socket.off('connect', emitJoinRoom);
      socket.off('reconnect', emitJoinRoom);
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
      iceCandidateQueueRef.current = {};
    };
  }, [mediaReady, meeting?.meetingId, liveMeetingData?.meetingId, currentUser?._id, currentUser?.name]);

  // Periodic HTTP Polling for Chat & Database Sync
  useEffect(() => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    if (!meetingCode) return;

    const fetchLatestState = () => {
      fetchApi(`/meetings/${meetingCode}`)
        .then((res) => {
          if (res.data) {
            const latestMessages = res.data.inMeetingMessages || [];
            const latestMessage = latestMessages[latestMessages.length - 1];
            const latestMessageKey = latestMessage
              ? String(latestMessage._id || `${latestMessage.sentAt}-${latestMessage.message}`)
              : null;

            if (
              latestMessageKey &&
              lastChatMessageRef.current &&
              latestMessageKey !== lastChatMessageRef.current &&
              String(latestMessage.senderId) !== String(currentUser?._id)
            ) {
              setChatNotification(latestMessage);
              if (chatNotificationTimerRef.current) {
                clearTimeout(chatNotificationTimerRef.current);
              }
              chatNotificationTimerRef.current = setTimeout(() => setChatNotification(null), 5000);
            }

            lastChatMessageRef.current = latestMessageKey;
            setLiveMeetingData(res.data);
            setChatMessages(latestMessages);
          }
        })
        .catch(() => {});
    };

    fetchLatestState();
    const interval = setInterval(fetchLatestState, 3000);
    return () => clearInterval(interval);
  }, [meeting?.meetingId, currentUser?._id]);

  useEffect(() => () => {
    if (chatNotificationTimerRef.current) {
      clearTimeout(chatNotificationTimerRef.current);
    }
  }, []);

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

  // Direct Native Full Screen Sharing for Mobile & Desktop
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setToastNotification('Screen sharing is not supported on this browser version or context.');
        setTimeout(() => setToastNotification(null), 4000);
        return;
      }

      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        if (screenStream) {
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
        }
      } catch (err) {
        console.warn('Native screen share error or cancelled by user:', err);
        if (err.name !== 'NotAllowedError') {
          setToastNotification('Could not start screen share: ' + (err.message || 'Permission denied'));
          setTimeout(() => setToastNotification(null), 4000);
        }
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
      }).then((res) => {
        // Sync back real _id from server so edit/delete work on this message
        if (res.data?._id) {
          setChatMessages((prev) =>
            prev.map((m) =>
              m === item || (m.sentAt === item.sentAt && m.senderName === item.senderName)
                ? { ...m, _id: res.data._id }
                : m
            )
          );
        }
      }).catch(() => {});
    }
  };

  // Edit a chat message
  const handleEditMessage = async (msg) => {
    if (!editingText.trim() || editingText.trim() === msg.message) {
      setEditingMsgId(null);
      return;
    }
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    const msgId = msg._id;
    if (!meetingCode || !msgId) { setEditingMsgId(null); return; }

    const updated = editingText.trim();
    // Optimistic update
    setChatMessages((prev) =>
      prev.map((m) => (String(m._id) === String(msgId) ? { ...m, message: updated, editedAt: new Date() } : m))
    );
    setEditingMsgId(null);

    fetchApi(`/meetings/${meetingCode}/chat/${msgId}`, {
      method: 'PUT',
      body: JSON.stringify({ message: updated })
    }).catch(() => {});
  };

  // Delete a chat message
  const handleDeleteMessage = (msg) => {
    const meetingCode = liveMeetingData?.meetingId || meeting?.meetingId;
    const msgId = msg._id;
    if (!meetingCode || !msgId) return;

    // Optimistic removal
    setChatMessages((prev) => prev.filter((m) => String(m._id) !== String(msgId)));

    fetchApi(`/meetings/${meetingCode}/chat/${msgId}`, { method: 'DELETE' }).catch(() => {});
  };

  const remotePeerList = Object.values(remotePeers);
  const totalParticipantsCount = remotePeerList.length + 1; // Remote peers + Local user

  // ── Gallery: equal-sized grid, responsive columns based on participant count
  const galleryGridCols =
    totalParticipantsCount === 1
      ? 'grid-cols-1 max-w-2xl'
      : totalParticipantsCount === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : totalParticipantsCount <= 4
      ? 'grid-cols-2'
      : 'grid-cols-2 sm:grid-cols-3';

  // ── Compact: dense grid, smaller tiles
  const compactGridCols =
    totalParticipantsCount === 1
      ? 'grid-cols-1 max-w-sm'
      : totalParticipantsCount === 2
      ? 'grid-cols-2 max-w-xl'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-50 text-slate-900 flex flex-col overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100000] bg-[#20b875] text-white px-5 py-2.5 rounded-2xl shadow-2xl font-extrabold text-xs flex items-center gap-2.5 border border-emerald-300 animate-in fade-in slide-in-from-top-4 duration-300">
          <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>{toastNotification}</span>
        </div>
      )}
      {chatNotification && (
        <div
          className="fixed bottom-24 left-1/2 z-[100000] w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl border border-emerald-200/60 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden"
          style={{ animation: 'slideUpFadeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          <style>{`
            @keyframes slideUpFadeIn {
              from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.95); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1);    }
            }
            @keyframes shrinkBar {
              from { width: 100%; }
              to   { width: 0%; }
            }
          `}</style>

          {/* Progress bar — shrinks over 5 s to signal auto-dismiss */}
          <div
            className="h-0.5 bg-[#20b875] origin-left"
            style={{ animation: 'shrinkBar 5s linear forwards' }}
          />

          <div className="px-4 py-3 flex items-start gap-3">
            {/* Sender avatar */}
            <div className="shrink-0 w-9 h-9 rounded-full bg-[#20b875] text-white font-black text-sm flex items-center justify-center shadow-md">
              {(chatNotification.senderName || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Text content — clicking opens chat sidebar */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                setSidebarOpen(true);
                setChatNotification(null);
              }}
              className="flex-1 text-left min-w-0 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#20b875]">Meeting Chat</span>
                <span className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse"></span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{chatNotification.senderName}</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{chatNotification.message}</p>
            </button>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => setChatNotification(null)}
              className="shrink-0 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer mt-0.5"
              aria-label="Dismiss notification"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#20b875] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-[#20b875]/20 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate max-w-[110px] xs:max-w-[170px] sm:max-w-md">
              {liveMeetingData?.title || 'Live Video Conference'}
            </h1>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span> LIVE
            </span>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002-2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{copiedLink ? 'Copied' : 'Link'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setActiveTab('chat');
            }}
            className={`w-9 h-9 rounded-full border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
              sidebarOpen && activeTab === 'chat'
                ? 'bg-[#20b875] text-white border-[#20b875] shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="In-Meeting Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setActiveTab('people');
            }}
            className={`px-2.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sidebarOpen && activeTab === 'people'
                ? 'bg-[#20b875] text-white border-[#20b875] shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="Participants List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>({totalParticipantsCount})</span>
          </button>
        </div>
      </header>

      {/* Main Video Call View Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar flex flex-col justify-start sm:justify-center items-center">

          {/* ═══════════════════════════════════════════════
              PINNED FULL SCREEN VIEW — Individual System Stage
          ════════════════════════════════════════════════ */}
          {pinnedPeerId ? (
            (() => {
              const isLocalPinned = pinnedPeerId === 'local';
              const pinnedPeerObj = isLocalPinned ? null : remotePeers[pinnedPeerId];
              const pinnedName = isLocalPinned ? (currentUser?.name || 'You') : (pinnedPeerObj?.name || 'Participant');
              const isPinnedVideoOn = isLocalPinned ? videoOn : (pinnedPeerObj?.videoOn !== false);

              return (
                <div className="w-full max-w-6xl h-full flex-1 flex flex-col gap-3 relative" style={{ minHeight: 0 }}>
                  {/* Top Floating Pinned Banner */}
                  <div className="w-full bg-[#072b1e]/95 border border-[#20b875]/40 backdrop-blur-md px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl flex items-center justify-between shadow-xl z-20">
                    <div className="flex items-center gap-2 sm:gap-2.5 truncate">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                      </svg>
                      <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                        PINNED FULL SCREEN VIEW: <span className="text-emerald-300">{pinnedName}</span> <span className="text-[10px] text-gray-300 font-normal hidden sm:inline">(Viewing full screen on your device)</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinnedPeerId(null)}
                      className="bg-[#20b875] hover:bg-[#189960] text-white font-extrabold text-xs px-3 sm:px-4 py-1.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ml-2"
                    >
                      <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="hidden xs:inline">Exit Full Screen</span>
                    </button>
                  </div>

                  {/* Main Expanded Video Stage */}
                  <div className="flex-1 relative bg-[#09233d] border-2 border-[#20b875] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[45vh] group">
                    {isLocalPinned ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover transform ${
                          screenSharing ? 'scale-100' : '-scale-x-100'
                        } ${videoOn ? 'block' : 'hidden'}`}
                      />
                    ) : (
                      <video
                        ref={(el) => {
                          if (el && pinnedPeerObj?.stream) {
                            if (el.srcObject !== pinnedPeerObj.stream) {
                              el.srcObject = pinnedPeerObj.stream;
                            }
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        className={`absolute inset-0 w-full h-full object-cover ${
                          isPinnedVideoOn ? 'block' : 'hidden'
                        }`}
                      />
                    )}

                    {/* Camera Off Avatar Overlay */}
                    {!isPinnedVideoOn && (
                      <div className="flex flex-col items-center gap-3 z-10">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#20b875] text-white font-black text-2xl sm:text-4xl flex items-center justify-center ring-4 ring-[#4ade80]/30 shadow-xl">
                          {pinnedName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-emerald-200">Camera Off</span>
                      </div>
                    )}

                    {/* Footer Name Badge */}
                    <div className="absolute bottom-3 left-3 z-20 bg-[#072b1e]/90 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#166046] flex items-center gap-2 shadow-lg max-w-[85%]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shrink-0"></span>
                      <span className="text-xs font-black text-white truncate">
                        {pinnedName} {isLocalPinned ? '(You)' : ''}
                      </span>
                    </div>

                    {/* Unpin Overlay Button on Hover */}
                    <button
                      type="button"
                      onClick={() => setPinnedPeerId(null)}
                      className="absolute inset-0 m-auto w-max h-max opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#072b1e]/95 hover:bg-[#20b875] text-white px-4 py-2.5 rounded-full text-xs font-black shadow-2xl border border-emerald-400/50 flex items-center gap-2 backdrop-blur-md cursor-pointer z-30 transform hover:scale-105 active:scale-95"
                    >
                      <svg className="w-4 h-4 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                      </svg>
                      <span>Unpin from Entire Screen</span>
                    </button>
                  </div>

                  {/* Bottom Horizontal Carousel for Remaining Participants */}
                  <div className="w-full flex gap-3 overflow-x-auto custom-scrollbar py-1 shrink-0">
                    {!isLocalPinned && (
                      <div
                        onClick={() => setPinnedPeerId('local')}
                        className="w-32 h-20 shrink-0 cursor-pointer rounded-xl overflow-hidden border border-emerald-500/40 relative bg-[#09233d] hover:border-emerald-400 transition-all shadow-md group"
                        title="Click to pin your video"
                      >
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover transform ${screenSharing ? 'scale-100' : '-scale-x-100'}`}
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">You</span>
                      </div>
                    )}
                    {remotePeerList
                      .filter((p) => p.socketId !== pinnedPeerId)
                      .map((peer) => (
                        <div
                          key={peer.socketId}
                          onClick={() => setPinnedPeerId(peer.socketId)}
                          className="w-32 h-20 shrink-0 cursor-pointer rounded-xl overflow-hidden border border-slate-700 relative bg-[#09233d] hover:border-emerald-400 transition-all shadow-md group"
                          title={`Click to pin ${peer.name}`}
                        >
                          <RemoteVideoTile peer={peer} layout="compact" isFeatured={false} onPin={() => setPinnedPeerId(peer.socketId)} isPinned={false} />
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()
          ) : layout === 'focus' && totalParticipantsCount > 1 ? (
            <div className="w-full max-w-6xl flex gap-3 sm:gap-4 h-full" style={{ minHeight: 0 }}>
              {/* Featured / Speaker Tile — Local User */}
              <div className="flex-1 relative bg-[#09233d] border-2 border-[#20b875] rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group" style={{ aspectRatio: '16/9', minHeight: 200 }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform ${
                    screenSharing ? 'scale-100' : '-scale-x-100'
                  } ${videoOn ? 'block' : 'hidden'}`}
                />
                {!videoOn && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-[#20b875] text-white font-black text-3xl flex items-center justify-center ring-4 ring-[#4ade80]/30 shadow-lg">
                      {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-emerald-200">Camera Off</span>
                  </div>
                )}
                {/* Pin Hover Overlay for Local User */}
                <button
                  type="button"
                  onClick={() => setPinnedPeerId(pinnedPeerId === 'local' ? null : 'local')}
                  className="absolute inset-0 m-auto w-max h-max opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#072b1e]/95 hover:bg-[#20b875] text-white px-3.5 py-2 rounded-full text-xs font-black shadow-2xl border border-emerald-400/50 flex items-center gap-2 backdrop-blur-md cursor-pointer z-30 transform hover:scale-105 active:scale-95"
                  title="Pin your video to entire screen"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                  </svg>
                  <span>Pin to Entire Screen</span>
                </button>
                {/* Featured badge */}
                <span className="absolute top-3 left-3 z-20 bg-[#20b875] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> FEATURED
                </span>
                <div className="absolute bottom-3 left-3 bg-[#072b1e]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#166046] flex items-center gap-2 max-w-[88%] shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80] shrink-0"></span>
                  <span className="text-xs font-extrabold text-white truncate">
                    {currentUser?.name || 'You'} (You) {screenSharing ? '[Sharing]' : ''}
                  </span>
                  {handRaised && (
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
                    </svg>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-[#072b1e]/90 backdrop-blur-md p-2 rounded-xl border border-[#166046] shadow-md">
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

              {/* Thumbnail Sidebar — Remote Peers */}
              <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto custom-scrollbar shrink-0" style={{ width: '22%', minWidth: 120, maxWidth: 200 }}>
                {remotePeerList.map((peer) => (
                  <div key={peer.socketId} className="shrink-0" style={{ aspectRatio: '4/3' }}>
                    <RemoteVideoTile peer={peer} layout="focus-thumbnail" isFeatured={false} onPin={() => setPinnedPeerId(peer.socketId)} isPinned={pinnedPeerId === peer.socketId} />
                  </div>
                ))}
              </div>
            </div>
          ) : layout === 'compact' ? (
            <div className={`w-full max-w-6xl grid gap-2 ${compactGridCols}`}>
              {/* LOCAL USER — Compact Tile */}
              <div className="relative bg-[#09233d] border border-[#20b875] rounded-xl overflow-hidden aspect-video shadow-lg flex items-center justify-center group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform ${
                    screenSharing ? 'scale-100' : '-scale-x-100'
                  } ${videoOn ? 'block' : 'hidden'}`}
                />
                {!videoOn && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-[#20b875] text-white font-black text-sm flex items-center justify-center">
                      {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Pin Hover Overlay for Local User */}
                <button
                  type="button"
                  onClick={() => setPinnedPeerId(pinnedPeerId === 'local' ? null : 'local')}
                  className="absolute inset-0 m-auto w-max h-max opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#072b1e]/95 hover:bg-[#20b875] text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-2xl border border-emerald-400/50 flex items-center gap-1 backdrop-blur-md cursor-pointer z-30"
                  title="Pin your video to entire screen"
                >
                  <svg className="w-3 h-3 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                  </svg>
                  <span>Pin Screen</span>
                </button>
                <div className="absolute bottom-1.5 left-1.5 bg-[#072b1e]/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-[#166046] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0"></span>
                  <span className="text-[10px] font-extrabold text-white truncate max-w-[80px]">
                    {currentUser?.name || 'You'}
                  </span>
                </div>
                <div className="absolute top-1.5 right-1.5 bg-[#072b1e]/90 backdrop-blur-md p-1 rounded-lg border border-[#166046]">
                  {micOn ? (
                    <svg className="w-3 h-3 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* REMOTE PEERS — Compact Tiles */}
              {remotePeerList.map((peer) => (
                <RemoteVideoTile key={peer.socketId} peer={peer} layout="compact" isFeatured={false} onPin={() => setPinnedPeerId(peer.socketId)} isPinned={pinnedPeerId === peer.socketId} />
              ))}

              {/* Invite card — only if alone */}
              {totalParticipantsCount === 1 && (
                <div
                  onClick={handleCopyLink}
                  className="relative bg-white border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl overflow-hidden aspect-video shadow-md flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all hover:bg-emerald-50"
                >
                  <svg className="w-5 h-5 text-emerald-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-[10px] font-black text-slate-700">{copiedLink ? 'Copied!' : 'Invite'}</span>
                </div>
              )}
            </div>

          ) : (
            <div className={`w-full ${totalParticipantsCount === 1 ? 'max-w-6xl h-full flex-1 flex flex-col justify-center items-center relative' : 'max-w-5xl grid gap-3 sm:gap-4 ' + galleryGridCols}`}>
              {/* LOCAL USER VIDEO TILE */}
              <div className={`relative bg-[#09233d] border-2 border-[#20b875] rounded-xl sm:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group ${totalParticipantsCount === 1 ? 'w-full h-full max-h-[80vh] min-h-[60vh]' : 'aspect-video'}`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transform ${
                    screenSharing ? 'scale-100' : '-scale-x-100'
                  } ${videoOn ? 'block' : 'hidden'}`}
                />

                {!videoOn && (
                  <div className="flex flex-col items-center gap-1 sm:gap-3 p-2">
                    <div className="w-12 h-12 sm:w-28 sm:h-28 rounded-full bg-[#20b875] text-white font-black text-sm sm:text-4xl flex items-center justify-center ring-2 sm:ring-4 ring-[#4ade80]/30 shadow-lg">
                      {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] sm:text-sm font-semibold text-emerald-200">Camera Off</span>
                  </div>
                )}

                {/* Pin Hover Overlay for Local User */}
                <button
                  type="button"
                  onClick={() => setPinnedPeerId(pinnedPeerId === 'local' ? null : 'local')}
                  className="absolute inset-0 m-auto w-max h-max opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#072b1e]/95 hover:bg-[#20b875] text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black shadow-2xl border border-emerald-400/50 flex items-center gap-1.5 backdrop-blur-md cursor-pointer z-30 transform hover:scale-105 active:scale-95"
                  title="Pin your video to entire screen"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z" />
                  </svg>
                  <span>Pin to Entire Screen</span>
                </button>

                {/* Local Participant Info */}
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 bg-[#072b1e]/90 backdrop-blur-md px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-full border border-[#166046] flex items-center gap-1 sm:gap-2 max-w-[85%] shadow-md">
                  <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#4ade80] shrink-0"></span>
                  <span className="text-[10px] sm:text-xs font-extrabold text-white truncate">
                    {currentUser?.name || 'You'} (You) {screenSharing ? '[Sharing]' : ''}
                  </span>
                  {handRaised && (
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
                    </svg>
                  )}
                </div>

                {/* Local Mic Status */}
                <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 bg-[#072b1e]/90 backdrop-blur-md p-1 sm:p-2 rounded-md sm:rounded-xl border border-[#166046] shadow-md">
                  {micOn ? (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* REMOTE PEERS WEBRTC LIVE VIDEO TILES */}
              {remotePeerList.map((peer) => (
                <RemoteVideoTile key={peer.socketId} peer={peer} layout="gallery" isFeatured={false} onPin={() => setPinnedPeerId(peer.socketId)} isPinned={pinnedPeerId === peer.socketId} />
              ))}

              {/* Quick Copy Link Banner if only 1 participant */}
              {totalParticipantsCount === 1 && (
                <div
                  onClick={handleCopyLink}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-emerald-300 hover:border-emerald-500 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <span className="w-2 h-2 rounded-full bg-[#20b875] animate-pulse"></span>
                  <span className="text-xs font-black text-slate-800">
                    {copiedLink ? 'Link Copied to Clipboard!' : 'Click to Copy Meeting Room Link'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel: In-Meeting Chat & Participants */}
        {sidebarOpen && (
          <>
            {/* Mobile backdrop — tap to close */}
            <div
              className="fixed inset-0 z-[110] bg-black/60 sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          <aside className="fixed top-0 left-0 w-screen h-dvh z-[120] sm:static sm:z-auto sm:w-80 sm:h-auto bg-white sm:border-l border-slate-200 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'chat' ? 'bg-[#20b875] text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Meeting Chat
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('people')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'people' ? 'bg-[#20b875] text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  People ({totalParticipantsCount})
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-3 pb-2 min-h-0">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs font-medium">
                      No messages yet. Send a message to start meeting chat!
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isOwn = String(msg.senderId) === String(currentUser?._id) ||
                        msg.senderName === (currentUser?.name || 'You');
                      const isEditing = editingMsgId && String(msg._id) === String(editingMsgId);

                      return (
                        <div
                          key={msg._id || idx}
                          className={`group relative rounded-2xl border transition-all ${
                            isOwn
                              ? 'bg-emerald-50 border-emerald-200/80 ml-4'
                              : 'bg-slate-50 border-slate-200 mr-4'
                          }`}
                        >
                          {/* Message header: sender + time */}
                          <div className="flex items-center justify-between px-3 pt-2.5 pb-0.5">
                            <span className={`text-[11px] font-extrabold ${
                              isOwn ? 'text-emerald-700' : 'text-slate-600'
                            }`}>
                              {isOwn ? 'You' : msg.senderName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-gray-400 font-mono">
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {/* Edit & Delete buttons — own messages only */}
                              {isOwn && !isEditing && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 transition-opacity"
                                  style={{ opacity: window.innerWidth < 640 ? 1 : undefined }}
                                >
                                  {/* Edit button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMsgId(msg._id);
                                      setEditingText(msg.message);
                                    }}
                                    className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Edit message"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg)}
                                    className="w-6 h-6 rounded-lg bg-white hover:bg-rose-100 border border-rose-200 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Delete message"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Message body or inline edit input */}
                          {isEditing ? (
                            <div className="px-3 pb-2.5 pt-1">
                              <input
                                type="text"
                                value={editingText}
                                autoFocus
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditMessage(msg);
                                  if (e.key === 'Escape') setEditingMsgId(null);
                                }}
                                className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditMessage(msg)}
                                  className="text-[10px] font-bold text-white bg-[#20b875] px-2.5 py-1 rounded-lg cursor-pointer hover:bg-[#189960]"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-slate-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="px-3 pb-2.5 pt-0.5">
                              <p className="text-xs text-slate-700 leading-relaxed">{msg.message}</p>
                              {msg.editedAt && (
                                <span className="text-[9px] text-slate-400 italic">edited</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="shrink-0 flex items-center gap-2 px-3.5 py-3 border-t border-slate-200 bg-white">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type meeting message..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#20b875]"
                  />
                  <button
                    type="submit"
                    className="bg-[#20b875] hover:bg-[#189960] text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
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
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#20b875] text-white font-bold text-xs flex items-center justify-center">
                          {(currentUser?.name || 'Y').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
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
                      <div key={p.socketId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                            {(p.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">{p.name}</span>
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
          </>
        )}
      </div>

      {/* Control Toolbar */}
      <footer className="relative bg-white border-t border-slate-200 px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-4 w-full shrink-0 shadow-lg">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLayoutMenuOpen((open) => !open)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
              layoutMenuOpen ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Choose meeting layout"
            aria-label="Choose meeting layout"
            aria-expanded={layoutMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
            </svg>
          </button>
          {layoutMenuOpen && (
            <div className="absolute bottom-12 sm:bottom-14 left-2 sm:left-0 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 pt-1 pb-1.5">Meeting Layout</p>
              {[
                {
                  value: 'gallery',
                  label: 'Gallery View',
                  desc: 'Equal tiles',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="8" height="8" rx="1" strokeWidth="2"/>
                      <rect x="13" y="3" width="8" height="8" rx="1" strokeWidth="2"/>
                      <rect x="3" y="13" width="8" height="8" rx="1" strokeWidth="2"/>
                      <rect x="13" y="13" width="8" height="8" rx="1" strokeWidth="2"/>
                    </svg>
                  )
                },
                {
                  value: 'focus',
                  label: 'Focus View',
                  desc: 'Featured speaker',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="14" height="18" rx="1" strokeWidth="2"/>
                      <rect x="19" y="3" width="2" height="4" rx="0.5" strokeWidth="2"/>
                      <rect x="19" y="10" width="2" height="4" rx="0.5" strokeWidth="2"/>
                      <rect x="19" y="17" width="2" height="4" rx="0.5" strokeWidth="2"/>
                    </svg>
                  )
                },
                {
                  value: 'compact',
                  label: 'Compact View',
                  desc: 'Dense grid',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="10" y="3" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="17" y="3" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="3" y="10" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="10" y="10" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="17" y="10" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="3" y="17" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="10" y="17" width="5" height="5" rx="0.5" strokeWidth="2"/>
                      <rect x="17" y="17" width="5" height="5" rx="0.5" strokeWidth="2"/>
                    </svg>
                  )
                }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLayout(option.value);
                    setLayoutMenuOpen(false);
                  }}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors flex items-center gap-2.5 ${
                    layout === option.value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={layout === option.value ? 'text-emerald-600' : 'text-slate-400'}>{option.icon}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{option.label}</div>
                    <div className="text-[9px] font-medium text-slate-400 leading-tight">{option.desc}</div>
                  </div>
                  {layout === option.value && (
                    <svg className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleMic}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
            micOn
              ? 'bg-slate-100 border-slate-200 text-emerald-600 hover:bg-slate-200'
              : 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
          }`}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
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
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={toggleCamera}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
            videoOn
              ? 'bg-slate-100 border-slate-200 text-emerald-600 hover:bg-slate-200'
              : 'bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600/30'
          }`}
          title={videoOn ? 'Stop Camera' : 'Start Camera'}
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
        </button>

        {/* Native Screen Share Button */}
        <button
          type="button"
          onClick={toggleScreenShare}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
            screenSharing
              ? 'bg-[#20b875] border-[#4ade80] text-white animate-pulse'
              : 'bg-slate-100 border-slate-200 text-emerald-600 hover:bg-slate-200'
          }`}
          title="Share Screen"
        >
          <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Raise Hand Button */}
        <button
          type="button"
          onClick={toggleHand}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer shrink-0 ${
            handRaised
              ? 'bg-amber-500 border-amber-400 text-white'
              : 'bg-slate-100 border-slate-200 text-amber-500 hover:bg-slate-200'
          }`}
          title="Raise Hand"
        >
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v5.5m0-5.5a1.5 1.5 0 013 0v6.5" />
          </svg>
        </button>

        {/* Leave Call Button */}
        <button
          type="button"
          onClick={handleLeaveCall}
          className="w-10 h-10 sm:w-auto bg-[#ff0055] hover:bg-[#e0004c] text-white font-extrabold text-xs px-0 sm:px-6 py-0 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-lg tracking-wider shrink-0 cursor-pointer"
          title={isHost ? 'End Meeting for Everyone' : 'Leave Meeting'}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2-2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
          </svg>
          <span className="uppercase font-black tracking-wider hidden sm:inline">{isHost ? 'END MEETING' : 'LEAVE CALL'}</span>
        </button>
      </footer>
    </div>,
    document.body
  );
}
