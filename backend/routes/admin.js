const express = require('express');
const router = express.Router();
const { getAllUsers, resetUserPassword, getSettings, updateSettings } = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/users', auth, adminOnly, getAllUsers);
router.post('/users/:id/reset-password', auth, adminOnly, resetUserPassword);
router.get('/settings', auth, adminOnly, getSettings);
router.put('/settings', auth, adminOnly, updateSettings);

module.exports = router;
