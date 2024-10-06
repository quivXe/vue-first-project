// /server/routes/collabRoutes.js
const express = require('express');
const { createCollaboration, joinCollaboration } = require('../controllers/collaborationController');
const router = express.Router();

router.post('/create', createCollaboration);
router.post('/join', joinCollaboration);

module.exports = router;
