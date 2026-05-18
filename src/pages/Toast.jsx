import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';

const ICONS = {
    warning: <AlertTriangle size={16} />,
    error:   <XCircle size={16} />,
    success: <CheckCircle size={16} />,
};

const STYLES = {
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
    error:   'bg-red-50 border-red-300 text-red-800',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
};

export default function Toast({ message, type = 'warning', onClose }) {
    React.useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border text-xs font-semibold shadow-sm mb-6 ${STYLES[type]}`}>
            <span className="mt-0.5 shrink-0">{ICONS[type]}</span>
            <p className="flex-1 leading-relaxed">{message}</p>
            <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <X size={14} />
            </button>
        </div>
    );
}