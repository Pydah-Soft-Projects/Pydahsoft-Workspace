const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Team = require('../models/Team');

const sendMessage = async (req, res) => {
  try {
    const { recipientType = 'all', recipientId, recipientName, teamId, teamName, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message content cannot be empty' }
      });
    }

    let resolvedRecipientName = recipientName;
    if (recipientType === 'individual' && recipientId && !resolvedRecipientName) {
      const recipientUser = await User.findById(recipientId).select('name username');
      if (recipientUser) {
        resolvedRecipientName = recipientUser.name || recipientUser.username;
      }
    }

    let resolvedTeamName = teamName;
    if (recipientType === 'team' && teamId && !resolvedTeamName) {
      const teamObj = await Team.findById(teamId).select('name');
      if (teamObj) resolvedTeamName = teamObj.name;
    }

    const newMessage = await ChatMessage.create({
      sender: req.user._id,
      senderName: req.user.name || req.user.username || 'Staff Member',
      senderRole: req.user.role || 'employee',
      recipientType: ['team', 'individual'].includes(recipientType) ? recipientType : 'all',
      recipientId: recipientType === 'individual' ? recipientId : undefined,
      recipientName: recipientType === 'individual' ? resolvedRecipientName : undefined,
      teamId: recipientType === 'team' ? teamId : undefined,
      teamName: recipientType === 'team' ? resolvedTeamName : undefined,
      message: message.trim()
    });

    return res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to send message' }
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find teams this user belongs to (or leads)
    const userTeams = await Team.find({
      $or: [{ members: userId }, { teamLead: userId }]
    }).select('_id');
    const userTeamIds = userTeams.map((t) => t._id);

    // Fetch broadcast messages ('all') + team messages ('team') + direct messages
    const filter = {
      $or: [
        { recipientType: 'all' },
        { recipientType: 'team', teamId: { $in: userTeamIds } },
        { recipientId: userId },
        { sender: userId }
      ]
    };

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(300);

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to retrieve messages' }
    });
  }
};

module.exports = {
  sendMessage,
  getMessages
};
