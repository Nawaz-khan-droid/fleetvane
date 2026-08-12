import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <div className="prose prose-invert max-w-none text-slate-400 space-y-4 leading-relaxed">
        <p>FleetVane is committed to protecting live GPS telemetry, vehicle location data, and user profile information.</p>
        <h2 className="text-xl font-semibold text-white mt-6">Data Collection</h2>
        <p>We collect device location updates, vehicle metadata, and shipment tracking points solely for live route optimization.</p>
        <h2 className="text-xl font-semibold text-white mt-6">Security & JWT Storage</h2>
        <p>Access tokens are stored strictly in-memory during active sessions. Refresh tokens are stored via encrypted, HttpOnly, SameSite cookies.</p>
      </div>
    </div>
  );
}
