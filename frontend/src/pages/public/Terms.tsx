import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>
      <div className="prose prose-invert max-w-none text-slate-400 space-y-4 leading-relaxed">
        <p>By accessing the FleetVane optimization engine, you agree to comply with local transport safety regulations and API usage guidelines.</p>
        <h2 className="text-xl font-semibold text-white mt-6">Acceptable Use</h2>
        <p>Fleet tracking features must only be activated on authorized fleet vehicles and driver profiles.</p>
      </div>
    </div>
  );
}
