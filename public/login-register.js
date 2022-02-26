let socket;

function accountOnline() {
    outMessage('#msg-login', 'Tài khoản đang trực tuyến');
}

function removeValueInput() {
    const inputList = document.getElementsByTagName('input');
    for (const element of inputList) {
        element.value = '';
    }
}

function openDialogLogin() {
    removeValueInput();
    document.querySelector('#dl-login').open = true;
    document.querySelector('#dl-register').open = false;
}

function openDialogRegister() {
    removeValueInput()
    document.querySelector('#dl-login').open = false;
    document.querySelector('#dl-register').open = true;
}

document.querySelector('#get-dl-register').addEventListener('click', openDialogRegister)

document.querySelector('#get-dl-login').addEventListener('click', openDialogLogin)

document.querySelector('#confirm-login').addEventListener('click', async () => {
    let username = document.querySelector('#username-login').value;
    let password = document.querySelector('#password-login').value;

    if (username == '' || password == '') {
        return outMessage('#msg-login', 'Tài khoản hoặc mật khẩu không được để trống');
    }
    const response = await callApi({ username, password }, '/account/login');
    if (response.status == 200) {
        socket = io('/login');

        socket.on('account-online', accountOnline);

        socket.on('login-success', loginSuccess);
        
        socket.emit('login');
    } else {
        outMessage('#msg-login', 'Tài khoản hoặc mật khẩu không đúng');
    }
})

async function callApi(account, url) {
    let request = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
    }
    const response = await fetch(url, request);
    return response;
}

async function loginSuccess() {
    document.querySelector('#dl-login').open = false;
    window.location.replace('/index');
}

document.querySelector('#confirm-register').addEventListener('click', async () => {
    const account = inputValidation();
    if (!account) {
        return;
    }
    const response = await callApi(account, '/account/register');
    if (response.status == 201) {
        openDialogLogin();
    } else {
        const message = await response.json();
        outMessage('#msg-register', message)
    }
})

function inputValidation() {
    const regexUsername = /[A-Za-z0-9._]{6,20}/;
    const regexNickName = /.{6,20}/;
    const regexPassword = /(?=.*[a-z]+)(?=.*\d+).{8,20}$/
    const regexEmail = /^[A-Za-z0-9._]+@[A-Za-z0-9._]+.\w+$/

    let nickName = document.querySelector('#nick-name').value;
    let username = document.querySelector('#username-register').value;
    let password = document.querySelector('#password-register').value;
    let email = document.querySelector('#email').value;
    let CofPassword = document.querySelector('#confirm-password').value;

    let msgList = [];

    switch (true) {
        case username == '':
            msgList.push('Tài khoản không được để trống');
            break;
        case !regexUsername.test(username):
            msgList.push('Tài khoản phải có độ dài từ 6 đến 20 ký tự');
            break;
        case !regexPassword.test(password):
            msgList.push('Mật khẩu có độ dài từ 8 đến 20 ký tự');
            msgList.push('Mật khẩu phải bảo gồm ít nhất 1 chữ cái và 1 số');
            break;
        case password !== CofPassword:
            msgList.push('Mật khẩu nhập lại không khớp');
            break;
        case nickName == '':
            msgList.push('Tên người dùng không được để trống');
            break;
        case !regexNickName.test(nickName):
            msgList.push('Tên người dùng không hợp lệ');
            break;
        case !regexEmail.test(email):
            msgList.push('Email không hợp lệ');
            break;
    }

    if (msgList.length > 0) {
        return outMessage('#msg-register', ...msgList);
    }
    return {
        username,
        password,
        nickName,
        email
    }
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