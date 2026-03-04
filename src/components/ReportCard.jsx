import { MapPin } from "lucide-react";

export default function ReportCard({ report })
 {
  return (
    <div
      className="bg-white border rounded-2xl p-5
      transition hover:shadow-xl hover:-translate-y-1"
    >
      <p className="text-xs font-medium text-blue-600">
        {report.category}
      </p>

      <h3 className="text-lg font-semibold mt-1">
        {report.title}
      </h3>

      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
        {report.summary}
      </p>

      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
       <MapPin size={14} />
        {report.location}
      </p>
      {report.status && (
        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
        {report.status}
        </span>
      )}
    </div>
  );
}
