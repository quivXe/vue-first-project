// /server/routes/pusherAuthRoute.js

const express = require('express');
const { channelAuth } = require('../controllers/pusherAuthController');
const router = express.Router();

router.post('/pusher/channel-auth', channelAuth);

module.exports = router;
