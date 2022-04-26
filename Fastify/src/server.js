'use strict'

// const fastify = require('fastify')({ logger: true })
const fastify = require('fastify')()
const path = require('path')
const handler = require('./handler.js')

fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/', // optional: default '/'
})

fastify.register(require('fastify-websocket'))

fastify.get('/ws', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {
    handler(connection.socket, req)
})

fastify.listen(80, '::', err => {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})