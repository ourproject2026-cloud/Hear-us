import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ReportAbuseModal({ onClose, targetType, targetId }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return alert("Please select a reason");
    
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reports/abuse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          targetType, // 'incident' or 'comment'
          targetId,
          reason
        }),
      });

      if (res.ok) {
        alert("Report submitted to moderators. Thank you.");
        onClose();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to report.");
      }
    } catch (err) {
      alert("System error. Try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle size={24} />
            <h3 className="font-black uppercase tracking-tighter text-xl">Report Issue</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-500 text-sm mb-6 font-medium">
          Is this {targetType} violating community guidelines? Select a reason below.
        </p>

        <div className="space-y-3 mb-8">
          {["Spam", "Harassment", "False Information", "Inappropriate Media"].map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                reason === r ? "border-rose-600 bg-rose-50 text-rose-600" : "border-slate-50 text-slate-500 hover:border-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={sending || !reason}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-600 transition-all disabled:opacity-50"
        >
          {sending ? "Sending..." : "Confirm Report"}
        </button>
      </div>
    </div>
  );
}