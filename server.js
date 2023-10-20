const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Allow one origin
        methods: ["GET", "POST"]
    }
});

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

const filter = new Filter();

const PORT = process.env.PORT || 4001;
let userEmojis = {};
let userPages = {};

app.use(cors());
app.use(limiter);  // Apply rate limiting

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
        const { x, y } = data;
        const page = userPages[socket.id];  // Get page of sender
        // Broadcast to all other users on the same page
        socket.broadcast.to(page).emit('cursorMove', { userId: socket.id, x, y });
    });

    socket.on('chatToggle', (data) => {
        const { chatActive } = data;
        const page = userPages[socket.id];  // Get page of sender
        // Broadcast to all other users on the same page
        socket.broadcast.to(page).emit('chatToggle', { userId: socket.id, chatActive });
    });

    socket.on('sendMessage', (data) => {
        const { chatMessage } = data;
        const cleanMessage = filter.clean(chatMessage);  // Filter out bad words from chatMessage
        const page = userPages[socket.id];  // Get page of sender
        // Broadcast to all other users on the same page
        socket.broadcast.to(page).emit('newMessage', { userId: socket.id, chatMessage: cleanMessage });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
        delete userEmojis[socket.id];  // Remove emoji association on disconnect
        delete userPages[socket.id];  // Remove page association on disconnect
        io.emit('cursorLeave', { id: socket.id });
    });

});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));  // Updated port assignment