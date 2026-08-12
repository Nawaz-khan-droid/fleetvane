import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, Users, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/manager' },
  { icon: Truck, label: 'Fleet', path: '/manager/fleet' },
  { icon: Package, label: 'Shipments', path: '/manager/shipments' },
  { icon: Users, label: 'Drivers', path: '/manager/drivers' },
];

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-2xl flex flex-col relative z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">FleetVane</span>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/manager'}
              className={({ isActive }) =>
                `group relative flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 mr-3 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Decorative background effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none -z-10" />

        {/* Top Header */}
        <header className="h-20 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Overview</h1>
          </div>
          
          <div className="flex items-center gap-8">
            <button className="relative p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all duration-300 group">
              <Bell className="w-5 h-5 group-hover:animate-swing" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
            </button>
            
            <div className="flex items-center gap-5 border-l border-slate-800/60 pl-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700/50 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Manager'}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">{user?.name || 'Admin User'}</span>
                  <span className="text-xs text-slate-500">{user?.role || 'Fleet Manager'}</span>
                </div>
              </div>
              <button 
                onClick={() => logout()}
                className="p-2.5 text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-10 relative scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
