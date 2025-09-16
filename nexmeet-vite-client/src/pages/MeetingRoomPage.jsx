// src/pages/MeetingRoomPage.jsx

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Peer from "peerjs";
import io from "socket.io-client";

// A simple component to render each video stream
const Video = ({ stream, muted }) => {
  const ref = useRef();

  useEffect(() => {
    if (stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      muted={muted}
      autoPlay
      playsInline
      className="w-full h-full object-cover rounded-lg"
    />
  );
};

const MeetingRoomPage = () => {
  const { roomId } = useParams();
  const [peers, setPeers] = useState({});
  const [streams, setStreams] = useState([]); // State to hold all video streams
  const peerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");
    peerRef.current = new Peer(undefined, {
      host: "localhost",
      port: 9000,
      path: "/",
    });

    // Get user's video and audio stream
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((localStream) => {
        // Add our own local stream to the streams array
        setStreams([{ peerId: "local", stream: localStream, isLocal: true }]);

        // When someone calls us
        peerRef.current.on("call", (call) => {
          console.log("Receiving a call from", call.peer);
          call.answer(localStream); // Answer the call with our local stream

          // When we receive their stream
          call.on("stream", (remoteStream) => {
            // Add the remote stream to the streams array
            setStreams((prevStreams) => [
              ...prevStreams,
              { peerId: call.peer, stream: remoteStream },
            ]);
          });

          // Store the peer connection
          setPeers((prev) => ({ ...prev, [call.peer]: call }));
        });

        // When a new user connects to the room
        socketRef.current.on("user-connected", (peerId) => {
          console.log("User connected:", peerId);
          // Call the new user
          const call = peerRef.current.call(peerId, localStream);

          // When they send us their stream
          call.on("stream", (remoteStream) => {
            // Add their stream to our state
            setStreams((prevStreams) => [
              ...prevStreams,
              { peerId: call.peer, stream: remoteStream },
            ]);
          });

          setPeers((prev) => ({ ...prev, [call.peer]: call }));
        });
      });

    // Announce our arrival
    peerRef.current.on("open", (id) => {
      console.log("My PeerJS ID is:", id);
      socketRef.current.emit("join-video-room", roomId, id);
    });

    // When a user disconnects
    socketRef.current.on("user-disconnected", (peerId) => {
      console.log("User disconnected:", peerId);
      if (peers[peerId]) peers[peerId].close();
      // Remove the disconnected user's stream from the state
      setStreams((prevStreams) =>
        prevStreams.filter((s) => s.peerId !== peerId)
      );
    });

    return () => {
      socketRef.current.disconnect();
      peerRef.current.destroy();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold">Meeting Room</h1>
        <p className="text-sm text-gray-400">Room ID: {roomId}</p>
      </header>
      <main className="flex-grow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Map over the streams and render a Video component for each one */}
        {streams.map((s) => (
          <div key={s.peerId} className="bg-black rounded-lg overflow-hidden">
            <Video stream={s.stream} muted={s.isLocal} />
          </div>
        ))}
      </main>
    </div>
  );
};

export default MeetingRoomPage;
