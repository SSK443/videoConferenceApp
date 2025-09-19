


// // src/pages/MeetingRoomPage.jsx

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Peer from 'peerjs';
// import io from 'socket.io-client';
// import { jwtDecode } from 'jwt-decode';

// // --- UI COMPONENTS ---
// const MutedIcon = () => (
//     <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" />
//     </svg>
// );

// const Video = ({ stream, isLocal, username, isMuted }) => {
//   const ref = useRef();
//   const [isCameraOff, setIsCameraOff] = useState(false);

//   useEffect(() => {
//     if (stream) {
//       ref.current.srcObject = stream;
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         const handleTrackStateChange = () => setIsCameraOff(!videoTrack.enabled);
//         handleTrackStateChange();
//         const onTrackStateChange = () => handleTrackStateChange();
//         videoTrack.addEventListener('ended', onTrackStateChange);
//         videoTrack.addEventListener('mute', onTrackStateChange);
//         videoTrack.addEventListener('unmute', onTrackStateChange);
//         return () => {
//           videoTrack.removeEventListener('ended', onTrackStateChange);
//           videoTrack.removeEventListener('mute', onTrackStateChange);
//           videoTrack.removeEventListener('unmute', onTrackStateChange);
//         };
//       }
//     }
//   }, [stream]);

//   return (
//     <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
//       {isCameraOff ? (
//         <div className="w-full h-full bg-gray-800 flex items-center justify-center">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//             </svg>
//         </div>
//       ) : (
//         <video ref={ref} muted={isLocal} autoPlay playsInline className="w-full h-full object-cover" />
//       )}
//       <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
//         {isMuted && <MutedIcon />}
//         <span>{username} {isLocal && '(You)'}</span>
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

//   const socketRef = useRef();
//   const peerRef = useRef();
//   const localStreamRef = useRef();
//   const peersRef = useRef({});
//   const screenStreamRef = useRef();

//   const handleAdminMute = (targetSocketId) => { socketRef.current.emit('admin-mute-user', { targetSocketId }); };
//   const handleAdminCamOff = (targetSocketId) => { socketRef.current.emit('admin-cam-off-user', { targetSocketId }); };
//   const handleAdminKick = (targetSocketId) => { socketRef.current.emit('admin-kick-user', { targetSocketId }); };

//   const toggleMute = useCallback((forceMute = false) => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         setIsMuted(prevIsMuted => {
//             const newMutedState = forceMute ? true : !prevIsMuted;
//             audioTrack.enabled = !newMutedState;
//             if (socketRef.current) {
//                 socketRef.current.emit('mute-status-change', { muted: newMutedState });
//             }
//             return newMutedState;
//         });
//       }
//     }
//   }, []);

//   const toggleCamera = useCallback((forceCamOff = false) => {
//     if (localStreamRef.current) {
//         const videoTrack = localStreamRef.current.getVideoTracks()[0];
//         if (videoTrack) {
//             setIsCameraOff(prevIsCameraOff => {
//                 const newCamOffState = forceCamOff ? true : !prevIsCameraOff;
//                 videoTrack.enabled = !newCamOffState;
//                 return newCamOffState;
//             });
//         }
//     }
//   }, []);

//   useEffect(() => {
//     let isEffectRunning = true;
//     const token = localStorage.getItem('token');
//     if (!token) { navigate('/login'); return; }

//     let decodedUserInfo;
//     try {
//       const decodedToken = jwtDecode(token);
//       decodedUserInfo = decodedToken.user;
//     } catch (error) { navigate('/login'); return; }
    
//     const socket = io('http://localhost:5000');
//     socketRef.current = socket;
    
//     socket.on('connect', () => { setCurrentUser({ ...decodedUserInfo, socketId: socket.id }); });

//     const addStream = (peerId, stream, username, initialMutedStatus = false) => {
//         setStreams(prev => {
//           if (!prev.some(s => s.peerId === peerId)) {
//             return [...prev, { peerId, stream, username, isLocal: false, isMuted: initialMutedStatus }];
//           }
//           return prev;
//         });
//     };

//     const handleRemoteMuteChange = ({ peerId, muted }) => {
//         setStreams(prevStreams => 
//             prevStreams.map(s => s.peerId === peerId ? { ...s, isMuted: muted } : s)
//         );
//     };
    
//     const handleUserDisconnected = (peerId, socketId) => {
//         if (peersRef.current[peerId]) peersRef.current[peerId].close();
//         delete peersRef.current[peerId];
//         setStreams(prev => prev.filter(s => s.peerId !== peerId));
//         setParticipants(prev => prev.filter(p => p.socketId !== socketId));
//     };

//     const handleUserConnected = (newParticipant) => {
//         if (!localStreamRef.current || peersRef.current[newParticipant.peerId]) return;
//         setParticipants(prev => {
//             if (!prev.some(p => p.socketId === newParticipant.socketId)) return [...prev, newParticipant];
//             return prev;
//         });
//         const call = peerRef.current.call(newParticipant.peerId, localStreamRef.current);
//         call.on('stream', remoteStream => addStream(call.peer, remoteStream, newParticipant.username, newParticipant.isMuted));
//         peersRef.current[newParticipant.peerId] = call;
//     };
//     const handleCall = (call) => {
//         if (!localStreamRef.current || peersRef.current[call.peer]) return;
//         call.answer(localStreamRef.current);
//         call.on('stream', remoteStream => {
//             setParticipants(prevParticipants => {
//                 const caller = prevParticipants.find(p => p.peerId === call.peer);
//                 addStream(call.peer, remoteStream, caller?.username, caller?.isMuted);
//                 return prevParticipants;
//             });
//         });
//         peersRef.current[call.peer] = call;
//     };
//     const handleRoomParticipants = (allParticipants) => {
//         setParticipants(allParticipants);
//     };
//     const handleForceMute = () => toggleMute(true);
//     const handleForceCamOff = () => toggleCamera(true);
//     const handleForceKick = () => {
//         alert("You have been removed from the meeting by an admin.");
//         navigate('/dashboard');
//     };
    
//     const init = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         if (!isEffectRunning) return;
//         localStreamRef.current = stream;

//         const myPeer = new Peer(undefined, { host: 'localhost', port: 9000, path: '/' });
//         peerRef.current = myPeer;

//         myPeer.on('open', (peerId) => {
//           socket.emit('join-video-room', roomId, peerId, token);
//           setStreams([{ peerId, stream, isLocal: true, username: decodedUserInfo.username, isMuted: false }]);
//         });

//         myPeer.on('call', handleCall);
//         socket.on('user-connected', handleUserConnected);
//         socket.on('user-disconnected', handleUserDisconnected);
//         socket.on('room-participants', handleRoomParticipants);
//         socket.on('force-mute', handleForceMute);
//         socket.on('force-cam-off', handleForceCamOff);
//         socket.on('force-kick', handleForceKick);
//         socket.on('user-mute-status-changed', handleRemoteMuteChange);
//       } catch (err) { console.error("Init Error", err); }
//     };
//     init();

//     return () => {
//         isEffectRunning = false;
//         if (socketRef.current) { socketRef.current.disconnect(); }
//         if (peerRef.current) { peerRef.current.destroy(); }
//         if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(track => track.stop()); }
//         Object.values(peersRef.current).forEach(call => call.close());
//     };
//   }, [roomId, navigate]); 
  
//   const leaveMeeting = () => { navigate('/dashboard'); };
  
//   const toggleScreenShare = async () => {
//     if (isSharingScreen) {
//         const localVideoTrack = localStreamRef.current?.getVideoTracks()[0];
//         if(!localVideoTrack) return;
//         for (const peerId in peersRef.current) {
//             const peerConnection = peersRef.current[peerId]?.peerConnection;
//             const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
//             if (sender) sender.replaceTrack(localVideoTrack);
//         }
//         screenStreamRef.current?.getTracks().forEach(track => track.stop());
//         screenStreamRef.current = null;
//         setStreams(prev => prev.map(s => s.isLocal ? { ...s, stream: localStreamRef.current } : s));
//         setIsSharingScreen(false);
//     } else {
//         try {
//             const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//             const screenTrack = screenStream.getVideoTracks()[0];
//             if (!screenTrack) return;
//             screenStreamRef.current = screenStream;
//             for (const peerId in peersRef.current) {
//                  const peerConnection = peersRef.current[peerId]?.peerConnection;
//                 const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
//                 if (sender) sender.replaceTrack(screenTrack);
//             }
//             const audioTrack = localStreamRef.current?.getAudioTracks()[0];
//             const displayStream = new MediaStream([screenTrack, audioTrack].filter(Boolean));
//             setStreams(prev => prev.map(s => s.isLocal ? { ...s, stream: displayStream } : s));
//             screenTrack.onended = () => {
//                 const localVideoTrack = localStreamRef.current?.getVideoTracks()[0];
//                  if(!localVideoTrack) return;
//                 for (const peerId in peersRef.current) {
//                     const peerConnection = peersRef.current[peerId]?.peerConnection;
//                     const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
//                     if (sender) sender.replaceTrack(localVideoTrack);
//                 }
//                 setStreams(prev => prev.map(s => s.isLocal ? { ...s, stream: localStreamRef.current } : s));
//                 setIsSharingScreen(false);
//             };
//             setIsSharingScreen(true);
//         } catch (err) {
//             console.error("Error starting screen share", err);
//         }
//     }
//   };
  
//   const getGridLayout = (count) => {
//     if (count <= 1) return ""; // We use flexbox for the single user case
//     if (count === 2) return "grid-cols-1 md:grid-cols-2";
//     if (count <= 4) return "grid-cols-2";
//     if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
//     return "grid-cols-3 lg:grid-cols-4";
//   };

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
//       <div className="flex-grow flex flex-col">
//         <header className="p-4 text-center">
//             <h1 className="text-2xl font-bold">Meeting Room</h1>
//             <p className="text-sm text-gray-400">Room ID: {roomId}</p>
//         </header>
        
//         {/* --- THIS IS THE CORRECTED LAYOUT LOGIC --- */}
//         <main className={`flex-grow p-4 ${streams.length > 1 ? `grid ${getGridLayout(streams.length)} gap-4` : 'flex items-center justify-center'}`}>
//           {streams.map((s) => (
//             <div 
//               key={s.peerId} 
//               className={`bg-black rounded-lg overflow-hidden aspect-video ${streams.length === 1 ? 'w-full max-w-5xl' : ''}`}
//             >
//               <Video stream={s.stream} isLocal={s.isLocal} username={s.username} isMuted={s.isLocal ? isMuted : s.isMuted} />
//             </div>
//           ))}
//         </main>

//         <footer className="p-4 bg-gray-800 flex justify-center items-center gap-2 md:gap-4">
//           <button onClick={() => toggleMute()} title={isMuted ? "Unmute" : "Mute"} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
//             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               {isMuted ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0 0a7.5 7.5 0 005.656-12.844M12 11a3 3 0 11-6 0 3 3 0 016 0z" />}
//             </svg>
//           </button>
//           <button onClick={() => toggleCamera()} title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
//             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5z" />
//             </svg>
//           </button>
//           <button onClick={toggleScreenShare} title={isSharingScreen ? "Stop Sharing" : "Share Screen"} className={`p-3 rounded-full ${isSharingScreen ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
//             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//             </svg>
//           </button>
//           <button onClick={leaveMeeting} title="Leave Meeting" className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors">
//             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//             </svg>
//           </button>
//         </footer>
//       </div>

//       <aside className="w-64 md:w-80 bg-gray-800 p-4 flex-col border-l border-gray-700 hidden md:flex">
//         <h2 className="text-xl font-bold mb-4">Participants ({participants.length + (currentUser ? 1 : 0)})</h2>
//         <ul className="space-y-4 overflow-y-auto">
//           {currentUser && (
//             <li className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
//               <span className="font-semibold truncate">{currentUser.username} (You)</span>
//               <span className="text-xs font-medium text-blue-400 uppercase">{currentUser.role}</span>
//             </li>
//           )}
//           {participants.map(p => (
//             <li key={p.socketId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700">
//               <span className='truncate'>{p.username}</span>
//               <div className="flex items-center gap-1">
//                 {currentUser?.role === 'admin' && currentUser.userId !== p.userId && (
//                   <>
//                     <button onClick={() => handleAdminMute(p.socketId)} title="Mute User" className="text-xs bg-yellow-600 hover:bg-yellow-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">M</button>
//                     <button onClick={() => handleAdminCamOff(p.socketId)} title="Turn Off Camera" className="text-xs bg-blue-600 hover:bg-blue-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">C</button>
//                     <button onClick={() => handleAdminKick(p.socketId)} title="Remove User" className="text-xs bg-red-600 hover:bg-red-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">K</button>
//                   </>
//                 )}
//               </div>
//             </li>
//           ))}
//         </ul>
//       </aside>
//     </div>
//   );
// };

// export default MeetingRoomPage;








// // src/pages/MeetingRoomPage.jsx

// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Peer from 'peerjs';
// import io from 'socket.io-client';
// import { jwtDecode } from 'jwt-decode';
// import CreatePoll from '../components/CreatePoll'; // <-- IMPORT
// import PollDisplay from '../components/PollDisplay'; // <-- IMPORT

// // --- UI COMPONENTS (MutedIcon, Video) remain the same ---
// const MutedIcon = ({ className }) => (
//     <svg className={`w-5 h-5 text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" />
//     </svg>
// );
// const Video = ({ stream, isLocal, username, isMuted }) => {
//     const ref = useRef();
//     const [isCameraOff, setIsCameraOff] = useState(false);
//     useEffect(() => {
//         if (stream) {
//             ref.current.srcObject = stream;
//             const videoTrack = stream.getVideoTracks()[0];
//             if (videoTrack) {
//                 const handleTrackStateChange = () => setIsCameraOff(!videoTrack.enabled);
//                 handleTrackStateChange();
//                 const onTrackStateChange = () => handleTrackStateChange();
//                 videoTrack.addEventListener('ended', onTrackStateChange);
//                 videoTrack.addEventListener('mute', onTrackStateChange);
//                 videoTrack.addEventListener('unmute', onTrackStateChange);
//                 return () => {
//                     videoTrack.removeEventListener('ended', onTrackStateChange);
//                     videoTrack.removeEventListener('mute', onTrackStateChange);
//                     videoTrack.removeEventListener('unmute', onTrackStateChange);
//                 };
//             }
//         }
//     }, [stream]);
//     return (
//         <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
//             {isCameraOff ? (
//                 <div className="w-full h-full bg-gray-800 flex items-center justify-center">
//                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
//                 </div>
//             ) : (<video ref={ref} muted={isLocal} autoPlay playsInline className="w-full h-full object-cover" />)}
//             <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
//                 {isMuted && <MutedIcon />}
//                 <span>{username} {isLocal && '(You)'}</span>
//             </div>
//         </div>
//     );
// };


// const MeetingRoomPage = () => {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
  
//   // --- NEW STATE for Polls ---
//   const [showCreatePoll, setShowCreatePoll] = useState(false);
//   const [activePoll, setActivePoll] = useState(null);

//   const [participants, setParticipants] = useState([]);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [streams, setStreams] = useState([]);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isCameraOff, setIsCameraOff] = useState(false);
//   const [isSharingScreen, setIsSharingScreen] = useState(false);
  
//   const socketRef = useRef();
//   const peerRef = useRef();
//   const localStreamRef = useRef();
//   const peersRef = useRef({});
//   const screenStreamRef = useRef();

//   const handleAdminMute = (targetSocketId) => { socketRef.current.emit('admin-mute-user', { targetSocketId }); };
//   const handleAdminCamOff = (targetSocketId) => { socketRef.current.emit('admin-cam-off-user', { targetSocketId }); };
//   const handleAdminKick = (targetSocketId) => { socketRef.current.emit('admin-kick-user', { targetSocketId }); };

//   const toggleMute = useCallback((forceMute = false) => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         setIsMuted(prevIsMuted => {
//             const newMutedState = forceMute ? true : !prevIsMuted;
//             audioTrack.enabled = !newMutedState;
//             if (socketRef.current) {
//                 socketRef.current.emit('mute-status-change', { muted: newMutedState });
//             }
//             return newMutedState;
//         });
//       }
//     }
//   }, []);

//   const toggleCamera = useCallback((forceCamOff = false) => {
//     if (localStreamRef.current) {
//         const videoTrack = localStreamRef.current.getVideoTracks()[0];
//         if (videoTrack) {
//             setIsCameraOff(prevIsCameraOff => {
//                 const newCamOffState = forceCamOff ? true : !prevIsCameraOff;
//                 videoTrack.enabled = !newCamOffState;
//                 return newCamOffState;
//             });
//         }
//     }
//   }, []);
  
//   // --- NEW Poll Functions ---
//   const handleCreatePoll = (pollData) => {
//     socketRef.current.emit('create-poll', pollData);
//     setShowCreatePoll(false);
//   };

//   const handleVote = (pollId, optionIndex) => {
//     socketRef.current.emit('vote-poll', { pollId, optionIndex });
//   };

//   const handleEndPoll = (pollId) => {
//     socketRef.current.emit('end-poll', { pollId });
//   };


//   useEffect(() => {
//     let isEffectRunning = true;
//     const token = localStorage.getItem('token');
//     if (!token) { navigate('/login'); return; }

//     let decodedUserInfo;
//     try {
//       const decodedToken = jwtDecode(token);
//       decodedUserInfo = decodedToken.user;
//     } catch (error) { navigate('/login'); return; }
    
//     const socket = io('http://localhost:5000');
//     socketRef.current = socket;
    
//     socket.on('connect', () => { setCurrentUser({ ...decodedUserInfo, socketId: socket.id }); });

//     const addStream = (peerId, stream, username, initialMutedStatus = false) => {
//         setStreams(prev => {
//           if (!prev.some(s => s.peerId === peerId)) {
//             return [...prev, { peerId, stream, username, isLocal: false, isMuted: initialMutedStatus }];
//           }
//           return prev;
//         });
//     };
    
//     const handleRemoteMuteChange = ({ peerId, muted }) => {
//         setStreams(prevStreams => 
//             prevStreams.map(s => s.peerId === peerId ? { ...s, isMuted: muted } : s)
//         );
//     };
    
//     const handleUserDisconnected = (peerId, socketId) => {
//         if (peersRef.current[peerId]) peersRef.current[peerId].close();
//         delete peersRef.current[peerId];
//         setStreams(prev => prev.filter(s => s.peerId !== peerId));
//         setParticipants(prev => prev.filter(p => p.socketId !== socketId));
//     };

//     const handleUserConnected = (newParticipant) => {
//         if (!localStreamRef.current || peersRef.current[newParticipant.peerId]) return;
//         setParticipants(prev => {
//             if (!prev.some(p => p.socketId === newParticipant.socketId)) return [...prev, newParticipant];
//             return prev;
//         });
//         const call = peerRef.current.call(newParticipant.peerId, localStreamRef.current);
//         call.on('stream', remoteStream => addStream(call.peer, remoteStream, newParticipant.username, newParticipant.isMuted));
//         peersRef.current[newParticipant.peerId] = call;
//     };
//     const handleCall = (call) => {
//         if (!localStreamRef.current || peersRef.current[call.peer]) return;
//         call.answer(localStreamRef.current);
//         call.on('stream', remoteStream => {
//             setParticipants(prevParticipants => {
//                 const caller = prevParticipants.find(p => p.peerId === call.peer);
//                 addStream(call.peer, remoteStream, caller?.username, caller?.isMuted);
//                 return prevParticipants;
//             });
//         });
//         peersRef.current[call.peer] = call;
//     };
//     const handleRoomParticipants = (allParticipants) => {
//         setParticipants(allParticipants);
//     };
//     const handleForceMute = () => toggleMute(true);
//     const handleForceCamOff = () => toggleCamera(true);
//     const handleForceKick = () => {
//         alert("You have been removed from the meeting by an admin.");
//         navigate('/dashboard');
//     };

//     // --- NEW Poll Event Listeners ---
//     const handleNewPoll = (poll) => setActivePoll(poll);
//     const handlePollUpdated = (updatedPoll) => {
//         setActivePoll(prevPoll => {
//             if (!prevPoll || prevPoll._id === updatedPoll._id) {
//                 return updatedPoll;
//             }
//             return prevPoll;
//         });
//     };
    
//     const init = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         if (!isEffectRunning) return;
//         localStreamRef.current = stream;

//         const myPeer = new Peer(undefined, { host: 'localhost', port: 9000, path: '/' });
//         peerRef.current = myPeer;

//         myPeer.on('open', (peerId) => {
//           socket.emit('join-video-room', roomId, peerId, token);
//           setStreams([{ peerId, stream, isLocal: true, username: decodedUserInfo.username, isMuted: false }]);
//         });

//         myPeer.on('call', handleCall);
//         socket.on('user-connected', handleUserConnected);
//         socket.on('user-disconnected', handleUserDisconnected);
//         socket.on('room-participants', handleRoomParticipants);
//         socket.on('force-mute', handleForceMute);
//         socket.on('force-cam-off', handleForceCamOff);
//         socket.on('force-kick', handleForceKick);
//         socket.on('user-mute-status-changed', handleRemoteMuteChange);
//         socket.on('new-poll', handleNewPoll);
//         socket.on('poll-updated', handlePollUpdated);
        
//       } catch (err) { console.error("Init Error", err); }
//     };
//     init();

//     return () => {
//         isEffectRunning = false;
//         if (socketRef.current) { socketRef.current.disconnect(); }
//         if (peerRef.current) { peerRef.current.destroy(); }
//         if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(track => track.stop()); }
//         Object.values(peersRef.current).forEach(call => call.close());
//     };
//   }, [roomId, navigate, toggleMute, toggleCamera]); 
  
//   const leaveMeeting = () => { navigate('/dashboard'); };
//   const toggleScreenShare = async () => { /* ... same as Day 17 ... */ };
//   const getGridLayout = (count) => { /* ... same as Day 17 ... */ };

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
//       {/* --- NEW: Render Poll Components --- */}
//       {showCreatePoll && <CreatePoll onCreate={handleCreatePoll} onCancel={() => setShowCreatePoll(false)} />}
//       <PollDisplay 
//         poll={activePoll} 
//         onVote={handleVote} 
//         onEnd={handleEndPoll}
//         currentUser={currentUser}
//       />

//       <div className="flex-grow flex flex-col">
//         { /* ... header, main video grid ... */ }
//         <footer className="p-4 bg-gray-800 flex justify-center items-center gap-2 md:gap-4">
//           {/* ... Mute, Cam, Share, Leave buttons ... */}
//           <button onClick={() => setShowCreatePoll(true)} title="Create Poll" className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors">
//              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//              </svg>
//           </button>
//         </footer>
//       </div>
//       <aside className="w-64 md:w-80 bg-gray-800 p-4 flex-col border-l border-gray-700 hidden md:flex">
//         {/* ... Participant list ... */}
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

const Video = ({ stream, isLocal, username, isMuted }) => {
  const ref = useRef();
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (stream) {
      ref.current.srcObject = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const handleTrackStateChange = () => setIsCameraOff(!videoTrack.enabled);
        handleTrackStateChange();
        const onTrackStateChange = () => handleTrackStateChange();
        videoTrack.addEventListener('ended', onTrackStateChange);
        videoTrack.addEventListener('mute', onTrackStateChange);
        videoTrack.addEventListener('unmute', onTrackStateChange);
        return () => {
          videoTrack.removeEventListener('ended', onTrackStateChange);
          videoTrack.removeEventListener('mute', onTrackStateChange);
          videoTrack.removeEventListener('unmute', onTrackStateChange);
        };
      }
    }
  }, [stream]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
      {isCameraOff ? (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
      ) : (
        <video ref={ref} muted={isLocal} autoPlay playsInline className="w-full h-full object-cover" />
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded flex items-center gap-2">
        {isMuted && <MutedIcon />}
        <span>{username} {isLocal && '(You)'}</span>
      </div>
    </div>
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
  
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activePoll, setActivePoll] = useState(null);

  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const peersRef = useRef({});
  const screenStreamRef = useRef();

  const handleAdminMute = (targetSocketId) => { socketRef.current.emit('admin-mute-user', { targetSocketId }); };
  const handleAdminCamOff = (targetSocketId) => { socketRef.current.emit('admin-cam-off-user', { targetSocketId }); };
  const handleAdminKick = (targetSocketId) => { socketRef.current.emit('admin-kick-user', { targetSocketId }); };

  const toggleMute = useCallback((forceMute = false) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        setIsMuted(prevIsMuted => {
            const newMutedState = forceMute ? true : !prevIsMuted;
            audioTrack.enabled = !newMutedState;
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
                return newCamOffState;
            });
        }
    }
  }, []);

  const handleCreatePoll = (pollData) => {
    socketRef.current.emit('create-poll', pollData);
    setShowCreatePoll(false);
  };

  const handleVote = (pollId, optionIndex) => {
    socketRef.current.emit('vote-poll', { pollId, optionIndex });
  };

  const handleEndPoll = (pollId) => {
    socketRef.current.emit('end-poll', { pollId });
  };

  useEffect(() => {
    let isEffectRunning = true;
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    let decodedUserInfo;
    try {
      const decodedToken = jwtDecode(token);
      decodedUserInfo = decodedToken.user;
    } catch (error) { navigate('/login'); return; }
    
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    
    socket.on('connect', () => { setCurrentUser({ ...decodedUserInfo, socketId: socket.id }); });

    const addStream = (peerId, stream, username, initialMutedStatus = false) => {
        setStreams(prev => {
          if (!prev.some(s => s.peerId === peerId)) {
            return [...prev, { peerId, stream, username, isLocal: false, isMuted: initialMutedStatus }];
          }
          return prev;
        });
    };

    const handleRemoteMuteChange = ({ peerId, muted }) => {
        setStreams(prevStreams => 
            prevStreams.map(s => s.peerId === peerId ? { ...s, isMuted: muted } : s)
        );
    };
    
    const handleUserDisconnected = (peerId, socketId) => {
        if (peersRef.current[peerId]) peersRef.current[peerId].close();
        delete peersRef.current[peerId];
        setStreams(prev => prev.filter(s => s.peerId !== peerId));
        setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    };

    const handleUserConnected = (newParticipant) => {
        if (!localStreamRef.current || peersRef.current[newParticipant.peerId]) return;
        setParticipants(prev => {
            if (!prev.some(p => p.socketId === newParticipant.socketId)) return [...prev, newParticipant];
            return prev;
        });
        const call = peerRef.current.call(newParticipant.peerId, localStreamRef.current);
        call.on('stream', remoteStream => addStream(call.peer, remoteStream, newParticipant.username, newParticipant.isMuted));
        peersRef.current[newParticipant.peerId] = call;
    };
    const handleCall = (call) => {
        if (!localStreamRef.current || peersRef.current[call.peer]) return;
        call.answer(localStreamRef.current);
        call.on('stream', remoteStream => {
            setParticipants(prevParticipants => {
                const caller = prevParticipants.find(p => p.peerId === call.peer);
                addStream(call.peer, remoteStream, caller?.username, caller?.isMuted);
                return prevParticipants;
            });
        });
        peersRef.current[call.peer] = call;
    };
    const handleRoomParticipants = (allParticipants) => {
        setParticipants(allParticipants);
    };
    const handleForceMute = () => toggleMute(true);
    const handleForceCamOff = () => toggleCamera(true);
    const handleForceKick = () => {
        alert("You have been removed from the meeting by an admin.");
        navigate('/dashboard');
    };
    
    const handleNewPoll = (poll) => setActivePoll(poll);
    const handlePollUpdated = (updatedPoll) => {
        setActivePoll(prevPoll => {
            if (!prevPoll || prevPoll._id === updatedPoll._id) {
                return updatedPoll;
            }
            return prevPoll;
        });
    };
    
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isEffectRunning) return;
        localStreamRef.current = stream;

        const myPeer = new Peer(undefined, { host: 'localhost', port: 9000, path: '/' });
        peerRef.current = myPeer;

        myPeer.on('open', (peerId) => {
          socket.emit('join-video-room', roomId, peerId, token);
          setStreams([{ peerId, stream, isLocal: true, username: decodedUserInfo.username, isMuted: false }]);
        });

        myPeer.on('call', handleCall);
        socket.on('user-connected', handleUserConnected);
        socket.on('user-disconnected', handleUserDisconnected);
        socket.on('room-participants', handleRoomParticipants);
        socket.on('force-mute', handleForceMute);
        socket.on('force-cam-off', handleForceCamOff);
        socket.on('force-kick', handleForceKick);
        socket.on('user-mute-status-changed', handleRemoteMuteChange);
        socket.on('new-poll', handleNewPoll);
        socket.on('poll-updated', handlePollUpdated);
      } catch (err) { console.error("Init Error", err); }
    };
    init();

    return () => {
        isEffectRunning = false;
        if (socketRef.current) { socketRef.current.disconnect(); }
        if (peerRef.current) { peerRef.current.destroy(); }
        if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(track => track.stop()); }
        Object.values(peersRef.current).forEach(call => call.close());
    };
  }, [roomId, navigate, toggleMute, toggleCamera]); 
  
  const leaveMeeting = () => { navigate('/dashboard'); };
  
  const toggleScreenShare = async () => { /* ... same stable logic ... */ };
  
  const getGridLayout = (count) => {
    if (count <= 1) return "";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-3 lg:grid-cols-4";
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      {showCreatePoll && <CreatePoll onCreate={handleCreatePoll} onCancel={() => setShowCreatePoll(false)} />}
      <PollDisplay 
        poll={activePoll} 
        onVote={handleVote} 
        onEnd={handleEndPoll}
        currentUser={currentUser}
      />

      <div className="flex-grow flex flex-col">
        <header className="p-4 text-center">
            <h1 className="text-2xl font-bold">Meeting Room</h1>
            <p className="text-sm text-gray-400">Room ID: {roomId}</p>
        </header>
        
        <main className={`flex-grow p-4 ${streams.length > 1 ? `grid ${getGridLayout(streams.length)} gap-4` : 'flex items-center justify-center'}`}>
          {streams.map((s) => (
            <div 
              key={s.peerId} 
              className={`bg-black rounded-lg overflow-hidden aspect-video ${streams.length === 1 ? 'w-full max-w-5xl' : ''}`}
            >
              <Video stream={s.stream} isLocal={s.isLocal} username={s.username} isMuted={s.isLocal ? isMuted : s.isMuted} />
            </div>
          ))}
        </main>

        <footer className="p-4 bg-gray-800 flex justify-center items-center gap-2 md:gap-4">
          <button onClick={() => toggleMute()} title={isMuted ? "Unmute" : "Mute"} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMuted ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0-4.5l-2.293-2.293m0 0a7.502 7.502 0 01-4.243-4.243m6.536 6.536l6.536-6.536M6 10a5.501 5.501 0 015.5-5.5" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7.5 7.5 0 01-7.5 7.5m0 0a7.5 7.5 0 01-7.5-7.5m7.5 7.5v4.5m0 0a7.5 7.5 0 005.656-12.844M12 11a3 3 0 11-6 0 3 3 0 016 0z" />}
            </svg>
          </button>
          <button onClick={() => toggleCamera()} title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={toggleScreenShare} title={isSharingScreen ? "Stop Sharing" : "Share Screen"} className={`p-3 rounded-full ${isSharingScreen ? 'bg-red-500' : 'bg-gray-600'} hover:bg-gray-500 transition-colors`}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={() => setShowCreatePoll(true)} title="Create Poll" className="p-3 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors">
             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
          </button>
          <button onClick={leaveMeeting} title="Leave Meeting" className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors">
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </footer>
      </div>
      <aside className="w-64 md:w-80 bg-gray-800 p-4 flex-col border-l border-gray-700 hidden md:flex">
        <h2 className="text-xl font-bold mb-4">Participants ({participants.length + (currentUser ? 1 : 0)})</h2>
        <ul className="space-y-4 overflow-y-auto">
          {currentUser && (
            <li className="flex items-center justify-between p-2 rounded-lg bg-gray-700">
              <span className="font-semibold truncate">{currentUser.username} (You)</span>
              <span className="text-xs font-medium text-blue-400 uppercase">{currentUser.role}</span>
            </li>
          )}
          {participants.map(p => (
            <li key={p.socketId} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700">
              <span className='truncate'>{p.username}</span>
              <div className="flex items-center gap-1">
                {currentUser?.role === 'admin' && currentUser.userId !== p.userId && (
                  <>
                    <button onClick={() => handleAdminMute(p.socketId)} title="Mute User" className="text-xs bg-yellow-600 hover:bg-yellow-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">M</button>
                    <button onClick={() => handleAdminCamOff(p.socketId)} title="Turn Off Camera" className="text-xs bg-blue-600 hover:bg-blue-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">C</button>
                    <button onClick={() => handleAdminKick(p.socketId)} title="Remove User" className="text-xs bg-red-600 hover:bg-red-500 p-2 w-7 h-7 flex items-center justify-center rounded-full font-bold">K</button>
                  </>
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

