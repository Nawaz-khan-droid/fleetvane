import React from 'react';

export default function Shipments() {
  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Shipments</h1>
        <p className="text-slate-400 mt-1 text-sm">Manage and track all deliveries.</p>
      </div>
      <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur">
        <p className="text-slate-400">Kanban board or Table coming soon...</p>
      </div>
    </div>
  );
}
