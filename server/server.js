// server/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const http = require("http"); // <-- 1. Import the http module
const { Server } = require("socket.io"); // <-- 2. Import the Server class from socket.io

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
require("./config/passport"); // Passport config

// --- Database Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB database connection established successfully")
  )
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// --- API Routes ---
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

// --- 3. Create HTTP Server and integrate Socket.IO ---
const server = http.createServer(app); // Create an HTTP server with our Express app

// Initialize Socket.IO server and configure CORS for it
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // The origin of our client app
    methods: ["GET", "POST"],
  },
});

// --- 4. Define Socket.IO Connection Logic ---
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Event listener for when a user wants to join a room
  socket.on("join_room", (data) => {
    const { room } = data;
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  // Event listener for when a message is sent
  socket.on("send_message", (data) => {
    // We want to broadcast this message to everyone else in the same room
    socket.to(data.room).emit("receive_message", data);
  });

  // Event listener for when a user disconnects
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// --- Start the Server ---
// We now listen on the 'server' instance, not the 'app' instance
server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
