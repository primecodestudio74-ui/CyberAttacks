import React, { useState } from 'react';
import { Shield, Lock, Mail, User } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,transparent_50%)]" />
        <div className="grid-bg w-full h-full opacity-10" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Toggle */}
        <div className="flex justify-center gap-12 mb-8 text-sm font-bold tracking-widest uppercase">
          <button 
            onClick={() => setIsLogin(true)}
            className={`transition-all ${isLogin ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`transition-all ${!isLogin ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Register
          </button>
        </div>

        {isLogin ? <LoginForm onSwitch={() => setIsLogin(false)} /> : <RegisterForm onSwitch={() => setIsLogin(true)} />}
      </div>

      <style jsx>{`
        .grid-bg {
          background-image: linear-gradient(to right, #1e293b 1px, transparent 1px),
                            linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

const InputField = ({ label, type = "text", placeholder }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold mb-1 text-gray-400 uppercase tracking-wider">{label}</label>
    <input 
      type={type} 
      className="w-full bg-black/40 border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
      placeholder={placeholder}
    />
  </div>
);

const LoginForm = ({ onSwitch }) => (
  <div className="bg-[#0d1525]/80 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-sm relative">
    <div className="flex flex-col items-center mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="text-cyan-500 w-8 h-8" />
        <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Cyberattacks</h2>
      </div>
      <p className="text-gray-400 text-lg">Welcome Back!</p>
    </div>

    <form>
      <InputField label="Email" type="email" />
      <InputField label="Password" type="password" />
      
      <div className="flex justify-between items-center text-xs mb-6 text-gray-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-cyan-500" /> Remember Me
        </label>
        <a href="#" className="hover:text-cyan-400 transition-colors">Forgot Password?</a>
      </div>

      <button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 mb-4">
        LOGIN
      </button>
    </form>
    
    <p className="text-center text-xs text-gray-500">
      Don't have an account? <span onClick={onSwitch} className="text-cyan-400 cursor-pointer hover:underline">Sign Up</span>
    </p>
  </div>
);

const RegisterForm = ({ onSwitch }) => (
  <div className="bg-[#0d1525]/80 border border-gray-800 p-8 rounded-lg shadow-2xl backdrop-blur-sm">
    <h2 className="text-xl font-bold text-center mb-6 text-white uppercase tracking-wide">Create Your Account</h2>
    
    <form>
      <InputField label="Full Name" />
      <InputField label="Email Address" type="email" />
      <InputField label="Password" type="password" />
      <InputField label="Confirm Password" type="password" />

      <button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 mt-4 mb-4">
        SIGN UP
      </button>
    </form>

    <p className="text-center text-xs text-gray-500">
      Already have an account? <span onClick={onSwitch} className="text-cyan-400 cursor-pointer hover:underline">Login</span>
    </p>
  </div>
);

export default AuthPage;