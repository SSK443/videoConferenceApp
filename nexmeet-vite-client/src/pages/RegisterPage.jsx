// src/pages/RegisterPage.jsx

import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const { username, email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });
      setMessage("Registration successful! Please log in.");
      setTimeout(() => navigate("/login"), 2000); // Redirect to login after 2 seconds
    } catch (err) {
      setMessage(err.response.data.msg || "Server Error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-white text-3xl font-bold mb-6 text-center">
          Create Account
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="username"
              value={username}
              onChange={onChange}
              placeholder="Username"
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Email Address"
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Password"
              className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength="6"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Sign Up
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-yellow-400">{message}</p>
        )}
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
