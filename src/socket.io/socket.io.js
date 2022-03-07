const { Server } = require('socket.io');
const cookie = require('cookie');
const { getGameData } = require('../controller/gameController');
const { getAccountByToken } = require('../controller/accountController');
const accountModel = require('../model/accountModel')
const roomModel = require('../model/roomModel')
const createIndexIo = require('./indexIo');
const createRoomIo = require('./roomIo');
const createLoginIo = require('./loginIo');
const createPlayIo = require('./playIo')



const io = new Server();
const indexIo = io.of('/room-list');
const roomIo = io.of('/room');
const loginIo = io.of('/login');
const playIo = io.of('/play');

const template = require('../template/template');

let gameData;
getGameData().then(data => gameData = data).catch(err => console.log(err))
let accountOnline = [];

const roomListConnection = socket => {
    createIndexIo(indexIo, socket, template);
}

const roomConnection = socket => {
    createRoomIo(roomIo, socket, indexIo, template, gameData);
}

const loginConnection = socket => {
    createLoginIo(socket);
}

const playConnection = socket => {
    createPlayIo(playIo, socket, indexIo, roomIo);
}

indexIo.use(authentication);

roomIo.use(authentication);
roomIo.use(authorization);

playIo.use(authentication);
playIo.use(authorization);

indexIo.on('connection', roomListConnection)
roomIo.on('connection', roomConnection)
loginIo.on('connection', loginConnection)
playIo.on('connection', playConnection);

async function authentication(socket, next) {
    try {
        const cookieUser = cookie.parse(socket.handshake.headers.cookie);
        const account = await getAccountByToken(cookieUser.token);
        if (account) {
            if (!account.online) {
                socket.account = account;
                accountModel.findByIdAndUpdate(account.id, { online: true }, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                return next();
            }
            return next({ message: 'account-online' });
        }
    } catch (error) {
        console.log(error);
        next({ message: 'account-invalid' });
    }
};

async function authorization(socket, next) {
    try {
        const room = await roomModel.findById(socket.handshake.query.id);
        if (!room) {
            throw new Error();
        }
        const member = room.member.find(playerId => playerId == socket.account.id);
        if (socket.account.id == room.host || member) {
            return next();
        }
        throw new Error()
    } catch (error) {
        next({ message: 'not authorized' });
        console.log(error);
    }
}

module.exports = io;