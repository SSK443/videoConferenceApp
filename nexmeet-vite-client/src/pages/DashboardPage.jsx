// src/pages/DashboardPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- 1. Import useNavigate
import Chat from "../components/Chat";

const DashboardPage = () => {
  const [roomId, setRoomId] = useState(""); // <-- 2. State for the input field
  const navigate = useNavigate(); // <-- 3. Hook for navigation

  // 4. Function to handle form submission
  const handleJoinRoom = (e) => {
    e.preventDefault(); // Prevent the default form submission (page reload)
    // Only navigate if the user has entered a room ID
    if (roomId.trim() !== "") {
      // Use the navigate function to redirect the user to the meeting room
      navigate(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-center text-white mb-8">
        Your Dashboard
      </h1>

      {/* 5. Form to create or join a meeting room */}
      <div className="max-w-md mx-auto mb-12 bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-center mb-4">
          Join or Create a Meeting
        </h2>
        <form
          onSubmit={handleJoinRoom}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="flex-grow p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-700 transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Join Room
          </button>
        </form>
      </div>

      {/* The existing chat component */}
      <div className="flex justify-center">
        <Chat />
      </div>
    </div>
  );
};

export default DashboardPage;
