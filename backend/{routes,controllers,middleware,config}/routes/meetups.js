const express = require('express');
const router = express.Router();
const { getAllMeetups, getMeetup, createMeetup, updateMeetup, deleteMeetup, closeMeetup, reorderMeetups, exportAttendance } = require('../controllers/meetupController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', getAllMeetups);
router.get('/:id', getMeetup);
router.post('/', auth, adminOnly, createMeetup);
router.put('/reorder', auth, adminOnly, reorderMeetups);
router.put('/:id', auth, adminOnly, updateMeetup);
router.delete('/:id', auth, adminOnly, deleteMeetup);
router.patch('/:id/close', auth, adminOnly, closeMeetup);
router.get('/:id/export', auth, adminOnly, exportAttendance);

module.exports = router;
