import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";

import { apiBaseUrl } from "../../utils/api";
import { InputField } from "./InputField";
import LoginButton from "./LoginButton";

const LoginForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState({
    type: "",
    msg: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("operator_token", data.token);
        localStorage.setItem("operator_name", data.fullName);

        navigate("/dashboard");
      } else {
        setStatus({
          type: "error",
          msg: data.message || "Invalid email or password.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        msg: "Unable to connect to the server.",
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {status.msg && (
        <div
          className={`
            rounded-xl
            border
            px-4
            py-3
            text-sm
            ${
              status.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            }
          `}
        >
          {status.msg}
        </div>
      )}

      <InputField
        label="Email Address"
        type="email"
        placeholder="john@example.com"
        icon={Mail}
        value={formData.email}
        onChange={(e) =>
          setFormData({
            ...formData,
            email: e.target.value,
          })
        }
      />

      <InputField
        label="Password"
        type="password"
        placeholder="Enter your password"
        icon={Lock}
        value={formData.password}
        onChange={(e) =>
          setFormData({
            ...formData,
            password: e.target.value,
          })
        }
      />

      {/* Remember Me + Forgot Password */}

      <div className="flex items-center justify-between">

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">

          <input
            type="checkbox"
            className="
              h-4
              w-4
              rounded
              border-slate-600
              bg-slate-800
              accent-cyan-500
            "
          />

          Remember me

        </label>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-cyan-400 transition hover:text-cyan-300"
        >
          Forgot password?
        </button>

      </div>

      <LoginButton loading={loading}>
        Sign In
      </LoginButton>

      <div className="text-center text-sm text-slate-400">

        Don't have an account?{" "}

        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          Create Account
        </button>

      </div>

    </form>
  );
};

export default LoginForm;