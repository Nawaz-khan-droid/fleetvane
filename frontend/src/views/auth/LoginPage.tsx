'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function LoginPage() {
  const { login, state: authState } = useAuth();
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

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'CLIENT') navigate('/client/dashboard');
      else if (user.role === 'DRIVER') navigate('/driver/dashboard');
      else if (user.role === 'MANAGER' || user.role === 'ADMIN') navigate('/manager/dashboard');
      else navigate('/manager/dashboard');
    } catch {
      toast.error(t.auth.invalidCredentials);
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(16,185,129,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(16,185,129,0.03) 0%, transparent 50%)' }}
    >
      {/* Subtle emerald gradient top strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={`w-full max-w-5xl mx-4 overflow-hidden ${theme.card.base} ${theme.card.border}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── Left: Branding ── */}
          <div className="hidden lg:flex flex-col justify-center items-center p-10 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Truck className="w-7 h-7 text-emerald-100" />
              </div>
              <span className={`text-3xl font-bold tracking-tight`}>{t.brand.name}</span>
            </div>
            <p className={`text-lg text-emerald-100 text-center max-w-xs leading-relaxed`}>
              {t.brand.tagline}
            </p>
            <p className={`text-sm text-emerald-200/70 text-center mt-4 max-w-xs`}>
              {t.brand.description}
            </p>
          </div>

          {/* ── Right: Form ── */}
          <div className="p-8 sm:p-10 bg-white dark:bg-slate-900">
            <div className="mb-6">
              <h1 className={`${theme.typography.h3} text-slate-900 dark:text-slate-100`}>
                {t.auth.loginTitle}
              </h1>
              <p className={`${theme.typography.body} mt-1`}>
                {t.auth.loginSubtitle}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className={theme.form.label}>{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${theme.form.input} pl-10`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className={theme.form.label}>{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${theme.form.input} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className={`${theme.button.primary} w-full flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t.auth.loggingIn : t.auth.loginBtn}
              </Button>
            </form>

            <p className={`${theme.typography.caption} text-center mt-6`}>
              {t.auth.noAccount}{' '}
              <button
                onClick={() => navigate('/signup')}
                className={`${theme.typography.label} ${theme.brand.primaryText} hover:underline`}
              >
                {t.auth.signupLink}
              </button>
            </p>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className={`${theme.typography.caption} ${theme.nav.link} hover:underline inline-flex items-center gap-1`}
              >
                ← {t.nav.backToHome}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
