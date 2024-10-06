// /server/routes/collabRoutes.js
const express = require('express');
const { createCollaboration, joinCollaboration } = require('../controllers/collaborationController');
const router = express.Router();
const createRateLimiter = require("../middlewares/rateLimiter");

const joinCollaborationLimiter = createRateLimiter(5 * 60 * 1000, 10);

router.post('/create', createCollaboration);
router.post('/join', joinCollaborationLimiter, joinCollaboration);

module.exports = router;
