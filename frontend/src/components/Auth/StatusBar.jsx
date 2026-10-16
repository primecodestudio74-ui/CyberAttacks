import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  Activity,
  Server,
  Clock,
} from "lucide-react";

const StatusItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2 whitespace-nowrap">
    <div
      className={`
        flex h-8 w-8 items-center justify-center rounded-lg border
        ${color}
      `}
    >
      <Icon size={15} />
    </div>

    <div className="leading-tight">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="text-xs font-medium text-slate-200">
        {value}
      </p>
    </div>
  </div>
);

const StatusBar = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="
      border-b
      border-white/10
      bg-black/20
      backdrop-blur-xl
      "
    >
      <div
        className="
        mx-auto
        flex
        max-w-7xl
        items-center
        justify-between
        px-6
        py-4
        "
      >
        {/* Left */}

        <div className="flex items-center gap-6">

          <StatusItem
            icon={ShieldCheck}
            label="System"
            value="Protected"
            color="border-green-500/20 bg-green-500/10 text-green-400"
          />

          <StatusItem
            icon={Lock}
            label="Encryption"
            value="AES-256"
            color="border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
          />

          <StatusItem
            icon={Activity}
            label="Threat Feed"
            value="Live"
            color="border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
          />

        </div>

        {/* Center */}

        <div className="hidden lg:flex items-center gap-3">

          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />

          <span className="font-mono text-xs tracking-[3px] uppercase text-green-400">
            Secure Connection Established
          </span>

        </div>

        {/* Right */}

        <div className="flex items-center gap-6">

          <StatusItem
            icon={Server}
            label="Edge Node"
            value="Mumbai-01"
            color="border-blue-500/20 bg-blue-500/10 text-blue-400"
          />

          <StatusItem
            icon={Clock}
            label="Local Time"
            value={time}
            color="border-purple-500/20 bg-purple-500/10 text-purple-400"
          />

        </div>

      </div>
    </header>
  );
};

export default StatusBar;