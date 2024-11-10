const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Simulate users database with predefined usernames and passwords
const users = [
    { username: 'user1', password: 'pass1' },
    { username: 'user2', password: 'pass2' },
    { username: 'user3', password: 'pass3' },
    { username: 'user4', password: 'pass4' }

];

// Set up file upload storage with multer
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' folder

// Simulate an authenticated session (for simplicity)
let authenticatedUsers = {};

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        authenticatedUsers[username] = { socketId: null, group: null };  // Store the authenticated users
        return res.json({ message: 'Login successful', username });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Serve chat page (after login)
app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
});

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({ message: 'File uploaded successfully', filePath: req.file.path });
});

// Socket.io for real-time chat and file sharing
let groups = {};  // Store active groups and members

io.on('connection', (socket) => {
    console.log('A user connected');

    // When a user joins a group
    socket.on('joinGroup', (data) => {
        const { username, groupName } = data;

        // Check if the user is authenticated
        if (!authenticatedUsers[username]) {
            socket.emit('message', 'You need to log in first.');
            return;
        }

        // Save the user to the group
        authenticatedUsers[username].socketId = socket.id;
        authenticatedUsers[username].group = groupName;

        // Create group if it doesn't exist
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(socket.id);

        socket.join(groupName);
        io.to(groupName).emit('message', `${username} has joined the group: ${groupName}`);
    });

    // When a user sends a message
    socket.on('sendMessage', (data) => {
        const { username, groupName, message } = data;

        // Broadcast the message to the group
        io.to(groupName).emit('message', `${username}: ${message}`);
    });

    // When a user uploads a file
    socket.on('sendFile', (fileData) => {
        const { username, groupName, filePath } = fileData;
        
        // Broadcast the file info to the group
        io.to(groupName).emit('message', `${username} shared a file: ${filePath}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
        for (let username in authenticatedUsers) {
            if (authenticatedUsers[username].socketId === socket.id) {
                const groupName = authenticatedUsers[username].group;
                groups[groupName] = groups[groupName].filter(id => id !== socket.id);
                io.to(groupName).emit('message', `${username} has left the group: ${groupName}`);
                delete authenticatedUsers[username];
            }
        }

        console.log('A user disconnected');
    });
});


server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://<your-computer-ip>:${PORT}`);
});
