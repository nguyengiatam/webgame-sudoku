require('dotenv').config({ path: `${__dirname}/../.env` });
const express = require('express');

const jwt = require('jsonwebtoken');
const accountRouter = require('./router/accountRouter');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const settingRouter = require('./router/settingRouter');

const PORT = process.env.PORT || 4000;
const app = express();
const server = require("http").Server(app);
const socket = require('./socket.io/socket.io');
socket.attach(server);

app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use(express.static('./public'));

app.get('/', checkLogin, (req, res) => {
    res.redirect('/login')
});

app.get('/room', authentication, (req, res) => {
    res.sendFile(`${__dirname}/views/room.html`);
})

app.get('/login', function (req, res) {
    res.sendFile(`${__dirname}/views/loginRegister.html`);
})

app.use('/account', accountRouter);

app.get('/index', authentication, (req, res, next) => {
    res.sendFile(`${__dirname}/views/index.html`);
})

app.get('/play', authentication, (req, res, next) => {
    res.sendFile(`${__dirname}/views/play.html`);
})

app.get('/logout', (req, res, next) => {
    res.cookie('token', '', {maxAge: -1});
    res.status(200).send();
})

app.use('/setting', authentication, settingRouter);

function authentication(req, res, next) {
    try {
        const token = req.cookies.token;
        const {_id} = jwt.verify(token , process.env.SECRET_KEY_JWT);
        if (_id) {
            req.accountId = _id;
            return next();
        }
        throw new Error('token false');
    } catch (error) {
        res.redirect('/login');
    }
}

function checkLogin(req, res, next) {
    try {
        const token = req.cookies.token;
        if(!token){
            return res.redirect('/login');
        }
        const {_id} = jwt.verify(token , process.env.SECRET_KEY_JWT);
        if (_id) {
            return res.redirect('/index');
        }
        next();
    } catch (error) {
        res.redirect('/login');
    }
}

server.listen(PORT, () => {
    console.log(`Server is runing in PORT ${PORT} `);
})
