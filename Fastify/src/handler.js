const clients = []
const history = []

// handle connection of a client
module.exports = (ws, req) => {
    clients.push(ws) // keep a track of the socket

    // send to all connected socket with logged user
    const broadcast = (...args) => {
        clients.forEach(c => {
            if(c.login)
                c.send(JSON.stringify(args))
        })
    }

    // on message from client
    ws.on('message', e => {
        // get index of current client
        const id = clients.findIndex(c => c === ws)
        const data = JSON.parse(e)

        if(data?.length < 2) return
        // handle login request
        if(data[0] === 'login') {
            if(id > -1 && clients[id].login) {
                // Already logged
                ws.send(JSON.stringify(['login', 'logged']))
            } else {
                // id already exists
                if(clients.find(c => c.login === data[1]))
                    ws.send(JSON.stringify(['login', 'used']))
                else {
                    clients[id].login = data[1]
                    // Warn all clients about user join
                    broadcast('join', clients[id].login)

                    // send authorise, userlist and chat history to the new user
                    ws.send(JSON.stringify(['login', 'success']))
                    ws.send(JSON.stringify(['users', clients.map(c => c.login)]))
                    ws.send(JSON.stringify(['history', history]))
                }
            }
        // handle message from client
        } else if (data[0] === 'message') {
            // console.log('received: %s from %s', data, req.socket.remoteAddress)
            const msg = data[1].toString()
            const userName = clients[id].login
            // Keep messages history
            history.push([userName, msg])
            // broadcast the message to all clients
            clients.forEach(c => {
                if(c.login) // Author is unspecified if target is emitter
                    c.send(JSON.stringify(['message', c.login === userName ? '' : userName , msg]))
            })
        }
    })

    ws.on('error', e => {
        console.log('Error with ' + ws.login)
        const id = clients.findIndex(c => c === ws)
    })

    // Client disconnect
    ws.on('close', () => {
        console.log('Closed connexion with ' + ws.login)
        const id = clients.findIndex(c => c === ws)
        // Warn clients
        broadcast('leave', ws.login)
        // remove from logged list
        clients.splice(id, 1)
    })

}