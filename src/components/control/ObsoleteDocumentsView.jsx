import React, { useState } from 'react';
import { Archive, Eye, AlertTriangle, Search, ExternalLink } from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ObsoleteDocumentsView() {
  const { documents, setViewingDocument } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');

  const obsoleteDocs = documents.filter(d => d.status === 'OBSOLETE');

  const filtered = obsoleteDocs.filter(d => {
    return d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           d.department.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-rose-600" />
            Dokumen Obsolete (Kadaluarsa / Ditarik)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Arsip dokumen standar yang sudah tidak berlaku karena telah diterbitkan revisi baru atau penarikan operasional.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200">
          {obsoleteDocs.length} Dokumen Obsolete Tersimpan
        </div>
      </div>

      {/* ISO Warning Callout */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Kepatuhan ISO 9001 (Klausul 7.5.3.2) - Pengendalian Dokumen Kadaluarsa:</h4>
          <p className="mt-0.5 text-slate-700 dark:text-slate-300">
            Dokumen obsolete tetap disimpan untuk keperluan audit rekam jejak, namun telah dicap watermark <strong>OBSOLETE</strong> dan tidak boleh digunakan di area operasional kerja.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4">Digantikan Oleh</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-rose-50/20 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap line-through text-slate-500">
                    {doc.docNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={doc.title}>
                    {doc.title}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{doc.creator}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                    {doc.revision}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {doc.supersededBy ? (
                      <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        {doc.supersededBy}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Revisi Baru</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={doc.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition flex items-center gap-1 mx-auto"
                      title="Pratinjau Dokumen Obsolete (Watermarked)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat Arsip
                    </button>
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
