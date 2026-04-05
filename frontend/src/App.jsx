import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from '../pages/AuthPage';
import CyberDashboard from '../pages/CyberDashboard'; 
// Import your new attack modules here
import SqlInjection from '../pages/Attacks/SQLInejection'; 

// Protected Route Helper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
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

        {/* Main Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CyberDashboard />
            </ProtectedRoute>
          } 
        />

        {/* SQL Injection Module Route */}
        <Route 
          path="/dashboard/sql-injection" 
          element={
            <ProtectedRoute>
              <SqlInjection />
            </ProtectedRoute>
          } 
        />

        {/* Future Module Placeholders (You can add these as you build them) */}
        {/* <Route path="/dashboard/phishing" element={<ProtectedRoute><Phishing /></ProtectedRoute>} />
        <Route path="/dashboard/brute-force" element={<ProtectedRoute><BruteForce /></ProtectedRoute>} />
        <Route path="/dashboard/dictionary" element={<ProtectedRoute><Dictionary /></ProtectedRoute>} /> 
        */}

        {/* Catch-all: Redirect unknown URLs to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;