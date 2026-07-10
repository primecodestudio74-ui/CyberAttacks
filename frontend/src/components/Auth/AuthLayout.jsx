import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import Typewriter from "./Typewriter";

const AuthLayout = ({ children }) => {
  const navigate = useNavigate();

  const mottos = useMemo(
    () => [
      "HackAware Cyber Security Platform",
      "Simulate Attack | Learn Defense",
      "Stay Aware, Stay Secure",
      "Terminal Handshake Initialized",
      "Vulnerability Assessment Active",
    ],
    []
  );

  useEffect(() => {
    const token = localStorage.getItem("operator_token");

    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">

      {/* Video Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src="/videos/HA_BG.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-transparent to-[#0a0f1a]/80" />
        <div className="absolute inset-0 bg-[#0a0f1a]/20 backdrop-blur-[2px]" />
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid-bg w-full h-full" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8">

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-md">
                <Shield className="w-10 h-10 text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
              </div>
            </div>

            <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
              HACK
              <span className="text-cyan-500 text-shadow-glow">
                AWARE
              </span>
            </h1>

            <div className="h-10 flex items-center justify-center border-y border-white/5 bg-black/40 backdrop-blur-sm mb-8">
              <Typewriter sequences={mottos} />
            </div>

          </div>

          {/* Login / Signup Form */}
          {children}

          {/* Footer */}
          <div className="mt-4 flex justify-between items-center px-2 font-mono text-[8px] text-gray-400 uppercase tracking-widest opacity-60">
            <span>DB_STABLE_V2</span>
            <span>NODE: MUMBAI_EDGE_01</span>
            <span>AES_256_ACTIVE</span>
          </div>

        </div>

      </div>

      <style>{`
        .grid-bg {
          background-image:
            linear-gradient(to right, #1e293b 1px, transparent 1px),
            linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(6, 182, 212, 0.8);
        }
      `}</style>

    </div>
  );
};

export default AuthLayout;