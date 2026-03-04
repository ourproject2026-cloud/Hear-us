import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Grab the secret token out of the Google URL
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // 2. Save it securely in the browser's memory
      localStorage.setItem("token", token);
      
      // 3. Force the browser to jump straight to the Profile page!
      window.location.href = "/profile"; 
    } else {
      alert("Google Login failed to return a token.");
      navigate("/login");
    }
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center font-black text-2xl text-blue-600">
      Securing your login... 🚀
    </div>
  );
}