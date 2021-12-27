
const express = require('express')
const WebSocket = require('ws')


const PORT = 3000
const app = express()

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(PORT, () => console.log(`Listening on ${PORT}`));




const ws_server = new WebSocket.Server({ port: 8081 })

const broadcast = (ws_server, data) => {
    ws_server.clients.forEach((client) => {
        if (client.readyState == WebSocket.OPEN) {
            console.log(String(data))
            client.send(String(data))
        }
    })
}

ws_server.on("connection", socket => {
    socket.on("message", (data) => {
        broadcast(ws_server, data)
    })
})