const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Helper to generate readable meeting code e.g. meet-8f3b-9a1c
const generateMeetingId = () => {
  const part1 = Math.random().toString(36).substring(2, 6);
  const part2 = Math.random().toString(36).substring(2, 6);
  const part3 = Math.random().toString(36).substring(2, 6);
  return `meet-${part1}-${part2}-${part3}`;
};

// Create a new meeting (Instant or Scheduled)
const createMeeting = async (req, res) => {
  try {
    const { title, description, type, scheduledAt, invitedUserIds } = req.body;
    const currentUser = req.user;

    const meetingId = generateMeetingId();
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || process.env.FRONTEND_URL || 'http://localhost:5173';
    const meetingLink = `${origin}/meetings/${meetingId}`;

    let invitedUsers = [];
    if (invitedUserIds && Array.isArray(invitedUserIds) && invitedUserIds.length > 0) {
      const users = await User.find({ _id: { $in: invitedUserIds } }).select('name email username');
      invitedUsers = users.map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email || `${u.username}@pydahsoft.com`
      }));
    }

    const newMeeting = new Meeting({
      meetingId,
      title: title || (type === 'scheduled' ? 'Scheduled Team Conference' : `${currentUser.name}'s Meeting`),
      description: description || '',
      host: currentUser._id,
      hostName: currentUser.name,
      hostRole: currentUser.role || 'Team Member',
      meetingLink,
      type: type || 'instant',
      status: type === 'scheduled' ? 'scheduled' : 'active',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      invitedUsers,
      activeParticipants: [
        {
          userId: currentUser._id,
          name: currentUser.name,
          joinedAt: new Date()
        }
      ]
    });

    await newMeeting.save();

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: newMeeting
    });
  } catch (error) {
    console.error('[Create Meeting Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create meeting' }
    });
  }
};

// Get list of meetings (active, scheduled, past)
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({})
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: meetings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching meetings' }
    });
  }
};

// Get meeting details by meetingId
const getMeetingById = async (req, res) => {
  try {
    const { meetingId } = req.params;
    let meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      // If it's a dynamic instant room code, auto-create room on the fly
      const currentUser = req.user;
      meeting = new Meeting({
        meetingId,
        title: `Team Meeting (${meetingId})`,
        host: currentUser._id,
        hostName: currentUser.name,
        hostRole: currentUser.role || 'Member',
        meetingLink: `${req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || process.env.FRONTEND_URL || 'http://localhost:5173'}/meetings/${meetingId}`,
        status: 'active',
        activeParticipants: [
          {
            userId: currentUser._id,
            name: currentUser.name,
            joinedAt: new Date()
          }
        ]
      });
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error loading meeting details' }
    });
  }
};

// Join meeting
const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUser = req.user;

    let meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    // Check if user is already in active participants list
    const exists = meeting.activeParticipants.some(
      (p) => String(p.userId) === String(currentUser._id)
    );

    if (!exists) {
      meeting.activeParticipants.push({
        userId: currentUser._id,
        name: currentUser.name,
        joinedAt: new Date()
      });
    }

    if (meeting.status === 'scheduled') {
      meeting.status = 'active';
    }

    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Joined meeting successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error joining meeting' }
    });
  }
};

// End meeting
const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    meeting.status = 'ended';
    meeting.activeParticipants = [];
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Meeting ended',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error ending meeting' }
    });
  }
};

// Post in-meeting chat message
const sendInMeetingMessage = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { message } = req.body;
    const currentUser = req.user;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    const chatItem = {
      senderId: currentUser._id,
      senderName: currentUser.name,
      message,
      sentAt: new Date()
    };

    meeting.inMeetingMessages.push(chatItem);
    await meeting.save();

    res.status(200).json({
      success: true,
      data: chatItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to post message' }
    });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  joinMeeting,
  endMeeting,
  sendInMeetingMessage
};
