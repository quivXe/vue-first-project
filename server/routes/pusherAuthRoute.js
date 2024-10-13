// /server/routes/pusherAuthRoute.js

const express = require('express');
const { channelAuth } = require('../controllers/pusherAuthController');
const { collabAuthMiddleware } = require('../middlewares/collabAuthMiddleware');
const router = express.Router();

router.post('/pusher/channel-auth', collabAuthMiddleware, channelAuth);

module.exports = router;
