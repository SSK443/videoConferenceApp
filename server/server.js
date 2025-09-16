// server/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const http = require('http'); // Required for Socket.IO
const { Server } = require('socket.io'); // Required for Socket.IO

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Passport Middleware ---
app.use(passport.initialize());
require('./config/passport')(passport); // Passport config

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB database connection established successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- API Routes ---
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// --- Create HTTP Server and Integrate Socket.IO ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Your React client's address
    methods: ['GET', 'POST'],
  },
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // --- Logic for Chat ---
  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });

  // --- ========================================== ---
  // --- NEW: Logic for WebRTC Video Call Signaling ---
  // --- ========================================== ---

  // This event is triggered when a user enters a meeting room on the frontend.
  socket.on('join-video-room', (roomId, peerId) => {
    // The user joins the specified room.
    socket.join(roomId);
    console.log(`A user joined the video room: ${roomId}. Peer ID: ${peerId}`);

    // The server then broadcasts a message to everyone else in the room.
    // This message tells the existing users that a new user has connected and shares their peerId.
    // The existing users will then use this peerId to initiate a direct connection.
    socket.to(roomId).emit('user-connected', peerId);

    // This event is triggered when a user leaves the meeting room or closes the browser.
    socket.on('disconnect', () => {
      console.log(`User disconnected from video room: ${roomId}. Peer ID: ${peerId}`);
      // The server broadcasts to everyone in the room that this user has left.
      // The frontend will then know to remove this user's video stream.
      socket.to(roomId).emit('user-disconnected', peerId);
    });
  });

  // This is a fallback for the main disconnect event
  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// --- Start The Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

