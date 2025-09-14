// src/components/PrivateRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";

// This component will receive another component as its "children"
// For example: <PrivateRoute><DashboardPage /></PrivateRoute>
const PrivateRoute = ({ children }) => {
  // Check if a JWT token exists in local storage
  const isAuthenticated = localStorage.getItem("token");

  // If the user is authenticated (token exists), render the children component (the protected page).
  // Otherwise, use the Navigate component from React Router to redirect them to the /login page.
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
