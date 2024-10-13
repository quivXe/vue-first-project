// /server/routes/requestCurrentVersionRoute.js

const express = require('express');
const { requestCurrentVersionController } = require('../controllers/requestCurrentVersionController');
const { collabAuthMiddleware } = require('../middlewares/collabAuthMiddleware');
const router = express.Router();

router.post('/request-current', collabAuthMiddleware, requestCurrentVersionController);

module.exports = router;
