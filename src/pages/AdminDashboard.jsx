import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Flag, MessageSquare, CheckCircle, XCircle, Trash2, Check, ExternalLink } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("all-reports");
  const [reports, setReports] = useState([]);
  const [flaggedReports, setFlaggedReports] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setError("Not authorized. Please log in.");

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
  }, []);

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
      if (res.ok) {
        setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) { console.error("Failed to update status", error); }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete this report completely?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setReports(reports.filter(r => r._id !== id));
    } catch (error) { console.error("Failed to delete", error); }
  };

  // -------------------------
  // 🚀 FLAG RESOLUTION ACTIONS
  // -------------------------
  const handleDismissFlag = async (flagId, targetType) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/admin/flagged/${flagId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (targetType === "IncidentReport") {
          setFlaggedReports(flaggedReports.filter(f => f._id !== flagId));
        } else {
          setFlaggedComments(flaggedComments.filter(f => f._id !== flagId));
        }
      }
    } catch (error) { console.error("Failed to dismiss flag", error); }
  };

  const handleResolveFlaggedReport = async (flagId, reportId, action) => {
    if (action === "approve") {
      await handleUpdateStatus(reportId, "approved");
      await handleDismissFlag(flagId, "IncidentReport");
    } else if (action === "reject") {
      await handleUpdateStatus(reportId, "rejected");
      await handleDismissFlag(flagId, "IncidentReport");
    } else if (action === "delete") {
      await handleDeleteReport(reportId);
      await handleDismissFlag(flagId, "IncidentReport");
    }
  };

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

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="text-blue-600" size={32} /> Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Review, approve, and manage platform activity.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab("all-reports")} className={`flex items-center gap-2 px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === "all-reports" ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500"}`}>
          <FileText size={18} /> All Reports
        </button>
        <button onClick={() => setActiveTab("flagged-reports")} className={`flex items-center gap-2 px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === "flagged-reports" ? "text-red-700 border-b-2 border-red-700" : "text-slate-500"}`}>
          <Flag size={18} /> Flagged Reports ({flaggedReports.length})
        </button>
        <button onClick={() => setActiveTab("flagged-comments")} className={`flex items-center gap-2 px-4 py-2 font-semibold transition whitespace-nowrap ${activeTab === "flagged-comments" ? "text-orange-700 border-b-2 border-orange-700" : "text-slate-500"}`}>
          <MessageSquare size={18} /> Flagged Comments ({flaggedComments.length})
        </button>
      </div>

      {activeTab === "all-reports" && (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report._id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{report.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 my-1">{report.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${report.status === 'pending' ? 'bg-orange-100 text-orange-700' : report.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {report.status || "approved"}
                  </span>
                  <Link to={`/reports/${report._id}`} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={14} /> Open Post
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus(report._id, "approved")} className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-sm font-medium"><CheckCircle size={14} /> Approve</button>
                  <button onClick={() => handleUpdateStatus(report._id, "rejected")} className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 rounded text-sm font-medium"><XCircle size={14} /> Reject</button>
                  <button onClick={() => handleDeleteReport(report._id)} className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-sm font-medium"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "flagged-reports" && (
        <div className="space-y-4">
          {flaggedReports.length === 0 ? <p className="text-slate-500 py-10">No flagged reports.</p> : flaggedReports.map(flag => (
            <div key={flag._id} className="p-4 border border-red-200 bg-red-50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <h3 className="font-bold text-red-700 flex items-center gap-2"><Flag size={16} /> Flag Reason: {flag.reason}</h3>
                <div className="bg-white bg-opacity-70 p-3 rounded mt-2 border border-red-100">
                  <p className="font-semibold text-slate-800">{flag.targetData.title}</p>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">{flag.targetData.description}</p>
                  <Link to={`/reports/${flag.targetId}`} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2 w-fit">
                    <ExternalLink size={12} /> View Full Report
                  </Link>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleResolveFlaggedReport(flag._id, flag.targetId, "approve")} className="flex items-center gap-1 px-3 py-1 bg-white text-green-700 border border-green-200 hover:bg-green-50 rounded text-sm font-medium"><Check size={14} /> Approve & Dismiss</button>
                <button onClick={() => handleResolveFlaggedReport(flag._id, flag.targetId, "reject")} className="flex items-center gap-1 px-3 py-1 bg-white text-yellow-700 border border-yellow-200 hover:bg-yellow-50 rounded text-sm font-medium"><XCircle size={14} /> Reject Report</button>
                <button onClick={() => handleResolveFlaggedReport(flag._id, flag.targetId, "delete")} className="flex items-center gap-1 px-3 py-1 bg-white text-red-700 border border-red-200 hover:bg-red-50 rounded text-sm font-medium"><Trash2 size={14} /> Delete Report</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "flagged-comments" && (
        <div className="space-y-4">
          {flaggedComments.length === 0 ? <p className="text-slate-500 py-10">No flagged comments.</p> : flaggedComments.map(flag => (
            <div key={flag._id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <h3 className="font-bold text-orange-700 flex items-center gap-2"><MessageSquare size={16} /> Flag Reason: {flag.reason}</h3>
                <div className="bg-white bg-opacity-70 p-3 rounded mt-2 border border-orange-100">
                  <p className="text-sm text-slate-800 italic">"{flag.targetData.text}"</p>
                  <Link to={`/reports/${flag.targetData.reportId}`} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2 w-fit">
                    <ExternalLink size={12} /> Go to Thread
                  </Link>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleResolveFlaggedComment(flag._id, flag.targetId, "approve")} className="flex items-center gap-1 px-3 py-1 bg-white text-green-700 border border-green-200 hover:bg-green-50 rounded text-sm font-medium"><Check size={14} /> Ignore Flag</button>
                <button onClick={() => handleResolveFlaggedComment(flag._id, flag.targetId, "delete")} className="flex items-center gap-1 px-3 py-1 bg-white text-red-700 border border-red-200 hover:bg-red-50 rounded text-sm font-medium"><Trash2 size={14} /> Delete Comment</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;