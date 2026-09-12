const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const teamRoutes = require('./routes/teamRoutes');
const projectRoutes = require('./routes/projectRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dailyPlanRoutes = require('./routes/dailyPlanRoutes');
const timeRoutes = require('./routes/timeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const chatRoutes = require('./routes/chatRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io Server for WebRTC Signaling & Real-Time Meetings
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

// Track meeting rooms and connected peer sockets
// roomUsers map: meetingId -> Map(socketId -> { socketId, userId, userName, micOn, videoOn, handRaised })
const roomUsersMap = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Register User for Single Session Invalidation & Account Notifications
  socket.on('register-user', ({ userId }) => {
    if (userId) {
      socket.userId = userId;
      socket.join(`user:${userId.toString()}`);
      console.log(`[Socket.io] User ${userId} registered to single-session channel: user:${userId}`);
    }
  });

  // Join Video Meeting Room
  socket.on('join-room', ({ meetingId, userId, userName }) => {
    if (!meetingId) return;

    socket.join(meetingId);
    socket.meetingId = meetingId;
    socket.userId = userId;
    socket.userName = userName;

    if (!roomUsersMap.has(meetingId)) {
      roomUsersMap.set(meetingId, new Map());
    }
    const roomUsers = roomUsersMap.get(meetingId);

    // Get list of existing users in the room before adding current socket
    const existingPeers = Array.from(roomUsers.values()).map(u => ({
      socketId: u.socketId,
      userId: u.userId,
      userName: u.userName,
      micOn: u.micOn ?? true,
      videoOn: u.videoOn ?? true,
      handRaised: u.handRaised ?? false
    }));

    // Add current user to room Map
    const userObj = {
      socketId: socket.id,
      userId,
      userName,
      micOn: true,
      videoOn: true,
      handRaised: false
    };
    roomUsers.set(socket.id, userObj);

    // Send list of existing users to the newly joined peer
    socket.emit('all-users', existingPeers);

    // Notify all other users in the room that a new peer joined
    socket.to(meetingId).emit('user-joined', userObj);

    console.log(`[Socket.io] User ${userName} (${socket.id}) joined room: ${meetingId}. Total in room: ${roomUsers.size}`);
  });

  // WebRTC Signaling: Offer
  socket.on('offer', ({ targetSocketId, offer, callerSocketId, callerName }) => {
    io.to(targetSocketId).emit('offer', {
      offer,
      callerSocketId: callerSocketId || socket.id,
      callerName: callerName || socket.userName
    });
  });

  // WebRTC Signaling: Answer
  socket.on('answer', ({ targetSocketId, answer, responderSocketId }) => {
    io.to(targetSocketId).emit('answer', {
      answer,
      responderSocketId: responderSocketId || socket.id
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice-candidate', ({ targetSocketId, candidate, senderSocketId }) => {
    io.to(targetSocketId).emit('ice-candidate', {
      candidate,
      senderSocketId: senderSocketId || socket.id
    });
  });

  // Media State Toggles
  socket.on('toggle-audio', ({ meetingId, micOn }) => {
    const room = roomUsersMap.get(meetingId);
    if (room && room.has(socket.id)) {
      room.get(socket.id).micOn = micOn;
    }
    socket.to(meetingId).emit('user-toggled-audio', { socketId: socket.id, micOn });
  });

  socket.on('toggle-video', ({ meetingId, videoOn }) => {
    const room = roomUsersMap.get(meetingId);
    if (room && room.has(socket.id)) {
      room.get(socket.id).videoOn = videoOn;
    }
    socket.to(meetingId).emit('user-toggled-video', { socketId: socket.id, videoOn });
  });

  socket.on('toggle-hand', ({ meetingId, handRaised }) => {
    const room = roomUsersMap.get(meetingId);
    if (room && room.has(socket.id)) {
      room.get(socket.id).handRaised = handRaised;
    }
    socket.to(meetingId).emit('user-toggled-hand', { socketId: socket.id, handRaised });
  });

  // Handle Disconnect & Leaving
  const handleLeaveRoom = () => {
    const meetingId = socket.meetingId;
    if (meetingId && roomUsersMap.has(meetingId)) {
      const room = roomUsersMap.get(meetingId);
      room.delete(socket.id);
      if (room.size === 0) {
        roomUsersMap.delete(meetingId);
      }
      socket.to(meetingId).emit('user-left', { socketId: socket.id, userName: socket.userName });
      console.log(`[Socket.io] User ${socket.userName} (${socket.id}) left room: ${meetingId}`);
    }
  };

  // Handle Host Ending Meeting For Everyone
  socket.on('end-meeting', ({ meetingId }) => {
    const targetRoom = meetingId || socket.meetingId;
    if (targetRoom) {
      io.to(targetRoom).emit('meeting-ended-by-host', { meetingId: targetRoom });
      roomUsersMap.delete(targetRoom);
      console.log(`[Socket.io] Meeting ${targetRoom} ended by host`);
    }
  });

  socket.on('leave-room', handleLeaveRoom);
  socket.on('disconnect', handleLeaveRoom);
});

// Security Middleware
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Database
connectDB();

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PydahSoft Backend API is online',
    system: 'Employee Project, Task & Performance Management System',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily-plans', dailyPlanRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/meetings', meetingRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.originalUrl}` }
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: { message: err.message || 'Internal Server Error' }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[PydahSoft Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

