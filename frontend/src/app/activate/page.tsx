'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense, FormEvent, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApiErrorResponse {
    error?: string;
}

function ActivationForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token'); 

    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Device Fingerprinting Tracking
    useEffect(() => {
        let deviceUuid = localStorage.getItem('device_uuid');
        if (!deviceUuid) {
            deviceUuid = crypto.randomUUID ? crypto.randomUUID() : 'fallback-uuid-' + Date.now();
            localStorage.setItem('device_uuid', deviceUuid);
        }
    }, []);

    const handleFormSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setStatusMessage('');
        
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        try {
            const deviceUuid = localStorage.getItem('device_uuid');
            const backendUrl = process.env.NEXT_PUBLIC_SPRING_BOOT_URL || 'http://localhost:8080';
            
            const response = await fetch(`${backendUrl}/api/auth/activate-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, deviceUuid })
            });

            if (response.ok) {
                setStatusMessage("Profile successfully activated! Routing you to login...");
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const data: ApiErrorResponse = await response.json();
                setError(data.error || "Activation failed. Link may be expired.");
            }
        } catch (err) {
            setError("Network gateway failure. Unable to contact server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 p-8"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <KeyRound className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Activate Profile</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                        Set a secure password to complete your driver setup
                    </p>
                </div>

                {statusMessage && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium text-center">
                        {statusMessage}
                    </div>
                )}
                
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                required 
                                placeholder="Create a strong password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" 
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                required 
                                placeholder="Repeat your password"
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow" 
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading || !!statusMessage} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 shadow-md shadow-blue-500/20"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        {loading ? "Activating..." : "Secure & Activate Account"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function ActivateDriverAccount() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <ActivationForm />
        </Suspense>
    );
}
