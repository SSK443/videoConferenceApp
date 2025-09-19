// // src/components/PollDisplay.jsx

// import React from "react";

// const PollDisplay = ({ poll, onVote, onEnd, currentUser }) => {
//   if (!poll) return null;

//   const totalVotes = poll.options.reduce(
//     (acc, option) => acc + option.votes,
//     0
//   );
//   const hasVoted = poll.options.some((opt) =>
//     opt.voters.includes(currentUser?.id)
//   );
//   const isCreatorOrAdmin =
//     currentUser?.id === poll.createdBy.userId || currentUser?.role === "admin";

//   return (
//     <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-sm z-40 border border-gray-700">
//       <h3 className="text-lg font-bold text-white mb-3">{poll.question}</h3>
//       <div className="space-y-2">
//         {poll.options.map((option, index) => {
//           const percentage =
//             totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(0) : 0;
//           return (
//             <div key={index}>
//               <button
//                 onClick={() => onVote(poll._id, index)}
//                 disabled={!poll.isOpen || hasVoted}
//                 className="w-full text-left p-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 <div className="relative w-full">
//                   {(hasVoted || !poll.isOpen) && (
//                     <div
//                       className="absolute top-0 left-0 h-full bg-blue-500 bg-opacity-30 rounded-md"
//                       style={{ width: `${percentage}%` }}
//                     ></div>
//                   )}
//                   <div className="relative flex justify-between items-center text-white px-2">
//                     <span>{option.text}</span>
//                     {(hasVoted || !poll.isOpen) && (
//                       <span className="font-bold">
//                         {percentage}% ({option.votes})
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </button>
//             </div>
//           );
//         })}
//       </div>
//       <p className="text-xs text-gray-400 mt-3">
//         Created by {poll.createdBy.username} &bull; {totalVotes} votes
//       </p>
//       {isCreatorOrAdmin && poll.isOpen && (
//         <button
//           onClick={() => onEnd(poll._id)}
//           className="w-full mt-3 py-2 bg-red-600 hover:bg-red-500 rounded-md text-sm font-semibold"
//         >
//           End Poll
//         </button>
//       )}
//     </div>
//   );
// };

// export default PollDisplay;






// src/components/PollDisplay.jsx

import React from 'react';

const PollDisplay = ({ poll, onVote, onEnd, currentUser, onClose }) => {
  if (!poll) return null;

  const totalVotes = poll.options.reduce((acc, option) => acc + option.votes, 0);
  const hasVoted = poll.options.some(opt => opt.voters.includes(currentUser?.id));
  const isCreatorOrAdmin = currentUser?.id === poll.createdBy.userId || currentUser?.role === 'admin';

  return (
    <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-sm z-40 border border-gray-700 animate-fade-in-down">
      
      {/* Header with Title and the new Close Button */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-white">{poll.question}</h3>
        {/* --- NEW: Close button is visible only when the poll has ended --- */}
        {!poll.isOpen && (
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors"
              title="Close Poll Results"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        )}
      </div>

      {/* Poll Options and Results */}
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(0) : 0;
          return (
            <div key={index}>
              <button
                onClick={() => onVote(poll._id, index)}
                disabled={!poll.isOpen || hasVoted}
                className="w-full text-left p-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="relative w-full">
                  {/* Progress bar for results */}
                  {(hasVoted || !poll.isOpen) && (
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 bg-opacity-30 rounded-md transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                  )}
                  <div className="relative flex justify-between items-center text-white px-2">
                    <span>{option.text}</span>
                    {(hasVoted || !poll.isOpen) && <span className="font-bold">{percentage}% ({option.votes})</span>}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Created by {poll.createdBy.username} &bull; {totalVotes} votes
      </p>
      
      {/* End Poll Button for creator/admin */}
      {isCreatorOrAdmin && poll.isOpen && (
        <button onClick={() => onEnd(poll._id)} className="w-full mt-3 py-2 bg-red-600 hover:bg-red-500 rounded-md text-sm font-semibold">
          End Poll
        </button>
      )}
    </div>
  );
};

export default PollDisplay;


