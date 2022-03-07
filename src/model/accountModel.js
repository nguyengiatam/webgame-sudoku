const db = require('../config/dbCloud.config');
const bcrypt = require('bcrypt');

const Schema = db.Schema;

const account = new Schema({
    username: String,
    password: String,
    nickName: String,
    email: String,
    notifications: Array,
    online: Boolean,
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
    avatarList: {
        type: Array,
        default: ['img/avatar/1.png','img/avatar/2.png','img/avatar/3.png','img/avatar/4.png','img/avatar/5.png','img/avatar/6.png','img/avatar/7.png','img/avatar/8.png','img/avatar/9.png','img/avatar/10.png','img/avatar/11.png','img/avatar/12.png']
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
});

const accountModel = db.model('account', account);

module.exports = accountModel