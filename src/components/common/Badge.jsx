import React from 'react';

export default function Badge({ status, size = 'md' }) {
  const normalized = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
    lg: 'text-sm px-3.5 py-1.5 font-bold rounded-lg',
  };

  const getStyle = () => {
    switch (normalized) {
      case 'AKTIF':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
      case 'DRAFT':
        return 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800';
      case 'VERIFIKASI':
      case 'MENUNGGU VERIFIKASI':
        return 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'OBSOLETE':
        return 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      case 'DITOLAK':
        return 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800';
      case 'DISETUJUI':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <span className={`inline-flex items-center justify-center tracking-wider transition-all duration-150 ${sizeClasses[size] || sizeClasses.md} ${getStyle()}`}>
      {normalized === 'AKTIF' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
      {normalized === 'VERIFIKASI' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping"></span>}
      {status}
    </span>
  );
}
