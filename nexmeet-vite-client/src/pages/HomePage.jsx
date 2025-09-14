// src/pages/HomePage.jsx

import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="container mx-auto text-white text-center py-20 px-4">
      <h1 className="text-5xl font-extrabold mb-4">Welcome to Nexmeet</h1>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
        The next generation of seamless, high-quality video conferencing.
        Connect, collaborate, and create with confidence.
      </p>
      <div className="space-x-4">
        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
