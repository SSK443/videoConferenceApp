// src/components/Chat.jsx

import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// Establish a connection to the server.
// We'll replace this with a more dynamic connection later.
const socket = io("http://localhost:5000");

const Chat = () => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const room = "1234"; // Hardcoded room ID for now. We'll make this dynamic later.

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: "User", // We'll replace this with the actual username later
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      // Emit the 'send_message' event to the server
      await socket.emit("send_message", messageData);
      // Add our own message to our message list so we can see it immediately
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage(""); // Clear the input field
    }
  };

  useEffect(() => {
    // Join the chat room when the component mounts
    socket.emit("join_room", { room });

    // Set up the event listener for receiving messages
    const messageListener = (data) => {
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", messageListener);

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("receive_message", messageListener);
    };
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-auto">
      <div className="border-b-2 border-gray-700 pb-2 mb-4">
        <h3 className="text-lg font-semibold text-white">Live Chat</h3>
      </div>
      <div className="h-64 overflow-y-auto mb-4 p-2 bg-gray-900 rounded">
        {messageList.map((msg, index) => (
          <div key={index} className="mb-2">
            <p className="text-sm text-gray-400">
              {msg.author} at {msg.time}
            </p>
            <p className="bg-indigo-600 text-white p-2 rounded-lg inline-block">
              {msg.message}
            </p>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyPress={(event) => event.key === "Enter" && sendMessage()}
          className="flex-grow p-2 rounded-l-md bg-gray-700 text-white focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 transition duration-300"
        >
          &#9658;
        </button>
      </div>
    </div>
  );
};

export default Chat;
