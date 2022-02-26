const socket = io('/room-list');
const roomListElement = document.querySelector('#room-list');
const myAccount = {};

socket.on('server-return-room-list', (data) => {
    for (const room of data) {
        pushRoom(room);
    }
})

socket.on('create-room-success', createSuccess);

socket.on('new-room-create', newRoomCreate);

socket.on('join-room-success', joinRoom);

socket.on('player-join-room', updateInfoRoom)

socket.on('leave-room-success', updateInfoRoom);

socket.on('delete-room', deleteRoom);

socket.on("connect_error", connectError);

socket.on('room-start-game', updateInfoRoom);

socket.on('correct-password', correctPassword);

socket.on('incorrect-password', incorrectPassword);

socket.on('room-full', roomFull);

socket.on('game-over', gameOver);

socket.on('get-info-success', printMyInfo)

socket.emit('get-room-list');

socket.emit('get-my-info');

document.querySelector('#btn-create-room').addEventListener('click', showDialogCreateRoom);

document.querySelector('#cancel-creating-room').addEventListener('click', closeDialogCreateRoom);

document.querySelector('#cancel-password-entry').addEventListener('click', closeDialogPasswordEntry);

document.querySelector('#cover-element').addEventListener('click', closeDialogCreateRoom);

document.querySelector('#cover-element').addEventListener('click', closeDialogPasswordEntry);

document.querySelector('#confirm-creating-room').addEventListener('click', createRoom);

document.querySelector('#confirm-password').addEventListener('click', checkPassword);

document.querySelector('#btn-logout').addEventListener('click', logout);

document.querySelector('#set-general').addEventListener('click', getGeneral);

document.querySelector('#close-popup').addEventListener('click', closePopup);

document.querySelector('#save-info').addEventListener('click', saveInfo);

function connectError() {
    window.location.replace('/login');
}

function roomFull() {
    alert('Phòng đã đầy');
}

function joinRoom(data) {
    window.location.replace(`/room?id=${data._id}`);
}

function printMyInfo(info) {
    console.log(info);
    document.querySelector('#my-avatar').src = info.avatar;
    document.querySelector('#my-nick-name').innerHTML = info.nickName;
    myAccount.id = info.id;
}

function updateInfoRoom(data) {
    const room = document.querySelector(`#room${data._id}`);
    room.querySelector('#number-player').innerHTML = `${data.numberPlayer}/${data.maxPlayer}`;
    room.querySelector('#host-name').innerHTML = data.host.nickName;
    room.querySelector('#playing-status').src = data.imgStatus;
}

function deleteRoom(id) {
    const room = document.querySelector(`#room${id}`);
    room.parentNode.removeChild(room);
}

function pushRoom(data) {
    roomListElement.innerHTML += data;
}

function gameOver(roomId) {
    const room = document.querySelector(`#room${roomId}`);
    room.querySelector('#playing-status').src = 'img/icon/waiting.png';
}

function showDialogCreateRoom() {
    document.querySelector('#dl-create-room').open = true;
    document.querySelector('#cover-element').style.display = 'block';
}

function closeDialogCreateRoom() {
    document.querySelector('#dl-create-room').open = false;
    document.querySelector('#cover-element').style.display = 'none';
}

function showDialogPasswordEntry(roomId) {
    console.log(document.querySelector('#confirm-password').dataset);
    document.querySelector('#confirm-password').dataset.id = roomId;
    document.querySelector('#dl-password-entry').open = true;
    document.querySelector('#cover-element').style.display = 'block';
}

function closeDialogPasswordEntry() {
    document.querySelector('#confirm-password').removeAttribute('data-id');
    console.log(document.querySelector('#confirm-password').dataset);
    document.querySelector('#dl-password-entry').open = false;
    document.querySelector('#cover-element').style.display = 'none';
}

function createRoom() {
    const regexRoomName = /.{3,50}/;
    const name = document.querySelector('#room-name').value;
    const password = document.querySelector('#room-pass').value;
    const maxPlayer = document.querySelector('#set-max-player').value;
    if (!regexRoomName.test(name)) {
        return outMessage('#msg-create-room', 'Tên phòng có độ dài từ 3 đến 50 ký tự');
    }
    socket.emit('create-room', { name, password, maxPlayer });
}

function createSuccess(roomId) {
    document.querySelector('#room-name').value = '';
    document.querySelector('#room-pass').value = '';
    window.location.replace(`/room?id=${roomId}`);
}

function newRoomCreate(roomItem) {
    pushRoom(roomItem);
}

function outMessage(selector, ...messageList) {
    const element = document.querySelector(selector);
    const ul = document.createElement('ul');
    for (const msg of messageList) {
        const li = document.createElement('li');
        li.innerText = msg;
        ul.appendChild(li);
    }
    element.innerHTML = '';
    element.appendChild(ul);
}

function checkPasswordEntry(id) {
    const room = document.querySelector(`#room${id}`);
    if (room.querySelector('#lock-status').dataset.status == 'lock') {
        showDialogPasswordEntry(id);
    } else {
        checkRoom(id);
    }
}

function incorrectPassword() {
    outMessage('#msg-password-entry', 'Mật khẩu không đúng')
    document.querySelector('#password-entry').value = '';
}

function correctPassword(id) {
    console.log('correct');
    closeDialogPasswordEntry();
    checkRoom(id)
}

function checkPassword() {
    const id = this.dataset.id;
    const password = document.querySelector('#password-entry').value;
    socket.emit('check-password', { password, id });
}

function checkRoom(id) {
    socket.emit('join-room', id)
}

async function logout() {
    const res = await fetch('/logout');
    if (res.status == 200) {
        window.location.replace('/login');
    }
}

async function getGeneral() {
    const popup = document.querySelector('#popup-setting');
    popup.style.opacity = '1';
    popup.style.top = '0vw';
    popup.querySelector('.title-popup').innerHTML = this.querySelector('.text-selection').innerHTML;
    setTimeout(function () {
        getTemplateSetting('/setting/general', popup.querySelector('.body-popup'), addEventBtnGeneral)
    }, 600);

}

function closePopup() {
    const popup = document.querySelector('#popup-setting');
    popup.style.top = '-53vw';
    popup.style.opacity = '0';
}

async function getTemplateSetting(api, parentNode, callback) {
    const res = await fetch(api);
    const elementSetting = await res.json();
    parentNode.innerHTML = elementSetting;
    callback();
}

async function saveInfo() {
    const newValue = inputValidation();
    if (!newValue) {
        return;
    }
    const request = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newValue)
    }

    const res = await fetch('/account/update', request);
    if (res.status == 200) {
        alert('Thay đổi thông tin thành công');
        socket.emit('get-my-info');
    }
    closePopup()
}

function inputValidation() {
    const regexEmail = /^[A-Za-z0-9._]+@[A-Za-z0-9._]+.\w+$/;
    const regexNickName = /.{6,20}/;
    const nickName = document.querySelector('#account-nick-name').value;
    const email = document.querySelector('#account-email').value;
    if (!regexEmail.test(email)) {
        return alert('Email không hợp lệ');
    } else if (!regexNickName.test(nickName)) {
        return alert('Tên người dùng không hợp lệ');
    }
    return {
        nickName,
        email
    }
}

function addEventBtnGeneral() {
    const btnEditList = document.querySelectorAll('.btn-edit-value');
    for (const btn of btnEditList) {
        btn.addEventListener('click', function () {
            if (this.innerHTML == 'Chỉnh sửa') {
                this.parentNode.querySelector('.value-account-info').style.borderBottom = 'rgb(165, 165, 165) solid 1px';
                this.parentNode.querySelector('.value-account-info').disabled = false;
                this.innerHTML = 'Xác nhận';
            } else {
                this.parentNode.querySelector('.value-account-info').style.borderBottom = 'none';
                this.parentNode.querySelector('.value-account-info').disabled = true;
                this.innerHTML = 'Chỉnh sửa';
            }
        })
    }
}