
const express = require('express')
const path = require('path')
const fs = require('fs')
const https = require('https')

const WebSocket = require('ws')


const PORT = process.env.PORT || 3000
const app = express()

var key = fs.readFileSync(path.join(__dirname + '/certs/key.pem'))
var cert = fs.readFileSync(path.join(__dirname + '/certs/cert.pem'))
var options = {
    key: key,
    cert: cert
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/index.html'))
})

app.get('/client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/client.js'))
})

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/style.css'))
})


var server = https.createServer(options, app)
server.listen(PORT, () => console.log(`Listening on ${PORT}`))




const ws_server = new WebSocket.Server({ server: server })

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