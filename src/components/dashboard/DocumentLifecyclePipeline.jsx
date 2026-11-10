import React from 'react';
import {
  FileEdit,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Archive,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function DocumentLifecyclePipeline({
  documents = [],
  navigateTo
}) {
  const draftCount = documents.filter(d => d.status === 'DRAFT' || d.status === 'PERLU REVISI' || d.status === 'REVISI').length;
  const reviewCount = documents.filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI').length;
  const approvalCount = documents.filter(d => d.status === 'APPROVAL').length;
  const activeCount = documents.filter(d => d.status === 'AKTIF').length;
  const obsoleteCount = documents.filter(d => d.status === 'OBSOLETE' || d.status === 'DITOLAK').length;

  const stages = [
    {
      id: 'draft',
      step: '01',
      title: 'Drafting',
      subtitle: 'Penyusunan draft',
      count: draftCount,
      icon: FileEdit,
      menuKey: 'reg-draft',
      crumbs: ['Dashboard', 'Registrasi Dokumen', 'Draft'],
    },
    {
      id: 'review',
      step: '02',
      title: 'Verifikasi',
      subtitle: 'Review format & isi',
      count: reviewCount,
      icon: Clock,
      menuKey: 'reg-pending',
      crumbs: ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'],
      hasPulse: reviewCount > 0,
    },
    {
      id: 'approval',
      step: '03',
      title: 'Approval',
      subtitle: 'Otorisasi pengesahan',
      count: approvalCount,
      icon: CheckCircle2,
      menuKey: 'reg-pending',
      crumbs: ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'],
      hasPulse: approvalCount > 0,
    },
    {
      id: 'active',
      step: '04',
      title: 'Terkendali',
      subtitle: 'Resmi berlaku aktif',
      count: activeCount,
      icon: ShieldCheck,
      menuKey: 'ctrl-active',
      crumbs: ['Dashboard', 'Document Control', 'Dokumen Aktif'],
      isHighlight: true,
    },
    {
      id: 'obsolete',
      step: '05',
      title: 'Obsolete',
      subtitle: 'Arsip riwayat lama',
      count: obsoleteCount,
      icon: Archive,
      menuKey: 'ctrl-obsolete',
      crumbs: ['Dashboard', 'Document Control', 'Dokumen Obsolete'],
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Industrial Pipeline Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Alur Siklus Hidup Dokumen
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {documents.length} Dokumen Total
        </span>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              onClick={() => navigateTo(stage.menuKey, stage.crumbs)}
              className={`group relative rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                stage.isHighlight
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 shadow-xs'
                  : stage.hasPulse
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-500 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {/* Connector Arrow on Desktop */}
              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 shadow-2xs pointer-events-none">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    TAHAP {stage.step}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      stage.isHighlight
                        ? 'bg-emerald-600 text-white'
                        : stage.hasPulse
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="mt-2.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {stage.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {stage.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
                <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                  {stage.count}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-0.5">
                  <span>Lihat</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
