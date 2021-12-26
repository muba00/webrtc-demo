
const WebSocket = require('ws')

const server = new WebSocket.Server({ port: 8080 })

const broadcast = (server, data) => {
    server.clients.forEach((client) => {
        if (client.readyState == WebSocket.OPEN) {
            console.log(String(data))
            client.send(String(data))
        }
    })
}

server.on("connection", socket => {
    socket.on("message", (data) => {
        broadcast(server, data)
    })
})