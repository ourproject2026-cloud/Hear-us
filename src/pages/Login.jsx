import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [anonymous, setAnonymous] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     EMAIL LOGIN
  ========================= */
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("Token not received");
      }

      // ✅ Store token FIRST
      localStorage.setItem("token", data.token);

      // Save anonymous preference
      localStorage.setItem("defaultAnonymous", String(anonymous));

      // ✅ Use React Router navigation
      navigate("/profile");

    } catch (err) {
      console.error("Login error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GOOGLE LOGIN
  ========================= */
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow">
      <h1 className="text-2xl font-bold text-primary mb-2">
        Welcome to HearUs
      </h1>

      <p className="text-slate-600 mb-6">
        Sign in to publish reports and manage your activity.
      </p>

      {/* GOOGLE LOGIN */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex items-center justify-center w-full py-3 mt-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 gap-3"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          className="w-5 h-5"
          alt="Google"
        />
        Continue with Google
      </button>

      <div className="text-center text-sm text-slate-400 mb-4">or</div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border rounded-lg px-4 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-4 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Identity toggle */}
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 mb-6">
        <div>
          <p className="font-medium">Default Anonymous</p>
          <p className="text-xs text-slate-500">
            New comments/reports will be anonymous by default
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAnonymous(!anonymous)}
          className={`w-12 h-6 rounded-full relative transition ${
            anonymous ? "bg-accent" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
              anonymous ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* Login */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-accent text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* Signup link */}
      <p className="text-sm text-slate-500 mt-4 text-center">
        Don’t have an account?{" "}
        <Link to="/signup" className="text-blue-600 underline">
          Signup
        </Link>
      </p>
    </div>
  );
}