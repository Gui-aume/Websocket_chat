// Set: users are unique
const users = new Set()
let logged = false
let username

window.addEventListener('load', () => {
    
    const DOM = {
        // For login
        userLogin: document.querySelector('#userLogin'),
        password: document.querySelector('#password'),
        loginButton: document.querySelector('#loginButton'),
        // For messages
        button: document.querySelector('#button'),
        input: document.querySelector('#input'),
        userList: document.querySelector('#userList'),
        messages: document.querySelector('#messages')
    }

    // Connect to server websocket
    const socket = new WebSocket(`ws://${window.location.host}/ws`)

    const sendLogin = e => {
        // Event must be : login button and ((user input or password input) and Enter key)
        if(e.target.id !== 'loginButton' && ((e.target.id !== 'password' || e.target.id !== 'userLogin') && e.keyCode !== 13)) return
        if(logged || DOM.userLogin.value.length <= 0) return // ajouter le check du mdp
    
        socket.send(JSON.stringify(['login', DOM.userLogin.value]))
        username = DOM.userLogin.value
    }

    DOM.loginButton.addEventListener('click', sendLogin)
    DOM.userLogin.addEventListener('keypress', sendLogin)
    DOM.password.addEventListener('keypress', sendLogin)

    // send chat message to server
    const sendMessage = e => {
        if(e.target.id !== 'button' && e.keyCode !== 13) return
        
        if(DOM.input.value.length > 0) {
            socket.send(JSON.stringify(['message', DOM.input.value]))
            DOM.input.value = ''
        }
    }

    // remove login form and prepare chatbox
    const login = () => {
        logged = true

        // DISABLE LOGIN AND ENABLE CHATBOX
        document.querySelector('#login').remove()
        document.querySelector('#chatbox').style.display = 'block'

        DOM.button.addEventListener('click', sendMessage)
        DOM.input.addEventListener('keypress', sendMessage)
    }

    // add received messages to chatbox
    const newMessage = (author, text) => {
        const box = document.createElement('article')
        box.className = 'box'

        const authorBox = document.createElement('h4')
        const textBox = document.createElement('p')
        authorBox.innerText = author || username
        textBox.innerText = text

        // Identify self messages
        if(!author || author === username)
            box.classList.add('owner')
        
        box.appendChild(authorBox)
        box.appendChild(textBox)
        DOM.messages.appendChild(box)
    }

    // Reload Render of userlist
    const renderUserList = () => {
        DOM.userList.innerHTML = '<h4>UserList</h4>'

        Array.from(users).sort().forEach(u => {
            const user = document.createElement('p')
            user.innerText = u
            if(u === username)
                user.style.color = 'cornflowerblue'
            DOM.userList.appendChild(user)
        })
    }

    // handle websocket message received
    socket.addEventListener('message', e => {
        const data = JSON.parse(e.data)
        // messages are array [message type, data1, data2, ...]
        if(data?.length < 2) return

        // On login message
        if(!logged && data[0] === 'login') {
            if(data[1] === 'success')
                login()
            else if (data[1] === 'used')
                console.log('Login name already in use')
            else if (data[1] === 'logged')
                console.log('Already logged, if not : try to reload the page')
        }
        if(!logged) return

        switch(data[0]) {
            case 'message': // message broadcast from server
                if(data[2])
                    newMessage(data[1], data[2])
            break
            case 'history': // chat messages history : received on login
                data[1].forEach(([author, text]) => newMessage(author, text))
            break
            case 'users': // connected users list : received on login
                data[1].forEach(u => users.add(u))
                renderUserList()
            break
            case 'join': // user join the chat
                users.add(data[1])
                renderUserList()
            break
            case 'leave': // user leave the chat
                users.delete(data[1])
                renderUserList()
            break
        }
    })

    // Refresh if disconnected
    socket.addEventListener('close', () => {
        if(logged) // avoid reloading loop if server is unreachable
            location.reload()
    })

})