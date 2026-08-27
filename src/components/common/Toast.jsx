import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function Toast() {
  const { toast } = useDocumentControl();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    danger: <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-l-4 border-l-emerald-500 border-slate-200 text-slate-800 shadow-elevated',
    danger: 'bg-white border-l-4 border-l-red-500 border-slate-200 text-slate-800 shadow-elevated',
    warning: 'bg-white border-l-4 border-l-amber-500 border-slate-200 text-slate-800 shadow-elevated',
    info: 'bg-white border-l-4 border-l-blue-500 border-slate-200 text-slate-800 shadow-elevated',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border text-sm font-medium ${bgStyles[toast.type] || bgStyles.info}`}>
        {icons[toast.type] || icons.info}
        <span className="leading-snug">{toast.message}</span>
      </div>
    </div>
  );
}
