import 'react';
// import { LogOut, User, FileText, LayoutDashboard, Menu, X } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children, userEmail, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#f0f4f0] font-sans text-slate-800">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between px-8 py-4 bg-philhealth-green shadow-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-10 bg-philhealth-yellow rounded-lg flex items-center justify-center font-bold text-philhealth-green text-xl shadow-lg shadow-black/10">
                        CF2
                    </div>

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

                            <p className="text-philhealth-yellow text-[10px] uppercase font-bold tracking-tighter">
                                Accreditation: #82-192-04
                            </p>
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

// function SidebarItem({ icon, label, active = false }) {
//     return (
//         <button
//             className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all ${
//                 active
//                     ? 'bg-philhealth-yellow text-philhealth-green shadow-lg shadow-black/10'
//                     : 'hover:bg-philhealth-green-dark text-white/70 hover:text-white'
//             }`}
//         >
//             {icon}
//             {label}
//         </button>
//     );
// }