// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const mongoose = require("mongoose");
// const passport = require("passport");
// const jwt = require("jsonwebtoken");
// const User = require("./models/user.model");
// const Poll = require("./models/poll.model");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });

// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.use(passport.initialize());

// require("./config/passport")(passport);

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() =>
//     console.log("MongoDB database connection established successfully")
//   )
//   .catch((err) => console.error(err));

// const authRouter = require("./routes/auth");
// app.use("/api/auth", authRouter);

// const roomParticipants = {};

// io.on("connection", (socket) => {
//   socket.on("join-video-room", (roomId, peerId, token) => {
//     if (!token) return;
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const userId = decoded.user.id;

//       User.findById(userId).then((user) => {
//         if (!user) return;
//         if (!roomParticipants[roomId]) roomParticipants[roomId] = [];
//         const isAlreadyInRoom = roomParticipants[roomId].some(
//           (p) => p.userId === userId
//         );
//         if (isAlreadyInRoom) {
//           console.log(
//             `User ${user.username} is already in room ${roomId}. Ignoring duplicate join event.`
//           );
//           return;
//         }

//         socket.join(roomId);
//         console.log(`User ${user.username} joined room ${roomId}`);
//         const newParticipant = {
//           socketId: socket.id,
//           peerId: peerId,
//           username: user.username,
//           role: user.role,
//           userId: userId,
//           isMuted: false,
//           isSharingScreen: false, // Add screen sharing status
//         };
//         socket.emit("room-participants", roomParticipants[roomId]);
//         roomParticipants[roomId].push(newParticipant);
//         socket.to(roomId).emit("user-connected", newParticipant);

//         // --- SCREEN SHARING EVENTS ---
//         socket.on("screen-share-started", (data) => {
//           const sharer = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (sharer) {
//             sharer.isSharingScreen = true;
//             socket.to(roomId).emit("screen-share-started", {
//               peerId: sharer.peerId,
//               username: sharer.username,
//               isSharingScreen: true,
//             });
//             console.log(
//               `${sharer.username} started screen sharing in room ${roomId}`
//             );
//           }
//         });

//         socket.on("screen-share-stopped", (data) => {
//           const sharer = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (sharer) {
//             sharer.isSharingScreen = false;
//             socket.to(roomId).emit("screen-share-stopped", {
//               peerId: sharer.peerId,
//               username: sharer.username,
//               isSharingScreen: false,
//             });
//             console.log(
//               `${sharer.username} stopped screen sharing in room ${roomId}`
//             );
//           }
//         });

//         // --- NEW: Poll Creation Logic ---
//         socket.on("create-poll", async (pollData) => {
//           const creator = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (!creator) return;

//           const newPoll = new Poll({
//             question: pollData.question,
//             options: pollData.options.map((opt) => ({
//               text: opt,
//               votes: 0,
//               voters: [],
//             })),
//             roomId: roomId,
//             createdBy: { username: creator.username, userId: creator.userId },
//           });
//           await newPoll.save();
//           io.to(roomId).emit("new-poll", newPoll);
//         });

//         // --- NEW: Poll Voting Logic ---
//         socket.on("vote-poll", async ({ pollId, optionIndex }) => {
//           const voter = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (!voter) return;

//           const poll = await Poll.findById(pollId);
//           if (poll && poll.isOpen) {
//             // Prevent user from voting twice
//             const hasVoted = poll.options.some((opt) =>
//               opt.voters.includes(voter.userId)
//             );
//             if (hasVoted) return;

//             poll.options[optionIndex].votes += 1;
//             poll.options[optionIndex].voters.push(voter.userId);
//             await poll.save();
//             io.to(roomId).emit("poll-updated", poll);
//           }
//         });

//         // --- NEW: End Poll Logic ---
//         socket.on("end-poll", async ({ pollId }) => {
//           const sender = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           const poll = await Poll.findById(pollId);
//           // Only the creator or an admin can end the poll
//           if (
//             poll &&
//             sender &&
//             (poll.createdBy.userId === sender.userId || sender.role === "admin")
//           ) {
//             poll.isOpen = false;
//             await poll.save();
//             io.to(roomId).emit("poll-updated", poll); // Send final update with isOpen: false
//           }
//         });

//         // Existing listeners
//         socket.on("mute-status-change", ({ muted }) => {
//           const participant = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (participant) {
//             participant.isMuted = muted;
//             socket
//               .to(roomId)
//               .emit("user-mute-status-changed", { peerId, muted });
//           }
//         });

//         socket.on("disconnect", () => {
//           const participant = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (participant) {
//             console.log(`User ${participant.username} disconnected`);
//             roomParticipants[roomId] = roomParticipants[roomId].filter(
//               (p) => p.socketId !== socket.id
//             );
//             io.to(roomId).emit("user-disconnected", peerId, socket.id);
//           }
//         });

//         socket.on("admin-mute-user", ({ targetSocketId }) => {
//           const sender = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (sender && sender.role === "admin") {
//             io.to(targetSocketId).emit("force-mute");
//           }
//         });

//         socket.on("admin-cam-off-user", ({ targetSocketId }) => {
//           const sender = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (sender && sender.role === "admin") {
//             io.to(targetSocketId).emit("force-cam-off");
//           }
//         });

//         socket.on("admin-kick-user", ({ targetSocketId }) => {
//           const sender = roomParticipants[roomId]?.find(
//             (p) => p.socketId === socket.id
//           );
//           if (sender && sender.role === "admin") {
//             io.to(targetSocketId).emit("force-kick");
//           }
//         });
//       });
//     } catch (err) {
//       console.error("JWT verification failed for join-video-room", err);
//     }
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server is running on port: ${PORT}`);
// });






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

// In-memory storage for meeting rooms and their admins
const roomParticipants = {};
const roomAdmins = {}; // Track admin per room

// Helper function to handle admin commands
function handleAdminCommand(
  roomId,
  senderSocketId,
  command,
  targetSocketId = null
) {
  const sender = roomParticipants[roomId]?.find(
    (p) => p.socketId === senderSocketId
  );
  if (!sender) {
    io.to(senderSocketId).emit("admin-error", "You are not in this room");
    return;
  }

  // Check if sender is admin (either room admin or global admin)
  const isAuthorized = sender.isRoomAdmin || sender.role === "admin";
  if (!isAuthorized) {
    io.to(senderSocketId).emit(
      "admin-error",
      "You do not have admin privileges"
    );
    console.log(
      `${sender.username} attempted admin command without privileges`
    );
    return;
  }

  console.log(`👑 Admin ${sender.username} issued ${command} command`);

  switch (command) {
    case "mute":
    case "camera-off":
    case "kick":
      if (!targetSocketId) {
        io.to(senderSocketId).emit("admin-error", "No target specified");
        return;
      }

      const target = roomParticipants[roomId]?.find(
        (p) => p.socketId === targetSocketId
      );
      if (!target) {
        io.to(senderSocketId).emit("admin-error", "Target user not found");
        return;
      }

      if (target.socketId === senderSocketId) {
        io.to(senderSocketId).emit(
          "admin-error",
          "You cannot control yourself"
        );
        return;
      }

      // Check if target is also an admin (prevent admin vs admin conflicts)
      if (target.isRoomAdmin || target.role === "admin") {
        io.to(senderSocketId).emit(
          "admin-error",
          "Cannot control another admin"
        );
        return;
      }

      // Execute command
      switch (command) {
        case "mute":
          io.to(targetSocketId).emit("force-mute");
          target.isMuted = true;
          io.to(roomId).emit("user-mute-status-changed", {
            peerId: target.peerId,
            muted: true,
            username: target.username,
          });
          console.log(`🔇 Admin ${sender.username} muted ${target.username}`);
          break;

        case "camera-off":
          io.to(targetSocketId).emit("force-cam-off");
          console.log(
            `📹 Admin ${sender.username} turned off camera for ${target.username}`
          );
          break;

        case "kick":
          io.to(targetSocketId).emit("force-kick");
          // Remove from room immediately
          roomParticipants[roomId] = roomParticipants[roomId].filter(
            (p) => p.socketId !== targetSocketId
          );
          io.to(roomId).emit(
            "user-disconnected",
            target.peerId,
            targetSocketId
          );
          io.to(roomId).emit("room-participants", roomParticipants[roomId]);
          console.log(`🚪 Admin ${sender.username} kicked ${target.username}`);
          break;
      }
      break;

    case "mute-all":
      let mutedCount = 0;
      roomParticipants[roomId].forEach((participant) => {
        if (participant.socketId !== senderSocketId && !participant.isMuted) {
          io.to(participant.socketId).emit("force-mute");
          participant.isMuted = true;
          io.to(roomId).emit("user-mute-status-changed", {
            peerId: participant.peerId,
            muted: true,
            username: participant.username,
          });
          mutedCount++;
        }
      });
      console.log(
        `🔇 Admin ${sender.username} muted ${mutedCount} users in room ${roomId}`
      );
      break;

    default:
      io.to(senderSocketId).emit("admin-error", "Unknown command");
  }
}

// Helper function to set up socket events
function setupSocketEvents(socket, roomId, peerId) {
  // Admin commands
  socket.on("admin-mute-user", ({ targetSocketId }) => {
    handleAdminCommand(roomId, socket.id, "mute", targetSocketId);
  });

  socket.on("admin-cam-off-user", ({ targetSocketId }) => {
    handleAdminCommand(roomId, socket.id, "camera-off", targetSocketId);
  });

  socket.on("admin-kick-user", ({ targetSocketId }) => {
    handleAdminCommand(roomId, socket.id, "kick", targetSocketId);
  });

  socket.on("admin-mute-all", () => {
    handleAdminCommand(roomId, socket.id, "mute-all");
  });

  // Screen sharing events
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
        `🖥️ ${sharer.username} started screen sharing in room ${roomId}`
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
        `🖥️ ${sharer.username} stopped screen sharing in room ${roomId}`
      );
    }
  });

  // Poll creation
  socket.on("create-poll", async (pollData) => {
    const creator = roomParticipants[roomId]?.find(
      (p) => p.socketId === socket.id
    );
    if (!creator) return;

    try {
      const newPoll = new Poll({
        question: pollData.question,
        options: pollData.options.map((opt) => ({
          text: opt,
          votes: 0,
          voters: [],
        })),
        roomId: roomId,
        createdBy: { username: creator.username, userId: creator.userId },
        isOpen: true,
      });
      await newPoll.save();
      io.to(roomId).emit("new-poll", newPoll);
      console.log(
        `📊 Poll created by ${creator.username}: ${pollData.question}`
      );
    } catch (error) {
      console.error("Error creating poll:", error);
      socket.emit("poll-error", "Failed to create poll");
    }
  });

  // Poll voting
  socket.on("vote-poll", async ({ pollId, optionIndex }) => {
    const voter = roomParticipants[roomId]?.find(
      (p) => p.socketId === socket.id
    );
    if (!voter) return;

    try {
      const poll = await Poll.findById(pollId);
      if (poll && poll.isOpen) {
        // Prevent user from voting twice
        const hasVoted = poll.options.some((opt) =>
          opt.voters.includes(voter.userId)
        );
        if (hasVoted) {
          socket.emit("vote-error", "You have already voted");
          return;
        }

        poll.options[optionIndex].votes += 1;
        poll.options[optionIndex].voters.push(voter.userId);
        await poll.save();
        io.to(roomId).emit("poll-updated", poll);
        console.log(`🗳️ ${voter.username} voted on poll ${pollId}`);
      }
    } catch (error) {
      console.error("Error voting on poll:", error);
      socket.emit("vote-error", "Failed to vote");
    }
  });

  // End poll
  socket.on("end-poll", async ({ pollId }) => {
    const sender = roomParticipants[roomId]?.find(
      (p) => p.socketId === socket.id
    );
    if (!sender) return;

    try {
      const poll = await Poll.findById(pollId);
      // Only the creator or an admin can end the poll
      if (
        poll &&
        (poll.createdBy.userId === sender.userId ||
          sender.role === "admin" ||
          sender.isRoomAdmin)
      ) {
        poll.isOpen = false;
        await poll.save();
        io.to(roomId).emit("poll-updated", poll);
        console.log(`⏹️ Poll ${pollId} ended by ${sender.username}`);
      } else {
        socket.emit(
          "poll-error",
          "You do not have permission to end this poll"
        );
      }
    } catch (error) {
      console.error("Error ending poll:", error);
      socket.emit("poll-error", "Failed to end poll");
    }
  });

  // Mute status change
  socket.on("mute-status-change", ({ muted }) => {
    const participant = roomParticipants[roomId]?.find(
      (p) => p.socketId === socket.id
    );
    if (participant) {
      participant.isMuted = muted;
      socket.to(roomId).emit("user-mute-status-changed", {
        peerId: peerId,
        muted,
        username: participant.username,
      });
      console.log(
        `🔇 ${participant.username} ${muted ? "muted" : "unmuted"} themselves`
      );
    }
  });
}

io.on("connection", (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  socket.on("join-video-room", (roomId, peerId, token) => {
    console.log(`🚪 Join request: Room ${roomId}, Peer ${peerId}`);

    if (!token) {
      console.log("❌ No token provided");
      socket.emit("auth-error", "No token provided");
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;

      User.findById(userId)
        .then((user) => {
          if (!user) {
            console.log("❌ User not found");
            socket.emit("auth-error", "User not found");
            return;
          }

          // Initialize room if it doesn't exist
          if (!roomParticipants[roomId]) {
            roomParticipants[roomId] = [];
            roomAdmins[roomId] = null;
            console.log(`🆕 Room ${roomId} created`);
          }

          const isAlreadyInRoom = roomParticipants[roomId].some(
            (p) => p.userId === userId
          );
          if (isAlreadyInRoom) {
            console.log(`⚠️ User ${user.username} already in room ${roomId}`);
            socket.emit("already-joined", "You are already in this room");
            return;
          }

          socket.join(roomId);
          console.log(
            `✅ ${user.username} (${userId}) joined room ${roomId} as peer ${peerId}`
          );

          const newParticipant = {
            socketId: socket.id,
            peerId: peerId,
            username: user.username,
            role: user.role,
            userId: userId,
            email: user.email,
            isMuted: false,
            isSharingScreen: false,
            joinedAt: new Date(),
          };

          // Set admin status
          const isFirstUser = roomParticipants[roomId].length === 0;
          const isGlobalAdmin = user.role === "admin";

          if (isFirstUser || isGlobalAdmin) {
            newParticipant.isRoomAdmin = true;
            roomAdmins[roomId] = newParticipant;
            console.log(`👑 ${user.username} is now admin of room ${roomId}`);
          } else {
            newParticipant.isRoomAdmin = false;
          }

          // Send current room info to the joining user
          socket.emit("room-info", {
            participants: roomParticipants[roomId],
            currentAdmin: roomAdmins[roomId],
          });

          // Add to participants list
          roomParticipants[roomId].push(newParticipant);
          console.log(
            `📊 Room ${roomId} now has ${roomParticipants[roomId].length} participants`
          );

          // Notify all other users about the new participant
          socket.to(roomId).emit("user-connected", newParticipant);

          // Send updated participants list to everyone
          io.to(roomId).emit("room-participants", roomParticipants[roomId]);

          // Set up event listeners for this socket
          setupSocketEvents(socket, roomId, peerId);
        })
        .catch((err) => {
          console.error("❌ Database error:", err);
          socket.emit("auth-error", "Database error");
        });
    } catch (err) {
      console.error("❌ JWT verification failed:", err);
      socket.emit("auth-error", "Invalid token");
    }
  });

  // Handle socket disconnection
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);

    for (const room of Object.keys(roomParticipants)) {
      const participant = roomParticipants[room].find(
        (p) => p.socketId === socket.id
      );
      if (participant) {
        console.log(`👋 User ${participant.username} left room ${room}`);

        // Handle admin promotion if needed
        if (participant.isRoomAdmin && roomParticipants[room].length > 1) {
          const remainingUsers = roomParticipants[room].filter(
            (p) => p.socketId !== socket.id
          );
          if (remainingUsers.length > 0) {
            remainingUsers[0].isRoomAdmin = true;
            roomAdmins[room] = remainingUsers[0];
            io.to(room).emit("admin-changed", {
              newAdmin: remainingUsers[0].username,
            });
            console.log(`👑 New admin promoted: ${remainingUsers[0].username}`);
          }
        }

        // Remove from room
        roomParticipants[room] = roomParticipants[room].filter(
          (p) => p.socketId !== socket.id
        );

        // Notify others
        io.to(room).emit("user-disconnected", participant.peerId, socket.id);
        io.to(room).emit("room-participants", roomParticipants[room]);

        // Clean up empty room
        if (roomParticipants[room].length === 0) {
          delete roomParticipants[room];
          delete roomAdmins[room];
          console.log(`🧹 Room ${room} cleaned up (empty)`);
        }

        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`📡 Socket.IO server ready on ws://localhost:${PORT}`);
});