import React from 'react';

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-sans">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Client Dashboard</h1>
      <p className="text-slate-400 mb-8">View and track your requested shipments.</p>
      
      <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur">
        <p className="text-slate-400">Shipments list coming soon...</p>
      </div>
    </div>
  );
}
