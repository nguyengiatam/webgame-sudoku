const roomModel = require('../model/roomModel');
const accountModel = require('../model/accountModel')
const icon = require('./iconPath');

module.exports = (io, socket, accountOnline, template) => {

    const fillInTheTemplate = room => {
        let roomItem = template.roomItem;
        roomItem = roomItem.replace(/%ROOM-ID%/g, room._id);
        roomItem = roomItem.replace(/%ROOM-NAME%/, room.name);
        roomItem = roomItem.replace(/%HOST%/, room.host.nickName);
        roomItem = roomItem.replace(/%MAX-PLAYER%/, room.maxPlayer);
        roomItem = roomItem.replace(/%IMG-LOCK%/, room.imgLock);
        roomItem = roomItem.replace(/%NUMBER-PLAYER%/, room.numberPlayer);
        roomItem = roomItem.replace(/%IMG-STATUS%/, room.imgStatus);
        if (room.password != '') {
            roomItem = roomItem.replace(/%STATUS%/, 'lock');
        } else {
            roomItem = roomItem.replace(/%STATUS%/, 'unlock');
        }
        return roomItem;
    }

    const findRoom = async roomId => {
        try {
            const room = await roomModel.findById(roomId).populate('host');
            return room
        } catch (error) {
            socket.emit('room-do-not-exists');
        }
    }

    const getRoomList = async () => {
        const roomElementList = []
        try {
            const roomDataList = await roomModel.find({}).populate('host');
            for (const room of roomDataList) {
                let roomItem = fillInTheTemplate(room)
                roomElementList.push(roomItem);
            }
            socket.emit('server-return-room-list', roomElementList);
        } catch (error) {
            console.log(error);
        }

    }

    const joinRoom = async (roomId) => {
        try {
            const room = await findRoom(roomId);
            if (room) {
                if (room.numberPlayer < room.maxPlayer) {
                    room.numberPlayer++;
                    room.member.push(socket.account.id);
                    roomModel.findByIdAndUpdate(roomId, room, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                    socket.emit('join-room-success', room);
                    io.emit('player-join-room', room)
                } else {
                    socket.emit('room-full');
                }
            }
        } catch (error) {
            console.log(error);
            socket.emit('server-error');
        }
    }

    const createRoom = async dataClient => {
        const roomData = {
            host: socket.account.id,
            name: dataClient.name,
            password: dataClient.password,
            member: [],
            playerReady: [],
            playing: false,
            numberPlayer: 1,
            maxPlayer: dataClient.maxPlayer,
            imgStatus: icon.WAITING
        };

        roomData.imgLock = roomData.password != '' ? icon.LOCK : icon.UNLOCK;

        try {
            const room = await roomModel.create(roomData);
            const roomFull = await findRoom(room.id);
            const roomItem = fillInTheTemplate(roomFull);
            socket.emit('create-room-success', room.id);
            io.emit('new-room-create', roomItem)
        } catch (error) {
            console.log(error);
        }
    }

    const playerDisconnect = () => {
        const index = accountOnline.findIndex(id => id == socket.account.id);
        accountOnline.splice(index, 1);
    }

    const checkPassword = async data => {
        try {
            const room = await findRoom(data.id);
            if (room) {
                if (room.password == data.password) {
                    socket.emit('correct-password', room.id);
                } else {
                    socket.emit('incorrect-password', room.id);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getMyInfor = async () => {
        try {
            const account = await accountModel.findById(socket.account.id);
            if (!account) {
                throw new Error();
            }
            const info = {
                id: account.id,
                nickName: account.nickName,
                avatar: account.avatar
            }
            socket.account = account;
            socket.emit('get-info-success', info);
        } catch (error) {
            console.log(error);
        }
    }

    socket.join(socket.account.id);
    socket.on('get-room-list', getRoomList);
    socket.on('join-room', joinRoom);
    socket.on('create-room', createRoom);
    socket.on('disconnect', playerDisconnect);
    socket.on('check-password', checkPassword);
    socket.on('get-my-info', getMyInfor);
}