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
    const meetingLink = `${origin}/#/meetings/${meetingId}`;

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
      .limit(100);

    // Auto-expire meetings from previous days or older than 1 hour
    const now = new Date();
    const todayStr = now.toDateString();
    const staleIds = [];

    for (const m of meetings) {
      const createdDate = new Date(m.createdAt || m.scheduledAt || now);
      const isPreviousDay = createdDate.toDateString() !== todayStr && createdDate < now;
      const createdAgeMs = now - createdDate;

      if (m.status === 'active') {
        // Instant/Active meeting from a previous day OR created more than 1 hour ago -> auto end
        if (isPreviousDay || createdAgeMs > 60 * 60 * 1000) {
          staleIds.push(m._id);
          m.status = 'ended';
          m.activeParticipants = [];
        }
      }

      if (m.status === 'scheduled') {
        const scheduledDate = m.scheduledAt ? new Date(m.scheduledAt) : createdDate;
        const schedAgeMs = now - scheduledDate;
        // Scheduled meeting from previous day or scheduled > 1 hour ago -> auto end
        if (isPreviousDay || schedAgeMs > 60 * 60 * 1000) {
          staleIds.push(m._id);
          m.status = 'ended';
          m.activeParticipants = [];
        }
      }
    }

    if (staleIds.length > 0) {
      await Meeting.updateMany(
        { _id: { $in: staleIds } },
        { $set: { status: 'ended', activeParticipants: [] } }
      );
    }

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
    const meeting = await Meeting.findOne({ meetingId });

    // If meeting does not exist at all, return 404 — do NOT auto-create
    // (prevents old/ended meeting IDs from silently opening a fresh room)
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found. The link may be invalid or expired.' }
      });
    }

    // Block access to ended meetings
    if (meeting.status === 'ended') {
      return res.status(410).json({
        success: false,
        error: { message: 'This meeting has ended and can no longer be joined.' }
      });
    }

    // Auto-expire meetings from previous days or created more than 1 hour ago
    const now = new Date();
    const createdDate = new Date(meeting.createdAt || meeting.scheduledAt || now);
    const isPreviousDay = createdDate.toDateString() !== now.toDateString() && createdDate < now;
    const ageMs = now - createdDate;

    if (isPreviousDay || ageMs > 60 * 60 * 1000) {
      meeting.status = 'ended';
      meeting.activeParticipants = [];
      await meeting.save();
      return res.status(410).json({
        success: false,
        error: { message: 'This meeting session has expired and is no longer active.' }
      });
    }

    // Ensure currentUser is registered in activeParticipants
    const currentUser = req.user;
    const isAlreadyActive = meeting.activeParticipants.some(
      (p) => String(p.userId) === String(currentUser._id) || (p.name || '').toLowerCase() === (currentUser.name || '').toLowerCase()
    );
    if (!isAlreadyActive) {
      meeting.activeParticipants.push({
        userId: currentUser._id,
        name: currentUser.name,
        joinedAt: new Date()
      });
      if (meeting.status === 'scheduled') {
        meeting.status = 'active';
      }
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
        error: { message: 'Meeting not found. The link may be invalid or expired.' }
      });
    }

    if (meeting.status === 'ended') {
      return res.status(410).json({
        success: false,
        error: { message: 'This meeting has already ended and cannot be rejoined.' }
      });
    }

    // Auto-expire meetings from previous days or created more than 1 hour ago
    const now = new Date();
    const createdDate = new Date(meeting.createdAt || meeting.scheduledAt || now);
    const isPreviousDay = createdDate.toDateString() !== now.toDateString() && createdDate < now;
    const ageMs = now - createdDate;

    if (isPreviousDay || ageMs > 60 * 60 * 1000) {
      meeting.status = 'ended';
      meeting.activeParticipants = [];
      await meeting.save();
      return res.status(410).json({
        success: false,
        error: { message: 'This meeting session has expired and is no longer active.' }
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

    // Return the saved message with its _id
    const saved = meeting.inMeetingMessages[meeting.inMeetingMessages.length - 1];
    res.status(200).json({
      success: true,
      data: saved
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to post message' }
    });
  }
};

// Edit an in-meeting chat message (only the sender can edit)
const editInMeetingMessage = async (req, res) => {
  try {
    const { meetingId, msgId } = req.params;
    const { message } = req.body;
    const currentUser = req.user;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    const msg = meeting.inMeetingMessages.id(msgId);
    if (!msg) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    if (String(msg.senderId) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only edit your own messages' }
      });
    }

    msg.message = message.trim();
    msg.editedAt = new Date();
    await meeting.save();

    res.status(200).json({
      success: true,
      data: msg
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to edit message' }
    });
  }
};

// Delete an in-meeting chat message (only the sender can delete)
const deleteInMeetingMessage = async (req, res) => {
  try {
    const { meetingId, msgId } = req.params;
    const currentUser = req.user;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    const msg = meeting.inMeetingMessages.id(msgId);
    if (!msg) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    if (String(msg.senderId) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only delete your own messages' }
      });
    }

    meeting.inMeetingMessages.pull({ _id: msgId });
    await meeting.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to delete message' }
    });
  }
};

// Leave meeting (remove participant from activeParticipants)
const leaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const currentUser = req.user;

    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      meeting.activeParticipants = (meeting.activeParticipants || []).filter(
        (p) => String(p.userId) !== String(currentUser._id) && (p.name || '').toLowerCase() !== (currentUser.name || '').toLowerCase()
      );
      if (String(meeting.host) === String(currentUser._id) || meeting.activeParticipants.length === 0) {
        meeting.status = 'ended';
        meeting.activeParticipants = [];
      }
      await meeting.save();
    }

    res.status(200).json({
      success: true,
      message: 'Left meeting successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error leaving meeting' }
    });
  }
};

// Delete meeting completely
const deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findOneAndDelete({
      $or: [{ meetingId }, { _id: meetingId.match(/^[0-9a-fA-F]{24}$/) ? meetingId : null }]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { message: 'Meeting not found' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error deleting meeting' }
    });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  sendInMeetingMessage,
  editInMeetingMessage,
  deleteInMeetingMessage,
  deleteMeeting
};
