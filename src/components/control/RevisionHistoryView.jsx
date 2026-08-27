import React, { useState } from 'react';
import { GitBranch, Clock, User, FileText, CheckCircle2, Search, ArrowRight, Eye } from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RevisionHistoryView() {
  const { documents, setViewingDocument } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');

  // Group documents by base number (Type + Dept + Seq)
  const groupedDocs = documents.reduce((acc, doc) => {
    const baseKey = `${doc.type}-${doc.department}-${doc.seqNumber}`;
    if (!acc[baseKey]) {
      acc[baseKey] = [];
    }
    acc[baseKey].push(doc);
    return acc;
  }, {});

  const filteredGroups = Object.entries(groupedDocs).filter(([key, docs]) => {
    const anyDocMatches = docs.some(d =>
      d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return anyDocMatches;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600" />
            Riwayat & Silsilah Revisi Dokumen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pohon kronologis evolusi versi dokumen dari inisiasi (Rev 00) hingga rilis terkini.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari silsilah revisi berdasarkan nomor / judul dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Document Version Lineage Cards */}
      <div className="space-y-4">
        {filteredGroups.map(([baseKey, docsList]) => {
          const sortedDocs = [...docsList].sort((a, b) => parseInt(a.revision) - parseInt(b.revision));
          const latestDoc = sortedDocs[sortedDocs.length - 1];

          return (
            <div key={baseKey} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {latestDoc.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Grup: <strong>{baseKey}</strong></span>
                    <span>•</span>
                    <span>Departemen: <strong>{latestDoc.department}</strong></span>
                    <span>•</span>
                    <span>Total Versi: <strong>{sortedDocs.length} Iterasi</strong></span>
                  </div>
                </div>
              </div>

              {/* Version Stepper Tree */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {sortedDocs.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-2 transition ${
                      item.status === 'AKTIF'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : item.status === 'OBSOLETE'
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-80'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        Rev. {item.revision}
                      </span>
                      <Badge status={item.status} size="sm" />
                    </div>

                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                      {item.docNumber}
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div>Tgl: {item.effectiveDate || item.createdDate}</div>
                      <div>Oleh: {item.creator}</div>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 italic bg-white/70 dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/50 dark:border-slate-800 line-clamp-2">
                        "{item.notes}"
                      </p>
                    )}

                    <button
                      onClick={() => setViewingDocument(item)}
                      className="w-full mt-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-slate-700 rounded transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Lihat Versi Ini
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
