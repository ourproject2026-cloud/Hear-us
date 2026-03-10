import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ThumbsUp, ThumbsDown, Flag, ArrowLeft, 
  MessageSquare, Ghost, User as UserIcon, AlertTriangle,
  Pencil, Trash2, Check, X,
  // 🚀 IMPORTED THE CATEGORY ICONS
  ShieldAlert, HeartPulse, Banknote, 
  Cpu, Leaf, HelpCircle, Trophy, Landmark 
} from "lucide-react";

// 🚀 ADDED: Category Styles Dictionary to match the Home page theme
const CATEGORY_STYLES = {
  civil: { color: "text-purple-700 bg-purple-50 border-purple-200", icon: <Landmark size={14}/> },
  medical: { color: "text-rose-700 bg-rose-50 border-rose-200", icon: <HeartPulse size={14}/> },
  sports: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Trophy size={14}/> },
  economic: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <Banknote size={14}/> },
  technical: { color: "text-cyan-700 bg-cyan-50 border-cyan-200", icon: <Cpu size={14}/> },
  environment: { color: "text-green-700 bg-green-50 border-green-200", icon: <Leaf size={14}/> },
  crime: { color: "text-red-700 bg-red-50 border-red-200", icon: <ShieldAlert size={14}/> },
  other: { color: "text-slate-700 bg-slate-100 border-slate-200", icon: <HelpCircle size={14}/> }
};

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isAnon, setIsAnon] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const token = localStorage.getItem("token");
  let currentUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserId = payload.id || payload.userId || payload._id;
    } catch (e) { console.error("Invalid token format"); }
  }

  useEffect(() => {
    fetch(`http://localhost:5000/api/incidents/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setError(data.message); 
        else setReport(data);
      })
      .catch(err => setError("Failed to connect to server."));

    fetch(`http://localhost:5000/api/comments?reportId=${id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setComments(data);
        else setComments([]); 
      })
      .catch(err => setComments([]));
  }, [id]);

  // 🚀 FIXED: UI now safely forces arrays to render the correct lengths
  const handleLike = async () => {
    if (!token) return alert("Please log in to like a report.");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}/like`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReport(prev => ({ 
          ...prev, 
          likes: Array(data.likes).fill("id"), 
          dislikes: Array(data.dislikes).fill("id") 
        }));
      } else {
        alert("❌ " + (data.message || "Failed to like"));
      }
    } catch(err) { alert("Network error."); }
  };

  const handleDislike = async () => {
    if (!token) return alert("Please log in to dislike a report.");
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}/dislike`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReport(prev => ({ 
          ...prev, 
          likes: Array(data.likes).fill("id"), 
          dislikes: Array(data.dislikes).fill("id") 
        }));
      } else {
        alert("❌ " + (data.message || "Failed to dislike"));
      }
    } catch(err) { alert("Network error."); }
  };

  const handleFlag = async () => {
    if (!token) return alert("Please log in to flag a report.");
    const reason = prompt("Reason for flagging (spam, fake, offensive, hate):");
    if (!reason) return;
    try {
      const res = await fetch(`http://localhost:5000/api/incidents/${id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason.toLowerCase() })
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.message);
      } else {
        alert("❌ " + data.message);
      }
    } catch(err) { alert("Network error."); }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!token) return alert("Please log in to comment.");

    try {
      const res = await fetch(`http://localhost:5000/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reportId: id, text: commentText, isAnonymous: isAnon })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]); 
        setCommentText(""); 
      } else {
        alert("Failed to post comment.");
      }
    } catch (err) { alert("Server error while posting comment."); }
  };

  const handleCommentReact = async (commentId, action) => {
    if (!token) return alert("Please log in to react to comments.");
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }) 
      });
      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(c => 
          c._id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes } : c
        ));
      }
    } catch (err) { console.error("Failed to react to comment", err); }
  };

  const handleReportComment = async (commentId) => {
    if (!token) return alert("Please log in to report a comment.");
    const reason = prompt("Why are you reporting this comment? (spam, harassment, etc.)");
    if (!reason) return;
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      alert(data.message || "Comment reported successfully.");
    } catch (err) { console.error("Failed to report comment", err); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      } else {
        alert("Failed to delete comment.");
      }
    } catch (err) { console.error("Error deleting comment", err); }
  };

  const saveEditedComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text: editContent })
      });
      
      const data = await res.json(); 

      if (res.ok) {
        setComments(comments.map(c => c._id === commentId ? { ...c, text: data.text } : c));
        setEditingId(null);
      } else {
        alert(`Failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) { 
      console.error("Network Error:", err);
      alert("Network Error: Backend server is offline. Check your terminal.");
    }
  };

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center">
      <h2 className="text-2xl font-black text-slate-800 mb-4">{error}</h2>
      <Link to="/" className="text-blue-600 font-bold underline">Return to Feed</Link>
    </div>
  );
  if (!report) return <div className="min-h-screen flex items-center justify-center text-xl font-black text-slate-400">Loading Evidence...</div>;

  // 🚀 Calculate which style to apply based on the report category
  const catKey = report.category?.toLowerCase() || "other";
  const catConfig = CATEGORY_STYLES[catKey] || CATEGORY_STYLES["other"];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link to="/" className="flex items-center gap-2 text-slate-400 font-bold mb-8 hover:text-blue-600 transition">
        <ArrowLeft size={20} /> Back to Feed
      </Link>

      <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-100">
        {report.mediaUrl && (
          <div className="bg-slate-900 max-h-[500px] flex justify-center">
            {report.mediaType === "video" ? (
              <video src={`http://localhost:5000${report.mediaUrl}`} controls className="max-h-[500px] w-full object-contain" />
            ) : report.mediaType === "audio" ? (
               <div className="p-20 w-full flex justify-center bg-blue-50"><audio src={`http://localhost:5000${report.mediaUrl}`} controls /></div>
            ) : (
              <img src={`http://localhost:5000${report.mediaUrl}`} className="max-h-[500px] w-full object-contain" alt="Evidence" />
            )}
          </div>
        )}

        <div className="p-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              {/* 🚀 DYNAMIC BADGE APPLIED HERE */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border mb-4 ${catConfig.color}`}>
                {catConfig.icon} {report.category || "Other"}
              </span>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">{report.title}</h1>
            </div>
            <button onClick={handleFlag} className="text-slate-300 hover:text-red-500 transition-colors" title="Report this post">
              <Flag size={24} />
            </button>
          </div>

          <p className="text-slate-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">{report.description}</p>

          <div className="flex items-center gap-4 border-t border-slate-100 pt-8">
            <button onClick={handleLike} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition">
              <ThumbsUp size={20} /> {report.likes?.length || 0} Likes
            </button>
            <button onClick={handleDislike} className="flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition">
              <ThumbsDown size={20} /> {report.dislikes?.length || 0} Dislikes
            </button>
            <span className="ml-auto text-sm font-bold text-slate-400 flex items-center gap-2">
              {report.isAnonymous ? <Ghost size={16} /> : <UserIcon size={16} />} 
              Source: {report.authorName || "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <MessageSquare className="text-blue-600" /> Community Discussion
        </h2>

        <form onSubmit={postComment} className="mb-10 relative">
          <textarea 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add to the investigation..."
            className="w-full bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 outline-none font-medium focus:border-blue-600 focus:bg-white transition-all resize-none"
            rows="3"
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
             <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
               <button type="button" onClick={() => setIsAnon(false)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isAnon ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <UserIcon size={16}/> User ID
               </button>
               <button type="button" onClick={() => setIsAnon(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isAnon ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Ghost size={16}/> Anonymous
               </button>
             </div>
             <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 hover:-translate-y-0.5 transition shadow-lg shadow-blue-200 w-full sm:w-auto">
                Post Comment
             </button>
          </div>
        </form>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold">No discussion yet. Be the first to share your thoughts.</p>
            </div>
          ) : (
            comments.map(c => {
              const isOwner = currentUserId && c.authorId === currentUserId; 
              
              return (
              <div key={c._id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    {c.isAnonymous ? <Ghost size={14}/> : <UserIcon size={14}/>}
                    <span className="text-slate-700">{c.author || c.authorName || "Unknown User"}</span>
                    {isOwner && <span className="text-[10px] ml-2 text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">You</span>}
                  </div>
                  {c.isReported && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Under Review</span>}
                </div>
                
                {editingId === c._id ? (
                  <div className="mt-2 mb-4">
                    <textarea 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white rounded-xl p-4 border-2 border-blue-200 outline-none font-medium focus:border-blue-500 transition-all resize-none"
                      rows="2"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveEditedComment(c._id)} className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                        <Check size={14} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-300 transition">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 font-medium leading-relaxed">{c.text}</p>
                )}
                
                <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-slate-200/60 flex-wrap">
                  <button onClick={() => handleCommentReact(c._id, "like")} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition">
                    <ThumbsUp size={14} /> {Array.isArray(c.likes) ? c.likes.length : (c.likes || 0)}
                  </button>
                  <button onClick={() => handleCommentReact(c._id, "dislike")} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-600 transition">
                    <ThumbsDown size={14} /> {Array.isArray(c.dislikes) ? c.dislikes.length : (c.dislikes || 0)}
                  </button>
                  
                  {isOwner && editingId !== c._id && (
                    <>
                      <button onClick={() => { setEditingId(c._id); setEditContent(c.text); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-500 transition ml-auto sm:ml-0">
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => deleteComment(c._id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition">
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}

                  {!isOwner && (
                    <button onClick={() => handleReportComment(c._id)} className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-orange-500 transition" title="Report this comment">
                      <AlertTriangle size={14} /> Report
                    </button>
                  )}
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
}