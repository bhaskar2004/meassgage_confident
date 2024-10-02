let userId = '';
let connectedUserId = '';
let messages = [];
let encryptionEnabled = false;
let decryptionEnabled = false;
const usedIds = new Set(); // To keep track of used IDs

// Function to generate a unique 4-digit ID
function generateUniqueId() {
    let id;
    do {
        id = Math.floor(1000 + Math.random() * 9000); // Generate a number between 1000 and 9999
    } while (usedIds.has(id)); // Ensure the ID has not been used
    usedIds.add(id); // Add ID to the set of used IDs
    return id;
}

// Generate Unique ID for the user
document.getElementById('generateIdBtn').addEventListener('click', () => {
    userId = generateUniqueId();
    document.getElementById('userIdDisplay').textContent = `Your Unique ID: ${userId}`;
    document.getElementById('userIdDisplay').style.display = 'block';
    document.querySelector('.app-container').style.display = 'flex';
    localStorage.setItem(userId, JSON.stringify({ messages: [] })); // Save user data
});

// Send Connection Request
document.getElementById('connectBtn').addEventListener('click', () => {
    const connectId = document.getElementById('connectIdInput').value.trim();
    if (connectId && connectId !== userId) {
        const existingUser = JSON.parse(localStorage.getItem(connectId));
        if (existingUser) {
            alert(`Connection request sent to ${connectId}`);
            // Store the connection request in local storage
            localStorage.setItem(connectId, JSON.stringify({
                ...existingUser,
                requests: [...(existingUser.requests || []), userId]
            }));
            document.getElementById('connectIdInput').value = ''; // Clear input
        } else {
            alert("User not found. Please check the ID.");
        }
    } else {
        alert("Please enter a valid Unique ID.");
    }
});

// Function to accept connection request
function acceptRequest(requesterId) {
    const existingUser = JSON.parse(localStorage.getItem(userId));
    if (existingUser) {
        existingUser.messages.push(`Connected with ${requesterId}`);
        localStorage.setItem(userId, JSON.stringify(existingUser));
        alert(`You are now connected with ${requesterId}`);
        loadMessages();
    }
}

// Load connection requests
function loadRequests() {
    const existingUser = JSON.parse(localStorage.getItem(userId));
    const requestsDiv = document.getElementById('requests');
    requestsDiv.innerHTML = ''; // Clear previous requests
    if (existingUser && existingUser.requests) {
        existingUser.requests.forEach(requesterId => {
            const requestElement = document.createElement('div');
            requestElement.innerHTML = `${requesterId} <button onclick="acceptRequest('${requesterId}')">Accept</button>`;
            requestsDiv.appendChild(requestElement);
        });
        document.getElementById('notificationArea').style.display = 'block';
    }
}

// XOR encryption/decryption function
function xorEncryptDecrypt(text, key) {
    return text.split('').map((char, index) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))
    ).join('');
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('userInput');
    const messageArea = document.getElementById('userMessageArea');
    const message = messageInput.value.trim();
    if (message) {
        const timestamp = new Date().toLocaleTimeString(); // Get the current time
        const encryptedMessage = encryptionEnabled ? xorEncryptDecrypt(message, 'secretkey') : message;
        messages.push(`You to ${connectedUserId} at ${timestamp}: ${encryptedMessage}`);
        localStorage.setItem(userId, JSON.stringify({ messages: [...messages] }));
        loadMessages(); // Refresh messages
        messageInput.value = '';
    }
}

// Load messages
function loadMessages() {
    const messageArea = document.getElementById('userMessageArea');
    messageArea.innerHTML = ''; // Clear previous messages
    messages.forEach(msg => {
        const parts = msg.split(': ');
        const decryptedMsg = decryptionEnabled ? xorEncryptDecrypt(parts[2], 'secretkey') : parts[2];
        const messageElement = document.createElement('div');
        messageElement.textContent = `${parts[0]}: ${decryptedMsg} (${parts[1]})`; // Show message with timestamp
        messageArea.appendChild(messageElement);
    });
    messageArea.scrollTop = messageArea.scrollHeight; // Auto-scroll to bottom
}

// Initialize on load
window.onload = function() {
    userId = localStorage.getItem('currentUserId');
    if (userId) {
        document.getElementById('userIdDisplay').textContent = `Your Unique ID: ${userId}`;
        document.getElementById('userIdDisplay').style.display = 'block';
        document.querySelector('.app-container').style.display = 'flex';
        loadRequests();
        loadMessages();
    }
};

// Toggle encryption
document.getElementById('encryptToggle').addEventListener('click', () => {
    encryptionEnabled = !encryptionEnabled;
    document.getElementById('encryptToggle').textContent = `Encryption: ${encryptionEnabled ? 'ON' : 'OFF'}`;
});

// Toggle decryption
document.getElementById('decryptToggle').addEventListener('click', () => {
    decryptionEnabled = !decryptionEnabled;
    document.getElementById('decryptToggle').textContent = `Decrypt: ${decryptionEnabled ? 'ON' : 'OFF'}`;
});

// Send button event
document.getElementById('sendBtn').addEventListener('click', sendMessage);
