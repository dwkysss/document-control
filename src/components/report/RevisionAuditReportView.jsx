import React, { useState } from 'react';
import { History, Search, Download, ShieldCheck, User, Clock, FileText } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RevisionAuditReportView() {
  const { auditLogs } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log =>
    log.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.docTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVE_DOCUMENT':
      case 'APPROVE_REVISION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">APPROVED</span>;
      case 'REJECT_DOCUMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">REJECTED</span>;
      case 'CREATE_REVISION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">REVISED</span>;
      case 'SUBMIT_VERIFICATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">SUBMITTED</span>;
      case 'SAVE_DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">DRAFT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Laporan Audit Trail & Riwayat Perubahan Dokumen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log ketertelusuran riwayat lengkap seluruh aksi penambahan, revisi, verifikasi, dan persetujuan dokumen.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200">
          {auditLogs.length} Entri Jejak Audit
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari log audit berdasarkan user / nomor dokumen / tindakan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">Waktu (Timestamp)</th>
                <th className="py-3 px-4">User Pelaksana</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
                <th className="py-3 px-4">Nomor Dokumen</th>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Rincian Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    <div>{log.user}</div>
                    <div className="text-[10px] text-slate-400 font-mono">NIK: {log.nik}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {log.docNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={log.docTitle}>
                    {log.docTitle}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {log.details}
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
