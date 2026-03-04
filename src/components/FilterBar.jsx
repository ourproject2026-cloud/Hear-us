const categories = [
  "All",
  "Crime",
  "Civil",
  "Political",
  "Environment",
  "Public Safety",
];

export default function FilterBar({
  selectedCategory,
  setSelectedCategory,
  isLocalOnly,
  setIsLocalOnly,
}) {
  return (
    <div className="flex flex-col gap-4 mb-8">

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm border transition
              ${
                selectedCategory === cat
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-slate-600 border-slate-300 hover:border-accent"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Location toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Show local only</span>
        <button
          onClick={() => setIsLocalOnly(!isLocalOnly)}
          className={`w-12 h-6 rounded-full relative transition
            ${isLocalOnly ? "bg-accent" : "bg-slate-300"}
          `}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition
              ${isLocalOnly ? "translate-x-6" : ""}
            `}
          />
        </button>
      </div>

    </div>
  );
}
