import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";

import { InputField } from "./InputField";
import LoginButton from "./LoginButton";
import { apiBaseUrl } from "../../utils/api";

const SignupForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
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
      const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
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
          msg: data.message || "Registration failed.",
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
        label="Full Name"
        placeholder="John Doe"
        icon={User}
        value={formData.fullName}
        onChange={(e) =>
          setFormData({
            ...formData,
            fullName: e.target.value,
          })
        }
      />

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
        placeholder="Create a strong password"
        icon={Lock}
        value={formData.password}
        onChange={(e) =>
          setFormData({
            ...formData,
            password: e.target.value,
          })
        }
      />

      <LoginButton loading={loading}>
        Create Account
      </LoginButton>

      <div className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signin")}
          className="font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          Sign In
        </button>
      </div>
    </form>
  );
};

export default SignupForm;