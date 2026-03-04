import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      return alert("All fields are required");
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.message || "Signup failed");
      }

      alert("Signup successful ✅ Please login");
      navigate("/login");
    } catch (err) {
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-2">Create Account</h1>

      <p className="text-slate-600 mb-6">
        Join HearUs to report and discuss incidents.
      </p>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded-lg px-4 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded-lg px-4 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded-lg px-4 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 characters"
        />
      </div>

      <button
        onClick={handleSignup}
        disabled={loading}
        className="w-full bg-accent text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>

      <p className="text-sm text-slate-500 mt-4 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 underline">
          Login
        </Link>
      </p>
    </div>
  );
}
