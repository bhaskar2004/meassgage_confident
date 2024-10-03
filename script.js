// Initialize socket connection
const socket = io('https://meassgage-confident-czmf-ja9l9joe5-bhaskar2004s-projects.vercel.app/', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5
});

// DOM Elements
const elements = {
    userMessageArea: document.getElementById('userMessageArea'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    encryptToggle: document.getElementById('encryptToggle'),
    decryptToggle: document.getElementById('decryptToggle'),
    userIdDisplay: document.getElementById('userIdDisplay'),
    connectIdInput: document.getElementById('connectIdInput'),
    connectBtn: document.getElementById('connectBtn'),
    notificationArea: document.getElementById('notificationArea'),
    requestsDiv: document.getElementById('requests'),
    appContainer: document.querySelector('.app-container'),
    generateIdBtn: document.getElementById('generateIdBtn')
};

// State
let state = {
    uniqueId: null,
    isEncryptionEnabled: false,
    isDecryptionEnabled: false,
    connectedUsers: new Set()
};

// Utility Functions
const generateUniqueId = () => Math.floor(1000 + Math.random() * 9000);

const encryptDecryptMessage = (message, key = 'secretkey') => {
    return message.split('').map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))
    ).join('');
};

const displayMessage = (message, from, timestamp) => {
    const msgElement = document.createElement('div');
    msgElement.textContent = `[${timestamp}] User ${from}: ${message}`;
    elements.userMessageArea.appendChild(msgElement);
    elements.userMessageArea.scrollTop = elements.userMessageArea.scrollHeight;
};

// Event Handlers
const handleGenerateId = () => {
    state.uniqueId = generateUniqueId();
    elements.userIdDisplay.textContent = `Your Unique ID: ${state.uniqueId}`;
    elements.userIdDisplay.style.display = 'block';
    socket.emit('register', state.uniqueId);
};

const handleSendConnectionRequest = () => {
    const connectId = elements.connectIdInput.value.trim();
    if (connectId && state.uniqueId) {
        socket.emit('send connection request', { from: state.uniqueId, to: connectId });
        elements.connectIdInput.value = '';
    } else {
        alert('Please generate your ID first and enter a valid connect ID.');
    }
};

const handleAcceptConnection = (event) => {
    if (event.target.classList.contains('acceptBtn')) {
        const fromId = event.target.dataset.id;
        socket.emit('accept connection', { from: state.uniqueId, to: fromId });
        elements.notificationArea.style.display = 'none';
        elements.appContainer.style.display = 'block';
        state.connectedUsers.add(fromId);
        updateConnectedUsersList();
    }
};

const handleSendMessage = () => {
    const message = elements.userInput.value.trim();
    if (message && state.connectedUsers.size > 0) {
        const toUserId = Array.from(state.connectedUsers).pop();
        const processedMessage = state.isEncryptionEnabled ? encryptDecryptMessage(message) : message;
        const timestamp = new Date().toLocaleTimeString();
        socket.emit('chat message', { message: processedMessage, to: toUserId, from: state.uniqueId, timestamp });
        elements.userInput.value = '';
        displayMessage(message, 'You', timestamp);
    } else {
        alert('Please connect to a user before sending a message.');
    }
};

const toggleEncryption = () => {
    state.isEncryptionEnabled = !state.isEncryptionEnabled;
    elements.encryptToggle.textContent = `Encryption: ${state.isEncryptionEnabled ? 'ON' : 'OFF'}`;
};

const toggleDecryption = () => {
    state.isDecryptionEnabled = !state.isDecryptionEnabled;
    elements.decryptToggle.textContent = `Decrypt: ${state.isDecryptionEnabled ? 'ON' : 'OFF'}`;
};

const updateConnectedUsersList = () => {
    const connectedUsersElement = document.getElementById('connectedUsers');
    if (connectedUsersElement) {
        connectedUsersElement.innerHTML = Array.from(state.connectedUsers).map(userId => 
            `<div>Connected to: ${userId}</div>`
        ).join('');
    }
};

// Socket Event Handlers
socket.on('connection request', ({ from }) => {
    elements.notificationArea.style.display = 'block';
    elements.requestsDiv.innerHTML += `<div>Connection request from ID: ${from} <button class="acceptBtn" data-id="${from}">Accept</button></div>`;
});

socket.on('chat message', (data) => {
    const displayMsg = state.isDecryptionEnabled ? encryptDecryptMessage(data.message) : data.message;
    displayMessage(displayMsg, data.from, data.timestamp);
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Failed to connect to the server. Please try again later.');
});

socket.on('connect', () => {
    console.log('Successfully connected to the server');
});

// Event Listeners
elements.generateIdBtn.addEventListener('click', handleGenerateId);
elements.connectBtn.addEventListener('click', handleSendConnectionRequest);
elements.requestsDiv.addEventListener('click', handleAcceptConnection);
elements.sendBtn.addEventListener('click', handleSendMessage);
elements.encryptToggle.addEventListener('click', toggleEncryption);
elements.decryptToggle.addEventListener('click', toggleDecryption);

// Initialize UI
elements.encryptToggle.textContent = `Encryption: OFF`;
elements.decryptToggle.textContent = `Decrypt: OFF`;
