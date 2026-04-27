import { Link, useNavigate } from "react-router-dom";
import { Shield, LogOut, User } from "lucide-react"; 

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  // 🚀 Logic to verify Admin status based on the database 'role' field
  let isAdmin = false;
  if (token) {
    try {
      // Decode the JWT payload (the middle part of the token)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Matches the 'role' property established in your authRoutes and database
      isAdmin = payload.role === "admin"; 
    } catch (e) {
      console.error("Session invalid or expired");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <Link to="/" className="text-3xl font-black text-blue-600 tracking-tight hover:opacity-80 transition">
        HearUs
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="font-bold text-slate-600 hover:text-blue-600 transition">
          Explore
        </Link>
        
        <Link to="/submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200">
          + Report Incident
        </Link>
        
        {/* 🛡️ THE BOUNCER: Only renders Command Center for users with role: "admin" */}
        {/* 🚀 FIXED: Removed the duplicate, broken 'user' check to prevent app crashes */}
        {isAdmin && (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md border border-slate-700"
          >
            <Shield size={18} /> Command Center
          </Link>
        )}
            
        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          {token ? (
            <>
              <Link to="/profile" className="text-slate-500 hover:text-blue-600 transition" title="My Profile">
                <User size={24} />
              </Link>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-500 transition" 
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </>
          ) : (
            <Link to="/login" className="font-bold text-slate-600 hover:text-blue-600 transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}