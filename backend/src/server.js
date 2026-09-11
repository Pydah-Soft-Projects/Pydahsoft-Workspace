const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate limiting (Disabled in development mode, 5000 requests in production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: {
    success: false,
    error: { message: 'Too many requests from this IP, please try again after 15 minutes' }
  }
});
app.use('/api', limiter);

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

app.listen(PORT, () => {
  console.log(`[PydahSoft Backend] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
