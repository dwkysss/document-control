import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  RefreshCw,
  Calendar,
  Search,
  Download,
  CheckCircle2,
  Ban,
  AlertTriangle,
  ClipboardCheck,
  Clock,
  Check,
  FileEdit,
  Building2
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

/**
 * Utilitas untuk menghitung status jatuh tempo peninjauan berkala ISO 9001 (Langkah 8)
 */
function getPeriodicReviewInfo(doc, reviewIntervalMonths = 12) {
  const baseDateStr = doc.lastReviewedDate || doc.effectiveDate || doc.approvedDate || doc.createdDate;
  if (!baseDateStr) {
    return { status: 'NORMAL', label: 'Terkendali', dueDateStr: '-', daysRemaining: 999, badgeColor: 'bg-slate-100 text-slate-700' };
  }

  const baseDate = new Date(baseDateStr);
  const dueDate = new Date(baseDate);
  dueDate.setMonth(dueDate.getMonth() + reviewIntervalMonths);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  if (daysRemaining < 0) {
    return {
      status: 'OVERDUE',
      label: `Jatuh Tempo (${Math.abs(daysRemaining)} hr)`,
      dueDateStr,
      daysRemaining,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'DUE_SOON',
      label: `Review (${daysRemaining} hr)`,
      dueDateStr,
      daysRemaining,
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
    };
  } else {
    return {
      status: 'NORMAL',
      label: 'Terkendali',
      dueDateStr,
      daysRemaining,
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
    };
  }
}

export default function ActiveDocumentsView() {
  const {
    documents,
    setViewingDocument,
    setSelectedDocForRevision,
    setActiveMenu,
    setBreadcrumbs,
    cancelDocument,
    confirmDocumentPeriodicReview,
    systemSettings,
    isAdmin,
    showToast
  } = useDocumentControl();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'DUE'
  const [docToCancel, setDocToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modal State untuk Peninjauan Berkala (Langkah 8 & 9)
  const [docToReview, setDocToReview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const reviewIntervalMonths = systemSettings.periodicReviewMonths || 12;
  const activeDocs = documents.filter(d => d.status === 'AKTIF');

  // Hitung dokumen yang mendekati / lewat jatuh tempo review berkala
  const reviewDueDocs = activeDocs.filter(d => {
    const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
    return info.status === 'OVERDUE' || info.status === 'DUE_SOON';
  });

  const filtered = activeDocs.filter(d => {
    const matchesSearch =
      d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'DUE') {
      const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
      return info.status === 'OVERDUE' || info.status === 'DUE_SOON';
    }

    return true;
  });

  const handleRevisionClick = (doc) => {
    setSelectedDocForRevision(doc);
    setActiveMenu('rev-new');
    setBreadcrumbs(['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
  };

  const handleOpenReviewModal = (doc) => {
    setDocToReview(doc);
    setReviewNotes('');
  };

  const handleConfirmStillValid = () => {
    if (!docToReview) return;
    confirmDocumentPeriodicReview(docToReview.id, reviewNotes.trim());
    setDocToReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Dokumen Aktif & Terkendali (Controlled Copies)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh dokumen resmi yang sedang berlaku operasional di lingkungan {systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200">
            {activeDocs.length} Dokumen Berlaku Resmi
          </div>
          {reviewDueDocs.length > 0 && (
            <div className="text-xs font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              {reviewDueDocs.length} Perlu Review Berkala
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Dokumen Aktif ({activeDocs.length})
            </button>
            <button
              onClick={() => setFilterMode('DUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterMode === 'DUE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Perlu Review Berkala ({reviewDueDocs.length})
            </button>
          </div>
          <span className="text-[11px] text-slate-400">
            Interval Peninjauan ISO: <strong>{reviewIntervalMonths} Bulan</strong>
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Cari dokumen aktif berdasarkan nomor / judul / divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4 text-center">Tgl. Berlaku</th>
                <th className="py-3 px-4 text-center">Monitoring & Review</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada dokumen aktif yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => {
                  const reviewInfo = getPeriodicReviewInfo(doc, reviewIntervalMonths);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        {doc.docNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[220px] truncate" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.type}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{doc.creator}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {doc.revision}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {doc.effectiveDate || doc.createdDate}
                      </td>
                      {/* Kolom Review Status (Langkah 8) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${reviewInfo.badgeColor}`} title={`Jatuh Tempo: ${reviewInfo.dueDateStr}`}>
                          {reviewInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingDocument(doc)}
                            className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-md transition flex items-center gap-1"
                            title="Buka Dokumen Terkendali & Validasi QR"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Pratinjau
                          </button>

                          {/* Tombol Tinjau / Review Berkala (Langkah 8 & 9 ISO 9001) */}
                          <button
                            onClick={() => handleOpenReviewModal(doc)}
                            className="px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 rounded-md transition flex items-center gap-1"
                            title="Monitoring & Peninjauan Berkala (Klausul 7.5)"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Tinjau
                          </button>

                          <button
                            onClick={() => handleRevisionClick(doc)}
                            className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 rounded-md transition flex items-center gap-1"
                            title="Ajukan Revisi Dokumen"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Revisi
                          </button>

                          {/* Batalkan Dokumen (Wewenang Khusus System Administrator) */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDocToCancel(doc);
                                setCancelReason('');
                              }}
                              className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-md transition flex items-center gap-1"
                              title="Batalkan Dokumen (Ubah Menjadi Obsolete)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Peninjauan Berkala (Langkah 8 & 9 ISO 9001:2015) */}
      {docToReview && (
        <Modal
          isOpen={Boolean(docToReview)}
          onClose={() => setDocToReview(null)}
          title="Monitoring & Review Berkala Dokumen (ISO 9001:2015 Clause 7.5)"
          subtitle={`No. Dokumen: ${docToReview.docNumber} • ${docToReview.title}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            {/* Alert Informasi ISO */}
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-3">
              <ClipboardCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-sky-900 dark:text-sky-200 leading-relaxed">
                <p className="font-bold">Langkah 8 & 9: Peninjauan Berkala Mutu</p>
                <p className="mt-1">
                  Dokumen operasional wajib ditinjau secara berkala untuk memastikan isi proses, regulasi, dan instruksi kerja tetap relevan serta tidak tumpang tindih.
                </p>
              </div>
            </div>

            {/* Info Matriks Dokumen */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Departemen:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{docToReview.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Revisi Saat Ini:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{docToReview.revision}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal Berlaku / Terbit:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{docToReview.effectiveDate || docToReview.createdDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Terakhir Ditinjau:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{docToReview.lastReviewedDate || 'Belum pernah ditinjau'}</span>
                </div>
              </div>
            </div>

            {/* Form Catatan Peninjauan */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Hasil Evaluasi Peninjauan (Opsional):
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Contoh: Dokumen telah dicocokkan dengan regulasi internal dan parameter operasional mesin terbaru. Tidak ada perubahan yang diperlukan."
                rows={3}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Keputusan Alur (Langkah 9 Infografis: Perlu Revisi? YA / TIDAK) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-center mb-3">
                Hasil Evaluasi Dokumen (Pilih Tindakan):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi 1: TIDAK PERLU REVISI -> TETAP BERLAKU */}
                <button
                  type="button"
                  onClick={handleConfirmStillValid}
                  className="p-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>TETAP BERLAKU</span>
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300 mt-1 leading-snug">
                    Tidak ada perubahan. Masa berlaku review diperpanjang {reviewIntervalMonths} bulan ke depan.
                  </p>
                </button>

                {/* Opsi 2: PERLU REVISI -> REVISI DOKUMEN */}
                <button
                  type="button"
                  onClick={() => {
                    const targetDoc = docToReview;
                    setDocToReview(null);
                    handleRevisionClick(targetDoc);
                  }}
                  className="p-3 rounded-xl border-2 border-purple-500/50 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200 font-bold">
                    <FileEdit className="w-4 h-4 text-purple-600" />
                    <span>PERLU REVISI</span>
                  </div>
                  <p className="text-[10px] text-purple-700/80 dark:text-purple-300 mt-1 leading-snug">
                    Ada perubahan alur/regulasi. Buka formulir pengajuan revisi (nomor revisi naik).
                  </p>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {docToCancel && (
        <Modal
          isOpen={Boolean(docToCancel)}
          onClose={() => setDocToCancel(null)}
          title="Konfirmasi Pembatalan Dokumen (Penarikan / Obsolete)"
          subtitle={`No. Dokumen: ${docToCancel.docNumber} • ${docToCancel.title}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">Perhatian Standar ISO 9001 Clause 7.5:</p>
                <p className="mt-1 leading-relaxed">
                  Dokumen yang dibatalkan akan langsung ditarik dari peredaran operasional dan statusnya berubah menjadi <strong>OBSOLETE</strong> serta dicap watermark penarikan. Rekam jejak audit pembatalan akan dicatat di log sistem.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alasan Pembatalan Dokumen <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Kebijakan dicabut oleh Direksi / SOP tidak lagi relevan dengan alur proses baru..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDocToCancel(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    showToast('Harap isi alasan pembatalan dokumen!', 'danger');
                    return;
                  }
                  cancelDocument(docToCancel.id, cancelReason.trim());
                  setDocToCancel(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Ya, Batalkan Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
