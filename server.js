

const fs = require('fs')
const https = require('https')
const WebSocket = require('ws')



// ----------------------------------------------------------------------------------------

// Create a server for the client html page
const handleRequest = function (request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url)

    if (request.url === '/client.js') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' })
        response.end(fs.readFileSync('client.js'))
    } else if (request.url === '/style.css') {
        response.writeHead(200, { 'Content-Type': 'text/css' })
        response.end(fs.readFileSync('style.css'))
    } else {
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(fs.readFileSync('index.html'))
    }
};

const httpsServer = https.createServer(serverConfig, handleRequest)
httpsServer.listen()

// ----------------------------------------------------------------------------------------





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