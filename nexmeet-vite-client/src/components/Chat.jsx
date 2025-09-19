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












// src/components/Chat.jsx

// import React, { useState, useEffect, useRef } from 'react';

// const Chat = ({ currentUser, messages, onSendMessage, onClose }) => {
//   const [currentMessage, setCurrentMessage] = useState('');
//   const messageContainerRef = useRef(null);

//   // This effect automatically scrolls to the newest message
//   useEffect(() => {
//     if (messageContainerRef.current) {
//       messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const sendMessage = () => {
//     // Only send a message if it's not empty and we know who the user is
//     if (currentMessage.trim() && currentUser) {
//       onSendMessage(currentMessage);
//       setCurrentMessage(''); // Clear the input box after sending
//     }
//   };

//   return (
//     // This container creates the chat sidebar that slides in from the right
//     <div className="absolute top-0 right-0 h-full w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col p-4 z-30 animate-slide-in-right">
      
//       {/* Header with Title and Close Button */}
//       <div className="flex justify-between items-center mb-4 flex-shrink-0">
//         <h3 className="text-xl font-bold text-white">In-call Messages</h3>
//         <button onClick={onClose} className="text-gray-400 hover:text-white" title="Close Chat">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//         </button>
//       </div>
      
//       {/* Message Display Area */}
//       <div ref={messageContainerRef} className="flex-grow bg-gray-900 rounded p-2 overflow-y-auto mb-4">
//         {messages.map((msg) => (
//           <div key={msg.id} className={`mb-3 flex flex-col ${msg.author === currentUser.username ? 'items-end' : 'items-start'}`}>
//              <p className="text-xs text-gray-400 mb-1 px-1">
//                 {msg.author === currentUser.username ? "You" : msg.author}
//             </p>
//             <p className={`p-2 rounded-lg inline-block text-white max-w-xs break-words ${msg.author === currentUser.username ? 'bg-blue-600' : 'bg-gray-700'}`}>
//               {msg.message}
//             </p>
//           </div>
//         ))}
//       </div>

//       {/* Message Input Field */}
//       <div className="flex flex-shrink-0">
//         <input
//           type="text"
//           value={currentMessage}
//           placeholder="Type a message..."
//           onChange={(e) => setCurrentMessage(e.target.value)}
//           onKeyPress={(e) => e.key === "Enter" && sendMessage()}
//           className="flex-grow p-2 rounded-l-md bg-gray-700 text-white focus:outline-none"
//         />
//         <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded-r-md hover:bg-blue-500 transition-colors">
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Chat;

