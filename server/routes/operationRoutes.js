// /server/routes/collabRoutes.js
const express = require('express');
const { logOperation, getOperationsForCollab } = require('../controllers/operationController');
const { collabAuthMiddleware } = require('../middlewares/collabAuthMiddleware');
const router = express.Router();

router.post('/log', collabAuthMiddleware, logOperation);
router.post('/get', collabAuthMiddleware, getOperationsForCollab);

module.exports = router;
