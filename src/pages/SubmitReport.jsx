import { useState, useEffect } from "react";
import { ShieldCheck, Ghost, User, LocateFixed, Ban } from "lucide-react"; // 🚀 Added Ban icon

export default function SubmitReport() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Medical");
  const [location, setLocation] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  
  // 🚀 NEW: State to check if the user's trust score hit zero
  const [isRestricted, setIsRestricted] = useState(false);

  const categories = [
    "Medical", "Science", "Economic", "Technical",
    "Crime", "Civil", "Environment", "Others"
  ];

  const mapCategory = (uiCategory) => {
    const map = {
      Medical: "medical",
      Science: "other",
      Economic: "economic",
      Technical: "technical",
      Crime: "crime",
      Civil: "civil",
      Environment: "environment",
      Others: "other",
    };
    return map[uiCategory] || "other";
  };

  useEffect(() => {
    // 1. Auto get user GPS location silently on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.log("Location error:", error);
        },
        // Forced high accuracy for better default coordinates
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // 🚀 2. CHECK RESTRICTION: See if the user is allowed to post
    const checkUserStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        // If the backend says they are restricted, lock the page
        if (data.isRestricted) {
          setIsRestricted(true);
        }
      } catch (err) {
        console.error("Failed to check user status", err);
      }
    };
    
    checkUserStatus();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lon);
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          
          // 🚀 Fixed: Checks neighborhood/suburb first for hyper-local accuracy
          const locality = data.address.neighbourhood || 
                           data.address.suburb || 
                           data.address.residential || 
                           data.address.village || 
                           data.address.city_district ||
                           data.address.city || 
                           data.address.town;
          
          if (locality) {
            setLocation(locality); 
          } else {
            alert("Could not determine your exact locality.");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          alert("Failed to connect to location services.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) alert("Please allow location permissions in your browser.");
        else alert("Unable to fetch your location.");
      },
      // 🚀 Fixed: Forces high-accuracy GPS targeting
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/incidents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Submission failed");
      }

      alert(`Report Secured! ID: ${data.reportId}`);

      setTitle("");
      setDescription("");
      setLocation("");
      setMediaFile(null);

    } catch (err) {
      alert(err.message || "Submission error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 RESTRICTION SCREEN: Shows if Trust Score is too low
  if (isRestricted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center min-h-screen flex flex-col items-center justify-center">
        <Ban size={80} className="text-red-500 mb-6 mx-auto" />
        <h1 className="text-4xl font-black text-slate-900 mb-4">Account Restricted</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
          Your account has been temporarily restricted from submitting new reports. Your Trust Score fell below the community threshold due to multiple flagged posts.
        </p>
      </div>
    );
  }

  // STANDARD FORM (Shows if user is NOT restricted)
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
            <Ghost size={20}/> 
            <span className="font-bold text-sm">Be a Normal (Anon)</span>
          </button>

          <button
            type="button"
            onClick={() => setAnonymous(false)}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${!anonymous ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
          >
            <User size={20}/> 
            <span className="font-bold text-sm">Display Identity</span>
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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Bowenpally"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 focus:border-blue-600 focus:bg-white transition-all outline-none font-bold min-w-0"
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="flex items-center justify-center bg-slate-900 text-white px-5 rounded-2xl hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
                title="Auto-detect my location"
              >
                <LocateFixed size={20} className={isLocating ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Media</label>

            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4"
            />
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