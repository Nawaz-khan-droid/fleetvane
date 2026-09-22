import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Truck, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

export function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const { navigate } = useRouter();

  const handleDemoLogin = async (role: 'MANAGER' | 'DRIVER' | 'CLIENT') => {
    let email = '';
    let password = 'Client123!';
    switch (role) {
      case 'MANAGER':
        email = 'manager@fleetvane.com';
        password = 'Manager123!';
        break;
      case 'DRIVER':
        email = 'driver1@fleetvane.com';
        password = 'Driver123!';
        break;
      case 'CLIENT':
        email = 'client@fleetvane.com';
        password = 'Client123!';
        break;
    }
    
    try {
      const user = await login(email, password);
      onClose();
      
      // Route based on role
      if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
        navigate('/manager/dashboard');
      } else if (user?.role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      console.error('Demo login failed', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Book a Demo</h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Test drive the full platform. Select a role below to instantly log into one of our live demo accounts.
              </p>
              
              <button onClick={() => handleDemoLogin('MANAGER')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all bg-white dark:bg-slate-800/50 group text-left">
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Fleet Manager Portal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mission control, tracking, and dispatch.</p>
                </div>
              </button>

              <button onClick={() => handleDemoLogin('CLIENT')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all bg-white dark:bg-slate-800/50 group text-left">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Shipper / Client Portal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Create shipments and monitor deliveries.</p>
                </div>
              </button>

              <button onClick={() => handleDemoLogin('DRIVER')} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:ring-1 hover:ring-amber-500 transition-all bg-white dark:bg-slate-800/50 group text-left">
                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Driver App View</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mobile-first view for jobs and routes.</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
