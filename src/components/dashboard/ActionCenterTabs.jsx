import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CalendarClock,
  History,
  ArrowRight,
  Eye,
  FileCheck2,
  RefreshCw
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
  const [activeTab, setActiveTab] = useState(isViewer ? 'review' : 'pending'); // 'pending' | 'review' | 'activity'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header & Tabs */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pusat Tindakan & Pengawasan
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold flex-shrink-0 self-start sm:self-auto">
          {!isViewer && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Verifikasi</span>
              {pendingDocs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-500 text-white font-bold">
                  {pendingDocs.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'review'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Tinjauan ISO</span>
            {reviewDueDocs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-orange-500 text-white font-bold">
                {reviewDueDocs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Antrian Verifikasi */}
      {activeTab === 'pending' && !isViewer && (
        <div className="p-4 sm:p-5 space-y-3">
          {pendingDocs.length === 0 ? (
            <div className="py-8 px-4 text-center max-w-sm mx-auto space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Antrian Verifikasi Bersih
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Seluruh dokumen telah diverifikasi dan disetujui sesuai wewenang.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Menampilkan {Math.min(pendingDocs.length, 5)} dari {pendingDocs.length} dokumen dalam proses
                </span>
                <button
                  onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Semua Antrian</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {pendingDocs.slice(0, 5).map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-400 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {doc.docNumber}
                      </span>
                      <Badge status={doc.status} size="sm" />
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {doc.department}
                      </span>
                      {doc.companyCode && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {doc.companyCode}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs" title={doc.title}>
                      {doc.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Pemohon: <strong className="text-slate-800 dark:text-slate-200">{doc.creator}</strong></span>
                      <span>&bull;</span>
                      <span>Target: <strong className="text-blue-700 dark:text-blue-400">{doc.verifierTeam || 'Document Control'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setViewingDocument && setViewingDocument(doc)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-900 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tinjau</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Peringatan Tinjauan Tahunan */}
      {activeTab === 'review' && (
        <div className="p-4 sm:p-5 space-y-3">
          {reviewDueDocs.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Seluruh Dokumen Aktif Sesuai Siklus
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Tidak ada dokumen aktif yang mendekati siklus jatuh tempo evaluasi {reviewIntervalMonths} bulan.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {reviewDueDocs.length} dokumen mendekati atau melebihi batas waktu peninjauan tahunan
                </span>
                <span className="text-[11px] font-mono font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                  ISO Klausul 7.5.3
                </span>
              </div>

              {reviewDueDocs.slice(0, 5).map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-orange-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {doc.docNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                        Jatuh Tempo &le;30h
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {doc.department}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs" title={doc.title}>
                      {doc.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Tgl Berlaku: <strong className="text-slate-800 dark:text-slate-200">{doc.effectiveDate || doc.approvedDate || doc.createdDate}</strong> &bull; Versi: <strong>Rev {doc.revision || '00'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        if (confirmDocumentPeriodicReview) {
                          confirmDocumentPeriodicReview(doc.id, 'Dikonfirmasi tetap berlaku dan relevan dalam evaluasi berkala.');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-300 dark:border-emerald-800 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Konfirmasi dokumen tetap berlaku tanpa perubahan"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Tetap Relevan</span>
                    </button>

                    <button
                      onClick={() => {
                        if (setSelectedDocForRevision) {
                          setSelectedDocForRevision(doc);
                        }
                        navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-600 hover:text-white dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white border border-purple-300 dark:border-purple-800 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Ajukan pembaruan/revisi untuk dokumen ini"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Revisi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Trail Terkini */}
      {activeTab === 'activity' && (
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Riwayat perubahan & aktivitas penomoran terkini
            </span>
            <button
              onClick={() => navigateTo('rep-history', ['Dashboard', 'Report', 'History Revision'])}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Seluruh Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Belum ada riwayat audit trail yang tercatat.
            </div>
          ) : (
            <div className="space-y-2 pt-0.5">
              {auditLogs.slice(0, 6).map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex items-start gap-3 text-xs p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono text-[11px]">
                    {log.user ? log.user.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {log.docNumber || 'SISTEM'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {log.action || 'UPDATE'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.timestamp ? log.timestamp.slice(11, 19) : ''}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-snug">
                      {log.details}
                    </p>

                    <div className="text-[10px] text-slate-500 font-medium pt-0.5">
                      Personil: <strong className="text-slate-700 dark:text-slate-300">{log.user}</strong>
                    </div>
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
