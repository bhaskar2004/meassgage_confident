const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

// Store users and their unique IDs
let users = {};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve the HTML file
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
        }
    });

    socket.on('accept connection', ({ from, to }) => {
        console.log(`Accepted connection from ${from} to ${to}`);
        // Notify both users that the connection was accepted
        io.to(users[from]).emit('connected', { to });
        io.to(users[to]).emit('connected', { from });
    });

    socket.on('chat message', ({ message, to, timestamp }) => {
        const from = Object.keys(users).find(key => users[key] === socket.id);
        if (from) {
            // Check if the recipient exists in the users object before sending the message
            if (users[to]) {
                io.to(users[to]).emit('chat message', { message, from, timestamp });
                console.log(`Message from ${from} to ${to}: ${message}`);
            } else {
                console.log(`User ${to} not found`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove the user from the users object
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
