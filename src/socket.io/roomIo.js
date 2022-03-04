const roomModel = require('../model/roomModel');
const accountModel = require('../model/accountModel');
const icon = require('./iconPath');

module.exports = (io, socket, indexIo, accountOnline, template, gameDataList) => {
    const roomId = socket.handshake.query.id;

    const logError = error => {
        if (error) {
            console.log(error);
        }
    }

    const fillInTheTemplate = (account, tag) => {
        let playerItem = template.playerRoom;
        playerItem = playerItem.replace(/%TAG%/, tag);
        playerItem = playerItem.replace(/%AVATAR%/, account.avatar);
        playerItem = playerItem.replace(/%NAME%/, account.nickName);
        playerItem = playerItem.replace(/%RANK%/, account.rank);
        playerItem = playerItem.replace(/%WIN%/, account.win);
        return playerItem
    }

    const deleteRoom = async id => {
        try {
            await roomModel.findByIdAndDelete(id);
            indexIo.emit('delete-room', id);
        } catch (error) {
            socket.emit('server-error');
        }
    }

    const getAllPlayerItem = async () => {
        try {
            const room = await roomModel.findById(roomId).populate('host').populate('member');
            const playerReadyList = room.playerReady;
            let playerList = [];
            let itemHost = socket.account.id == room.host.id ? fillInTheTemplate(room.host, 'my-card') : fillInTheTemplate(room.host, 'player-card');
            playerList.push({ item: itemHost, id: room.host.id, role: 'host' });
            for (const member of room.member) {
                let itemMember = socket.account.id == member.id ? fillInTheTemplate(member, 'my-card') : fillInTheTemplate(member, 'player-card');
                playerList.push({ item: itemMember, id: member.id, role: 'member' });
            }
            socket.emit('join-success', { playerList, playerReadyList });
            if(room.host.id != socket.account.id){
                socket.to(roomId).emit('new-player-join', await getPlayerItem(socket.account.id, 'member', 'player-card'));
            }
        } catch (error) {
            console.log(error);
        }
    }

    const getPlayerItem = async (id, role, card) => {
        try {
            const account = await accountModel.findById(id);
            const item = fillInTheTemplate(account, card);
            return {
                item,
                id,
                role
            }
        } catch (error) {
            console.log(error);
        }
    }

    const playerLeaveRoom = async (key, room) => {
        try {
            if (key == 'host') {
                room.host = room.member.shift();
            } else {
                room.member = room.member.filter(id => id != socket.account.id);
                room.playerReady = room.playerReady.filter(id => id != socket.account.id);
            }
            roomModel.findByIdAndUpdate(roomId, room, logError);
            return room.host;
        } catch (error) {
            console.log(error);
        }
    }

    const leaveRoom = async () => {
        try {
            let room = await roomModel.findById(roomId);
            room.numberPlayer--;
            if (room.numberPlayer > 0) {
                if (socket.account.id == room.host) {
                    const playerId = await playerLeaveRoom('host', room);
                    io.to(roomId).emit('host-leave-room', playerId);
                } else {
                    await playerLeaveRoom('member', room);
                    io.to(roomId).emit('member-leave-room', socket.account.id);
                }
                room = await roomModel.findById(roomId).populate('host');
                indexIo.emit('leave-room-success', room);
            } else {
                deleteRoom(room.id);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const newChatContent = (content) => {
        let sendMe = template.chatByMe.replace(/%CONTENT%/, content);
        let sendPlayer = template.chatByPlayer.replace(/%CONTENT%/, content);
        sendPlayer = sendPlayer.replace(/%NICKNAME%/, socket.account.nickName);
        socket.emit('new-chat-content', sendMe);
        socket.to(roomId).emit('new-chat-content', sendPlayer);
    }

    const playerDisconnect = async () => {
        const index = accountOnline.findIndex(id => id == socket.account.id);
        accountOnline.splice(index, 1);
        const room = await roomModel.findById(roomId);
        if (!room.playing) {
            await leaveRoom();
        }
    }

    const playerReady = async () => {
        const room = await roomModel.findById(roomId);
        room.playerReady.push(socket.account.id);
        roomModel.findByIdAndUpdate(roomId, room, logError);
        io.to(roomId).emit('player-ready', socket.account.id);
    }

    const playerCancelReady = async () => {
        const room = await roomModel.findById(roomId);
        room.playerReady = room.playerReady.filter(id => id != socket.account.id);
        roomModel.findByIdAndUpdate(roomId, room, logError);
        io.to(roomId).emit('player-cancel-ready', socket.account.id);
    }

    const setLeaderBoard = (room) => {
        let result = [{ id: room.host, point: 0, error: 0 }];
        for (const member of room.member) {
            result.push({ id: member, point: 0, error: 0 });
        }
        return result;
    }

    const startGame = async () => {
        const room = await roomModel.findById(roomId).populate('host');
        if (room.playerReady.length == room.member.length && room.member.length != 0) {
            room.playing = true;
            room.imgStatus = icon.PLAYING;
            room.playerReady = [];
            room.gameData = gameDataList[Math.floor(Math.random() * gameDataList.length)];
            room.leaderBoard = setLeaderBoard(room);
            room.play = [room.host.id, ...room.member];
            roomModel.findByIdAndUpdate(roomId, room, (err) => {
                if (err) {
                    console.log(err, 'Lỗi update');
                }
            });
            io.to(roomId).emit('start-game', roomId)
            indexIo.emit('room-start-game', room);
        } else {
            socket.emit('all-players-not-ready');
        }
    }

    socket.join(roomId);
    socket.on('get-all-item', getAllPlayerItem);

    socket.on('disconnect', playerDisconnect)

    socket.on('new-chat-content', newChatContent)

    socket.on('player-ready', playerReady)

    socket.on('player-cancel-ready', playerCancelReady)

    socket.on('start-game', startGame)

}