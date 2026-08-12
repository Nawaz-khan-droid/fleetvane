import React, { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { toast } from 'sonner';

export default function DriverReport() {
  const [type, setType] = useState('TRAFFIC_DELAY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post('/incidents', { type, description });
      toast.success('Incident report filed successfully.');
      setDescription('');
    } catch (error) {
      toast.error('Failed to submit incident report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Report Incident</h1>
        <p className="text-slate-400">File an exception or delay report directly to fleet management.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Incident Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="TRAFFIC_DELAY">Traffic Delay</option>
            <option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
            <option value="WEATHER_HAZARD">Weather Hazard</option>
            <option value="CLIENT_UNAVAILABLE">Client Unavailable</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the incident details..."
            required
            className="w-full p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" /> Submit Incident Report
        </button>
      </form>
    </div>
  );
}
