const roomModel = require('../model/roomModel');
const accountModel = require('../model/accountModel');
const icon = require('./iconPath')

module.exports = (io, socket, accountOnline, indexIo, roomIo) => {
    const roomId = socket.handshake.query.id;
    let redirectRoom = false;
    socket.join(roomId);

    socket.on('get-data', getData);
    socket.on('new-value-correct', newValueCorrect);
    socket.on('new-value-incorrect', newValueIncorrect);
    socket.on('request-room-redirect', requestRoomRedirect)
    socket.on('disconnect', playerDisconnect);

    async function getData() {
        try {
            const room = await roomModel.findById(roomId).populate('host').populate('member');
            const gameData = JSON.parse(room.gameData.answer);
            const quizzes = JSON.parse(room.gameData.easy);
            const accountList = getListDataAccount([room.host, ...room.member]);
            const leaderBoard = room.leaderBoard;
            const myId = socket.account.id;
            socket.emit('game-data-room', { gameData, quizzes, leaderBoard, accountList, myId });
        } catch (error) {
            console.log(error);
        }
    }

    function getListDataAccount(listAccount) {
        let result = [];
        for (const account of listAccount) {
            result.push({
                id: account.id,
                nickName: account.nickName,
                avatar: account.avatar
            })
        }
        return result;
    }

    async function newValueCorrect() {
        try {
            const room = await roomModel.findById(roomId);
            for (const account of room.leaderBoard) {
                if (account.id == socket.account.id) {
                    account.point++;
                    room.leaderBoard.sort((a, b) => Number(b.point) - Number(a.point));
                    io.to(roomId).emit('update-leaderBoard', room.leaderBoard);
                    if (account.point == 45) {
                        gameOver(room);
                        socket.account.win++;
                        socket.emit('you-win');
                        accountModel.findByIdAndUpdate(socket.account.id, socket.account, logError);
                        socket.to(roomId).emit('you-lose');
                    }
                    break;
                }
            }
            roomModel.findByIdAndUpdate(roomId, room, logError);
        } catch (error) {
            console.log(error);
        }
    }

    async function newValueIncorrect() {
        try {
            const room = await roomModel.findById(roomId);
            for (const account of room.leaderBoard) {
                if (account.id == socket.account.id) {
                    account.error++;
                    if (account.error >= 3) {
                        socket.emit('you-lose');
                        socket.to(roomId).emit('player-lose', socket.account.id);
                        playerLose(room);
                    }
                    break;
                }
            }
            roomModel.findByIdAndUpdate(roomId, room, logError);
            io.to(roomId).emit('input-incorrect-value', socket.account.id);
        } catch (error) {
            console.log(error);
        }
    }

    function gameOver(room) {
        room.playing = false;
        room.imgStatus = icon.WAITING;
        room.leaderBoard = [];
        room.play = [];
        indexIo.emit('game-over', roomId)
    }

    function playerLose(room) {
        try {
            let idList = socket.adapter.rooms.get(roomId);
            idList.delete(socket.id);
            socket.adapter.rooms.set(roomId, idList);
            room.play = room.play.filter(playerId => playerId != socket.account.id);
            if (room.play.length <= 1 && room.playing) {
                accountModel.findById(room.play[0], (err, accountWin) => {
                    if(err){
                        console.log(err);
                    }
                    accountWin.win++;
                    accountModel.findByIdAndUpdate(accountWin.id, accountWin, logError);
                });
                socket.to(roomId).emit('you-win');
                gameOver(room);
            }
        } catch (error) {
            console.log(error);
        }
    }

    function logError(err) {
        if (err) {
            console.log(err);
        }
    }

    async function playerDisconnect() {
        try {
            const room = await roomModel.findById(roomId).populate('host').populate('member');
            if (!redirectRoom) {
                playerNotRedirectRoom(room);
            }
            if(room.playing){
                playerLose(room);
                socket.to(roomId).emit('player-lose', socket.account.id);
            }
            roomModel.findByIdAndUpdate(roomId, room, logError);
            const index = accountOnline.findIndex(id => id == socket.account.id);
            accountOnline.splice(index, 1);
        } catch (error) {
            console.log(error);
        }
    }

    function playerNotRedirectRoom(room) {
        room.numberPlayer--;
        if (room.numberPlayer <= 0) {
            roomModel.findByIdAndDelete(roomId, logError);
            indexIo.emit('delete-room', roomId);
            return;
        }
        if (room.host.id == socket.account.id) {
            room.host = room.member.shift();
            roomIo.to(roomId).emit('host-leave-room', room.host.id);
        } else {
            room.member = room.member.filter(player => player.id != socket.account.id);
            roomIo.to(roomId).emit('member-leave-room', socket.account.id);
        }
        indexIo.emit('leave-room-success', room);
    }

    function requestRoomRedirect(){
        redirectRoom = true;
        socket.emit('can-redirect', roomId)
    }
}