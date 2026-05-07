const express = require('express');
const router = express.Router();
const multer = require('multer');
const { register, uploadScreenshot, getMyRegistrations, getMeetupRegistrations, updateStatus } = require('../controllers/registrationController');
const { auth, adminOnly } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', auth, register);
router.post('/:id/screenshot', auth, upload.single('screenshot'), uploadScreenshot);
router.get('/my', auth, getMyRegistrations);
router.get('/meetup/:meetup_id', getMeetupRegistrations);
router.patch('/:id/status', auth, adminOnly, updateStatus);

module.exports = router;
