// src/pages/MeetingRoomPage.jsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Peer from "peerjs";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode"; // <-- IMPORT THE NEW LIBRARY

// The Video component remains the same.
const Video = ({ stream, isLocal }) => {
  const ref = useRef();
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (stream) {
      ref.current.srcObject = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const handleTrackStateChange = () =>
          setIsCameraOff(!videoTrack.enabled);
        handleTrackStateChange();
        const onTrackStateChange = () => handleTrackStateChange();
        videoTrack.addEventListener("ended", onTrackStateChange);
        videoTrack.addEventListener("mute", onTrackStateChange);
        videoTrack.addEventListener("unmute", onTrackStateChange);
        return () => {
          videoTrack.removeEventListener("ended", onTrackStateChange);
          videoTrack.removeEventListener("mute", onTrackStateChange);
          videoTrack.removeEventListener("unmute", onTrackStateChange);
        };
      }
    }
  }, [stream]);

  if (isCameraOff) {
    return (
      <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
        <svg
          xmlns="http://www.w.org/2000/svg"
          className="h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0-0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      muted={isLocal}
      autoPlay
      playsInline
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

const MeetingRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [streams, setStreams] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const peersRef = useRef({});
  const screenStreamRef = useRef();

  const handleAdminMute = (targetSocketId) => {
    if (socketRef.current) {
      socketRef.current.emit("admin-mute-user", { targetSocketId });
    }
  };

  const addStream = useCallback((peerId, stream, username) => {
    setStreams((prev) => {
      if (!prev.some((s) => s.peerId === peerId)) {
        return [...prev, { peerId, stream, username, isLocal: false }];
      }
      return prev;
    });
  }, []);

  const handleUserDisconnected = useCallback((peerId, socketId) => {
    console.log(`User disconnected: ${peerId}`);
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close();
    }
    delete peersRef.current[peerId];
    setStreams((prev) => prev.filter((s) => s.peerId !== peerId));
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
  }, []);

  useEffect(() => {
    let isEffectRunning = true;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // --- THE FIX IS HERE: Decode the token to get user info immediately ---
    try {
      const decodedToken = jwtDecode(token);
      setCurrentUser({
        username: decodedToken.user.username,
        role: decodedToken.user.role,
        id: decodedToken.user.id,
      });
    } catch (error) {
      console.error("Invalid token:", error);
      navigate("/login");
      return;
    }

    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    const handleUserConnected = (newParticipant) => {
      if (peersRef.current[newParticipant.peerId] || !localStreamRef.current)
        return;
      console.log(
        `New user connected: ${newParticipant.username}. Calling them.`
      );

      setParticipants((prev) => {
        if (!prev.some((p) => p.socketId === newParticipant.socketId)) {
          return [...prev, newParticipant];
        }
        return prev;
      });

      const call = peerRef.current.call(
        newParticipant.peerId,
        localStreamRef.current
      );
      call.on("stream", (remoteStream) => {
        addStream(call.peer, remoteStream, newParticipant.username);
      });
      peersRef.current[newParticipant.peerId] = call;
    };

    const handleCall = (call) => {
      if (peersRef.current[call.peer] || !localStreamRef.current) return;
      console.log(`Receiving call from ${call.peer}`);
      call.answer(localStreamRef.current);

      call.on("stream", (remoteStream) => {
        const caller = participants.find((p) => p.peerId === call.peer);
        addStream(call.peer, remoteStream, caller?.username);
      });
      peersRef.current[call.peer] = call;
    };

    const handleRoomParticipants = (existingParticipants) => {
      setParticipants(existingParticipants);
    };

    const handleForceMute = () => {
      toggleMute(true);
    };

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!isEffectRunning) return;
        localStreamRef.current = stream;

        const myPeer = new Peer(undefined, {
          host: "localhost",
          port: 9000,
          path: "/",
        });
        peerRef.current = myPeer;

        myPeer.on("open", (peerId) => {
          socket.emit("join-video-room", roomId, peerId, token);
          setStreams([{ peerId, stream, isLocal: true, username: "You" }]);
        });

        myPeer.on("call", handleCall);
        socket.on("user-connected", handleUserConnected);
        socket.on("user-disconnected", handleUserDisconnected);
        socket.on("room-participants", handleRoomParticipants);
        socket.on("force-mute", handleForceMute);
      } catch (err) {
        console.error("Init Error", err);
      }
    };

    init();

    return () => {
      isEffectRunning = false;
      console.log("Cleaning up MeetingRoomPage effect");
      if (socketRef.current) {
        socketRef.current.off("user-connected", handleUserConnected);
        socketRef.current.off("user-disconnected", handleUserDisconnected);
        socketRef.current.off("room-participants", handleRoomParticipants);
        socketRef.current.off("force-mute", handleForceMute);
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.off("call", handleCall);
        peerRef.current.destroy();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((call) => call.close());
      peersRef.current = {};
    };
  }, [roomId, addStream, handleUserDisconnected, navigate]);

  const toggleMute = useCallback(
    (forceMute = false) => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          const newMutedState = forceMute ? true : !isMuted;
          audioTrack.enabled = !newMutedState;
          setIsMuted(newMutedState);
        }
      }
    },
    [isMuted]
  );

  // These functions no longer need useCallback as they aren't in the dependency array
  const toggleCamera = () => {
    /* ... same as before ... */
  };
  const toggleScreenShare = async () => {
    /* ... same as before ... */
  };
  const leaveMeeting = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-grow flex flex-col">
        <header className="p-4 text-center">
          <h1 className="text-2xl font-bold">Meeting Room</h1>
          <p className="text-sm text-gray-400">Room ID: {roomId}</p>
        </header>

        <main className="flex-grow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((s) => (
            <div
              key={s.peerId}
              className="bg-black rounded-lg overflow-hidden relative"
            >
              <Video stream={s.stream} isLocal={s.isLocal} />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                {s.username}
              </div>
            </div>
          ))}
        </main>

        <footer className="p-4 bg-gray-800 flex justify-center items-center gap-4">
          <button
            onClick={() => toggleMute()}
            className={`p-3 rounded-full ${
              isMuted ? "bg-red-500" : "bg-gray-600"
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          {/* ... other buttons ... */}
        </footer>
      </div>

      <aside className="w-80 bg-gray-800 p-4 flex flex-col border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4">
          Participants ({participants.length + 1})
        </h2>
        <ul className="space-y-4 overflow-y-auto">
          {currentUser && (
            <li className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
              <span className="font-semibold">
                {currentUser.username} (You)
              </span>
              <span className="text-xs font-medium text-blue-400 uppercase">
                {currentUser.role}
              </span>
            </li>
          )}
          {participants.map((p) => (
            <li
              key={p.socketId}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700"
            >
              <span>{p.username}</span>
              <div className="flex items-center gap-2">
                {currentUser?.role === "admin" && (
                  <button
                    onClick={() => handleAdminMute(p.socketId)}
                    className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-full"
                  >
                    Mute
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default MeetingRoomPage;
