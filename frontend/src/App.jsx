import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import CyberDashboard from "../pages/CyberDashboard";
import SqlInjection from "../pages/Attacks/SQLInejection";
import BruteForce from "../pages/Attacks/BruteForce";
import Phishing from "../pages/Attacks/Phishing";
import AIPoisoningLab from "../pages/Attacks/AiPoisoningLab";

// Secure Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("operator_token") || localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Gate */}
        <Route path="/" element={<AuthPage />} />

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

        {/* Global Redirect to Dashboard for undefined paths */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;