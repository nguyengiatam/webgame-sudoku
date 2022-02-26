const db = require('../config/dbCloud.config');

const roomSchema = new db.Schema({
    host: {
        type: String,
        ref: 'account'
    },
    name: String,
    password: String,
    member: {
        type: Array,
        ref: 'account'
    },
    playerReady: {
        type: Array,
        ref: 'account'
    },
    gameData:Object,
    leaderBoard: Array,
    play: Array,
    numberPlayer: Number,
    maxPlayer: Number,
    playing: Boolean,
    imgLock: String,
    imgStatus: String
}, {
    collection: 'room'
})

const roomModel = db.model('room', roomSchema);

module.exports = roomModel;