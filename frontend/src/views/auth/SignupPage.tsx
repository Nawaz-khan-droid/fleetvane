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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
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
              <span className="text-3xl font-bold tracking-tight">{t.brand.name}</span>
            </div>
            <p className="text-lg text-emerald-100 text-center max-w-xs leading-relaxed">
              {t.brand.tagline}
            </p>
            <p className="text-sm text-emerald-200/70 text-center mt-4 max-w-xs">
              {t.brand.description}
            </p>
          </div>

          {/* ── Right: Form ── */}
          <div className="p-8 sm:p-10 bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            {/* Back to Login link */}
            <button
              onClick={() => navigate('/login')}
              className={`${theme.typography.caption} ${theme.nav.link} flex items-center gap-1 mb-4 hover:underline`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.auth.hasAccount}
            </button>

            <div className="mb-6">
              <h1 className={`${theme.typography.h3} text-slate-900 dark:text-slate-100`}>
                {t.auth.signupTitle}
              </h1>
              <p className={`${theme.typography.body} mt-1`}>
                {t.auth.signupSubtitle}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className={theme.form.label}>{t.auth.fullName}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={t.auth.fullNamePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${theme.form.input} pl-10`}
                  />
                </div>
              </div>

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

              {/* Company Name */}
              <div className="space-y-1.5">
                <Label className={theme.form.label}>{t.auth.companyName}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder={t.auth.companyNamePlaceholder}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label className={theme.form.label}>{t.auth.confirmPassword}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t.auth.passwordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${theme.form.input} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => {
                      setAcceptTerms(checked === true);
                      if (checked) setTermsError(null);
                    }}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="accept-terms"
                    className="text-sm text-slate-600 dark:text-slate-400 font-normal cursor-pointer leading-snug"
                  >
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}
                      className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                    {' '}&{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); navigate('/terms'); }}
                      className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                    >
                      Terms and Conditions
                    </button>
                  </Label>
                </div>
                {termsError && (
                  <p className="text-xs text-red-500 ml-7">{termsError}</p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className={`${theme.button.primary} w-full flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t.auth.creatingAccount : t.auth.signupBtn}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
