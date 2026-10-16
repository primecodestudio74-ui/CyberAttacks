import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Terminal,
  Lock,
  Activity,
} from "lucide-react";

import FeatureCard from "./FeatureCard";
import StatusBar from "./StatusBar";
import TypeWriter from "./TypeWriter";

const AuthLayout = ({  children,
  title = "Welcome Back",
  subtitle = "Sign in to continue to HackAware.", }) => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const terminalMessages = useMemo(
    () => [
      "Initializing Secure Session...",
      "Loading Threat Intelligence...",
      "Verifying Encryption Keys...",
      "Authentication Gateway Online...",
      "HackAware Security Platform Ready...",
    ],
    []
  );

  useEffect(() => {
    const token = localStorage.getItem("operator_token");

    if (token) {
      navigate("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  if (checkingAuth) {
    return <div className="h-screen bg-[#060b16]" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060b16] text-white">

      {/* ================= VIDEO ================= */}

      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      >
        <source src="/videos/HA_BG.mp4" type="video/mp4" />
      </video>

      {/* ================= OVERLAYS ================= */}

      <div className="absolute inset-0 bg-[#060b16]/75" />

      <div className="absolute inset-0 cyber-grid" />

      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[160px]" />

      <div className="absolute bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[160px]" />

      <div className="absolute inset-0 scanlines opacity-[0.03]" />

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 flex min-h-screen flex-col">

        <StatusBar />

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-10">

          {/* LEFT */}

          <div className="hidden lg:flex w-1/2 flex-col justify-center pr-16">

            <div className="mb-10 flex items-center gap-5">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">

                <Shield
                  size={42}
                  className="text-cyan-400"
                />

              </div>

              <div>

                <h1 className="text-6xl font-black tracking-tight">

                  HACK

                  <span className="text-cyan-400">

                    AWARE

                  </span>

                </h1>

                <p className="mt-1 text-gray-400 tracking-[3px] uppercase">

                  Cyber Security Platform

                </p>

              </div>

            </div>

            <h2 className="max-w-xl text-4xl font-bold leading-tight">

              Learn.

              <span className="text-cyan-400">

                {" "}Practice.

              </span>

              {" "}Defend.

            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">

              Build real-world cybersecurity skills through
              interactive labs, attack simulations,
              AI-assisted learning and practical exercises.

            </p>

            {/* Terminal */}

            <div className="mt-10 rounded-xl border border-cyan-500/20 bg-black/40 p-5 backdrop-blur-lg">

              <div className="mb-3 flex gap-2">

                <span className="h-3 w-3 rounded-full bg-red-500" />

                <span className="h-3 w-3 rounded-full bg-yellow-500" />

                <span className="h-3 w-3 rounded-full bg-green-500" />

              </div>

              <div className="font-mono text-cyan-400">

                <span>$ </span>

                <TypeWriter sequences={terminalMessages} />

              </div>

            </div>

            {/* Feature Cards */}

            <div className="mt-10 grid grid-cols-2 gap-5">

              <FeatureCard
                icon={Lock}
                title="Secure Login"
                description="AES-256 encrypted authentication."
              />

              <FeatureCard
                icon={Terminal}
                title="Virtual Labs"
                description="Practice ethical hacking safely."
              />

              <FeatureCard
                icon={Shield}
                title="Threat Defense"
                description="Learn attack detection."
              />

              <FeatureCard
                icon={Activity}
                title="Live Monitoring"
                description="Track your progress instantly."
              />

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex w-full lg:w-1/2 justify-center">
    
            <div
              className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-cyan-500/20
              bg-white/[0.04]
              backdrop-blur-2xl
              shadow-[0_25px_60px_rgba(0,0,0,.45)]
              p-8
              "
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
  Secure Authentication
</div>

              <div className="mb-8">
  <h2 className="text-3xl font-bold text-white">
    {title}
  </h2>

  <p className="mt-2 text-slate-400">
    {subtitle}
  </p>
</div>

              {children}

            </div>

          </div>

        </div>

      </div>

      {/* ================= CSS ================= */}

      <style>{`

      .cyber-grid{

      background-image:

      linear-gradient(rgba(6,182,212,.08) 1px,transparent 1px),

      linear-gradient(90deg,rgba(6,182,212,.08) 1px,transparent 1px);

      background-size:40px 40px;

      mask-image:radial-gradient(circle,white,transparent 95%);

      animation:gridMove 18s linear infinite;

      }

      @keyframes gridMove{

      from{

      transform:translateY(0);

      }

      to{

      transform:translateY(40px);

      }

      }

      .scanlines{

      background:linear-gradient(

      rgba(255,255,255,0) 50%,

      rgba(0,0,0,.25) 50%

      );

      background-size:100% 4px;

      }

      `}</style>

    </div>
  );
};

export default AuthLayout;