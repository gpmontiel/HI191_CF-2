import 'react';
import React from 'react';
import { FileText } from 'lucide-react';

export default function StatusTable({ forms = [], onView, isLoading }) {
    const [search, setSearch] = React.useState('');

    const filteredForms = forms.filter(form =>
        form.patient_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <section className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">

            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <h2 className="font-bold text-philhealth-green whitespace-nowrap">
                    Form Status Tracker
                </h2>
                <div className="relative w-64">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by patient name..."
                        className="w-full pl-8 pr-3 py-2 text-[11px] font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-philhealth-green/20 outline-none transition-all"
                    />
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100">
                        <th className="px-6 py-4 font-black">Transaction ID</th>
                        <th className="px-6 py-4 font-black">Patient Name</th>
                        <th className="px-6 py-4 font-black">Date Submitted</th>
                        <th className="px-6 py-4 font-black text-center">Status</th>
                        <th className="px-6 py-4 text-center font-black">Actions</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td colSpan={5} className="px-6 py-4">
                                    <div className="h-8 bg-slate-50 rounded w-full" />
                                </td>
                            </tr>
                        ))
                    ) : forms.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center opacity-30">
                                    <FileText size={64} strokeWidth={1} />
                                    <p className="mt-4 font-bold text-sm">
                                        No clinical forms found
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredForms.map((form) => (
                            <tr
                                key={form.id}
                                className="hover:bg-slate-50 transition-all duration-300"
                            >
                                <td className="px-6 py-5 text-xs font-mono text-philhealth-green font-bold">
                                    #{String(form.id).padStart(9, '0')}
                                </td>

                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-slate-800">
                                        {form.patient_name}
                                    </p>
                                </td>

                                <td className="px-6 py-5 text-xs text-slate-600 font-medium whitespace-nowrap">
                                    {form.submission_date
                                        ? new Date(form.submission_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })
                                        : 'N/A'
                                    }
                                </td>

                                <td className="px-6 py-5 text-center">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            form.status.toLowerCase() === 'approved'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : form.status.toLowerCase() === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : form.status.toLowerCase() === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                      {form.status}
                                    </span>
                                </td>

                                <td className="px-6 py-5 text-center">
                                    <button
                                        onClick={() => onView(form.id)}
                                        className="text-philhealth-green text-[10px] font-bold border border-philhealth-green px-3 py-1 rounded hover:bg-philhealth-green hover:text-white transition-all transform active:scale-95"
                                    >
                                        VIEW
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    Showing {filteredForms.length} submitted forms
                </p>

                <div className="flex gap-1">
                    <button className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded bg-white text-[10px] font-bold hover:bg-slate-50">
                        &lt;
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-philhealth-green rounded bg-philhealth-green text-white text-[10px] font-bold">
                        1
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded bg-white text-[10px] font-bold hover:bg-slate-50">
                        2
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded bg-white text-[10px] font-bold hover:bg-slate-50">
                        &gt;
                    </button>
                </div>
            </div>
        </section>
    );
}