import { useState } from "react";
import { ShieldCheck, Ghost, User } from "lucide-react";


export default function SubmitReport() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Medical");
  const [location, setLocation] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    "Medical", "Science", "Economic", "Technical", 
    "Crime", "Civil", "Environment", "Others"
  ];

  const mapCategory = (uiCategory) => {
    const map = {
      Medical: "medical",
      Science: "science",
      Economic: "economic",
      Technical: "technical",
      Crime: "violence",
      Civil: "harassment",
      Environment: "environment",
      Others: "other",
    };
    return map[uiCategory] || "other";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (description.length < 20) {
      return alert("Description must be at least 20 characters.");
    }

    // GET THE TOKEN FROM LOCAL STORAGE
    const token = localStorage.getItem("token"); 

    const reportData = {
      title,
      description,
      category: mapCategory(category),
      location: location || "Global",
      isAnonymous: anonymous,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
    };

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/incidents", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Sends the user identity
        },
        body: JSON.stringify(reportData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Submission failed");
      }

      alert(`Report Secured! ID: ${data.reportId}`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setMediaUrl("");
      setMediaType("");
    } catch (err) {
      alert(err.message || "Submission error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 bg-[#FBFCFF] min-h-screen">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-3xl mb-4">
          <ShieldCheck className="text-blue-600" size={32} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Submit Report</h1>
        <p className="text-slate-500 mt-2 font-medium">Anonymity (Being a Normal) is active by default.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-blue-500/5">
        
        {/* Anonymity Selector */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <button
                type="button"
                onClick={() => setAnonymous(true)}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${anonymous ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
            >
                <Ghost size={20} /> <span className="font-bold text-sm">Be a Normal (Anon)</span>
            </button>
            <button
                type="button"
                onClick={() => setAnonymous(false)}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${!anonymous ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
            >
                <User size={20} /> <span className="font-bold text-sm">Display Identity</span>
            </button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
          <input
            type="text"
            placeholder="Headline of the incident..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold"
            required
          />
        </div>

        {/* Category Grid */}
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sector</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-3 rounded-xl text-xs font-black transition-all border ${
                  category === cat 
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                  : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Evidence Description</label>
          <textarea
            rows="5"
            placeholder="Provide as much detail as possible..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-medium leading-relaxed"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Location / Area</label>
                <input
                    type="text"
                    placeholder="e.g. Hyderabad, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Media Link (Img/Vid)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Paste URL..."
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-xs"
                    />
                    <select 
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl px-3 text-xs font-bold outline-none"
                    >
                        <option value="">Type</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                    </select>
                </div>
            </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-[0.97] transition-all disabled:opacity-50 mt-4"
        >
          {loading ? "Securing Report..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}