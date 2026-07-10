import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";

import { apiBaseUrl } from "../../utils/api";
import { InputField } from "./InputField";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "info", msg: "AUTHENTICATING..." });

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("operator_token", data.token);
        localStorage.setItem("operator_name", data.fullName);
        navigate("/dashboard");
      } else {
        setStatus({ type: "error", msg: data.message || "ACCESS_DENIED" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "GATEWAY_TIMEOUT" });
    }
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-700 p-8 rounded-lg shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">Operator Login</h2>
        <span className="text-[9px] text-red-500 font-bold border border-red-500/20 px-2 py-0.5 rounded bg-red-500/5 animate-pulse">LOCKED</span>
      </div>

      {status.msg && (
        <div
          className={`mb-4 p-2 text-[10px] border font-mono ${
            status.type === "error"
              ? "border-red-500/40 text-red-400 bg-red-900/10"
              : "border-cyan-500/40 text-cyan-400 bg-cyan-900/10"
          }`}
        >
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Identity_Email"
          type="email"
          icon={Mail}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <InputField
          label="Secure_Passphrase"
          type="password"
          icon={Lock}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-700 to-cyan-500 hover:from-cyan-600 hover:to-cyan-400 text-white font-bold py-3 rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all uppercase tracking-widest text-[10px]"
        >
          Grant_Access
        </button>
      </form>
    </div>
  );
};

export default LoginForm;

