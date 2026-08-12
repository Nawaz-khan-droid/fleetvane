import { Settings as SettingsIcon, Bell, Key, Database } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Configure global parameters for Timefold VRP engine and live telemetry.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Timefold Haversine Distance Matrix</h3>
              <p className="text-sm text-slate-400">Recalculate route matrices automatically on shipment insertion.</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-500 rounded" />
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Live Incident Alerts</h3>
              <p className="text-sm text-slate-400">Notify fleet managers immediately when a driver files an incident report.</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 accent-purple-500 rounded" />
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Google Maps Traffic Overlay</h3>
              <p className="text-sm text-slate-400">Enable live Google Maps Traffic API layer on Manager Dashboard.</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-500 rounded" />
        </div>
      </div>
    </div>
  );
}
