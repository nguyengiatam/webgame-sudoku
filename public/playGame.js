const socket = io(window.location.href);

let gameData;
let quizzes;

const playerTemplate = `<div class="player-item-play" id="player%ID%">
<img src="%AVATAR%" alt="" class="avatar-player-play">
<div class="info-player-play">
    <div class="name-player %CARD%">%NAME%</div>
    <div class="correct-values">
        <div class="background-correct-values">0</div>
        <div class="number-correct-values"></div>
    </div>
    <div class="incorrect-values">
    </div>
</div>
</div>`;

socket.emit('get-data');
socket.on('game-data-room', setGameData);
socket.on('update-leaderBoard', showLeaderBoard);
socket.on('input-incorrect-value', showInputIncorrect)
socket.on('you-lose', lose);
socket.on('you-win', win);
socket.on('player-lose', playerLose);
socket.on('can-redirect', redirectRoom);
socket.on("connect_error", connectError);



const listNumberBox = document.querySelectorAll('.col');
const numberList = document.querySelectorAll('.number-input');
const time = document.querySelector('#time');
let elementFolow;
let runTime;
let error = 0;
let minute = 0;
let second = 0;

function connectError(err){
    if(err.message == 'not authorized'){
        window.location.replace('/index');
    } else {
        window.location.replace('/login');
    }
}

function redirectRoom(roomId){
    window.location.replace(`/room?id=${roomId}`);
}

function setGameData(data) {
    gameData = data.gameData;
    quizzes = data.quizzes;
    document.querySelector('.leader-board').innerHTML = getItemList(data.accountList, data.myId).join('');
    showLeaderBoard(data.leaderBoard, data.myId);
    startNewGame();
}

function showLeaderBoard(leaderBoard, myId = '') {
    for (let i = 0; i < leaderBoard.length; i++) {
        const itemPlayer = document.querySelector(`#player${leaderBoard[i].id}`);
        itemPlayer.style.top = `${5 * i}vw`;
        const backgroundItem = itemPlayer.querySelector('.background-correct-values');
        if (leaderBoard[i].id == myId) {
            backgroundItem.style.backgroundColor = 'rgb(11, 180, 11)';
            backgroundItem.style.border = '1px solid rgb(11, 180, 11)';
        }
        backgroundItem.innerHTML = leaderBoard[i].point;
        backgroundItem.style.width = 0.2 * (10 + leaderBoard[i].point * 2) + 'vw';
        setTimeout(() => {
            itemPlayer.style.zIndex = i;
        }, 400)
    }
}

function getItemList(listAccount, myId) {
    let itemList = [];
    for (const account of listAccount) {
        let card = account.id == myId ? 'my-card' : 'player-card';
        itemList.push(fillInTheTemplate(account, card));
    }
    return itemList;
}

function fillInTheTemplate(account, card) {
    let playerItem = playerTemplate;
    playerItem = playerItem.replace(/%CARD%/, card);
    playerItem = playerItem.replace(/%ID%/, account.id);
    playerItem = playerItem.replace(/%AVATAR%/, account.avatar);
    playerItem = playerItem.replace(/%NAME%/, account.nickName);
    return playerItem
}

function redirectIndex() {
    window.location.replace('/index')
}

function lose() {
    showBlockResult('lose');
}

function win() {
    showBlockResult('win')
}

function playerLose(playerId) {
    if (playerId) {
        const itemPlayer = document.querySelector(`#player${playerId}`);
        itemPlayer.querySelector('.background-correct-values').style.backgroundColor = 'rgb(197, 199, 201)';
        itemPlayer.querySelector('.name-player').style.color = 'rgb(197, 199, 201)';
        itemPlayer.querySelector('.avatar-player-play').style.backgroundColor = 'rgb(197, 199, 201)';
    }
}

function showBlockResult(result) {
    const dialogEndGame = document.querySelector('.result-game');
    dialogEndGame.style.display = 'block';
    document.querySelector('#cover-element').style.display = 'block';
    dialogEndGame.querySelector('.img-result-game').src = `img/icon/${result}.png`;
}

function showInputIncorrect(playerId) {
    const playerItem = document.querySelector(`#player${playerId}`);
    playerItem.querySelector('.incorrect-values').innerHTML += `<img src="img/icon/playing.png" alt="" class="img-incorrect">`
}

function dataMaping() {
    for (let i = 0; i < 9; i++) {
        let rowElement = document.querySelectorAll(`.row${i}`);
        for (let j = 0; j < 9; j++) {
            if (quizzes[i][j] != 0) {
                rowElement[j].innerHTML = quizzes[i][j];
                rowElement[j].classList.add('default');
            }
        }
    }
}

function handleEventClick() {
    let classList = this.classList;
    if (!classList.contains('default')) {
        if (elementFolow) {
            elementFolow.style.backgroundColor = 'white';
        }
        elementFolow = this;
        elementFolow.style.backgroundColor = 'greenyellow';
    }
}

function checkInputNumber(element, value) {
    let row = element.dataset.row;
    let col = element.dataset.col;
    if (value == gameData[row][col]) {
        return true;
    }
    return false;
}

function presenTime() {
    let presentTime = '';
    if (minute < 10) {
        presentTime += 0
    }
    presentTime += minute + ':';
    if (second < 10) {
        presentTime += 0;
    }
    presentTime += second;

    time.innerHTML = presentTime;

    if (second < 59) {
        second++
    } else {
        minute++;
        second = 0;
    }
    runTime = setTimeout(presenTime, 999);
}

function stopTime() {
    clearTimeout(runTime);
    minute = 0;
    second = 0;
}

function removeOldValue() {
    listNumberBox.forEach(element => {
        element.innerHTML = '';
        element.classList.remove('default');
        element.style.color = 'black';
    })
}

function stopGame() {
    if (elementFolow) {
        elementFolow.style.backgroundColor = 'white';
        elementFolow = '';
    }
    removeOldValue();
    stopTime();
}

function startNewGame() {
    error = 0;
    dataMaping();
}



function checkAndOutValue(value) {
    if (elementFolow) {
        if (checkInputNumber(elementFolow, value)) {
            elementFolow.style.color = 'aqua';
            if (!elementFolow.dataset.status) {
                elementFolow.dataset.status = true;
                socket.emit('new-value-correct');
            }
        } else {
            elementFolow.style.color = 'red';
            socket.emit('new-value-incorrect');
        }
        elementFolow.innerHTML = value;
    }
}

document.addEventListener('keyup', function (event) {
    let listKey = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (listKey.find(element => element == event.key)) {
        checkAndOutValue(event.key);
    } else if (event.key == 'Backspace') {
        elementFolow.innerHTML = '';
    }
})

listNumberBox.forEach(element => {
    element.addEventListener('click', handleEventClick)
});

document.querySelector('#redirect-index').addEventListener('click', redirectIndex)

document.querySelector('#redirect-room').addEventListener('click', () => {
    socket.emit('request-room-redirect');
});


for (const number of numberList) {
    number.addEventListener('click', function(){
        checkAndOutValue(+this.innerHTML);
    })
}