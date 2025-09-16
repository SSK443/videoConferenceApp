// src/App.jsx

import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

// Import Components
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

// Import Pages
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MeetingRoomPage from "./pages/MeetingRoomPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // This hook handles catching the token after a successful Google login redirect.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      console.log("Google Auth Token found in URL:", token);
      alert("Logged in with Google successfully!");
      localStorage.setItem("token", token);
      // Navigate to the dashboard and remove the token from the URL
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <PrivateRoute>
                <MeetingRoomPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

// THE FIX IS HERE:
// We have removed the AppWrapper component that contained the extra <Router>.
// The file now correctly exports the main App component directly.
export default App;
