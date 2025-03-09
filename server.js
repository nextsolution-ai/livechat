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

// Update CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://nextsolution-ai.github.io/livechat',
        'https://nextsolution-ai.github.io'
    ],
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.static('public'));

// Store active chat rooms and their participants
const chatRooms = new Map(); // roomId -> { users: Set, messages: Array }
const userRooms = new Map(); // userId -> roomId

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user starting a new chat
    socket.on('start chat', () => {
        const roomId = socket.id; // Use user's socket ID as room ID
        console.log(`New chat started. Room ID: ${roomId}`);
        
        chatRooms.set(roomId, {
            users: new Set([socket.id]),
            messages: []
        });
        userRooms.set(socket.id, roomId);
        
        // Join the room
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        
        // Notify admin panel of new chat
        io.emit('new chat', {
            roomId,
            userId: socket.id,
            timestamp: new Date().toISOString()
        });
    });

    // Handle admin joining a chat room
    socket.on('join room', (roomId) => {
        console.log(`Admin attempting to join room ${roomId}`);
        const room = chatRooms.get(roomId);
        if (room) {
            socket.join(roomId);
            room.users.add(socket.id);
            userRooms.set(socket.id, roomId);
            console.log(`Admin joined room ${roomId}`);
            
            // Send chat history to admin
            socket.emit('chat history', {
                roomId,
                messages: room.messages
            });
        } else {
            console.log(`Room ${roomId} not found`);
        }
    });

    // Handle chat messages
    socket.on('chat message', (msg) => {
        const roomId = userRooms.get(socket.id);
        console.log(`Message received from ${socket.id} in room ${roomId}`);
        
        if (roomId && chatRooms.has(roomId)) {
            const messageData = {
                userId: socket.id,
                message: msg,
                timestamp: new Date().toISOString(),
                roomId: roomId
            };
            
            // Store message in room history
            chatRooms.get(roomId).messages.push(messageData);
            
            // Broadcast to the specific room
            io.to(roomId).emit('chat message', messageData);
            console.log(`Message broadcast to room ${roomId}`);
            
            // Notify admin of new message
            io.emit('admin message', messageData);
        } else {
            console.log(`Room ${roomId} not found for message`);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const roomId = userRooms.get(socket.id);
        
        if (roomId) {
            const room = chatRooms.get(roomId);
            if (room) {
                room.users.delete(socket.id);
                if (room.users.size === 0) {
                    chatRooms.delete(roomId);
                    io.emit('chat ended', roomId);
                }
            }
            userRooms.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 