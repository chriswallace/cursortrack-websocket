// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
//const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 4001;  // Set port dynamically for Heroku

app.use(cors());  // Enable CORS for all routes

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

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));  // Updated port assignment