import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, FileText, Flag, MessageSquare, CheckCircle, XCircle, Trash2, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all-reports");
  const [reports, setReports] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");
      
      // 🛡️ FRONTEND BOUNCER
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== "admin") {
          alert("🛡️ Access Denied: Authorized Administrators Only.");
          navigate("/");
          return;
        }
      } catch (e) {
        navigate("/");
        return;
      }

      try {
        const reportsRes = await fetch("http://localhost:5000/api/incidents/all", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const flaggedRes = await fetch("http://localhost:5000/api/incidents/admin/flagged", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!reportsRes.ok || !flaggedRes.ok) throw new Error("Failed to fetch admin data.");

        const reportsData = await reportsRes.json();
        const flaggedData = await flaggedRes.json();

        setReports(reportsData);
        setFlaggedReports(flaggedData.filter(item => item.targetType === "IncidentReport"));
        setFlaggedComments(flaggedData.filter(item => item.targetType === "Comment"));
        setLoading(false);
      } catch (err) {
        setError("Server Error. The backend rejected the request.");
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [navigate]);

  // -------------------------
  // 🚀 REPORT ACTIONS
  // -------------------------
  const handleUpdateStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } catch (error) { console.error("Update failed", error); }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete report permanently?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setReports(reports.filter(r => r._id !== id));
    } catch (error) { console.error("Delete failed", error); }
  };

  const handleDismissFlag = async (flagId, targetType) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/admin/flagged/${flagId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (targetType === "IncidentReport") setFlaggedReports(flaggedReports.filter(f => f._id !== flagId));
        else setFlaggedComments(flaggedComments.filter(f => f._id !== flagId));
      }
    } catch (error) { console.error("Dismiss failed", error); }
  };

  const handleResolveFlaggedReport = async (flagId, reportId, action) => {
    if (action === "approve") { await handleUpdateStatus(reportId, "approved"); await handleDismissFlag(flagId, "IncidentReport"); }
    else if (action === "reject") { await handleUpdateStatus(reportId, "rejected"); await handleDismissFlag(flagId, "IncidentReport"); }
    else if (action === "delete") { await handleDeleteReport(reportId); await handleDismissFlag(flagId, "IncidentReport"); }
  };

  // 🚀 RESTORED: Comment Resolution Action
  const handleResolveFlaggedComment = async (flagId, commentId, action) => {
    if (action === "approve") {
      await handleDismissFlag(flagId, "Comment");
    } else if (action === "delete") {
      if (!window.confirm("Delete this comment completely?")) return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) await handleDismissFlag(flagId, "Comment");
      } catch (error) { console.error("Failed to delete comment", error); }
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Verifying Credentials...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3"><Shield className="text-blue-400" size={32} /> Command Center</h1>
          <p className="text-slate-400 mt-2 font-medium">Platform Administration & High-Priority Moderation</p>
        </div>
        <Shield size={120} className="absolute -right-4 -bottom-4 text-white/5 rotate-12" />
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-8 pb-2">
        <button onClick={() => setActiveTab("all-reports")} className={`px-4 py-2 font-black transition ${activeTab === "all-reports" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>All Reports</button>
        <button onClick={() => setActiveTab("flagged-reports")} className={`px-4 py-2 font-black transition ${activeTab === "flagged-reports" ? "text-red-600 border-b-2 border-red-600" : "text-slate-400"}`}>Flagged ({flaggedReports.length})</button>
        <button onClick={() => setActiveTab("flagged-comments")} className={`px-4 py-2 font-black transition ${activeTab === "flagged-comments" ? "text-orange-600 border-b-2 border-orange-600" : "text-slate-400"}`}>Comments ({flaggedComments.length})</button>
      </div>

      <div className="space-y-4">
        {activeTab === "all-reports" && reports.map(report => (
          <div key={report._id} className="p-6 border rounded-3xl bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-200 transition">
            <div className="flex-1">
              <h3 className="font-black text-slate-800">{report.title}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">{report.status || "pending"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleUpdateStatus(report._id, "approved")} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"><CheckCircle size={20}/></button>
              <button onClick={() => handleUpdateStatus(report._id, "rejected")} className="p-2 text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100"><XCircle size={20}/></button>
              <button onClick={() => handleDeleteReport(report._id)} className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}

        {activeTab === "flagged-reports" && flaggedReports.map(flag => (
          <div key={flag._id} className="p-6 border-2 border-red-100 bg-red-50 rounded-3xl flex flex-col gap-4">
            <h3 className="font-black text-red-700 flex items-center gap-2"><AlertTriangle size={18}/> Reason: {flag.reason}</h3>
            <div className="bg-white p-4 rounded-2xl">
              <p className="font-bold text-slate-800">{flag.targetData?.title}</p>
              <Link to={`/reports/${flag.targetId}`} target="_blank" className="text-xs text-blue-600 underline mt-2 block">Review Content</Link>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleResolveFlaggedReport(flag._id, flag.targetId, "approve")} className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-xs border border-emerald-100 hover:bg-emerald-50">Approve & Dismiss</button>
              <button onClick={() => handleResolveFlaggedReport(flag._id, flag.targetId, "delete")} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700">Delete Report</button>
            </div>
          </div>
        ))}

        {/* 🚀 RESTORED: Flagged Comments Block */}
        {activeTab === "flagged-comments" && flaggedComments.map(flag => (
          <div key={flag._id} className="p-6 border-2 border-orange-100 bg-orange-50 rounded-3xl flex flex-col gap-4">
            <h3 className="font-black text-orange-700 flex items-center gap-2"><MessageSquare size={18}/> Reason: {flag.reason}</h3>
            <div className="bg-white p-4 rounded-2xl">
              <p className="font-medium text-slate-800 italic">"{flag.targetData?.text}"</p>
              <Link to={`/reports/${flag.targetData?.reportId}`} target="_blank" className="text-xs text-blue-600 underline mt-2 block">Go to Thread</Link>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleResolveFlaggedComment(flag._id, flag.targetId, "approve")} className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold text-xs border border-emerald-100 hover:bg-emerald-50">Ignore Flag</button>
              <button onClick={() => handleResolveFlaggedComment(flag._id, flag.targetId, "delete")} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700">Delete Comment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;