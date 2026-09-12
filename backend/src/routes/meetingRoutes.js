const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/:meetingId', getMeetingById);
router.post('/:meetingId/join', joinMeeting);
router.post('/:meetingId/leave', leaveMeeting);
router.post('/:meetingId/end', endMeeting);
router.post('/:meetingId/chat', sendInMeetingMessage);
router.put('/:meetingId/chat/:msgId', editInMeetingMessage);
router.delete('/:meetingId/chat/:msgId', deleteInMeetingMessage);
router.delete('/:meetingId', deleteMeeting);

module.exports = router;
