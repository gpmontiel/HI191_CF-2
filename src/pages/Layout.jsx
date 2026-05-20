import 'react';
import { LogOut } from 'lucide-react';

export default function Layout({ children, userEmail, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#f0f4f0] font-sans text-slate-800">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between px-8 py-4 bg-philhealth-green shadow-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img
                        src="/philhealth-logo.png"
                        alt="PhilHealth Logo"
                        className="w-12 h-10 object-contain"
                    />

                    <div>
                        <h1 className="text-white font-bold text-lg leading-tight">
                            CF2 Form Portal
                        </h1>

                        <p className="text-philhealth-yellow text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
                            PhilHealth Healthcare System
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex items-center gap-6 text-white text-sm font-medium">
                        <a
                            href="#"
                            className="border-b-2 border-philhealth-yellow pb-1"
                        >
                            Dashboard
                        </a>
                    </nav>

                    <div className="h-8 w-[1px] bg-emerald-800 hidden sm:block"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-white text-sm font-bold truncate max-w-[150px]">
                                {userEmail || 'Physician'}
                            </p>

                            <button
                                onClick={onLogout}
                                className="text-philhealth-yellow hover:text-white text-[10px] uppercase font-black tracking-wider flex items-center gap-1 ml-auto bg-transparent border-none cursor-pointer transition-colors mt-0.5 group"
                            >
                                <LogOut size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                Sign Out Account
                            </button>
                        </div>

                        <div className="relative group">
                            <button
                                onClick={onLogout}
                                className="w-10 h-10 bg-emerald-100 rounded-full border-2 border-philhealth-yellow overflow-hidden flex items-center justify-center text-philhealth-green hover:bg-red-50 hover:border-red-400 transition-all cursor-pointer"
                                title="Sign Out"
                            >
                                <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-white text-xs group-hover:bg-red-600 transition-colors">
                                    {userEmail?.slice(0, 2).toUpperCase() || 'DR'}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Footer Bar */}
            <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-8 justify-between text-[10px] text-slate-400">
                <div className="flex gap-4">
                    <span>Terms of Service</span>
                    <span>Physician Handbook</span>
                    <span>Contact Hotline: 8441-7442</span>
                </div>

                <div className="flex items-center gap-2 font-bold hidden sm:flex">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Developed by: Dimaculangan, Montiel, Sigarra
                </div>
            </footer>
        </div>
    );
}