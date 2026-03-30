import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';

// Reusable Input Component
const AuthInput = ({ label, type, placeholder }) => (
  <div className="mb-4 text-left">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input 
      type={type} 
      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition"
      placeholder={placeholder}
      required
    />
  </div>
);

// --- LOGIN PAGE ---
const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Logic for authentication goes here
    navigate('/home'); 
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
      <p className="text-gray-500 text-center mb-8">Enter your credentials to access your account</p>
      
      <form onSubmit={handleLogin}>
        <AuthInput label="Email Address" type="email" placeholder="name@company.com" />
        <AuthInput label="Password" type="password" placeholder="••••••••" />
        
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md transition duration-200 mt-2">
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        New here? <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">Create an account</Link>
      </p>
    </div>
  );
};

// --- SIGNUP PAGE ---
const SignupPage = () => {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Get Started</h2>
      <p className="text-gray-500 text-center mb-8">Create a free account and start building</p>
      
      <form onSubmit={handleSignup}>
        <AuthInput label="Full Name" type="text" placeholder="Jane Doe" />
        <AuthInput label="Email Address" type="email" placeholder="name@company.com" />
        <AuthInput label="Password" type="password" placeholder="••••••••" />
        
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md transition duration-200 mt-2">
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Log in</Link>
      </p>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}