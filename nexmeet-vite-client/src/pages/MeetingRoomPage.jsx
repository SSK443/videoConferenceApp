// // src/pages/MeetingRoomPage.jsx

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Peer from "peerjs";
// import io from "socket.io-client";
// import { jwtDecode } from "jwt-decode";
// import CreatePoll from "../components/CreatePoll";
// import PollDisplay from "../components/PollDisplay";

// // --- UI COMPONENTS ---
// const MutedIcon = () => (
//   <svg
//     className="w-5 h-5 text-white"
//     xmlns="http://www.w3.org/2000/svg"
//     fill="none"
//     viewBox="0 0 24 24"
//     stroke="currentColor"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5"
//     />
//   </svg>
// );

// const Video = ({
//   stream,
//   isLocal,
//   username,
//   isMuted,
//   isScreenShare = false,
// }) => {
//   const ref = useRef();
//   const [isCameraOff, setIsCameraOff] = useState(false);

//   useEffect(() => {
//     if (stream) {
//       ref.current.srcObject = stream;
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         const handleTrackStateChange = () =>
//           setIsCameraOff(!videoTrack.enabled);
//         handleTrackStateChange();
//         const onTrackStateChange = () => handleTrackStateChange();
//         videoTrack.addEventListener("ended", onTrackStateChange);
//         videoTrack.addEventListener("mute", onTrackStateChange);
//         videoTrack.addEventListener("unmute", onTrackStateChange);
//         return () => {
//           videoTrack.removeEventListener("ended", onTrackStateChange);
//           videoTrack.removeEventListener("mute", onTrackStateChange);
//           videoTrack.removeEventListener("unmute", onTrackStateChange);
//         };
//       }
//     }
//   }, [stream]);

//   return (
//     <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
//       {isCameraOff ? (
//         <div className="w-full h-full bg-gray-800 flex items-center justify-center">
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className="h-24 w-24 text-gray-600"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//             />
//           </svg>
//         </div>
//       ) : (
//         <video
//           ref={ref}
//           muted={isLocal}
//           autoPlay
//           playsInline
//           className="w-full h-full object-cover"
//         />
//       )}

//       {/* Screen sharing indicator */}
//       {isScreenShare && (
//         <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
//           <span className="text-xs">🔴</span>
//           <span>Sharing</span>
//         </div>
//       )}

//       <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
//         {isMuted && <MutedIcon />}
//         <span>
//           {username} {isLocal && "(You)"} {isScreenShare && "(Screen)"}
//         </span>
//       </div>
//     </div>
//   );
// };

// const MeetingRoomPage = () => {
//   const { roomId } = useParams();
//   const navigate = useNavigate();

//   const [participants, setParticipants] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);

//   const [streams, setStreams] = useState([]);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isCameraOff, setIsCameraOff] = useState(false);
//   const [isSharingScreen, setIsSharingScreen] = useState(false);

//   const [showCreatePoll, setShowCreatePoll] = useState(false);
//   const [activePoll, setActivePoll] = useState(null);

//   const socketRef = useRef();
//   const peerRef = useRef();
//   const localStreamRef = useRef();
//   const peersRef = useRef({});
//   const screenStreamRef = useRef();

//   const handleAdminMute = (targetSocketId) => {
//     socketRef.current.emit("admin-mute-user", { targetSocketId });
//   };
//   const handleAdminCamOff = (targetSocketId) => {
//     socketRef.current.emit("admin-cam-off-user", { targetSocketId });
//   };
//   const handleAdminKick = (targetSocketId) => {
//     socketRef.current.emit("admin-kick-user", { targetSocketId });
//   };

//   const toggleMute = useCallback((forceMute = false) => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         setIsMuted((prevIsMuted) => {
//           const newMutedState = forceMute ? true : !prevIsMuted;
//           audioTrack.enabled = !newMutedState;
//           if (socketRef.current) {
//             socketRef.current.emit("mute-status-change", {
//               muted: newMutedState,
//             });
//           }
//           return newMutedState;
//         });
//       }
//     }
//   }, []);

//   const toggleCamera = useCallback((forceCamOff = false) => {
//     if (localStreamRef.current) {
//       const videoTrack = localStreamRef.current.getVideoTracks()[0];
//       if (videoTrack) {
//         setIsCameraOff((prevIsCameraOff) => {
//           const newCamOffState = forceCamOff ? true : !prevIsCameraOff;
//           videoTrack.enabled = !newCamOffState;
//           return newCamOffState;
//         });
//       }
//     }
//   }, []);

//   // Complete screen sharing implementation
//   const toggleScreenShare = useCallback(async () => {
//     if (!localStreamRef.current) {
//       console.error("Local stream not available");
//       return;
//     }

//     if (isSharingScreen) {
//       // Stop screen sharing
//       try {
//         if (screenStreamRef.current) {
//           screenStreamRef.current.getTracks().forEach((track) => track.stop());
//           screenStreamRef.current = null;
//         }

//         // Switch back to camera stream
//         const cameraVideoTrack = localStreamRef.current
//           .getVideoTracks()
//           .find(
//             (track) =>
//               track.kind === "video" &&
//               !track.mediaStreamTrack?.label?.includes("screen")
//           );
//         if (cameraVideoTrack) {
//           cameraVideoTrack.enabled = true;
//         }

//         // Remove screen track if it exists
//         localStreamRef.current.getTracks().forEach((track) => {
//           if (
//             track.kind === "video" &&
//             track.mediaStreamTrack?.label?.includes("screen")
//           ) {
//             localStreamRef.current.removeTrack(track);
//           }
//         });

//         // Notify peers to switch back
//         if (socketRef.current && peerRef.current) {
//           socketRef.current.emit("screen-share-stopped", {
//             peerId: peerRef.current.id,
//           });
//         }

//         setIsSharingScreen(false);

//         console.log("Screen sharing stopped");
//       } catch (error) {
//         console.error("Error stopping screen share:", error);
//       }
//     } else {
//       // Start screen sharing
//       try {
//         // Check if screen sharing is supported
//         if (!navigator.mediaDevices.getDisplayMedia) {
//           alert("Screen sharing is not supported in this browser.");
//           return;
//         }

//         // Get screen sharing stream
//         const screenStream = await navigator.mediaDevices.getDisplayMedia({
//           video: {
//             mediaSource: "screen",
//             width: { ideal: 1920 },
//             height: { ideal: 1080 },
//             frameRate: { ideal: 30 },
//           },
//           audio: false, // Screen sharing typically doesn't capture audio
//         });

//         screenStreamRef.current = screenStream;

//         // Replace video track with screen stream
//         const cameraStream = localStreamRef.current;
//         const screenVideoTrack = screenStream.getVideoTracks()[0];
//         const cameraVideoTrack = cameraStream
//           .getVideoTracks()
//           .find(
//             (track) =>
//               track.kind === "video" &&
//               !track.mediaStreamTrack?.label?.includes("screen")
//           );

//         if (cameraVideoTrack) {
//           // Disable camera track
//           cameraVideoTrack.enabled = false;
//         }

//         // Add screen track to local stream
//         cameraStream.addTrack(screenVideoTrack);

//         // Update local stream reference
//         localStreamRef.current = cameraStream;

//         // Update local stream display
//         setStreams((prev) =>
//           prev.map((s) =>
//             s.isLocal ? { ...s, stream: cameraStream, isScreenShare: true } : s
//           )
//         );

//         // Notify peers about screen sharing
//         if (socketRef.current && peerRef.current) {
//           socketRef.current.emit("screen-share-started", {
//             peerId: peerRef.current.id,
//           });
//         }

//         setIsSharingScreen(true);

//         console.log("Screen sharing started");

//         // Handle screen stream end (when user stops sharing)
//         screenVideoTrack.addEventListener("ended", () => {
//           console.log("Screen sharing ended by user");
//           toggleScreenShare();
//         });

//         // Update peer connections with new stream
//         Object.entries(peersRef.current).forEach(([peerId, call]) => {
//           if (call && call.peerConnection) {
//             try {
//               // Replace the video track in the peer connection
//               const sender = call.peerConnection
//                 .getSenders()
//                 .find((s) => s.track?.kind === "video");
//               if (sender && screenVideoTrack) {
//                 sender
//                   .replaceTrack(screenVideoTrack)
//                   .then(() => {
//                     console.log(`Video track replaced for peer ${peerId}`);
//                   })
//                   .catch((err) => {
//                     console.error(
//                       `Failed to replace track for peer ${peerId}:`,
//                       err
//                     );
//                   });
//               }
//             } catch (error) {
//               console.error(`Error updating peer connection ${peerId}:`, error);
//             }
//           }
//         });
//       } catch (error) {
//         console.error("Error starting screen share:", error);
//         if (error.name === "NotAllowedError") {
//           alert(
//             "Screen sharing permission denied. Please allow screen capture to continue."
//           );
//         } else if (error.name === "NotFoundError") {
//           alert(
//             "No screen sharing source found. Please check your browser settings."
//           );
//         } else {
//           alert("Failed to start screen sharing. Please try again.");
//         }
//       }
//     }
//   }, [isSharingScreen]);

//   const handleCreatePoll = (pollData) => {
//     socketRef.current.emit("create-poll", pollData);
//     setShowCreatePoll(false);
//   };

//   const handleVote = (pollId, optionIndex) => {
//     socketRef.current.emit("vote-poll", { pollId, optionIndex });
//   };

//   const handleEndPoll = (pollId) => {
//     socketRef.current.emit("end-poll", { pollId });
//   };

//   useEffect(() => {
//     let isEffectRunning = true;
//     const token = localStorage.getItem("token");
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     let decodedUserInfo;
//     try {
//       const decodedToken = jwtDecode(token);
//       decodedUserInfo = decodedToken.user;
//     } catch (error) {
//       console.error("Token decode error:", error);
//       navigate("/login");
//       return;
//     }

//     const socket = io("http://localhost:5000");
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("Socket connected:", socket.id);
//       setCurrentUser({ ...decodedUserInfo, socketId: socket.id });
//     });

//     // Screen sharing event handlers
//     const handleScreenShareStarted = ({
//       peerId,
//       username,
//       isSharingScreen,
//     }) => {
//       console.log(`${username || peerId} started screen sharing`);
//       setStreams((prev) =>
//         prev.map((s) =>
//           s.peerId === peerId ? { ...s, isScreenShare: isSharingScreen } : s
//         )
//       );

//       // Update participants list
//       setParticipants((prev) =>
//         prev.map((p) =>
//           p.peerId === peerId ? { ...p, isSharingScreen: isSharingScreen } : p
//         )
//       );
//     };

//     const handleScreenShareStopped = ({
//       peerId,
//       username,
//       isSharingScreen,
//     }) => {
//       console.log(`${username || peerId} stopped screen sharing`);
//       setStreams((prev) =>
//         prev.map((s) =>
//           s.peerId === peerId ? { ...s, isScreenShare: isSharingScreen } : s
//         )
//       );

//       // Update participants list
//       setParticipants((prev) =>
//         prev.map((p) =>
//           p.peerId === peerId ? { ...p, isSharingScreen: isSharingScreen } : p
//         )
//       );
//     };

//     const addStream = (
//       peerId,
//       stream,
//       username,
//       initialMutedStatus = false,
//       isScreenShare = false
//     ) => {
//       setStreams((prev) => {
//         if (!prev.some((s) => s.peerId === peerId)) {
//           return [
//             ...prev,
//             {
//               peerId,
//               stream,
//               username,
//               isLocal: false,
//               isMuted: initialMutedStatus,
//               isScreenShare,
//             },
//           ];
//         }
//         return prev.map((s) =>
//           s.peerId === peerId ? { ...s, stream, isScreenShare } : s
//         );
//       });
//     };

//     const handleRemoteMuteChange = ({ peerId, muted }) => {
//       setStreams((prevStreams) =>
//         prevStreams.map((s) =>
//           s.peerId === peerId ? { ...s, isMuted: muted } : s
//         )
//       );
//     };

//     const handleUserDisconnected = (peerId, socketId) => {
//       if (peersRef.current[peerId]) {
//         peersRef.current[peerId].close();
//       }
//       delete peersRef.current[peerId];
//       setStreams((prev) => prev.filter((s) => s.peerId !== peerId));
//       setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
//       console.log(`User ${peerId} disconnected`);
//     };

//     const handleUserConnected = (newParticipant) => {
//       if (!localStreamRef.current || peersRef.current[newParticipant.peerId])
//         return;

//       setParticipants((prev) => {
//         if (!prev.some((p) => p.socketId === newParticipant.socketId)) {
//           return [...prev, newParticipant];
//         }
//         return prev.map((p) =>
//           p.socketId === newParticipant.socketId
//             ? { ...p, ...newParticipant }
//             : p
//         );
//       });

//       const call = peerRef.current.call(
//         newParticipant.peerId,
//         localStreamRef.current
//       );
//       call.on("stream", (remoteStream) => {
//         addStream(
//           call.peer,
//           remoteStream,
//           newParticipant.username,
//           newParticipant.isMuted,
//           newParticipant.isSharingScreen || false
//         );
//       });
//       call.on("close", () => {
//         console.log(`Call with ${call.peer} closed`);
//         delete peersRef.current[call.peer];
//       });
//       peersRef.current[newParticipant.peerId] = call;
//       console.log(`Call initiated to ${newParticipant.username}`);
//     };

//     const handleCall = (call) => {
//       if (!localStreamRef.current || peersRef.current[call.peer]) return;

//       call.answer(localStreamRef.current);
//       call.on("stream", (remoteStream) => {
//         setParticipants((prevParticipants) => {
//           const caller =
//             prevParticipants.find((p) => p.peerId === call.peer) ||
//             participants.find((p) => p.peerId === call.peer);
//           addStream(
//             call.peer,
//             remoteStream,
//             caller?.username,
//             caller?.isMuted || false,
//             caller?.isSharingScreen || false
//           );
//           return prevParticipants;
//         });
//       });
//       call.on("close", () => {
//         console.log(`Call from ${call.peer} closed`);
//         delete peersRef.current[call.peer];
//       });
//       peersRef.current[call.peer] = call;
//       console.log(`Call answered from ${call.peer}`);
//     };

//     const handleRoomParticipants = (allParticipants) => {
//       setParticipants(allParticipants);
//     };

//     const handleForceMute = () => {
//       console.log("Force muted by admin");
//       toggleMute(true);
//     };

//     const handleForceCamOff = () => {
//       console.log("Force camera off by admin");
//       toggleCamera(true);
//     };

//     const handleForceKick = () => {
//       alert("You have been removed from the meeting by an admin.");
//       navigate("/dashboard");
//     };

//     const handleNewPoll = (poll) => {
//       console.log("New poll created:", poll.question);
//       setActivePoll(poll);
//     };

//     const handlePollUpdated = (updatedPoll) => {
//       setActivePoll((prevPoll) => {
//         if (!prevPoll || prevPoll._id === updatedPoll._id) {
//           return updatedPoll;
//         }
//         return prevPoll;
//       });
//     };

//     const init = async () => {
//       try {
//         console.log("Initializing meeting room...");
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             frameRate: { ideal: 30 },
//           },
//           audio: true,
//         });

//         if (!isEffectRunning) {
//           stream.getTracks().forEach((track) => track.stop());
//           return;
//         }

//         localStreamRef.current = stream;

//         const myPeer = new Peer(undefined, {
//           host: "localhost",
//           port: 9000,
//           path: "/",
//         });
//         peerRef.current = myPeer;

//         myPeer.on("open", (peerId) => {
//           console.log("Peer opened:", peerId);
//           socket.emit("join-video-room", roomId, peerId, token);
//           setStreams([
//             {
//               peerId,
//               stream,
//               isLocal: true,
//               username: decodedUserInfo.username,
//               isMuted: false,
//               isScreenShare: false,
//             },
//           ]);
//         });

//         myPeer.on("error", (err) => {
//           console.error("Peer error:", err);
//         });

//         myPeer.on("call", handleCall);

//         // Socket event listeners
//         socket.on("user-connected", handleUserConnected);
//         socket.on("user-disconnected", handleUserDisconnected);
//         socket.on("room-participants", handleRoomParticipants);
//         socket.on("force-mute", handleForceMute);
//         socket.on("force-cam-off", handleForceCamOff);
//         socket.on("force-kick", handleForceKick);
//         socket.on("user-mute-status-changed", handleRemoteMuteChange);
//         socket.on("new-poll", handleNewPoll);
//         socket.on("poll-updated", handlePollUpdated);
//         socket.on("screen-share-started", handleScreenShareStarted);
//         socket.on("screen-share-stopped", handleScreenShareStopped);

//         socket.on("disconnect", () => {
//           console.log("Socket disconnected");
//         });
//       } catch (err) {
//         console.error("Init Error:", err);
//         alert(
//           "Failed to access camera and microphone. Please check your permissions."
//         );
//       }
//     };

//     init();

//     return () => {
//       console.log("Cleaning up meeting room...");
//       isEffectRunning = false;

//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }

//       if (peerRef.current) {
//         peerRef.current.destroy();
//       }

//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((track) => track.stop());
//       }

//       if (screenStreamRef.current) {
//         screenStreamRef.current.getTracks().forEach((track) => track.stop());
//       }

//       Object.values(peersRef.current).forEach((call) => {
//         if (call && call.close) call.close();
//       });

//       setStreams([]);
//       setParticipants([]);
//     };
//   }, [roomId, navigate, toggleMute, toggleCamera]);

//   const leaveMeeting = useCallback(() => {
//     console.log("Leaving meeting...");
//     if (isSharingScreen && screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach((track) => track.stop());
//     }
//     navigate("/dashboard");
//   }, [navigate, isSharingScreen]);

//   const getGridLayout = (count) => {
//     if (count <= 1) return "";
//     if (count === 2) return "grid-cols-1 md:grid-cols-2";
//     if (count <= 4) return "grid-cols-2";
//     if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
//     return "grid-cols-3 lg:grid-cols-4";
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
//       {showCreatePoll && (
//         <CreatePoll
//           onCreate={handleCreatePoll}
//           onCancel={() => setShowCreatePoll(false)}
//         />
//       )}
//       <PollDisplay
//         poll={activePoll}
//         onVote={handleVote}
//         onEnd={handleEndPoll}
//         currentUser={currentUser}
//       />

//       <div className="flex-grow flex flex-col">
//         <header className="p-4 text-center">
//           <h1 className="text-2xl font-bold">Meeting Room</h1>
//           <p className="text-sm text-gray-400">Room ID: {roomId}</p>
//           <p className="text-xs text-gray-500 mt-1">
//             Participants: {streams.length} |
//             {isSharingScreen && " 🔴 Sharing Screen"}
//           </p>
//         </header>

//         <main
//           className={`flex-grow p-4 ${
//             streams.length > 1
//               ? `grid ${getGridLayout(streams.length)} gap-4`
//               : "flex items-center justify-center"
//           }`}
//         >
//           {streams.length === 0 ? (
//             <div className="flex items-center justify-center h-full">
//               <div className="text-center">
//                 <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <svg
//                     className="w-8 h-8 text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                     />
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                     />
//                   </svg>
//                 </div>
//                 <p className="text-gray-400">
//                   Waiting for participants to join...
//                 </p>
//               </div>
//             </div>
//           ) : (
//             streams.map((s) => (
//               <div
//                 key={s.peerId}
//                 className={`bg-black rounded-lg overflow-hidden aspect-video ${
//                   streams.length === 1 ? "w-full max-w-5xl" : ""
//                 }`}
//               >
//                 <Video
//                   stream={s.stream}
//                   isLocal={s.isLocal}
//                   username={s.username}
//                   isMuted={s.isLocal ? isMuted : s.isMuted}
//                   isScreenShare={s.isScreenShare}
//                 />
//               </div>
//             ))
//           )}
//         </main>

//         <footer className="p-4 bg-gray-800 flex justify-center items-center gap-2 md:gap-4">
//           <button
//             onClick={() => toggleMute()}
//             title={isMuted ? "Unmute" : "Mute"}
//             className={`p-3 rounded-full transition-colors ${
//               isMuted
//                 ? "bg-red-500 hover:bg-red-400"
//                 : "bg-gray-600 hover:bg-gray-500"
//             }`}
//           >
//             <svg
//               className="w-6 h-6"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               {isMuted ? (
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5"
//                 />
//               ) : (
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0 0a7.5 7.5 0 005.656-12.844M12 11a3 3 0 11-6 0 3 3 0 016 0z"
//                 />
//               )}
//             </svg>
//           </button>

//           <button
//             onClick={() => toggleCamera()}
//             title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
//             className={`p-3 rounded-full transition-colors ${
//               isCameraOff
//                 ? "bg-red-500 hover:bg-red-400"
//                 : "bg-gray-600 hover:bg-gray-500"
//             }`}
//           >
//             <svg
//               className="w-6 h-6"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
//               />
//             </svg>
//           </button>

//           <button
//             onClick={toggleScreenShare}
//             title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
//             className={`p-3 rounded-full transition-colors ${
//               isSharingScreen
//                 ? "bg-red-500 hover:bg-red-400"
//                 : "bg-gray-600 hover:bg-gray-500"
//             }`}
//             disabled={!localStreamRef.current}
//           >
//             <svg
//               className="w-6 h-6"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//               />
//             </svg>
//           </button>

//           <button
//             onClick={() => setShowCreatePoll(true)}
//             title="Create Poll"
//             className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
//           >
//             <svg
//               className="w-6 h-6"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
//               />
//             </svg>
//           </button>

//           <button
//             onClick={leaveMeeting}
//             title="Leave Meeting"
//             className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
//           >
//             <svg
//               className="w-6 h-6"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//               />
//             </svg>
//           </button>
//         </footer>
//       </div>

//       <aside className="w-64 md:w-80 bg-gray-800 p-4 flex flex-col border-l border-gray-700 hidden md:flex">
//         <h2 className="text-xl font-bold mb-4">
//           Participants ({participants.length + (currentUser ? 1 : 0)})
//         </h2>
//         <ul className="space-y-4 overflow-y-auto flex-grow">
//           {currentUser && (
//             <li className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
//               <div className="flex items-center gap-2">
//                 <span className="font-semibold truncate">
//                   {currentUser.username}
//                 </span>
//                 {isSharingScreen && (
//                   <span className="text-xs bg-red-600 px-2 py-1 rounded-full">
//                     🔴 Sharing
//                   </span>
//                 )}
//                 <span className="text-gray-400">(You)</span>
//               </div>
//               <span className="text-xs font-medium text-blue-400 uppercase">
//                 {currentUser.role}
//               </span>
//             </li>
//           )}
//           {participants.map((p) => (
//             <li
//               key={p.socketId}
//               className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700"
//             >
//               <div className="flex items-center gap-2">
//                 <span className="truncate">{p.username}</span>
//                 {p.isSharingScreen && (
//                   <span className="text-xs bg-red-600 px-2 py-1 rounded-full">
//                     🔴 Sharing
//                   </span>
//                 )}
//               </div>
//               <div className="flex items-center gap-1">
//                 {currentUser?.role === "admin" &&
//                   currentUser.userId !== p.userId && (
//                     <>
//                       <button
//                         onClick={() => handleAdminMute(p.socketId)}
//                         title="Mute User"
//                         className="text-xs bg-yellow-600 hover:bg-yellow-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
//                       >
//                         M
//                       </button>
//                       <button
//                         onClick={() => handleAdminCamOff(p.socketId)}
//                         title="Turn Off Camera"
//                         className="text-xs bg-blue-600 hover:bg-blue-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
//                       >
//                         C
//                       </button>
//                       <button
//                         onClick={() => handleAdminKick(p.socketId)}
//                         title="Remove User"
//                         className="text-xs bg-red-600 hover:bg-red-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
//                       >
//                         K
//                       </button>
//                     </>
//                   )}
//               </div>
//             </li>
//           ))}
//         </ul>
//       </aside>
//     </div>
//   );
// };

// export default MeetingRoomPage;





// src/pages/MeetingRoomPage.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import CreatePoll from '../components/CreatePoll';
import PollDisplay from '../components/PollDisplay';

// --- UI COMPONENTS ---
const MutedIcon = () => (
  <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-4 h-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Video = ({ 
  stream, 
  isLocal, 
  username, 
  isMuted, 
  isScreenShare = false, 
  isCameraOff = false,
  isRoomAdmin = false
}) => {
  const ref = useRef();
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (stream && !videoError) {
      try {
        console.log(`📹 Setting stream for ${username}`);
        ref.current.srcObject = stream;
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.enabled) {
          console.log(`✅ ${username} video track enabled`);
          setIsPlaying(true);
        } else {
          console.log(`⚠️ ${username} video track disabled or missing`);
          setIsPlaying(false);
        }
      } catch (error) {
        console.error(`❌ Error setting video stream for ${username}:`, error);
        setVideoError(true);
      }
    }
  }, [stream, videoError, username]);

  const handleVideoError = (e) => {
    console.error('Video element error:', e);
    setVideoError(true);
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center group">
      {/* Error state */}
      {videoError ? (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="h-16 w-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm">Video error</p>
          </div>
        </div>
      ) : !isCameraOff ? (
        <video 
          ref={ref} 
          muted={isLocal} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
          onError={handleVideoError}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
      
      {/* Screen sharing indicator */}
      {isScreenShare && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
          <span className="text-xs">🔴</span>
          <span>Sharing</span>
        </div>
      )}
      
      {/* Admin indicator */}
      {isLocal && isRoomAdmin && (
        <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
          <AdminIcon />
          <span>Admin</span>
        </div>
      )}
      
      {/* User info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded flex items-center gap-2 z-10">
        {isMuted && <MutedIcon />}
        <span className="truncate max-w-[150px]">
          {username} {isLocal && '(You)'} {isScreenShare && '(Screen)'}
        </span>
      </div>
    </div>
  );
};

const MeetingRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // States
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRoomAdmin, setIsRoomAdmin] = useState(false);
  const [streams, setStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Refs
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const peersRef = useRef({});

  // Helper functions
  const addStream = useCallback((peerId, stream, username, initialMutedStatus = false, isScreenShare = false) => {
    console.log(`📹 Adding stream for ${username} (${peerId})`);
    
    setStreams(prev => {
      const existingIndex = prev.findIndex(s => s.peerId === peerId);
      if (existingIndex === -1) {
        const newStream = { 
          peerId, 
          stream, 
          username, 
          isLocal: false, 
          isMuted: initialMutedStatus,
          isScreenShare,
          isCameraOff: false
        };
        console.log('✅ New stream added:', newStream.username);
        return [...prev, newStream];
      }
      
      const updatedStreams = [...prev];
      updatedStreams[existingIndex] = {
        ...updatedStreams[existingIndex],
        stream,
        isScreenShare
      };
      console.log('🔄 Stream updated:', peerId);
      return updatedStreams;
    });
  }, []);

  const removeStream = useCallback((peerId) => {
    console.log(`🗑️ Removing stream for ${peerId}`);
    setStreams(prev => {
      const updated = prev.filter(s => s.peerId !== peerId);
      console.log(`📊 Streams after removal: ${updated.length}`);
      return updated;
    });
  }, []);

  const cleanupPeerConnections = useCallback(() => {
    console.log('🧹 Cleaning up peer connections...');
    Object.entries(peersRef.current).forEach(([peerId, call]) => {
      if (call) {
        console.log(`🔌 Closing peer connection to ${peerId}`);
        call.close();
      }
    });
    peersRef.current = {};
  }, []);

  // Admin control handlers
  const handleAdminMute = useCallback((targetSocketId) => {
    console.log(`🔇 Admin mute request for ${targetSocketId}`);
    if (socketRef.current) {
      socketRef.current.emit('admin-mute-user', { targetSocketId });
    }
  }, []);

  const handleAdminCamOff = useCallback((targetSocketId) => {
    console.log(`📹 Admin camera off request for ${targetSocketId}`);
    if (socketRef.current) {
      socketRef.current.emit('admin-cam-off-user', { targetSocketId });
    }
  }, []);

  const handleAdminKick = useCallback((targetSocketId) => {
    console.log(`🚪 Admin kick request for ${targetSocketId}`);
    if (socketRef.current) {
      socketRef.current.emit('admin-kick-user', { targetSocketId });
    }
  }, []);

  const handleAdminMuteAll = useCallback(() => {
    console.log('🔇 Admin mute all request');
    if (socketRef.current) {
      socketRef.current.emit('admin-mute-all');
    }
  }, []);

  // Media controls
  const toggleMute = useCallback((forceMute = false) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        setIsMuted(prevIsMuted => {
          const newMutedState = forceMute ? true : !prevIsMuted;
          audioTrack.enabled = !newMutedState;
          console.log(`🔊 ${newMutedState ? 'Muted' : 'Unmuted'}`);
          if (socketRef.current) {
            socketRef.current.emit('mute-status-change', { muted: newMutedState });
          }
          return newMutedState;
        });
      }
    }
  }, []);

  const toggleCamera = useCallback((forceCamOff = false) => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        setIsCameraOff(prevIsCameraOff => {
          const newCamOffState = forceCamOff ? true : !prevIsCameraOff;
          videoTrack.enabled = !newCamOffState;
          console.log(`📹 ${newCamOffState ? 'Camera Off' : 'Camera On'}`);
          return newCamOffState;
        });
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;

    if (isSharingScreen) {
      try {
        console.log('🖥️ Stopping screen share');
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const cameraVideoTrack = localStreamRef.current.getVideoTracks().find(track => 
          track.kind === 'video' && !track.label?.toLowerCase().includes('screen')
        );
        if (cameraVideoTrack) {
          cameraVideoTrack.enabled = true;
        }
        
        localStreamRef.current.getTracks().forEach(track => {
          if (track.kind === 'video' && track.label?.toLowerCase().includes('screen')) {
            localStreamRef.current.removeTrack(track);
          }
        });
        
        if (socketRef.current && peerRef.current) {
          socketRef.current.emit('screen-share-stopped', { peerId: peerRef.current.id });
        }
        
        setIsSharingScreen(false);
        setStreams(prev => prev.map(s => 
          s.isLocal ? { ...s, isScreenShare: false } : s
        ));
      } catch (error) {
        console.error('❌ Error stopping screen share:', error);
      }
    } else {
      try {
        console.log('🖥️ Starting screen share');
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            mediaSource: 'screen',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        
        screenStreamRef.current = screenStream;
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        const cameraVideoTrack = localStreamRef.current.getVideoTracks().find(track => 
          track.kind === 'video' && !track.label?.toLowerCase().includes('screen')
        );
        
        if (cameraVideoTrack) {
          cameraVideoTrack.enabled = false;
        }
        
        localStreamRef.current.addTrack(screenVideoTrack);
        
        setIsSharingScreen(true);
        setStreams(prev => prev.map(s => 
          s.isLocal ? { ...s, isScreenShare: true } : s
        ));
        
        if (socketRef.current && peerRef.current) {
          socketRef.current.emit('screen-share-started', { peerId: peerRef.current.id });
        }
        
        screenVideoTrack.addEventListener('ended', () => {
          console.log('🖥️ Screen share ended by user');
          toggleScreenShare();
        });
        
      } catch (error) {
        console.error('❌ Error starting screen share:', error);
        if (error.name === 'NotAllowedError') {
          alert('Screen sharing permission denied. Please allow screen capture.');
        } else {
          alert('Failed to start screen sharing. Please try again.');
        }
      }
    }
  }, [isSharingScreen]);

  // Poll handlers
  const handleCreatePoll = useCallback((pollData) => {
    console.log('📊 Creating poll:', pollData.question);
    if (socketRef.current) {
      socketRef.current.emit('create-poll', pollData);
    }
    setShowCreatePoll(false);
  }, []);

  const handleVote = useCallback((pollId, optionIndex) => {
    console.log(`🗳️ Voting on poll ${pollId}, option ${optionIndex}`);
    if (socketRef.current) {
      socketRef.current.emit('vote-poll', { pollId, optionIndex });
    }
  }, []);

  const handleEndPoll = useCallback((pollId) => {
    console.log(`⏹️ Ending poll ${pollId}`);
    if (socketRef.current) {
      socketRef.current.emit('end-poll', { pollId });
    }
  }, []);

  // Connection handlers (defined before useEffect to avoid dependency issues)
  const handleUserConnected = useCallback((newParticipant) => {
    console.log(`👤 User connected: ${newParticipant.username} (${newParticipant.peerId})`);
    
    if (!localStreamRef.current) {
      console.log('⏳ Local stream not ready yet');
      return;
    }
    
    if (peersRef.current[newParticipant.peerId]) {
      console.log(`⚠️ Already connected to ${newParticipant.peerId}`);
      return;
    }
    
    // Update participants
    setParticipants(prev => {
      const existingIndex = prev.findIndex(p => p.socketId === newParticipant.socketId);
      if (existingIndex === -1) {
        console.log(`➕ Adding participant: ${newParticipant.username}`);
        return [...prev, newParticipant];
      }
      return prev.map(p => p.socketId === newParticipant.socketId ? { ...p, ...newParticipant } : p);
    });
    
    // Update admin status
    if (newParticipant.isRoomAdmin && newParticipant.socketId === socketRef.current?.id) {
      setIsRoomAdmin(true);
      console.log('👑 You are now room admin');
    }
    
    // Create peer connection
    try {
      console.log(`📞 Creating call to ${newParticipant.peerId}`);
      const call = peerRef.current.call(newParticipant.peerId, localStreamRef.current);
      
      call.on('stream', (remoteStream) => {
        console.log(`📹 Received stream from ${newParticipant.username}`);
        addStream(
          call.peer, 
          remoteStream, 
          newParticipant.username, 
          newParticipant.isMuted || false,
          newParticipant.isSharingScreen || false
        );
      });
      
      call.on('close', () => {
        console.log(`🔌 Call closed with ${newParticipant.peerId}`);
        delete peersRef.current[newParticipant.peerId];
        removeStream(newParticipant.peerId);
      });
      
      call.on('error', (err) => {
        console.error(`❌ Call error with ${newParticipant.peerId}:`, err);
        delete peersRef.current[newParticipant.peerId];
        removeStream(newParticipant.peerId);
      });
      
      peersRef.current[newParticipant.peerId] = call;
      console.log(`✅ Call initiated to ${newParticipant.username}`);
      
    } catch (error) {
      console.error(`❌ Error creating call to ${newParticipant.peerId}:`, error);
    }
  }, [addStream, removeStream]);

  const handleCall = useCallback((call) => {
    console.log(`📞 Incoming call from ${call.peer}`);
    
    if (!localStreamRef.current) {
      console.log('⏳ Local stream not ready, rejecting call');
      call.close();
      return;
    }
    
    if (peersRef.current[call.peer]) {
      console.log(`⚠️ Already connected to ${call.peer}, rejecting call`);
      call.close();
      return;
    }
    
    try {
      console.log(`✅ Answering call from ${call.peer}`);
      call.answer(localStreamRef.current);
      
      call.on('stream', (remoteStream) => {
        console.log(`📹 Received stream from incoming call ${call.peer}`);
        
        const caller = participants.find(p => p.peerId === call.peer) || 
                      { username: `User-${call.peer.slice(-4)}`, isMuted: false, isSharingScreen: false };
        
        addStream(
          call.peer, 
          remoteStream, 
          caller.username, 
          caller.isMuted || false,
          caller.isSharingScreen || false
        );
      });
      
      call.on('close', () => {
        console.log(`🔌 Incoming call closed from ${call.peer}`);
        delete peersRef.current[call.peer];
        removeStream(call.peer);
      });
      
      call.on('error', (err) => {
        console.error(`❌ Incoming call error from ${call.peer}:`, err);
        delete peersRef.current[call.peer];
        removeStream(call.peer);
      });
      
      peersRef.current[call.peer] = call;
      
    } catch (error) {
      console.error(`❌ Error answering call from ${call.peer}:`, error);
      call.close();
    }
  }, [localStreamRef, participants, addStream, removeStream]);

  const handleUserDisconnected = useCallback((peerId, socketId) => {
    console.log(`👋 User disconnected: ${peerId}, socket: ${socketId}`);
    
    if (peersRef.current[peerId]) {
      console.log(`🔌 Closing peer connection to ${peerId}`);
      peersRef.current[peerId].close();
    }
    
    delete peersRef.current[peerId];
    removeStream(peerId);
    
    setParticipants(prev => {
      const updated = prev.filter(p => p.socketId !== socketId);
      console.log(`📊 Participants after disconnect: ${updated.length}`);
      return updated;
    });
  }, [removeStream]);

  const handleRoomParticipants = useCallback((allParticipants) => {
    console.log(`📋 Room participants updated: ${allParticipants.length}`);
    setParticipants(allParticipants);
    
    // Check if current user is admin
    if (socketRef.current) {
      const currentAdmin = allParticipants.find(p => p.socketId === socketRef.current.id);
      if (currentAdmin) {
        setIsRoomAdmin(currentAdmin.isRoomAdmin);
        console.log(`👑 Current user isRoomAdmin: ${currentAdmin.isRoomAdmin}`);
      }
    }
  }, []);

  const handleRemoteMuteChange = useCallback(({ peerId, muted, username }) => {
    console.log(`🔇 ${username} was ${muted ? 'muted' : 'unmuted'}`);
    setStreams(prevStreams => 
      prevStreams.map(s => 
        s.peerId === peerId ? { ...s, isMuted: muted } : s
      )
    );
  }, []);

  const handleScreenShareStarted = useCallback(({ peerId, username, isSharingScreen }) => {
    console.log(`🖥️ ${username} started screen sharing`);
    setStreams(prev => prev.map(s => 
      s.peerId === peerId ? { ...s, isScreenShare } : s
    ));
    setParticipants(prev => prev.map(p => 
      p.peerId === peerId ? { ...p, isSharingScreen } : p
    ));
  }, []);

  const handleScreenShareStopped = useCallback(({ peerId, username, isSharingScreen }) => {
    console.log(`🖥️ ${username} stopped screen sharing`);
    setStreams(prev => prev.map(s => 
      s.peerId === peerId ? { ...s, isScreenShare } : s
    ));
    setParticipants(prev => prev.map(p => 
      p.peerId === peerId ? { ...p, isSharingScreen } : p
    ));
  }, []);

  const handleForceMute = useCallback(() => {
    console.log('🔇 Force muted by admin');
    toggleMute(true);
  }, [toggleMute]);

  const handleForceCamOff = useCallback(() => {
    console.log('📹 Force camera off by admin');
    toggleCamera(true);
  }, [toggleCamera]);

  const handleForceKick = useCallback(() => {
    console.log('🚪 Kicked by admin');
    alert("You have been removed from the meeting by an admin.");
    
    // Clean up
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    cleanupPeerConnections();
    navigate('/dashboard');
  }, [navigate, cleanupPeerConnections]);

  const handleNewPoll = useCallback((poll) => {
    console.log('📊 New poll:', poll.question);
    setActivePoll(poll);
  }, []);

  const handlePollUpdated = useCallback((updatedPoll) => {
    setActivePoll(prevPoll => {
      if (!prevPoll || prevPoll._id === updatedPoll._id) {
        return updatedPoll;
      }
      return prevPoll;
    });
  }, []);

  // Main useEffect
  useEffect(() => {
    let isEffectRunning = true;
    
    const token = localStorage.getItem('token');
    if (!token) { 
      navigate('/login'); 
      return; 
    }

    let decodedUserInfo;
    try {
      const decodedToken = jwtDecode(token);
      decodedUserInfo = decodedToken.user;
    } catch (error) { 
      console.error('❌ Token decode error:', error);
      navigate('/login'); 
      return; 
    }
    
    const socket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => { 
      console.log('🔌 Socket connected:', socket.id);
      setCurrentUser({ ...decodedUserInfo, socketId: socket.id }); 
      setConnectionStatus('Connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnectionStatus(`Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setConnectionStatus(`Connection Error: ${error.message}`);
    });

    // Admin error handling
    socket.on('admin-error', (message) => {
      console.log('⚠️ Admin error:', message);
      setAdminError(message);
      setTimeout(() => setAdminError(''), 3000);
    });

    // Room events
    socket.on('user-connected', handleUserConnected);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('room-participants', handleRoomParticipants);
    socket.on('force-mute', handleForceMute);
    socket.on('force-cam-off', handleForceCamOff);
    socket.on('force-kick', handleForceKick);
    socket.on('user-mute-status-changed', handleRemoteMuteChange);
    socket.on('new-poll', handleNewPoll);
    socket.on('poll-updated', handlePollUpdated);
    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);
    socket.on('auth-error', (message) => {
      console.error('❌ Auth error:', message);
      alert(`Authentication error: ${message}`);
      navigate('/login');
    });
    socket.on('already-joined', (message) => {
      console.log('⚠️ Already joined:', message);
      alert(message);
    });

    // Initialize WebRTC
    let initPromise;
    const init = async () => {
      try {
        console.log('🎥 Initializing meeting room...');
        setConnectionStatus('Getting media...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }, 
          audio: true 
        });
        
        console.log('✅ Media stream obtained');
        
        if (!isEffectRunning) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        setConnectionStatus('Creating peer...');

        const myPeer = new Peer(undefined, { 
          host: 'localhost', 
          port: 9000, 
          path: '/',
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          },
          debug: 2 // Enable debug logging
        });
        
        peerRef.current = myPeer;

        myPeer.on('open', (peerId) => {
          console.log('🔑 Peer opened:', peerId);
          setConnectionStatus('Joining room...');
          socket.emit('join-video-room', roomId, peerId, token);
          
          // Add local stream
          setStreams([{
            peerId, 
            stream, 
            isLocal: true, 
            username: decodedUserInfo.username, 
            isMuted: false,
            isScreenShare: false,
            isCameraOff: false
          }]);
          
          setConnectionStatus('Connected');
        });

        myPeer.on('error', (err) => {
          console.error('❌ Peer error:', err);
          setConnectionStatus(`Peer Error: ${err.type}`);
        });

        myPeer.on('disconnected', () => {
          console.log('🔌 Peer disconnected');
          setConnectionStatus('Peer Disconnected');
        });

        myPeer.on('call', handleCall);
        
        initPromise = Promise.resolve();
        
      } catch (err) { 
        console.error("❌ Init Error:", err);
        setConnectionStatus(`Media Error: ${err.message}`);
        alert('Failed to access camera and microphone. Please check your permissions.');
      }
    };
    
    init();

    return () => {
      console.log('🧹 Cleaning up...');
      isEffectRunning = false;
      
      if (initPromise) {
        // Wait for init to complete before cleanup
        initPromise.finally(() => {
          cleanupPeerConnections();
          if (socketRef.current) { 
            socketRef.current.disconnect(); 
          }
          if (peerRef.current) { 
            peerRef.current.destroy(); 
          }
          if (localStreamRef.current) { 
            localStreamRef.current.getTracks().forEach(track => track.stop()); 
          }
          setStreams([]);
          setParticipants([]);
        });
      } else {
        cleanupPeerConnections();
        if (socketRef.current) { 
          socketRef.current.disconnect(); 
        }
        if (peerRef.current) { 
          peerRef.current.destroy(); 
        }
        if (localStreamRef.current) { 
          localStreamRef.current.getTracks().forEach(track => track.stop()); 
        }
        setStreams([]);
        setParticipants([]);
      }
    };
  }, []); // Empty dependency array - only run once

  const leaveMeeting = useCallback(() => {
    console.log('👋 Leaving meeting...');
    cleanupPeerConnections();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/dashboard');
  }, [navigate, cleanupPeerConnections]);

  const getGridLayout = (count) => {
    if (count === 0) return "flex items-center justify-center";
    if (count === 1) return "flex items-center justify-center";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-4";
    if (count <= 4) return "grid grid-cols-2 gap-4";
    if (count <= 6) return "grid grid-cols-2 lg:grid-cols-3 gap-4";
    return "grid grid-cols-3 lg:grid-cols-4 gap-4";
  };

  // Show loading state while currentUser is being set
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Joining meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      {/* Connection Status */}
      <div className="fixed top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded text-sm z-50">
        {connectionStatus}
      </div>

      {/* Admin Error Notification */}
      {adminError && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {adminError}
        </div>
      )}

      {showCreatePoll && <CreatePoll onCreate={handleCreatePoll} onCancel={() => setShowCreatePoll(false)} />}
      <PollDisplay 
        poll={activePoll} 
        onVote={handleVote} 
        onEnd={handleEndPoll}
        currentUser={currentUser}
      />

      <div className="flex-grow flex flex-col">
        <header className="p-4 text-center border-b border-gray-700">
          <h1 className="text-2xl font-bold">Meeting Room</h1>
          <p className="text-sm text-gray-400">Room ID: {roomId}</p>
          <p className="text-xs text-gray-500 mt-1">
            Participants: {streams.length} | 
            {isRoomAdmin && ' 👑 Admin Mode'} 
            {isSharingScreen && ' 🔴 Sharing Screen'}
          </p>
        </header>
        
        <main className={`flex-grow p-4 ${getGridLayout(streams.length)}`}>
          {streams.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-gray-400">Waiting for participants to join...</p>
              </div>
            </div>
          ) : (
            streams.map((s) => (
              <div 
                key={s.peerId} 
                className={`bg-black rounded-lg overflow-hidden aspect-video ${streams.length === 1 ? 'w-full max-w-5xl' : ''}`}
              >
                <Video 
                  stream={s.stream} 
                  isLocal={s.isLocal} 
                  username={s.username} 
                  isMuted={s.isLocal ? isMuted : s.isMuted}
                  isScreenShare={s.isScreenShare}
                  isCameraOff={s.isLocal ? isCameraOff : s.isCameraOff}
                  isRoomAdmin={s.isLocal ? isRoomAdmin : false}
                />
              </div>
            ))
          )}
        </main>

        <footer className="p-4 bg-gray-800 flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-4">
          {/* User Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <button 
              onClick={() => toggleMute()} 
              title={isMuted ? "Unmute" : "Mute"} 
              className={`p-3 rounded-full transition-colors ${
                isMuted ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0 0a7.5 7.5 0 005.656-12.844M12 11a3 3 0 11-6 0 3 3 0 016 0z" />
                )}
              </svg>
            </button>
            
            <button 
              onClick={() => toggleCamera()} 
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"} 
              className={`p-3 rounded-full transition-colors ${
                isCameraOff ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button 
              onClick={toggleScreenShare} 
              title={isSharingScreen ? "Stop Sharing" : "Share Screen"} 
              className={`p-3 rounded-full transition-colors ${
                isSharingScreen ? 'bg-red-500 hover:bg-red-400' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              disabled={!localStreamRef.current}
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Admin Controls */}
          {isRoomAdmin && (
            <div className="flex items-center gap-2 border-t border-gray-700 pt-2 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
              <button 
                onClick={handleAdminMuteAll}
                title="Mute All Users"
                className="p-2 rounded-full bg-yellow-600 hover:bg-yellow-500 transition-colors"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </button>
              <span className="text-xs text-yellow-400 hidden sm:block">Admin</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCreatePoll(true)} 
              title="Create Poll" 
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            <button 
              onClick={leaveMeeting} 
              title="Leave Meeting" 
              className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
            >
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
      
      {/* Participants Sidebar */}
      <aside className="w-64 md:w-80 bg-gray-800 p-4 flex flex-col border-l border-gray-700 hidden md:flex">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Participants ({participants.length + (currentUser ? 1 : 0)})
          {isRoomAdmin && <span className="text-yellow-400 text-sm">👑</span>}
        </h2>
        
        <div className="flex-grow overflow-y-auto">
          <ul className="space-y-3">
            {/* Current User */}
            {currentUser && (
              <li className={`flex items-center justify-between p-3 rounded-lg ${
                isRoomAdmin ? 'bg-yellow-900/30 border border-yellow-500' : 'bg-gray-700'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isMuted ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <span className="font-semibold truncate">{currentUser.username}</span>
                  {isRoomAdmin && (
                    <span className="text-yellow-400 text-xs flex items-center gap-1">
                      <AdminIcon /> Admin
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">(You)</span>
                </div>
                {isRoomAdmin && (
                  <span className="text-yellow-400 text-xs font-medium">Room Admin</span>
                )}
              </li>
            )}
            
            {/* Other Participants */}
            {participants.map(p => {
              const isParticipantAdmin = p.isRoomAdmin || p.role === 'admin';
              const hasStream = streams.some(s => s.peerId === p.peerId && s.stream);
              const isCurrentUser = p.socketId === socketRef.current?.id;
              
              return (
                <li 
                  key={p.socketId} 
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors ${
                    isParticipantAdmin ? 'bg-yellow-900/20 border border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${
                      p.isMuted ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <span className="truncate">{p.username}</span>
                    {!hasStream && !isCurrentUser && (
                      <span className="text-xs text-gray-400">No video</span>
                    )}
                    {p.isSharingScreen && (
                      <span className="text-xs bg-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                        🔴 Sharing
                      </span>
                    )}
                    {isParticipantAdmin && !isCurrentUser && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <AdminIcon /> Admin
                      </span>
                    )}
                  </div>
                  
                  {/* Admin Controls - only show for other users */}
                  {isRoomAdmin && !isCurrentUser && currentUser?.userId !== p.userId && (
                    <div className="flex items-center gap-1 ml-2">
                      <button 
                        onClick={() => handleAdminMute(p.socketId)}
                        title="Mute User"
                        className="text-xs bg-yellow-600 hover:bg-yellow-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
                      >
                        M
                      </button>
                      <button 
                        onClick={() => handleAdminCamOff(p.socketId)}
                        title="Turn Off Camera"
                        className="text-xs bg-blue-600 hover:bg-blue-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
                      >
                        C
                      </button>
                      <button 
                        onClick={() => handleAdminKick(p.socketId)}
                        title="Remove User"
                        className="text-xs bg-red-600 hover:bg-red-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold transition-colors"
                      >
                        K
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default MeetingRoomPage;