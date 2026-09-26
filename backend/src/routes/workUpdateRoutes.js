const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitWorkUpdate,
  getWorkUpdates,
  getGroupedWorkUpdates,
  verifyWorkUpdate,
  deleteWorkUpdate
} = require('../controllers/workUpdateController');

// All routes protected by JWT auth
router.use(protect);

router.post('/', submitWorkUpdate);
router.get('/', getWorkUpdates);
router.get('/grouped', getGroupedWorkUpdates);
router.put('/:id/verify', verifyWorkUpdate);
router.delete('/:id', deleteWorkUpdate);

module.exports = router;
