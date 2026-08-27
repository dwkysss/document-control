import React from 'react';
import { Building2, PieChart, CheckCircle2, Archive, Clock, FileText } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DepartmentReportView() {
  const { departments, documents } = useDocumentControl();

  const deptStats = departments.map(dept => {
    const deptDocs = documents.filter(d => d.department === dept.code);
    const active = deptDocs.filter(d => d.status === 'AKTIF').length;
    const obsolete = deptDocs.filter(d => d.status === 'OBSOLETE').length;
    const pending = deptDocs.filter(d => d.status === 'VERIFIKASI').length;
    const draft = deptDocs.filter(d => d.status === 'DRAFT').length;
    const total = deptDocs.length;

    return {
      ...dept,
      total,
      active,
      obsolete,
      pending,
      draft,
      activeRate: total > 0 ? Math.round((active / total) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Laporan Distribusi Dokumen per Departemen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis volume dokumen, rasio keaktifan, dan tingkat kepatuhan per unit kerja.
          </p>
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {deptStats.map(stat => (
          <div key={stat.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {stat.code}
                </span>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]" title={stat.name}>{stat.name}</p>
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {stat.total} Dok
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Aktif:</span>
                <span className="font-bold">{stat.active}</span>
              </div>
              <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Verifikasi:</span>
                <span className="font-bold">{stat.pending}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Draft:</span>
                <span className="font-bold">{stat.draft}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-medium">
                <span className="flex items-center gap-1"><Archive className="w-3.5 h-3.5" /> Obsolete:</span>
                <span className="font-bold">{stat.obsolete}</span>
              </div>
            </div>

            {/* Compliance bar */}
            <div className="pt-2 border-t text-[11px]">
              <div className="flex justify-between text-slate-500 mb-1">
                <span>Rasio Aktif:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{stat.activeRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stat.activeRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">Kode Dept</th>
                <th className="py-3 px-4">Nama Departemen</th>
                <th className="py-3 px-4">Kepala Dept</th>
                <th className="py-3 px-4 text-center">Dokumen Aktif</th>
                <th className="py-3 px-4 text-center">Menunggu Review</th>
                <th className="py-3 px-4 text-center">Draft</th>
                <th className="py-3 px-4 text-center">Obsolete</th>
                <th className="py-3 px-4 text-center font-bold">Total Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptStats.map((stat, idx) => (
                <tr key={stat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{stat.code}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{stat.name}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{stat.head || '-'}</td>
                  <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">{stat.active}</td>
                  <td className="py-3.5 px-4 text-center text-amber-700 font-bold">{stat.pending}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{stat.draft}</td>
                  <td className="py-3.5 px-4 text-center text-rose-700 font-bold">{stat.obsolete}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                    {stat.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
