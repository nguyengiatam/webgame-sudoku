const fs = require('fs');
module.exports = {
    roomItem: fs.readFileSync(`${__dirname}/../template/room-item.html`, 'utf-8'),
    playerRoom: fs.readFileSync(`${__dirname}/../template/player-item-room.html`, 'utf-8'),
    chatByMe: fs.readFileSync(`${__dirname}/../template/chat-by-me.html`, 'utf-8'),
    chatByPlayer: fs.readFileSync(`${__dirname}/../template/chat-by-player.html`, 'utf-8'),
    playerPlay: fs.readFileSync(`${__dirname}/../template/player-item-play.html`, 'utf-8'),
    generalSetting: fs.readFileSync(`${__dirname}/../template/general.html`, 'utf-8'),
    changePassword: fs.readFileSync(`${__dirname}/../template/change-password.html`, 'utf-8')
}