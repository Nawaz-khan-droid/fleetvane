'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Truck, Shield, Map, BarChart3, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const features = [
  { icon: Map, title: 'Live Fleet Tracking', desc: 'Real-time vehicle positions on interactive maps' },
  { icon: Package, title: 'Shipment Lifecycle', desc: 'End-to-end delivery management & milestone tracking' },
  { icon: BarChart3, title: 'Operations Dashboard', desc: 'KPIs, activity feed, and fleet analytics at a glance' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Secure portals for managers, drivers, and clients' },
];

const demoAccounts = [
  { label: 'Manager', email: 'manager@fleetvane.com', password: 'Manager123!', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { label: 'Driver', email: 'driver1@fleetvane.com', password: 'Driver123!', color: 'bg-slate-700 hover:bg-slate-800 text-white' },
  { label: 'Client', email: 'client@fleetvane.com', password: 'Client123!', color: 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Email is required'); return; }
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'CLIENT') navigate('/client/dashboard');
      else if (user.role === 'DRIVER') navigate('/driver/dashboard');
      else navigate('/manager/dashboard');
    } catch {
      toast.error(t.auth.invalidCredentials);
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc: typeof demoAccounts[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* ── Left Panel: Branding ────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-10 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{t.brand.name}</span>
          </div>
          <p className="text-blue-200/70 text-sm">{t.brand.tagline}</p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-5 my-auto py-12">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-6">Platform Features</p>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-blue-200/60 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom trusted by */}
        <div className="relative z-10">
          <p className="text-xs text-blue-300/60">Trusted by logistics teams across India</p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{t.brand.name}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.auth.loginTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.auth.loginSubtitle}</p>
          </div>

          {/* Demo quick-fill */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Demo Access</p>
            <div className="flex gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 dark:bg-slate-950 px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className={theme.form.label}>{t.auth.email}</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label className={theme.form.label}>{t.auth.password}</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {loading ? t.auth.loggingIn : t.auth.loginBtn}
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">
            {t.auth.noAccount}{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t.auth.signupLink}
            </button>
          </p>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              ← {t.nav.backToHome}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
