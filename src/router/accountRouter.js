const express = require('express');
const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');
const controller = require('../controller/accountController');
const router = express.Router();

router.post('/login', controller.checkRequiredField, controller.login)
router.post('/register', controller.checkRequiredField, controller.checkUserExists, controller.register);
router.put('/update', controller.authentication, controller.filterDataUpdate, controller.updateInfo);
router.put('/password', controller.authentication, controller.changePassword);
router.delete('/delete', controller.deleteAccount);
router.use(controller.handerError);

module.exports = router