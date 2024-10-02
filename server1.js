const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Set up CORS options
const corsOptions = {
    origin: "https://meassgage-confident-czmf.vercel.app", // Your frontend origin
    methods: ["GET", "POST"],
    credentials: true // Allow credentials if needed
};

// Enable CORS for all requests
app.use(cors(corsOptions));

// Use the same CORS options for Socket.io
const io = socketIo(server, {
    cors: corsOptions // Use the same CORS options for Socket.io
});



// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the HTML file
});

// Create a users object to map user IDs to socket IDs
const users = {};

const io = socketIo(server, {
    cors: corsOptions // Use the same CORS options for Socket.io
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (userId) => {
        users[userId] = socket.id; // Map userId to socket.id
        console.log('User registered:', userId);
    });

    socket.on('send connection request', ({ from, to }) => {
        if (users[to]) {
            io.to(users[to]).emit('connection request', { from });
            console.log(`Connection request from ${from} to ${to}`);
        } else {
            console.log(`User ${to} not found`);
        }
    });

    socket.on('accept connection', ({ from, to }) => {
        console.log(`Accepted connection from ${from} to ${to}`);
        io.to(users[from]).emit('connected', { to });
        io.to(users[to]).emit('connected', { from });
    });

    socket.on('chat message', ({ message, to, from, timestamp }) => {
        if (users[to]) {
            io.to(users[to]).emit('chat message', { message, from, timestamp });
            console.log(`Message from ${from} to ${to}: ${message}`);
        } else {
            console.log(`User ${to} not found`);
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
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
