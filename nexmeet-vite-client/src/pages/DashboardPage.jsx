// src/pages/DashboardPage.jsx

import React from "react";

const DashboardPage = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="container mx-auto text-white text-center py-20 px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to Your Dashboard</h1>
      <p className="text-lg text-gray-300 mb-8">
        You are successfully logged in. Your meeting controls and options will
        be available here.
      </p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition duration-300"
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
