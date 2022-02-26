const db = require('../config/dbCloud.config');
const bcrypt = require('bcrypt');

const Schema = db.Schema;

const account = new Schema({
    username: String,
    password: String,
    nickName: String,
    email: String,
    friends: {
        type: Array,
        ref: 'account'
    },
    playing: {
        type: String,
        ref: 'room'
    },
    avatar: {
        type: String,
        default: `img/avatar/1.png`
    },
    rank: {
        type: String,
        default: 'Đồng'
    },
    totalGames: {
        type: Number,
        default: 0
    },
    win: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        default: "player"
    }
}, { collection: 'account' });

account.pre('save', function (next) {
    const user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    })
})

const accountModel = db.model('account', account);

module.exports = accountModel