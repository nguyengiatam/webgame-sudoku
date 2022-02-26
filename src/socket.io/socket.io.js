const { Server } = require('socket.io');
const cookie = require('cookie');
const { getGameData } = require('../controller/gameController');
const fs = require('fs');
const { getAccountByToken } = require('../controller/accountController');
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
    createIndexIo(indexIo, socket, accountOnline, template);
}

const roomConnection = socket => {
    createRoomIo(roomIo, socket, indexIo, accountOnline, template, gameData);
}

const loginConnection = socket => {
    createLoginIo(socket, accountOnline);
}

const playConnection = socket => {
    createPlayIo(playIo, socket, accountOnline, indexIo, roomIo);
}

indexIo.use(authentication);
indexIo.use(checkAccountOnline);

roomIo.use(authentication);
roomIo.use(authorization);
roomIo.use(checkAccountOnline);

playIo.use(authentication);
playIo.use(authorization);
playIo.use(checkAccountOnline);

indexIo.on('connection', roomListConnection)
roomIo.on('connection', roomConnection)
loginIo.on('connection', loginConnection)
playIo.on('connection', playConnection);

async function authentication(socket, next) {
    try {
        const cookieUser = cookie.parse(socket.handshake.headers.cookie);
        const account = await getAccountByToken(cookieUser.token);
        if (account) {
            socket.account = account;
            return next();
        }
    } catch (error) {
        console.log(error);
    }
    next({ message: 'account-invalid' });
};

function checkAccountOnline(socket, next) {
    const online = accountOnline.find(id => id == socket.account.id);
    if (!online) {
        accountOnline.push(socket.account.id);
        return next();
    }
    next({ message: 'account-online' });
}

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

function clearAccountOnline(accountId){
    const index = accountOnline.findIndex(id => id == accountId);
    if(index){
        accountOnline.splice(index, 1);
    }
}

module.exports = io;