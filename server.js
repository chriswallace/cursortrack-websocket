// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4001;  // Set port dynamically for Heroku
let userEmojis = {};  // Object to store user emojis by socket id

app.use(cors());  // Enable CORS for all routes

io.on('connection', (socket) => {
    console.log('New client connected');
    userEmojis[socket.id] = "😀";  // Set default emoji for new connections

    socket.on('emojiUpdate', (data) => {
        const { emoji } = data;
        userEmojis[socket.id] = emoji;  // Update emoji
        io.emit('emojiUpdate', { userId: socket.id, emoji });  // Broadcast update
    });

    socket.on('cursorMove', (data) => {
        const { x, y, emoji } = data;
        socket.broadcast.emit('cursorMove', { userId: socket.id, x, y, emoji });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete userEmojis[socket.id];  // Remove emoji association on disconnect
        io.emit('cursorLeave', { id: socket.id });
    });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));  // Updated port assignment
