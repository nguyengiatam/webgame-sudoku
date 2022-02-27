const express = require('express');
const settingController = require('../controller/settingController');

const router = express.Router();

router.get('/general', settingController.getGeneral);
router.get('/password', settingController.changePassword);

module.exports = router;