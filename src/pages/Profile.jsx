import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Trash2, Activity, User, Mail, Calendar, MapPin, AlertTriangle, LogOut, Shield, Pencil, X } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState(null);
  
  // 🚀 NEW: State for the Edit Modal
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: "", description: "", category: "", location: "" });
  
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const timestamp = new Date().getTime();

    Promise.all([
      fetch(`http://localhost:5000/api/auth/me?t=${timestamp}`, { headers }).then(res => res.json()),
      fetch(`http://localhost:5000/api/incidents/me?t=${timestamp}`, { headers }).then(res => res.json())
    ])
    .then(([userData, reportsData]) => {
      if (userData._id) {
        setUser(userData);
        setMyReports(Array.isArray(reportsData) ? reportsData : []);
      } else {
        throw new Error("Invalid User Data");
      }
    })
    .catch((err) => setDebugError(err.message))
    .finally(() => setLoading(false));
  }, [navigate]); 

  const handleDelete = async (reportId) => {
    if (!window.confirm("Delete this report permanently?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyReports(myReports.filter(r => r._id !== reportId));
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      alert("Server error while deleting.");
    }
  };

  // 🚀 NEW: Handlers for Editing
  const openEditModal = (report) => {
    setEditingReport(report);
    setEditFormData({
      title: report.title,
      description: report.description,
      category: report.category || "other",
      location: report.location
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${editingReport._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData)
      });
      
      if (res.ok) {
        const updatedReport = await res.json();
        // Update the report in the UI list instantly
        setMyReports(myReports.map(r => r._id === updatedReport._id ? updatedReport : r));
        setEditingReport(null); // Close modal
      } else {
        const errorData = await res.json();
        alert("❌ " + (errorData.message || "Failed to update report."));
      }
    } catch (err) {
      alert("Network error while updating.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading Profile...</div>;
  
  if (debugError) return (
    <div className="max-w-3xl mx-auto mt-20 p-10 bg-red-50 border-4 border-red-500 rounded-3xl text-center">
      <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
      <h2 className="text-3xl font-black text-red-700 mb-2">Data Fetch Failed</h2>
      <p className="text-red-600 mb-4">{debugError}</p>
      <button onClick={logout} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 mx-auto">
        <LogOut size={18} /> Logout & Try Again
      </button>
    </div>
  );

  if (!user) return null;

  const totalReports = myReports.length;
  const approvedReports = myReports.filter(r => r.status === "approved").length;
  const pendingReports = myReports.filter(r => r.status === "pending").length;
  const totalLikes = myReports.reduce((sum, report) => sum + (report.likes?.length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10 relative">
      <section className="bg-white border border-slate-100 shadow-sm rounded-[3rem] p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff&size=128`} alt="avatar" className="w-28 h-28 rounded-full shadow-lg" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 mb-2">{user.name}</h1>
            <p className="text-slate-500 font-medium mb-6 flex items-center justify-center md:justify-start gap-2"><Mail size={16} /> {user.email}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              {user.role === "admin" ? (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                  <Shield size={14} /> System Administrator
                </span>
              ) : (
                <span className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-500">
                  <User size={14} /> {user.googleId ? "Google Account" : "Standard Account"}
                </span>
              )}
              <span className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-500">
                <Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button onClick={logout} className="bg-red-50 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-100 transition">Logout</button>
        </div>
      </section>

      {/* 🚀 UPDATED: Changed to grid-cols-5 and added the Trust Score box */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <StatBox label="Total Reports" value={totalReports} color="text-blue-600" />
        <StatBox label="Live (Approved)" value={approvedReports} color="text-emerald-500" />
        <StatBox label="Pending Review" value={pendingReports} color="text-amber-500" />
        <StatBox label="Total Likes Received" value={totalLikes} color="text-pink-500" />
        
        {/* 🚀 NEW: Trust Score Display */}
        <StatBox 
          label="Trust Score" 
          value={user.trustScore ?? 50} 
          color={(user.trustScore ?? 50) < 30 ? "text-red-600" : "text-blue-600"} 
        />
      </section>

      <section className="bg-white border border-slate-100 shadow-sm rounded-[3rem] p-10">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Activity className="text-blue-600" /> My Investigation Logs</h2>
          <Link to="/submit" className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition">+ New Report</Link>
        </div>

        <div className="space-y-4">
          {myReports.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-lg">You haven't secured any reports yet.</p>
            </div>
          ) : (
            myReports.map((report) => (
              <div key={report._id} className="group bg-white border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition truncate mb-1">{report.title}</h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <span className="bg-slate-50 px-2 py-1 rounded text-slate-500">{report.category}</span>
                    <span>•</span><span>{new Date(report.createdAt).toLocaleDateString()}</span><span>•</span>
                    <span className="flex items-center gap-1 truncate"><MapPin size={12}/> {report.location}</span>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${report.status === "approved" ? "bg-emerald-100 text-emerald-700" : report.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    Status: {report.status || "pending"}
                  </span>
                </div>
                
                {/* 🚀 ADDED EDIT BUTTON HERE */}
                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button onClick={() => openEditModal(report)} className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition" title="Edit Report">
                    <Pencil size={18} />
                  </button>
                  <Link to={`/reports/${report._id}`} className="flex-1 md:flex-none text-center bg-slate-50 text-slate-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-slate-100 transition">View</Link>
                  <button onClick={() => handleDelete(report._id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition" title="Delete Report">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 🚀 NEW: Edit Report Modal UI overlay */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Pencil className="text-blue-600"/> Edit Report</h2>
              <button onClick={() => setEditingReport(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Title</label>
                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 outline-none font-medium focus:border-blue-500 focus:bg-white transition-all" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Category</label>
                  <select value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 outline-none font-medium focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                    <option value="civil">Civil & Infrastructure</option>
                    <option value="crime">Crime & Safety</option>
                    <option value="medical">Medical & Health</option>
                    <option value="environment">Environment</option>
                    <option value="technical">Technical Issues</option>
                    <option value="sports">Sports</option>
                    <option value="economic">Economic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Location</label>
                  <input type="text" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 outline-none font-medium focus:border-blue-500 focus:bg-white transition-all" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 outline-none font-medium focus:border-blue-500 focus:bg-white transition-all min-h-[150px] resize-y" required />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingReport(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 transition shadow-lg shadow-blue-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 text-center shadow-sm hover:-translate-y-1 transition duration-300">
      <p className={`text-4xl font-black mb-1 ${color}`}>{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}