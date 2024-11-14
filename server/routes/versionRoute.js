// /server/routes/versionRoute.js

const express = require('express');
const {
    requestCurrentVersionController,
    establishConnectionController,
    provideCurrentVersionController
} = require('../controllers/versionController');
const { collabAuthMiddleware } = require('../middlewares/collabAuthMiddleware');
const router = express.Router();

router.post('/version-controller/current-version', collabAuthMiddleware, requestCurrentVersionController);
router.post('/version-controller/provide/establish-connection', collabAuthMiddleware, establishConnectionController);
router.post('/version-controller/provide', collabAuthMiddleware, provideCurrentVersionController);

module.exports = router;
