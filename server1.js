const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// CORS configuration for Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "https://meassgage-confident-czmf.vercel.app", // Allow your frontend origin
        methods: ["GET", "POST"], // Allowed methods
        credentials: true // Allow credentials if needed
    }
});

// CORS configuration for Express
app.use(cors({
    origin: "https://meassgage-confident-czmf.vercel.app", // Allow your frontend origin for Express routes
    credentials: true // Allow credentials if needed
}));

// Log every request to verify CORS behavior
app.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
    res.header("Access-Control-Allow-Origin", "https://meassgage-confident-czmf.vercel.app");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

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
