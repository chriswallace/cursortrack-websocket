// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('cursorMove', (data) => {
        socket.broadcast.emit('cursorMove', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        io.emit('cursorLeave', { id: socket.id });
    });
});

server.listen(4001, () => console.log('Listening on port 4001'));
