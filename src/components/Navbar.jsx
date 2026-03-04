import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Shield, Plus, LogIn, User, LogOut } from "lucide-react";

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }

    setIsLoggedIn(true);

    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.role === "admin") setIsAdmin(true);
      } catch (err) {
        console.error("Auth check failed", err);
      }
    };
    checkRole();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      {/* LOGO */}
      <Link to="/" className="text-2xl font-black tracking-tighter">
        Hear<span className="text-blue-600">Us</span>
      </Link>
      
      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Explore</Link>
        
        <Link 
          to="/submit" 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          <Plus size={18} strokeWidth={3} /> Report Incident
        </Link>
        
        {isAdmin && (
          <Link to="/admin" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition">
            <Shield size={18} /> Command Center
          </Link>
        )}

        {/* 🚀 AUTH SECTION: Logic for Login vs Profile */}
        {!isLoggedIn ? (
          <Link 
            to="/login" 
            className="flex items-center gap-2 border-2 border-slate-100 text-slate-600 px-5 py-2 rounded-2xl font-bold text-sm hover:border-blue-600 hover:text-blue-600 transition-all"
          >
            <LogIn size={18} /> Login
          </Link>
        ) : (
          <div className="flex items-center gap-2">
             <Link to="/profile" className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition">
                <User size={20} />
             </Link>
             <button 
                onClick={handleLogout}
                className="p-2.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition"
                title="Logout"
             >
                <LogOut size={20} />
             </button>
          </div>
        )}
      </div>
    </nav>
  );
}