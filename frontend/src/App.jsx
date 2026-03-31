import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import CyberDashboard from '../pages/CyberDashboard'; // Your separate file

// A simple helper to check if the user is logged in
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('operator_token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<AuthPage />} />

        {/* Protected Route - Only accessible if logged in */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CyberDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all: Redirect unknown URLs to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;