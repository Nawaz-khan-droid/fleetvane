import { useState } from 'react';
import { apiClient } from '../../services/apiClient';

export default function IncidentReportForm() {
  const [description, setDescription] = useState('');
  const [type, setType] = useState('DELAY');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await apiClient.post('/incidents', { description, type, lat: latitude, lng: longitude });
        alert('Incident reported!');
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border border-border rounded-lg max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">Report an Incident</h2>
      <select value={type} onChange={e => setType(e.target.value)} className="w-full mb-4 p-2 bg-transparent border border-border rounded">
        <option value="DELAY">Traffic Delay</option>
        <option value="BREAKDOWN">Vehicle Breakdown</option>
        <option value="ROAD_CLOSURE">Road Closure</option>
      </select>
      <textarea 
        value={description} 
        onChange={e => setDescription(e.target.value)} 
        placeholder="Describe the issue..."
        className="w-full mb-4 p-2 bg-transparent border border-border rounded"
        rows={4}
      />
      <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold">Submit Report</button>
    </form>
  );
}
