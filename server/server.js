require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const Poll = require("./models/poll.model");

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
  socket.on("join-video-room", (roomId, peerId, token) => {
    if (!token) return;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;

      User.findById(userId).then((user) => {
        if (!user) return;
        if (!roomParticipants[roomId]) roomParticipants[roomId] = [];
        const isAlreadyInRoom = roomParticipants[roomId].some(
          (p) => p.userId === userId
        );
        if (isAlreadyInRoom) {
          console.log(
            `User ${user.username} is already in room ${roomId}. Ignoring duplicate join event.`
          );
          return;
        }

        socket.join(roomId);
        console.log(`User ${user.username} joined room ${roomId}`);
        const newParticipant = {
          socketId: socket.id,
          peerId: peerId,
          username: user.username,
          role: user.role,
          userId: userId,
          isMuted: false,
          isSharingScreen: false, // Add screen sharing status
        };
        socket.emit("room-participants", roomParticipants[roomId]);
        roomParticipants[roomId].push(newParticipant);
        socket.to(roomId).emit("user-connected", newParticipant);

        // --- SCREEN SHARING EVENTS ---
        socket.on("screen-share-started", (data) => {
          const sharer = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (sharer) {
            sharer.isSharingScreen = true;
            socket.to(roomId).emit("screen-share-started", {
              peerId: sharer.peerId,
              username: sharer.username,
              isSharingScreen: true,
            });
            console.log(
              `${sharer.username} started screen sharing in room ${roomId}`
            );
          }
        });

        socket.on("screen-share-stopped", (data) => {
          const sharer = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (sharer) {
            sharer.isSharingScreen = false;
            socket.to(roomId).emit("screen-share-stopped", {
              peerId: sharer.peerId,
              username: sharer.username,
              isSharingScreen: false,
            });
            console.log(
              `${sharer.username} stopped screen sharing in room ${roomId}`
            );
          }
        });

        // --- NEW: Poll Creation Logic ---
        socket.on("create-poll", async (pollData) => {
          const creator = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (!creator) return;

          const newPoll = new Poll({
            question: pollData.question,
            options: pollData.options.map((opt) => ({
              text: opt,
              votes: 0,
              voters: [],
            })),
            roomId: roomId,
            createdBy: { username: creator.username, userId: creator.userId },
          });
          await newPoll.save();
          io.to(roomId).emit("new-poll", newPoll);
        });

        // --- NEW: Poll Voting Logic ---
        socket.on("vote-poll", async ({ pollId, optionIndex }) => {
          const voter = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (!voter) return;

          const poll = await Poll.findById(pollId);
          if (poll && poll.isOpen) {
            // Prevent user from voting twice
            const hasVoted = poll.options.some((opt) =>
              opt.voters.includes(voter.userId)
            );
            if (hasVoted) return;

            poll.options[optionIndex].votes += 1;
            poll.options[optionIndex].voters.push(voter.userId);
            await poll.save();
            io.to(roomId).emit("poll-updated", poll);
          }
        });

        // --- NEW: End Poll Logic ---
        socket.on("end-poll", async ({ pollId }) => {
          const sender = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          const poll = await Poll.findById(pollId);
          // Only the creator or an admin can end the poll
          if (
            poll &&
            sender &&
            (poll.createdBy.userId === sender.userId || sender.role === "admin")
          ) {
            poll.isOpen = false;
            await poll.save();
            io.to(roomId).emit("poll-updated", poll); // Send final update with isOpen: false
          }
        });

        // Existing listeners
        socket.on("mute-status-change", ({ muted }) => {
          const participant = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (participant) {
            participant.isMuted = muted;
            socket
              .to(roomId)
              .emit("user-mute-status-changed", { peerId, muted });
          }
        });

        socket.on("disconnect", () => {
          const participant = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (participant) {
            console.log(`User ${participant.username} disconnected`);
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
            io.to(targetSocketId).emit("force-mute");
          }
        });

        socket.on("admin-cam-off-user", ({ targetSocketId }) => {
          const sender = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (sender && sender.role === "admin") {
            io.to(targetSocketId).emit("force-cam-off");
          }
        });

        socket.on("admin-kick-user", ({ targetSocketId }) => {
          const sender = roomParticipants[roomId]?.find(
            (p) => p.socketId === socket.id
          );
          if (sender && sender.role === "admin") {
            io.to(targetSocketId).emit("force-kick");
          }
        });
      });
    } catch (err) {
      console.error("JWT verification failed for join-video-room", err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
