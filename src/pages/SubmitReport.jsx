import { useState } from "react";
import { ShieldCheck, Ghost, User, UploadCloud, MapPin, LocateFixed } from "lucide-react";

export default function SubmitReport() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Medical");
  const [location, setLocation] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [mediaFile, setMediaFile] = useState(null); 
  const [loading, setLoading] = useState(false);

  // State for GPS coordinates
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // ✅ FIXED: Capitalized "Civil" so the UI button looks consistent with the others
  const categories = [
    "Civil",
    "Crime", 
    "Economic", 
    "Environment", 
    "Medical", 
    "Other", 
    "Sports",
    "Technical"
  ];

  const mapCategory = (uiCategory) => {
    const map = {
      Civil: "civil",
      Crime: "crime",
      Economic: "economic",
      Environment: "environment",
      Medical: "medical",
      Other: "other",
      Sports: "sports",
      Technical: "technical"
    };
    return map[uiCategory] || "other";
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  // Function to get exact GPS coordinates
  const handleGetLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationLoading(false);
        },
        (error) => {
          alert("Could not get your location. Please allow location access in your browser.");
          setLocationLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (description.length < 20) {
      return alert("Description must be at least 20 characters.");
    }

    const token = localStorage.getItem("token"); 

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", mapCategory(category));
    formData.append("location", location || "Global");
    formData.append("isAnonymous", anonymous);
    
    if (latitude && longitude) {
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
    }
    
    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    try {
      setLoading(true);
      
      const res = await fetch("http://localhost:5000/api/incidents", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: formData, 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Submission failed");
      }

      alert(`Report Secured! ID: ${data.reportId}`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setMediaFile(null);
      setLatitude(null);
      setLongitude(null);
      document.getElementById("media-upload").value = "";
      
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
                <div className="relative">
                  <input
                      type="text"
                      placeholder="e.g. Hyderabad, India"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold pr-32"
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locationLoading}
                    className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      latitude 
                      ? "bg-emerald-100 text-emerald-600" 
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                  >
                    {latitude ? <ShieldCheck size={14} /> : <LocateFixed size={14} />}
                    {locationLoading ? "..." : latitude ? "Secured" : "Auto-Locate"}
                  </button>
                </div>
                {latitude && longitude && (
                  <p className="text-[10px] text-emerald-500 font-bold ml-2 flex items-center gap-1">
                    <MapPin size={10} /> GPS Locked: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Evidence (Img/Vid)</label>
                <div className="relative">
                    <input
                        id="media-upload"
                        type="file"
                        accept="image/*,video/*,audio/*"
                        onChange={handleFileChange}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-3 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                    />
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