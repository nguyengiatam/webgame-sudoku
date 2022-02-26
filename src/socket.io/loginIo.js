const cookie = require('cookie');
const jwt = require('jsonwebtoken');

module.exports = (socket, accountOnline) => {
    socket.on('login', async () => {
        const cookieUser = cookie.parse(socket.handshake.headers.cookie);
        const token = cookieUser.token;
        const {_id} = jwt.verify(token , '@qbkzm98!');
        if (!_id) {
            return socket.emit('token invalid');
        }
        const index = accountOnline.find(id => id == _id);
        if(index){
            return socket.emit('account-online');
        }
        socket.emit('login-success');
    })
}