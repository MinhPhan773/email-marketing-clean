// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Validate token expiration
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      // Token expired
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // Invalid token
    console.error("Invalid token:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;