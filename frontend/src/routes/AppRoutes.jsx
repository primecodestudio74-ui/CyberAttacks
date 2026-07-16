import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Auth/Login.jsx';
import Signup from '../pages/Auth/Signup.jsx';

import CyberDashboard from '../pages/CyberDashboard.jsx';
import SqlInjection from '../pages/Attacks/SQLInejection.jsx';
import BruteForce from '../pages/Attacks/BruteForce.jsx';
import Phishing from '../pages/Attacks/Phishing.jsx';
import AIPoisoningLab from '../pages/Attacks/AiPoisoningLab.jsx';
import Keylogger from '../pages/Attacks/Keylogger.jsx';
import SessionHijacking from '../pages/Attacks/SessionHijacking.jsx';

// Secure Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('operator_token') || localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Gate */}
        <Route path="/" element={<Signup />} />

        <Route path="/signin" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main Dashboard Hub */}


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CyberDashboard />
            </ProtectedRoute>
          }
        />

        {/* Specialized Attack Vectors */}
        <Route
          path="/dashboard/sql-injection"
          element={
            <ProtectedRoute>
              <SqlInjection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/phishing"
          element={
            <ProtectedRoute>
              <Phishing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/brute-force"
          element={
            <ProtectedRoute>
              <BruteForce />
            </ProtectedRoute>
          }
        />

        {/* New AI Adversarial Vector */}
        <Route
          path="/dashboard/ai-poisoning"
          element={
            <ProtectedRoute>
              <AIPoisoningLab />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/keylogger"
          element={
            <ProtectedRoute>
              <Keylogger />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/sessionhijacking"
          element={
            <ProtectedRoute>
              <SessionHijacking />
            </ProtectedRoute>
          }
        />

        {/* Global Redirect to Dashboard for undefined paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

