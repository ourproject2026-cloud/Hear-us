import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldAlert, HeartPulse, Banknote, 
  Cpu, Leaf, HelpCircle, MapPin, Ghost, User, 
  Play, Image as ImageIcon, Map as MapIcon, LayoutGrid,
  Search, X, Trophy, Landmark 
} from "lucide-react"; // 🚀 Added 'Landmark' for the Civil category

// Import Leaflet map components and CSS
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default marker icon issue in React
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// 🚀 ADDED: The Civil Category configuration
const CATEGORIES = [
  { id: "all", label: "All Feed", color: "from-slate-700 to-slate-900", icon: null },
  { id: "civil", label: "Civil", color: "from-indigo-400 to-purple-500", shadow: "shadow-indigo-100", icon: <Landmark size={18}/> },
  { id: "medical", label: "Medical", color: "from-pink-400 to-rose-500", shadow: "shadow-rose-100", icon: <HeartPulse size={18}/> },
  { id: "sports", label: "Sports", color: "from-orange-400 to-amber-500", shadow: "shadow-amber-100", icon: <Trophy size={18}/> },
  { id: "economic", label: "Economic", color: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-100", icon: <Banknote size={18}/> },
  { id: "technical", label: "Technical", color: "from-blue-400 to-cyan-500", shadow: "shadow-cyan-100", icon: <Cpu size={18}/> },
  { id: "environment", label: "Environment", color: "from-lime-400 to-green-600", shadow: "shadow-green-100", icon: <Leaf size={18}/> },
  { id: "crime", label: "Crime", color: "from-red-500 to-rose-600", shadow: "shadow-red-100", icon: <ShieldAlert size={18}/> },
  { id: "other", label: "Other", color: "from-slate-400 to-slate-500", shadow: "shadow-slate-100", icon: <HelpCircle size={18}/> }
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [localOnly, setLocalOnly] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState(""); 
  
  const [reports, setReports] = useState([]);
  
  const userLocation = "India"; 

  useEffect(() => {
    fetch("http://localhost:5000/api/incidents/public")
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error("API Error:", err));
  }, []);

  const filteredReports = reports.filter(r => {
    const rCategory = r.category?.toLowerCase() || "other"; // Default to other if missing
    const rLocation = r.location?.toLowerCase() || "";
    const rTitle = r.title?.toLowerCase() || "";
    const rDesc = r.description?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    // If the active category is "other", we should also catch reports labeled "other"
    const categoryMatch = activeCategory === "all" || 
                          rCategory === activeCategory || 
                          (activeCategory === "other" && rCategory === "other");

    const locationMatch = !localOnly || rLocation.includes(userLocation.toLowerCase());
    const searchMatch = !query || rTitle.includes(query) || rDesc.includes(query);
    
    return categoryMatch && locationMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-[#FDFEFF] pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section */}
        <div className="pt-12 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900">
            Hear<span className="text-blue-600">Us</span>
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-full transition-all ${viewMode === "grid" ? "bg-white shadow-md text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode("map")}
                className={`p-3 rounded-full transition-all ${viewMode === "map" ? "bg-white shadow-md text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <MapIcon size={20} />
              </button>
            </div>

            <button 
              onClick={() => setLocalOnly(!localOnly)}
              className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black transition-all ${
                localOnly 
                ? "bg-blue-600 text-white shadow-2xl shadow-blue-200 scale-105" 
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              <MapPin size={20} className={localOnly ? "animate-pulse" : ""} />
              {localOnly ? userLocation : "Filter My Area"}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-10 relative max-w-2xl">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search reports by title, keyword, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-3xl py-4 pl-14 pr-12 text-slate-700 font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-6 flex items-center text-slate-400 hover:text-slate-600 transition"
              title="Clear search"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Dynamic Filter Bar */}
        <div className="flex overflow-x-auto gap-4 pb-12 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${
                activeCategory === cat.id 
                ? `bg-gradient-to-br ${cat.color} text-white shadow-xl ${cat.shadow} -translate-y-1` 
                : "bg-white text-slate-400 border border-slate-100 hover:border-slate-300"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* CONDITIONAL RENDERING: Map View vs Grid View */}
        {viewMode === "map" ? (
          
          <div className="h-[600px] w-full rounded-[3.5rem] overflow-hidden shadow-2xl border-[8px] border-white relative z-0">
            <MapContainer center={[17.3850, 78.4867]} zoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              
              {filteredReports.map((report, index) => {
                const lat = 17.3850 + (Math.sin(index) * 0.05);
                const lng = 78.4867 + (Math.cos(index) * 0.05);
                const config = CATEGORIES.find(c => c.id === report.category?.toLowerCase()) 
                               || CATEGORIES.find(c => c.id === "other");

                return (
                  <Marker key={report._id} position={[lat, lng]}>
                    <Popup className="rounded-2xl">
                      <div className="p-1 min-w-[200px]">
                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-black uppercase text-white bg-gradient-to-r ${config.color} mb-2`}>
                          {config.label}
                        </span>
                        <h3 className="font-bold text-slate-800 leading-tight mb-1">{report.title}</h3>
                        <p className="text-xs text-slate-500 mb-3">{report.location}</p>
                        <Link to={`/reports/${report._id}`} className="text-blue-600 text-xs font-black uppercase tracking-wider hover:underline">
                          View Evidence →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

        ) : (

          <>
            {filteredReports.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 mt-8 w-full">
                {searchQuery ? <Search size={48} className="mx-auto text-slate-300 mb-4" /> : <MapPin size={48} className="mx-auto text-slate-300 mb-4" />}
                <p className="text-slate-500 font-bold text-lg">
                  {searchQuery 
                    ? `No reports found matching "${searchQuery}"` 
                    : `The streets are quiet. No reports found for ${localOnly ? `"${userLocation}"` : "this category"}.`}
                </p>
                <button 
                  onClick={() => { setLocalOnly(false); setActiveCategory("all"); setSearchQuery(""); }} 
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Clear All Filters & Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredReports.map((report) => {
                  const config = CATEGORIES.find(c => c.id === report.category?.toLowerCase()) 
                                 || CATEGORIES.find(c => c.id === "other");
                                 
                  const fullMediaUrl = report.mediaUrl ? `http://localhost:5000${report.mediaUrl}` : null;
                  
                  return (
                    <Link key={report._id} to={`/reports/${report._id}`} className="group">
                      <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
                        
                        <div className="h-64 bg-slate-100 relative">
                          {fullMediaUrl ? (
                              report.mediaType === "video" ? (
                                <div className="h-full w-full relative">
                                  <video className="w-full h-full object-cover" src={fullMediaUrl} muted playsInline />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                    <Play size={40} fill="white" className="text-white transform group-hover:scale-110 transition-transform" />
                                  </div>
                                </div>
                              ) : report.mediaType === "audio" ? (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                  <div className="bg-white p-5 rounded-full shadow-md text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                     <Play size={32} fill="currentColor" />
                                  </div>
                                  <span className="text-sm font-bold text-slate-500 tracking-widest uppercase">Audio Evidence</span>
                                </div>
                              ) : (
                                <img src={fullMediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Incident" />
                              )
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-200">
                              <ImageIcon size={64} strokeWidth={1} />
                            </div>
                          )}

                          <div className="absolute top-6 right-6 backdrop-blur-md bg-black/20 px-4 py-2 rounded-2xl border border-white/20 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest z-10">
                              {report.isAnonymous ? <Ghost size={14} /> : <User size={14} />}
                              {report.isAnonymous ? "Anonymous" : report.authorName}
                          </div>

                          <div className={`absolute top-6 left-6 px-5 py-2 rounded-xl text-[10px] font-black uppercase text-white bg-gradient-to-r ${config.color} shadow-lg z-10`}>
                              {config.label}
                          </div>
                        </div>

                        <div className="p-10">
                          <h3 className="text-2xl font-black text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-slate-400 font-medium text-sm line-clamp-3 mb-8 leading-relaxed">
                            {report.description}
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><MapPin size={14} className="text-blue-600" /> {report.location || "Nearby"}</span>
                            <span className="group-hover:text-blue-600 transition-colors">View Report →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}