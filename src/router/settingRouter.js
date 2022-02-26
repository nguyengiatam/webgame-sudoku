const express = require('express');
const accountModel = require('../model/accountModel');
const template = require('../template/template');
const router = express.Router();

router.get('/general', async (req, res, next) => {
    try {
        const account = await accountModel.findById(req.accountId);
        if(!account){
            return res.status(404).json('not found');
        }
        let generalTemplate = template.generalSetting;
        generalTemplate = generalTemplate.replace(/%ID%/, account.id);
        generalTemplate = generalTemplate.replace(/%AVATAR%/, account.avatar);
        generalTemplate = generalTemplate.replace(/%USERNAME%/, account.username);
        generalTemplate = generalTemplate.replace(/%NICKNAME%/, account.nickName);
        generalTemplate = generalTemplate.replace(/%EMAIL%/, account.email);
        res.status(200).json(generalTemplate);
    } catch (error) {
        res.status(500).json();
        console.log(error);
    }
})

module.exports = router;