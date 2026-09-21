'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, Building2, Phone, BarChart3, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { theme } from '@/constants/theme';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function OnboardingPage() {
  const { state: authState, updateSessionToken } = useAuth() as any;
  const { navigate } = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'MANAGER' | 'CLIENT' | null>(null);
  
  // Step 2 Fields
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [sizeMetric, setSizeMetric] = useState(''); // Fleet Size or Monthly Volume
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);

  const fleetSizes = ['1-5 vehicles', '6-20 vehicles', '21-100 vehicles', '101+ vehicles'];
  const shippingVolumes = ['1-10 Shipments', '11-50 Shipments', '51-200 Shipments', '201+ Shipments'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !phone.trim() || !sizeMetric) {
      toast.error('Please fill out all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          role,
          companyName,
          phoneNumber: phone,
          metric: sizeMetric,
          industry,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete onboarding');
      
      // Instantly swap token via AuthContext (needs new function added to context)
      if (updateSessionToken) {
        updateSessionToken(data.accessToken, data.user);
      }
      
      toast.success('Workspace configured successfully!');
      
      if (role === 'MANAGER') navigate('/manager/dashboard');
      else navigate('/client/dashboard');
      
    } catch (err: any) {
      toast.error(err.message || 'Configuration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-4xl relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to FleetVane</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Let's set up your workspace. How will you be using the platform?
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Manager Card */}
                <button
                  onClick={() => { setRole('MANAGER'); setStep(2); }}
                  className="group relative flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="absolute top-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Truck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">MANAGE FLEET</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    "I own or manage vehicles and want to track operations, assign drivers, and view live maps."
                  </p>
                </button>

                {/* Client Card */}
                <button
                  onClick={() => { setRole('CLIENT'); setStep(2); }}
                  className="group relative flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-transparent hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="absolute top-4 right-4 text-slate-300 group-hover:text-emerald-500 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Package className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">SHIP GOODS</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    "I have cargo, freight, or goods that need transportation and want to track deliveries."
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === 'MANAGER' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                  {role === 'MANAGER' ? <Truck className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {role === 'MANAGER' ? 'Tell us about your fleet' : 'Tell us about your shipping needs'}
                  </h2>
                  <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 underline mt-1">
                    Change workspace type
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className={theme.form.label}>Company Name *</Label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Logistics"
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className={theme.form.label}>Contact Number *</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className={theme.form.label}>
                    {role === 'MANAGER' ? 'Fleet Size *' : 'Average Monthly Volume *'}
                  </Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {(role === 'MANAGER' ? fleetSizes : shippingVolumes).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSizeMetric(size)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                          sizeMetric === size 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className={theme.form.label}>Industry Type (Optional)</Label>
                  <div className="relative mt-1.5">
                    <BarChart3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:dark:bg-slate-900 [&>option]:dark:text-slate-100"
                    >
                      <option value="">Select industry</option>
                      <option value="delivery">Delivery & Logistics</option>
                      <option value="construction">Construction & Materials</option>
                      <option value="medical">Pharmaceuticals & Medical</option>
                      <option value="retail">Retail & Consumer Goods</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-6 rounded-xl font-bold text-lg text-white shadow-lg ${
                      role === 'MANAGER' 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                    }`}
                  >
                    {loading ? 'Setting up...' : 'Finish Setup & Launch Dashboard'}
                    {!loading && <ChevronRight className="w-5 h-5 ml-2" />}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
