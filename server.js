const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const cors = require('cors');

app.use(cors());
app.use(express.static('public'));

// Store connected users
let users = new Set();

io.on('connection', (socket) => {
    console.log('A user connected');
    users.add(socket.id);

    // Handle chat messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', {
            userId: socket.id,
            message: msg,
            timestamp: new Date().toISOString()
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
        users.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 