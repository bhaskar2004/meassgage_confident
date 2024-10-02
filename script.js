const socket = io('https://meassgage-confident-hp7ti3l6l-bhaskar2004s-projects.vercel.app');
let uniqueId;
const userMessageArea = document.getElementById('userMessageArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const encryptToggle = document.getElementById('encryptToggle');
const decryptToggle = document.getElementById('decryptToggle');
const userIdDisplay = document.getElementById('userIdDisplay');
const connectIdInput = document.getElementById('connectIdInput');
const connectBtn = document.getElementById('connectBtn');
const notificationArea = document.getElementById('notificationArea');
const requestsDiv = document.getElementById('requests');
const appContainer = document.querySelector('.app-container');

let isEncryptionEnabled = false; // Track encryption status
let isDecryptionEnabled = false; // Track decryption status
const connectedUsers = new Set(); // Store connected user IDs

// Generate Unique ID
document.getElementById('generateIdBtn').addEventListener('click', () => {
    uniqueId = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit unique ID
    userIdDisplay.textContent = `Your Unique ID: ${uniqueId}`;
    userIdDisplay.style.display = 'block';

    // Register the user with the generated ID
    socket.emit('register', uniqueId); // Emit the registration event
});

// Send Connection Request
connectBtn.addEventListener('click', () => {
    const connectId = connectIdInput.value.trim();
    if (connectId) {
        socket.emit('send connection request', { from: uniqueId, to: connectId });
        connectIdInput.value = ''; // Clear input
    }
});

// Handle incoming connection requests
socket.on('connection request', ({ from }) => {
    notificationArea.style.display = 'block';
    requestsDiv.innerHTML += `<div>Connection request from ID: ${from} <button class="acceptBtn" data-id="${from}">Accept</button></div>`;
});

// Accept connection
requestsDiv.addEventListener('click', (event) => {
    if (event.target.classList.contains('acceptBtn')) {
        const fromId = event.target.dataset.id;
        socket.emit('accept connection', { from: uniqueId, to: fromId });
        notificationArea.style.display = 'none'; // Hide notification
        appContainer.style.display = 'block'; // Show messaging area
        connectedUsers.add(fromId); // Add to connected users
    }
});

// Sending Messages
sendBtn.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        // Prompt for the recipient ID to send the message to
        const toUserId = Array.from(connectedUsers).pop(); // Get the last connected user (this can be modified based on your preference)
        if (toUserId) {
            const encryptedMessage = isEncryptionEnabled ? encryptMessage(message) : message; // Encrypt if enabled
            const timestamp = new Date().toLocaleTimeString(); // Get current time
            socket.emit('chat message', { message: encryptedMessage, to: toUserId, timestamp });
            userInput.value = ''; // Clear input
        } else {
            alert('No connected user to send the message to.');
        }
    }
});

// Receive Messages
socket.on('chat message', (data) => {
    const displayMessage = isDecryptionEnabled ? decryptMessage(data.message) : data.message; 
    const msgElement = document.createElement('div');
    msgElement.textContent = `[${data.timestamp}] User ${data.from}: ${displayMessage}`; 
    userMessageArea.appendChild(msgElement);
});

// Message encryption function
function encryptMessage(message) {
    const key = 'secretkey'; // Define a simple key for encryption
    return message.split('').map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))
    ).join('');
}

// Message decryption function
function decryptMessage(message) {
    return encryptMessage(message); // XOR works for both encryption and decryption
}

// Encryption toggle functionality
encryptToggle.addEventListener('click', () => {
    isEncryptionEnabled = !isEncryptionEnabled;
    encryptToggle.textContent = `Encryption: ${isEncryptionEnabled ? 'ON' : 'OFF'}`;
});

// Decryption toggle functionality
decryptToggle.addEventListener('click', () => {
    isDecryptionEnabled = !isDecryptionEnabled;
    decryptToggle.textContent = `Decrypt: ${isDecryptionEnabled ? 'ON' : 'OFF'}`;
});
