// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow one origin
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4001;  // Set port dynamically for Heroku
let userEmojis = {};  // Object to store user emojis by socket id
let userPages = {};  // Object to store user pages by socket id

app.use(cors());  // Enable CORS for all routes

io.on('connection', (socket) => {
    console.log('New client connected');
    userEmojis[socket.id] = "😀";  // Set default emoji for new connections

    socket.on('pageChange', (data) => {
        const { page } = data;
        if (userPages[socket.id]) {
            socket.leave(userPages[socket.id]);  // Leave the old room
        }
        userPages[socket.id] = page;  // Update page
        socket.join(page);  // Join the new room
    });


    socket.on('emojiUpdate', (data) => {
        const { emoji } = data;
        userEmojis[socket.id] = emoji;  // Update emoji
        const page = userPages[socket.id];  // Get page of sender
        socket.broadcast.to(page).emit('emojiUpdate', { userId: socket.id, emoji });  // Broadcast update
    });


    socket.on('cursorMove', (data) => {
        const { x, y, emoji, chatActive, chatMessage } = data;
        const page = userPages[socket.id];  // Get page of sender

        // Broadcast to all other users on the same page
        socket.broadcast.to(page).emit('cursorMove', {
            userId: socket.id,
            x,
            y,
            emoji,
            chatActive,
            chatMessage
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete userEmojis[socket.id];  // Remove emoji association on disconnect
        delete userPages[socket.id];  // Remove page association on disconnect
        io.emit('cursorLeave', { id: socket.id });
    });

});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));  // Updated port assignment