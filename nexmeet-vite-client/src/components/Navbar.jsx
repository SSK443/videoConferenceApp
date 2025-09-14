// src/components/Navbar.jsx

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  // 'isAuthenticated' will hold the user's login status.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // We get the location object to listen for URL changes.

  // This 'useEffect' hook is the heart of our smart navbar.
  // It runs whenever the component first loads and also whenever the URL (location) changes.
  useEffect(() => {
    // Check if the authentication token exists in local storage.
    const token = localStorage.getItem("token");
    if (token) {
      // If a token is found, we update our state to reflect that the user is logged in.
      setIsAuthenticated(true);
    } else {
      // If no token is found, we ensure the state reflects the user is logged out.
      setIsAuthenticated(false);
    }
  }, [location]); // The [location] dependency array means this effect will re-run on every route change.

  // This function handles the logout process.
  const handleLogout = () => {
    // 1. Remove the token from local storage.
    localStorage.removeItem("token");
    // 2. Update the state to reflect the user is now logged out.
    setIsAuthenticated(false);
    // 3. Redirect the user to the login page.
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* The main application logo/link to the homepage */}
        <Link to="/" className="text-white text-2xl font-bold tracking-wider">
          Nexmeet
        </Link>

        {/* This is where the conditional rendering happens */}
        <div>
          {isAuthenticated ? (
            // RENDER THIS BLOCK if the user IS authenticated
            <div className="space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            // RENDER THIS BLOCK if the user IS NOT authenticated
            <div className="space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
