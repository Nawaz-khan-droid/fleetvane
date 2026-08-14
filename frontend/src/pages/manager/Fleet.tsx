import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, MapPin, Truck as TruckIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { apiClient } from '../../services/apiClient';
import { toast } from 'sonner';
import type { Truck } from '../../types';

export default function Fleet() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTruck, setNewTruck] = useState({ plateNumber: '', model: '', capacity: 0 });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/trucks');
      setTrucks(response.data);
    } catch (err) {
      console.error('Failed to fetch trucks', err);
      setError('Failed to load fleet data');
      toast.error('Failed to load fleet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/trucks', newTruck);
      toast.success('Truck added successfully');
      setIsAddOpen(false);
      fetchTrucks();
    } catch (error) {
      toast.error('Failed to add truck');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> In Transit</span>;
      case 'IDLE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><TruckIcon className="w-3.5 h-3.5" /> Idle</span>;
      case 'DELAYED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertCircle className="w-3.5 h-3.5" /> Delayed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fleet Management</h1>
          <p className="text-slate-400 mt-1 text-sm">Monitor and manage your active vehicles.</p>
        </div>

        <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Dialog.Trigger asChild>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 font-medium">
              <Plus className="w-5 h-5" />
              Add Vehicle
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 border border-slate-800 bg-slate-900 p-8 shadow-2xl rounded-3xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <Dialog.Title className="text-2xl font-semibold leading-none tracking-tight text-white">Add New Vehicle</Dialog.Title>
                <Dialog.Description className="text-sm text-slate-400">
                  Enter the details of the new vehicle to add it to your fleet.
                </Dialog.Description>
              </div>
              
              <form onSubmit={handleAddTruck} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Plate Number</label>
                  <input
                    required
                    value={newTruck.plateNumber}
                    onChange={e => setNewTruck({...newTruck, plateNumber: e.target.value})}
                    className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. ABC-1234"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Vehicle Model</label>
                  <input
                    required
                    value={newTruck.model}
                    onChange={e => setNewTruck({...newTruck, model: e.target.value})}
                    className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. Ford Transit"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={newTruck.capacity || ''}
                    onChange={e => setNewTruck({...newTruck, capacity: parseInt(e.target.value) || 0})}
                    className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="e.g. 5000"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Dialog.Close asChild>
                    <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button type="submit" className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all font-medium">
                    Save Vehicle
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search vehicles by plate or ID..." 
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Fleet Table */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800/60">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Vehicle ID</th>
                <th scope="col" className="px-6 py-4 font-medium">Model</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Location</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading fleet data...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-rose-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-rose-500/50" />
                      <p>{error}</p>
                      <button onClick={fetchTrucks} className="mt-2 px-4 py-1.5 bg-rose-500/10 text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-500/20 transition-colors">
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : trucks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                trucks.map((truck, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={truck.id} 
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700">
                          <TruckIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{truck.plateNumber}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {truck.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {truck.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(truck.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {truck.lat && truck.lng ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-400" />
                          <span className="font-mono text-xs">{truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
