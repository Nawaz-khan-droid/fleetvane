'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, ArrowLeft, Eye, EyeOff, Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function SignupPage() {
  const { signup } = useAuth();
  const { navigate } = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTermsError(null);

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!companyName.trim()) {
      setError('Company name is required');
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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      setTermsError(t.auth.acceptTermsRequired);
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, companyName);
      toast.success(t.auth.signupSuccess);
      navigate('/login');
    } catch {
      toast.error('Signup failed. Please try again.');
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* ── Left Panel: Branding ────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-10 relative overflow-hidden">
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

        {/* Value props */}
        <div className="relative z-10 my-auto py-12">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-6">Why FleetVane?</p>
          <div className="space-y-4">
            {[
              'Real-time fleet visibility across your entire operation',
              'Intelligent route optimization powered by VRP algorithms',
              'Role-based portals for managers, drivers, and clients',
              'Enterprise-grade JWT authentication & rate limiting',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-blue-100/70 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-blue-300/60">Join hundreds of logistics teams on FleetVane</p>
        </div>
      </div>

      {/* ── Right Panel: Signup Form ─────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-6 lg:hidden">
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
          <div className="mb-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.auth.signupTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.auth.signupSubtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label className={theme.form.label}>{t.auth.fullName}</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={t.auth.fullNamePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Company */}
            <div>
              <Label className={theme.form.label}>{t.auth.companyName}</Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={t.auth.companyNamePlaceholder}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Password */}
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
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label className={theme.form.label}>{t.auth.confirmPassword}</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(!!v)}
                  className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
                  {t.auth.acceptTerms}{' '}
                  <button type="button" onClick={() => navigate('/privacy')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Privacy Policy
                  </button>
                  {' & '}
                  <button type="button" onClick={() => navigate('/terms')} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Terms
                  </button>
                </label>
              </div>
              {termsError && <p className="text-xs text-red-500 ml-7">{termsError}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.auth.creatingAccount : t.auth.signupBtn}
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-5">
            {t.auth.hasAccount}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {t.auth.loginLink}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
