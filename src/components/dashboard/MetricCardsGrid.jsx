import React from 'react';
import { Archive, AlertTriangle, ArrowUpRight, Building2, CalendarClock, Clock, FilePlus2, Layers, ShieldCheck } from 'lucide-react';

const toneClasses = {
  emerald: 'border-emerald-200/90 text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-400 hover:border-emerald-500',
  amber: 'border-amber-300/90 text-amber-800 dark:border-amber-800 dark:text-amber-400 hover:border-amber-500',
  orange: 'border-orange-300/90 text-orange-800 dark:border-orange-800 dark:text-orange-400 hover:border-orange-500',
  sky: 'border-sky-200 text-sky-800 dark:border-sky-900 dark:text-sky-400 hover:border-sky-500',
  slate: 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:border-slate-400',
  red: 'border-red-300/90 text-red-800 dark:border-red-800 dark:text-red-400 hover:border-red-500',
  blue: 'border-blue-200 text-blue-800 dark:border-blue-900 dark:text-blue-400',
  purple: 'border-purple-200 text-purple-800 dark:border-purple-900 dark:text-purple-400',
};

function MetricCard({ label, value, detail, action, icon: Icon, tone = 'slate', onClick, emphasized = false }) {
  const interactive = typeof onClick === 'function';
  const Tag = interactive ? 'button' : 'article';

  return (
    <Tag
      {...(interactive ? { type: 'button', onClick } : {})}
      className={`group relative min-h-[126px] overflow-hidden rounded-xl border bg-white p-3.5 text-left shadow-xs transition dark:bg-slate-900 sm:min-h-[164px] sm:p-4 ${toneClasses[tone]} ${interactive ? 'cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : ''} ${emphasized ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase leading-4 tracking-wide">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-current/10" aria-hidden="true"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3">
        <strong className="font-mono text-2xl font-extrabold text-slate-950 dark:text-white sm:text-3xl">{value}</strong>
        <p className="mt-1 truncate text-[11px] font-medium text-slate-600 dark:text-slate-400">{detail}</p>
      </div>
      {action && <div className="mt-3 hidden items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] font-semibold dark:border-slate-800 sm:flex"><span>{action}</span>{interactive && <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />}</div>}
    </Tag>
  );
}

export default function MetricCardsGrid({ totalDocs = 0, activeDocs = 0, pendingDocs = 0, draftDocs = 0, obsoleteDocs = 0, rejectedDocs = 0, reviewDueCount = 0, departmentsCount = 0, documentTypesCount = 0, navigateTo, isViewer = false }) {
  const complianceRate = totalDocs > 0 ? Math.round((activeDocs / totalDocs) * 100) : 100;
  const go = (menuKey, crumbs) => () => navigateTo(menuKey, crumbs);

  if (isViewer) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
    <MetricCard label="Dokumen Aktif Terkendali" value={activeDocs} detail="Controlled copies resmi yang berlaku" action="Buka katalog SOP & IK" icon={ShieldCheck} tone="emerald" onClick={go('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])} />
    <MetricCard label="Departemen Operasional" value={departmentsCount} detail="Unit kerja terdaftar" icon={Building2} tone="blue" />
    <MetricCard label="Hierarki Dokumen Mutu" value={documentTypesCount} detail="Kategori dokumen ISO" icon={Layers} tone="purple" />
  </div>;

  const cards = [
    ['Dokumen Aktif', activeDocs, `${complianceRate}% terkendali`, 'Katalog aktif', ShieldCheck, 'emerald', 'ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif']],
    ['Verifikasi DCO', pendingDocs, pendingDocs ? 'Menunggu review' : 'Antrian kosong', 'Periksa antrian', Clock, 'amber', 'reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'], pendingDocs > 0],
    ['Tinjauan ISO', reviewDueCount, reviewDueCount ? 'Jatuh tempo dalam 30 hari' : 'Siklus terkendali', 'Evaluasi dokumen', CalendarClock, 'orange', 'ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'], reviewDueCount > 0],
    ['Draft Usulan', draftDocs, 'Konsep belum diajukan', 'Buka draft', FilePlus2, 'sky', 'reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft']],
    ['Obsolete', obsoleteDocs, 'Arsip tidak berlaku', 'Telusuri arsip', Archive, 'slate', 'ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete']],
    ['Catatan Revisi', rejectedDocs, rejectedDocs ? 'Perlu perbaikan' : 'Nol catatan', 'Buka koreksi', AlertTriangle, 'red', 'reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'], rejectedDocs > 0],
  ];

  return <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 xl:grid-cols-6">
    {cards.map(([label, value, detail, action, icon, tone, menu, crumbs, emphasized]) => <MetricCard key={label} label={label} value={value} detail={detail} action={action} icon={icon} tone={tone} emphasized={emphasized} onClick={go(menu, crumbs)} />)}
  </div>;
}
