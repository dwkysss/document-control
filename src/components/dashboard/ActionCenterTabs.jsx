import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Badge from '../common/Badge';

export default function ActionCenterTabs({
  pendingDocs = [],
  reviewDueDocs = [],
  auditLogs = [],
  setViewingDocument,
  navigateTo,
  confirmDocumentPeriodicReview,
  setSelectedDocForRevision,
  isViewer = false,
  reviewIntervalMonths = 12
}) {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'review' | 'activity'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
      {/* Tab Navigation Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pusat Tugas & Verifikasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumen yang memerlukan perhatian atau peninjauan Anda.
          </p>
        </div>

        {/* Tab Buttons (Simple, Single-line, No Text Wrap) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold flex-shrink-0 self-start sm:self-auto">
          {!isViewer && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Verifikasi</span>
              {pendingDocs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {pendingDocs.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'review'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Tinjauan Tahunan</span>
            {reviewDueDocs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-500 text-white font-bold">
                {reviewDueDocs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Antrian Verifikasi & Review */}
      {activeTab === 'pending' && !isViewer && (
        <div className="p-5 space-y-3">
          {pendingDocs.length === 0 ? (
            <div className="py-10 px-4 text-center max-w-sm mx-auto space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Antrian Verifikasi Bersih
              </h4>
              <p className="text-xs text-slate-500">
                Tidak ada dokumen yang sedang menunggu verifikasi atau persetujuan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-end text-xs pb-0.5">
                <button
                  onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua Antrian ({pendingDocs.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingDocs.slice(0, 5).map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {doc.docNumber}
                      </span>
                      <Badge status={doc.status} size="sm" />
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {doc.department}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs" title={doc.title}>
                      {doc.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>Diajukan: <strong className="text-slate-700 dark:text-slate-300">{doc.creator}</strong></span>
                      <span>&bull;</span>
                      <span>Tim: <strong className="text-blue-600 dark:text-blue-400">{doc.verifierTeam || 'Document Control'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => setViewingDocument && setViewingDocument(doc)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-900/60 rounded-lg transition"
                    >
                      Tinjau Dokumen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Peringatan Tinjauan Tahunan (ISO 9001 Clause 7.5 Annual Review) */}
      {activeTab === 'review' && (
        <div className="p-5 space-y-3">
          {reviewDueDocs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Seluruh Dokumen Aktif Sesuai Siklus
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tidak ada dokumen aktif yang mendekati atau melewati siklus {reviewIntervalMonths} bulan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviewDueDocs.slice(0, 5).map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {doc.docNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                        Jatuh Tempo Review
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {doc.department}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate" title={doc.title}>
                      {doc.title}
                    </h4>

                    <p className="text-[11px] text-slate-500">
                      Tgl Berlaku: <strong className="text-slate-700 dark:text-slate-300">{doc.effectiveDate || doc.approvedDate || doc.createdDate}</strong> &bull; Versi: <strong>Rev {doc.revision || '00'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        if (confirmDocumentPeriodicReview) {
                          confirmDocumentPeriodicReview(doc.id, 'Dikonfirmasi tetap berlaku dan relevan dalam evaluasi berkala.');
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
                      title="Konfirmasi dokumen tetap berlaku tanpa perubahan"
                    >
                      Tetap Berlaku
                    </button>

                    <button
                      onClick={() => {
                        if (setSelectedDocForRevision) {
                          setSelectedDocForRevision(doc);
                        }
                        navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition"
                      title="Ajukan pembaruan/revisi untuk dokumen ini"
                    >
                      Ajukan Revisi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Riwayat & Audit Trail Terkini */}
      {activeTab === 'activity' && (
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-end text-xs pb-0.5">
            <button
              onClick={() => navigateTo('rep-history', ['Dashboard', 'Report', 'History Revision'])}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Buka Semua Log Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada riwayat audit trail yang tercatat.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {auditLogs.slice(0, 6).map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex items-start gap-3 text-xs p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[11px]">
                    {log.user ? log.user.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {log.docNumber || 'SISTEM'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {log.action || 'UPDATE'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {log.timestamp ? log.timestamp.slice(11, 19) : ''}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
                      {log.details}
                    </p>

                    <span className="text-[10px] text-slate-400 font-medium">
                      Oleh: <strong className="text-slate-600 dark:text-slate-300">{log.user}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
