// client/src/App.jsx

import React, { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

// Import Layout and Page Components
import Navbar from "./components/Navbar.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx"; // <-- STEP 1: IMPORT THE NEW COMPONENT
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <main>
        <Routes>
          {/* These routes are public and can be accessed by anyone. */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/*
            STEP 2: PROTECT THE DASHBOARD ROUTE
            - We wrap the <DashboardPage /> component inside our <PrivateRoute> component.
            - Now, before React Router can render the DashboardPage, it must first render PrivateRoute.
            - The PrivateRoute component will check for a token.
              - If the token exists, it will render its "children", which in this case is <DashboardPage />.
              - If the token does NOT exist, it will redirect the user to "/login".
          */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
