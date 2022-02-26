const socket = io(window.location.href);

socket.on('new-player-join', outPlayerItem);
socket.on('join-success', outAllPlayerItem);
socket.on('member-leave-room', memberLeaveRoom);
socket.on('host-leave-room', hostLeaveRoom);
socket.on('new-chat-content', printChat);
socket.on('player-ready', playerReady);
socket.on('player-cancel-ready', playerCancelReady);
socket.on("connect_error", connectError);
socket.on("all-players-not-ready", allPlayersNotReady);
socket.on("start-game", startGame);

socket.emit('get-all-item');


document.querySelector('#send-chat').addEventListener('click', sendChat)
document.addEventListener('keyup', (event) => {
    if (event.key == 'Enter') {
        sendChat();
    }
})

document.querySelector('#leave-room').addEventListener('click', () => {
    window.location.href = '/index';
})

document.querySelector('#play-game').addEventListener('click', function (event) {
    switch (this.innerHTML) {
        case 'Bắt đầu':
            socket.emit('start-game');
            break;
        case 'Sẵn sàng':
            socket.emit('player-ready');
            event.target.innerHTML = 'Hủy sẵn sàng';
            break;
        case 'Hủy sẵn sàng':
            socket.emit('player-cancel-ready');
            event.target.innerHTML = 'Sẵn sàng';
            break;
    }
})

function connectError(error) {
    if (error.message == 'not authorized') {
        window.location.replace('/index');
    } else {
        window.location.replace('/login');
    }
}

function allPlayersNotReady() {
    alert('Tất cả người chơi chưa sẵn sàng');
}

function startGame(roomId) {
    window.location.replace(`/play?id=${roomId}`);
}

function outAllPlayerItem(data) {
    for (const playerItem of data.playerList) {
        if (playerItem.role == 'host') {
            document.querySelector('.host').innerHTML = playerItem.item;
        } else {
            const memberElementList = document.querySelectorAll('.member');
            for (const element of memberElementList) {
                if (element.innerHTML == '') {
                    element.innerHTML = playerItem.item;
                    element.dataset.id = playerItem.id;
                    if (data.playerReadyList.find(id => id == playerItem.id)) {
                        element.querySelector('.img-ready').style.display = 'inline';
                    }
                    break;
                }
            }
        }
    }
    if (document.querySelector('.host').querySelector('#name').classList.contains('my-card')) {
        document.querySelector('#play-game').innerHTML = 'Bắt đầu';
    } else {
        document.querySelector('#play-game').innerHTML = 'Sẵn sàng';
    }
}

function outPlayerItem(data) {
    const memberElementList = document.querySelectorAll('.member');
    for (const element of memberElementList) {
        if (element.dataset.id == data.id) {
            break;
        }
        if (element.innerHTML == '') {
            element.innerHTML = data.item;
            element.dataset.id = data.id;
            break;
        }
    }
}

function memberLeaveRoom(playerId) {
    const memberElementList = document.querySelectorAll('.member');
    for (const element of memberElementList) {
        if (element.dataset.id == playerId) {
            element.innerHTML = '';
            element.dataset.id = '';
        }
    }
}

function hostLeaveRoom(playerId) {
    const memberElementList = document.querySelectorAll('.member');
    for (const element of memberElementList) {
        if (element.dataset.id == playerId) {
            element.querySelector('.img-ready').style.display = 'none';
            if(element.querySelector('#name').classList.contains('my-card')){
                document.querySelector('#play-game').innerHTML = 'Bắt đầu';
            }
            document.querySelector('.host').innerHTML = element.innerHTML;
            element.innerHTML = '';
            element.dataset.id = '';
            break;
        }
    }
}

function sendChat() {
    let inputChat = document.querySelector('#input-chat');
    if (inputChat.value == '') {
        return;
    }
    let content = inputChat.value.replace(/</g, '&#60;');
    content = content.replace(/>/g, '&#62;');
    console.log(content);
    socket.emit('new-chat-content', content);
    inputChat.value = '';
}

function printChat(element) {
    const contentArea = document.querySelector('.content-area');
    contentArea.innerHTML = element + contentArea.innerHTML;
}

function playerReady(playerId) {
    const memberElementList = document.querySelectorAll('.member');
    for (const element of memberElementList) {
        if (element.dataset.id == playerId) {
            element.querySelector('.img-ready').style.display = 'inline';
        }
    }
}

function playerCancelReady(playerId) {
    const memberElementList = document.querySelectorAll('.member');
    for (const element of memberElementList) {
        if (element.dataset.id == playerId) {
            element.querySelector('.img-ready').style.display = 'none';
        }
    }
}