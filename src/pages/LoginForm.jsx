import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginForm({ onLogin, isLoading }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (email && password) {
            onLogin(email);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f4f0] relative overflow-hidden font-sans">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-philhealth-green/5 rounded-full blur-[100px] animate-pulse" />

                <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-philhealth-yellow/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
                    {/* Top Brand Banner */}
                    <div className="bg-philhealth-green p-12 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] flex flex-wrap gap-6 p-8 overflow-hidden pointer-events-none transform rotate-12 scale-150">
                            {Array.from({ length: 24 }).map((_, i) => (
                                <ShieldCheck key={i} size={64} />
                            ))}
                        </div>

                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="inline-flex flex-col items-center gap-4 relative z-10"
                        >
                            <div className="w-20 h-20 bg-philhealth-yellow rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
                                <span className="text-philhealth-green text-3xl font-black">
                                  CF-2
                                </span>
                            </div>

                            <div className="mt-2">
                                <h1 className="text-3xl font-black text-white tracking-tight">
                                    CF-2 Form Portal
                                </h1>

                                <p className="text-philhealth-yellow text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-80">
                                    PhilHealth System
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Form Area */}
                    <div className="px-12 py-12">
                        <div className="mb-10">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                Welcome Back!
                            </h2>

                            <p className="text-slate-400 text-sm font-medium mt-1">
                                Sign in to continue to your account.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    Email
                                </label>

                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        placeholder="sample@email.com"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 focus:ring-0 focus:border-philhealth-green outline-none transition-all placeholder:text-slate-300 group-hover:border-slate-200"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Password
                                    </label>
                                </div>

                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 focus:ring-0 focus:border-philhealth-green outline-none transition-all placeholder:text-slate-300 hover:border-slate-200"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-philhealth-green hover:bg-philhealth-green-dark text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-2xl shadow-philhealth-green/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isLoading
                                        ? 'Verifying Identity...'
                                        : 'Confirm Authentication'}

                                    {!isLoading && (
                                        <ArrowRight
                                            size={18}
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onLogin('demo@philhealth.gov.ph')}
                                    disabled={isLoading}
                                    className="w-full bg-white border-2 border-slate-100 hover:border-philhealth-yellow text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    Quick Demo Access
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 pt-8 border-t border-slate-100 flex items-start gap-3">
                            <ShieldCheck
                                className="text-philhealth-green shrink-0 mt-0.5"
                                size={16}
                            />

                            <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                                This portal is protected by AES-256 encryption. By signing in,
                                you agree to the
                                <a
                                    href="#"
                                    className="text-philhealth-green ml-1 hover:underline"
                                >
                                    Data Privacy Act (RA 10173)
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="mt-12 flex justify-center items-center gap-6 opacity-30">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                        HI 191 Capstone Project
                    </p>

                    <div className="h-3 w-[1px] bg-slate-400" />

                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                        MAY 2026
                    </p>
                </div>
            </motion.div>
        </div>
    );
}