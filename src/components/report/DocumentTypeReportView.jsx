import React from 'react';
import { Layers, BookmarkCheck, FileText, CheckCircle2 } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DocumentTypeReportView() {
  const { documentTypes, documents } = useDocumentControl();

  const typeStats = documentTypes.map(type => {
    const matchedDocs = documents.filter(d => d.type === type.code);
    const active = matchedDocs.filter(d => d.status === 'AKTIF').length;
    const obsolete = matchedDocs.filter(d => d.status === 'OBSOLETE').length;
    const pending = matchedDocs.filter(d => d.status === 'VERIFIKASI').length;
    const draft = matchedDocs.filter(d => d.status === 'DRAFT').length;

    return {
      ...type,
      total: matchedDocs.length,
      active,
      obsolete,
      pending,
      draft,
      ratio: documents.length > 0 ? Math.round((matchedDocs.length / documents.length) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-600" />
            Laporan Distribusi Dokumen per Jenis (Hierarki Mutu)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sebaran dokumen SOP, Instruksi Kerja (IK), Formulir Kontrol, Kebijakan, dan Memo.
          </p>
        </div>
      </div>

      {/* Grid of Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {typeStats.map(stat => (
          <div key={stat.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-base">
                  {stat.code}
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{stat.name}</p>
                <span className="text-[10px] text-slate-400">
                  {stat.level === 5 ? 'Dokumen Eksternal (Level 5)' : `Level ${stat.level} Hierarki Mutu`}
                </span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                {stat.total}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 text-emerald-800 dark:text-emerald-300">
                <span className="text-[10px] text-emerald-600 uppercase font-semibold">Aktif</span>
                <p className="text-sm font-extrabold">{stat.active}</p>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded border border-amber-200 text-amber-800 dark:text-amber-300">
                <span className="text-[10px] text-amber-600 uppercase font-semibold">Review</span>
                <p className="text-sm font-extrabold">{stat.pending}</p>
              </div>
            </div>

            <div className="pt-2 text-[11px]">
              <div className="flex justify-between text-slate-500 mb-1">
                <span>Porsi dari Total Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{stat.ratio}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${stat.ratio}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
