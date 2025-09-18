// server/server.js

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

require("./config/passport")(passport);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log("MongoDB database connection established successfully")
  )
  .catch((err) => console.error(err));

const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

const roomParticipants = {};

io.on("connection", (socket) => {
  console.log("A user connected via socket:", socket.id);

  socket.on("join-video-room", (roomId, peerId, token) => {
    if (!token) {
      console.log("Join attempt failed: No token provided.");
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // --- THE FIX IS HERE ---
      // We need to look inside the 'user' object in the token
      const userId = decoded.user.id;
      console.log(`[DEBUG] Verifying token for user ID: ${userId}`);

      // --- AND THE FIX IS HERE ---
      // Use the correct userId variable to find the user
      User.findById(userId).then((user) => {
        console.log(`[DEBUG] Database query result for user:`, user);

        if (!user) {
          console.log("Join attempt failed: User not found in DB.");
          return;
        }

        socket.join(roomId);
        console.log(
          `User ${user.username} (socket: ${socket.id}) with peerId ${peerId} joined room ${roomId}`
        );

        if (!roomParticipants[roomId]) {
          roomParticipants[roomId] = [];
        }

        const newParticipant = {
          socketId: socket.id,
          peerId: peerId,
          username: user.username,
          role: user.role,
        };

        socket.emit("room-participants", roomParticipants[roomId]);
        roomParticipants[roomId].push(newParticipant);
        socket.to(roomId).emit("user-connected", newParticipant);

        socket.on("disconnect", () => {
          console.log(
            `User ${user.username} (socket: ${socket.id}) disconnected from room ${roomId}`
          );
          if (roomParticipants[roomId]) {
            roomParticipants[roomId] = roomParticipants[roomId].filter(
              (p) => p.socketId !== socket.id
            );
            io.to(roomId).emit("user-disconnected", peerId, socket.id);
          }
        });

        socket.on("admin-mute-user", ({ targetSocketId }) => {
          const sender = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (sender && sender.role === "admin") {
            console.log(
              `Admin ${sender.username} is muting user with socket ID ${targetSocketId}`
            );
            io.to(targetSocketId).emit("force-mute");
          } else {
            console.log("Unauthorized mute attempt by user:", sender?.username);
          }
        });
      });
    } catch (err) {
      console.error("JWT verification failed for join-video-room", err);
    }
  });

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
  });
  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data.message);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
