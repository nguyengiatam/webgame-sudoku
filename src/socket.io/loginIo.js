const cookie = require('cookie');
const accountModel = require('../model/accountModel');
const jwt = require('jsonwebtoken');

module.exports = (socket) => {
    socket.on('login', login);

    async function login(){
        try {
            const cookieUser = cookie.parse(socket.handshake.headers.cookie);
            const token = cookieUser.token;
            const { _id } = jwt.verify(token, '@qbkzm98!');
            if (!_id) {
                return socket.emit('token invalid');
            }
            const account = await accountModel.findById(_id);
            console.log(account.online);
            if (account.online) {
                return socket.emit('account-online');
            }
            socket.emit('login-success');
        } catch (error) {
            console.log(error);
        }
    }
}