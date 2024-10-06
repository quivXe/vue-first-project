// /server/routes/collabRoutes.js
const express = require('express');
const { logOperation, getOperationsForCollab } = require('../controllers/operationController');
const router = express.Router();

router.post('/log', logOperation);
router.post('/get', getOperationsForCollab);

module.exports = router;
