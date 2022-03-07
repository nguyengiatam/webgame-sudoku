const model = require('../model/accountModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const sharp = require('sharp');
const S3 = require('../config/aws.config');


const register = async (req, res, next) => {
    try {
        req.body.avatar = `img/avatar/${Math.floor(Math.random() * 12) + 1}.png`;
        const result = await model.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error)
    }
}

const login = async (req, res, next) => {
    try {
        const account = await model.findOne({ username: req.body.username });
        let result;
        if (account) {
            result = await bcrypt.compare(req.body.password, account.password);
        }
        if (!result) {
            return next({ status: 400, message: 'Username or password incorrect' });
        }
        const token = jwt.sign({ _id: account._id }, '@qbkzm98!');
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json();
    } catch (error) {
        next(error)
    }
}

const changePassword = async (req, res, next) => {
    try {
        const account = await model.findById(req.accountId);
        let result;
        if (account) {
            result = await bcrypt.compare(req.body.oldPassword, account.password);
        }
        if (!result) {
            return next({ status: 400, message: 'password incorrect' });
        }
        const password = await bcrypt.hash(req.body.newPassword, 10);
        await model.findByIdAndUpdate(req.accountId, { password });
        res.status(200).json();
    } catch (error) {
        next(error)
    }
}

const getAccountByToken = async token => {
    try {
        const { _id } = jwt.verify(token, '@qbkzm98!');
        const account = await model.findById(_id).populate('friends');
        return account;
    } catch (error) {
        throw new Error(error);
    }
}

const getAccount = async (req, res, next) => {
    try {
        const account = await model.findById(req.accountId);
        if (account) {
            req.account = account;
            return next();
        }
        next({ status: 404, message: 'Account does not exist' });
    } catch (error) {
        next(error);
    }
}

const checkUserExists = async (req, res, next) => {
    try {
        const user = await model.findOne({ username: req.body.username });
        if (user) {
            next({ status: 400, message: 'Username already exists' });
        } else {
            next();
        }
    } catch (error) {
        next(error)
    }
}

const updateInfo = async (req, res, next) => {
    try {
        const result = await model.findByIdAndUpdate(req.accountId, req.dataUpdate);
        if (result) {
            res.status(200).json();
        }
    } catch (error) {
        next(error)
    }
}

const getAvatarList = async (req, res, next) => {
    res.status(200).json(req.account.avatarList);
}

const changeAvatar = async (req, res, next) => {
    try {
        const pathSplit = req.body.newAvatar.split('/');
        pathSplit.splice(0, 3);
        let avatar = '';
        avatar = pathSplit[0] == 'avatar' ? pathSplit.join('/') : req.body.newAvatar;
        await model.findByIdAndUpdate(req.accountId, { avatar });
        res.status(200).json(avatar);
    } catch (error) {
        next(error);
    }
}

const uploadAvatar = async (req, res, next) => {
    try {
        const originBufferData = Buffer.from(req.body.data, 'binary');
        const fileName = `${Date.now()}.webp`;
        const compressedBufferData = await sharp(originBufferData).resize(200, 200).webp().toBuffer();
        const params = {
            Bucket: 'webgame-sudoku',
            Key: `${req.accountId}/${fileName}`,
            Body: compressedBufferData,
            ContentType: 'image/webp'
        }
        S3.upload(params, async (s3err, data) => {
            if (s3err) {
                return console.log(s3err);
            }
            await model.findByIdAndUpdate(req.accountId, { $push: { avatarList: [data.Location] } });
            res.status(201).json(data.Location);
        });
    } catch (error) {
        next(error);
    }
}

const deleteAccount = async (req, res, next) => {
    try {
        const result = await model.findByIdAndDelete({ _id: req.body._id });
        res.status(204).json(result);
    } catch (error) {
        next(error)
    }
}

const handerError = (err, req, res, next) => {
    console.log(err);
    const codeStatus = err.status || 500;
    res.status(codeStatus).json(err.message);
}

const filterDataUpdate = (req, res, next) => {
    const dataUpdate = {};
    for (const key in req.body) {
        if (key != 'username' && key != 'id' && key != '_id') {
            dataUpdate[key] = req.body[key];
        }
    }
    req.dataUpdate = dataUpdate;
    next();
}

const checkRequiredField = (req, res, next) => {
    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
        next({ status: 400, message: 'Missing required information' });
    } else {
        next();
    }
}


function authentication(req, res, next) {
    try {
        const token = req.cookies.token;
        const { _id } = jwt.verify(token, '@qbkzm98!');
        if (_id) {
            req.accountId = _id;
            return next();
        }
        throw new Error('token false');
    } catch (error) {
        res.redirect('/login');
    }
}

module.exports = {
    register,
    login,
    checkUserExists,
    updateInfo,
    deleteAccount,
    filterDataUpdate,
    checkRequiredField,
    handerError,
    getAccountByToken,
    authentication,
    changePassword,
    getAvatarList,
    getAccount,
    changeAvatar,
    uploadAvatar
}
