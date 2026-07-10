import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";

import { InputField } from "./InputField";
import { apiBaseUrl } from "../../utils/api";

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "info", msg: "INITIALIZING_ID..." });

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
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
        setStatus({ type: "error", msg: data.message || "REGISTRATION_FAILED" });
      }
    } catch {
      setStatus({ type: "error", msg: "CONNECTION_FAILURE" });
    }
  };

  return (
    <div className="bg-[#0d1525]/80 border border-gray-700 p-8 rounded-lg shadow-2xl backdrop-blur-lg animate-in fade-in zoom-in duration-500">
      <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-6 text-center">
        New Operator Registration
      </h2>

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
          label="Full_Legal_Name"
          icon={User}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        />
        <InputField
          label="Designated_Email"
          type="email"
          icon={Mail}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <InputField
          label="New_Passphrase"
          type="password"
          icon={Lock}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded mt-2 uppercase tracking-widest text-[10px] transition-all"
        >
          Initialize_Identity
        </button>
      </form>
    </div>
  );
};

export default SignupForm;

