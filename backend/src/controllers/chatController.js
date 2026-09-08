const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  try {
    const { recipientType = 'all', recipientId, recipientName, message } = req.body;

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

    const newMessage = await ChatMessage.create({
      sender: req.user._id,
      senderName: req.user.name || req.user.username || 'Staff Member',
      senderRole: req.user.role || 'employee',
      recipientType: recipientType === 'individual' ? 'individual' : 'all',
      recipientId: recipientType === 'individual' ? recipientId : undefined,
      recipientName: recipientType === 'individual' ? resolvedRecipientName : undefined,
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

    // Fetch broadcast messages ('all') + direct messages sent to or sent by the logged-in user
    const filter = {
      $or: [
        { recipientType: 'all' },
        { recipientId: userId },
        { sender: userId }
      ]
    };

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(200);

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
