import { useEffect, useState } from "react";
import ReportAbuseModal from "./ReportAbuseModal";
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, Ghost, User } from "lucide-react";

export default function Comment({ comment, onReply, depth = 0 }) {
  const [showReport, setShowReport] = useState(false);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes || 0);
  const [loadingReact, setLoadingReact] = useState(false);

  useEffect(() => {
    setLikes(comment.likes || 0);
    setDislikes(comment.dislikes || 0);
  }, [comment.likes, comment.dislikes]);

  const reactToComment = async (action) => {
    try {
      setLoadingReact(true);
      const token = localStorage.getItem("token");
      if (!token) return alert("Please login to react to comments.");

      const res = await fetch(
        `http://localhost:5000/api/comments/${comment._id}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Reaction failed");

      setLikes(data.likes);
      setDislikes(data.dislikes);
    } catch (err) {
      alert("Connection error. Could not update reaction.");
    } finally {
      setLoadingReact(false);
    }
  };

  return (
    <div
      className="group transition-all duration-300 border-b border-slate-50 pb-6 mb-6 last:border-0"
      style={{ marginLeft: depth * 20 }} // 🔥 indentation for threads
    >
      {/* AUTHOR INFO BAR */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            comment.isAnonymous
              ? "bg-slate-100 text-slate-400"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {comment.isAnonymous ? <Ghost size={14} /> : <User size={14} />}
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-[0.15em] ${
            comment.isAnonymous ? "text-slate-400" : "text-blue-600"
          }`}
        >
          {comment.isAnonymous
            ? "Normal (Ghost Identity)"
            : comment.displayName || "Verified User"}
        </span>

        <span className="text-slate-200">•</span>

        <span className="text-[10px] font-bold text-slate-300 uppercase">
          {new Date(comment.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* COMMENT BODY */}
      <div className="pl-1">
        <p className="text-slate-700 font-medium leading-relaxed mb-4">
          {comment.text}
        </p>
      </div>

      {/* INTERACTIONS BAR */}
      <div className="flex gap-4 items-center pl-1">
        <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1 border border-slate-100/50 shadow-sm">
          {/* Like */}
          <button
            onClick={() => reactToComment("like")}
            disabled={loadingReact}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              likes > 0
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-400 hover:text-blue-500"
            }`}
          >
            <ThumbsUp size={12} className={likes > 0 ? "fill-current" : ""} />
            <span className="text-xs font-black">{likes}</span>
          </button>

          {/* Dislike */}
          <button
            onClick={() => reactToComment("dislike")}
            disabled={loadingReact}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              dislikes > 0
                ? "bg-white text-rose-500 shadow-sm"
                : "text-slate-400 hover:text-rose-500"
            }`}
          >
            <ThumbsDown size={12} className={dislikes > 0 ? "fill-current" : ""} />
            <span className="text-xs font-black">{dislikes}</span>
          </button>
        </div>

        {/* Reply */}
        {onReply && (
          <button
            onClick={() => onReply(comment)} // 🔥 pass full comment
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors ml-2"
          >
            <MessageSquare size={14} />
            Reply
          </button>
        )}

        {/* Report */}
        <button
          onClick={() => setShowReport(true)}
          className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-600 transition-all ml-auto"
        >
          <Flag size={12} />
          Report
        </button>
      </div>

      {/* 🔥 REPLIES (THREAD SYSTEM) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1} // 🔥 indentation increase
            />
          ))}
        </div>
      )}

      {/* MODAL */}
      {showReport && (
        <ReportAbuseModal
          onClose={() => setShowReport(false)}
          targetType="comment"
          targetId={comment._id}
        />
      )}
    </div>
  );
}