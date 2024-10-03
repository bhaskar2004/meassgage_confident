const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Set up CORS options
const corsOptions = {
    origin: process.env.FRONTEND_URL || "https://meassgage-confident-czmf.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
};

// Enable CORS for all requests
app.use(cors(corsOptions));

// Initialize Socket.io with the same CORS options
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],  // Explicitly specify transports
    path: '/socket.io/'  // Ensure this matches your client-side configuration
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a users object to map user IDs to socket IDs
const users = {};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log('User registered:', userId);
    });

    socket.on('send connection request', ({ from, to }) => {
        if (users[to]) {
            io.to(users[to]).emit('connection request', { from });
            console.log(`Connection request from ${from} to ${to}`);
        } else {
            console.log(`User ${to} not found`);
            socket.emit('error', { message: 'User not found' });
        }
    });

    socket.on('accept connection', ({ from, to }) => {
        console.log(`Accepted connection from ${from} to ${to}`);
        if (users[from] && users[to]) {
            io.to(users[from]).emit('connected', { to });
            io.to(users[to]).emit('connected', { from });
        } else {
            console.log('One or both users not found');
            socket.emit('error', { message: 'One or both users not found' });
        }
    });

    socket.on('chat message', ({ message, to, from, timestamp }) => {
        if (users[to]) {
            io.to(users[to]).emit('chat message', { message, from, timestamp });
            console.log(`Message from ${from} to ${to}: ${message}`);
        } else {
            console.log(`User ${to} not found`);
            socket.emit('error', { message: 'User not found' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// For Vercel, we need to export the app
module.exports = app;

// Only listen if we're running the server directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
