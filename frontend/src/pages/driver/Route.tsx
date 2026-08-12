import { Navigation, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function DriverRoute() {
  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Assigned Route</h1>
        <p className="text-slate-400">Optimized stop sequence provided by Timefold VRP engine.</p>
      </div>

      <div className="space-y-4">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
            <div>
              <h3 className="font-semibold text-white">Central Warehouse Depot</h3>
              <p className="text-sm text-slate-400">Pickup Cargo #4092 • Origin Depot</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        </div>

        <div className="p-6 bg-slate-900/60 border border-indigo-500/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">2</div>
            <div>
              <h3 className="font-semibold text-white">Downtown Retail Outlet</h3>
              <p className="text-sm text-slate-400">Deliver 400kg Packages • Stop Order #2</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Next Stop
          </span>
        </div>
      </div>
    </div>
  );
}
