import { useAuth } from '../../context/AuthContext';
import { User, Shield, Mail, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
        <p className="text-slate-400">Manage account information and security credentials.</p>
      </div>

      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-500/20">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.name || 'Manager User'}</h2>
            <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {user?.role || 'MANAGER'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <Mail className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Email Address</p>
              <p className="text-sm font-medium text-white">{user?.email || 'manager@fleetvane.io'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <Shield className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Authentication</p>
              <p className="text-sm font-medium text-white">In-Memory JWT + HttpOnly Cookie</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
