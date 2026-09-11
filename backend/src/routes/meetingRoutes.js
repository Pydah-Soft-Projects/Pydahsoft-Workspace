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
router.delete('/:meetingId', deleteMeeting);

module.exports = router;
