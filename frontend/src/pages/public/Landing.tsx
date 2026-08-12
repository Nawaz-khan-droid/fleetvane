import { Link } from 'react-router-dom';
import { Truck, Navigation, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[140px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FleetVane</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Cpu className="w-4 h-4" /> Timefold VRP Engine & Hybrid Maps Powered
          </span>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-8">
            Intelligent Fleet Tracking & <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Dynamic Route Optimization</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade logistics management platform designed with high-performance Timefold constraint solvers, live telemetry tracking, and hybrid mapping systems.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all">
              Launch Console <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/privacy" className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl transition-all">
              Read Technical Specs
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Timefold VRP Solver</h3>
          <p className="text-slate-400 leading-relaxed">
            Calculates optimal multi-stop vehicle delivery sequences considering capacity limits, vehicle constraints, and Haversine distance matrices.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
            <Navigation className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Hybrid Mapping Engine</h3>
          <p className="text-slate-400 leading-relaxed">
            Seamlessly toggle between OpenStreetMap CartoDB dark themes and Google Maps API v3 with real-time traffic layer overlay.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Modular Security</h3>
          <p className="text-slate-400 leading-relaxed">
            In-memory short-lived access tokens coupled with HttpOnly secure cookie refresh token rotation and 401 retry interceptors.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p>© 2026 FleetVane Intelligent Fleet Optimizer. Capstone Project.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
