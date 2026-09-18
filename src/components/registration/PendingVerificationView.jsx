import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye, ShieldAlert, FileText, UserCheck, AlertCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function PendingVerificationView() {
  const {
    documents,
    departments,
    canUserViewPendingDoc,
    reviewDocumentContent,
    verifyDocumentFormat,
    approveDocument,
    rejectDocument,
    setViewingDocument,
    currentUser,
    canReviewContent,
    canVerifyFormat,
    canApproveDocument,
    showToast
  } = useDocumentControl();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'REVIEW' | 'VERIFIKASI' | 'APPROVAL'

  // State Tahap 1: Review Atasan
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // State Tahap 2: Verifikasi Format DCO
  const [selectedVerifyDoc, setSelectedVerifyDoc] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // State Tahap 3: Pengesahan Approver (MR)
  const [selectedApproveDoc, setSelectedApproveDoc] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // State Penolakan Berkas
  const [selectedRejectDoc, setSelectedRejectDoc] = useState(null);
  const [rejectStage, setRejectStage] = useState('REVIEW'); // 'REVIEW' | 'FORMAT' | 'APPROVAL'
  const [rejectionReason, setRejectionReason] = useState('');

  // Antrian berkas: difilter strictly berdasarkan wewenang departemen user saat ini (ISO 9001 Segregation)
  const pendingDocs = documents
    .filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL')
    .filter(d => (canUserViewPendingDoc ? canUserViewPendingDoc(d) : true));
  const stage1Count = pendingDocs.filter(d => d.status === 'REVIEW').length;
  const stage2Count = pendingDocs.filter(d => d.status === 'VERIFIKASI').length;
  const stage3Count = pendingDocs.filter(d => d.status === 'APPROVAL').length;

  // Berkas terfilter berdasarkan Tab aktif
  const displayedDocs = activeTab === 'ALL'
    ? pendingDocs
    : pendingDocs.filter(d => d.status === activeTab);

  // Handler Tahap 1: Review Isi & Alur Kerja oleh Atasan Departemen / Reviewer
  const handleOpenReviewModal = (doc) => {
    if (!canReviewContent) {
      showToast('Akses ditolak! Hanya Atasan / Kepala Departemen (Reviewer) atau Administrator yang berwenang mereview isi dokumen.', 'danger');
      return;
    }
    if (currentUser?.role === 'reviewer' && canUserViewPendingDoc && !canUserViewPendingDoc(doc)) {
      showToast(`Akses ditolak! Dokumen ini hanya dapat direview oleh Atasan Departemen ${doc.department}.`, 'danger');
      return;
    }
    setSelectedReviewDoc(doc);
    setReviewNotes('Isi materi operasional, alur kerja antar bagian, dan persyaratan teknis telah diperiksa dan disetujui untuk lanjut verifikasi format ISO.');
  };

  const handleConfirmReview = () => {
    if (selectedReviewDoc) {
      reviewDocumentContent(selectedReviewDoc.id, reviewNotes.trim());
      setSelectedReviewDoc(null);
    }
  };

  // Handler Tahap 2: Verifikasi Format oleh Document Control (DCO)
  const handleOpenVerifyModal = (doc) => {
    if (!canVerifyFormat) {
      showToast('Akses ditolak! Hanya Document Control Officer (DCO) atau Administrator yang dapat memverifikasi format dokumen.', 'danger');
      return;
    }
    setSelectedVerifyDoc(doc);
    setVerificationNotes('Format tata naskah ISO 9001, nomor dokumen otomatis, dan kelengkapan lampiran telah diverifikasi.');
  };

  const handleConfirmVerifyFormat = () => {
    if (selectedVerifyDoc) {
      verifyDocumentFormat(selectedVerifyDoc.id, verificationNotes.trim());
      setSelectedVerifyDoc(null);
    }
  };

  // Handler Tahap 3: Pengesahan Akhir oleh Pejabat Penyetuju (MR / Approver)
  const handleOpenApproveModal = (doc) => {
    if (!canApproveDocument) {
      showToast('Akses ditolak! Hanya Management Representative (MR) / Approver atau Administrator yang berwenang mengesahkan dokumen.', 'danger');
      return;
    }
    setSelectedApproveDoc(doc);
    setApprovalNotes('Dokumen telah memenuhi seluruh persyaratan mutu ISO 9001 dan disahkan sebagai dokumen aktif resmi.');
  };

  const handleConfirmApprove = () => {
    if (selectedApproveDoc) {
      approveDocument(selectedApproveDoc.id, approvalNotes.trim());
      setSelectedApproveDoc(null);
    }
  };

  // Handler Penolakan (Tolak di Tahap 1, Tahap 2, atau Tahap 3)
  const handleOpenRejectModal = (doc, stage) => {
    if (!canReviewContent && !canVerifyFormat && !canApproveDocument) {
      showToast('Akses ditolak! Anda tidak memiliki wewenang menolak pengajuan dokumen.', 'danger');
      return;
    }
    setSelectedRejectDoc(doc);
    setRejectStage(stage);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('Harap masukkan alasan penolakan agar pembuat dapat memperbaiki dokumen!', 'danger');
      return;
    }
    if (selectedRejectDoc) {
      rejectDocument(selectedRejectDoc.id, rejectionReason.trim());
      setSelectedRejectDoc(null);
    }
  };

  // Cek apakah user saat ini merupakan Reviewer yang berwenang (Atasan Dept / Reviewer / Admin)
  const isAssignedReviewer = (doc) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role !== 'reviewer' && currentUser.role !== 'approver') return false;
    return canUserViewPendingDoc ? canUserViewPendingDoc(doc) : false;
  };

  // Cek apakah user saat ini merupakan Approver yang ditugaskan (MR / GM / Admin)
  const isAssignedApprover = (doc) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.department === 'MGMT' || currentUser.position?.toUpperCase().includes('GENERAL MANAGER') || currentUser.position?.toUpperCase().includes('MANAGEMENT REPRESENTATIVE') || currentUser.position?.toUpperCase().includes('MR')) return true;
    if (doc.targetApprover && doc.targetApprover.toUpperCase().includes(currentUser.name.toUpperCase())) return true;
    if (currentUser.role === 'approver' && doc.department === currentUser.department) return true;
    if (currentUser.role === 'approver') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Antrean Verifikasi & Persetujuan Dokumen ISO 9001
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rantai Persetujuan 3 Tingkat: Tahap 1 Review Isi (Atasan) ➔ Tahap 2 Verifikasi Format (DCO) ➔ Tahap 3 Pengesahan (MR).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
            Tahap 1 (Reviewer): {stage1Count}
          </span>
          <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
            Tahap 2 (DCO): {stage2Count}
          </span>
          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            Tahap 3 (MR): {stage3Count}
          </span>
        </div>
      </div>

      {/* Filter Tabs by Stage */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Semua Antrean</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
            {pendingDocs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REVIEW')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'REVIEW'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
          }`}
        >
          <span>Tahap 1: Review Atasan</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'REVIEW' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
            {stage1Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VERIFIKASI')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'VERIFIKASI'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
          }`}
        >
          <span>Tahap 2: Verifikasi DCO</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'VERIFIKASI' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
            {stage2Count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPROVAL')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'APPROVAL'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <span>Tahap 3: Pengesahan MR</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'APPROVAL' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'}`}>
            {stage3Count}
          </span>
        </button>
      </div>

      {/* Info Banner untuk Atasan Departemen (Reviewer) */}
      {currentUser?.role === 'reviewer' && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-xl p-3.5 flex items-start gap-3 animate-fade-in">
          <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-purple-900 dark:text-purple-200">
              Antrean Verifikasi Khusus Departemen {currentUser?.department || ''} ({currentUser?.name || ''})
            </p>
            <p className="text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
              Sesuai aturan pemisahan wewenang ISO 9001, Anda hanya menampilkan antrean dokumen yang berasal dari departemen <strong>{currentUser?.department || 'Anda'}</strong> atau dokumen di mana Anda ditugaskan khusus sebagai Reviewer. Dokumen dari departemen lain tidak ditampilkan.
            </p>
          </div>
        </div>
      )}

      {/* Info Banner untuk Staf Biasa */}
      {!canReviewContent && !canVerifyFormat && !canApproveDocument && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3.5 flex items-start gap-3 animate-fade-in">
          <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-blue-900 dark:text-blue-200">
              Mode Pemantauan ({currentUser?.position || 'Staff'})
            </p>
            <p className="text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
              Sesuai aturan wewenang ISO 9001:2015 PT Dentelle Jaya Infinitex, Anda dapat memantau progres persetujuan berkas. Dokumen diawali dari pemeriksaan isi oleh <strong>Atasan / Reviewer</strong>, lalu diverifikasi tata naskahnya oleh <strong>Document Control (DCO)</strong>, hingga disahkan secara resmi oleh <strong>Management Representative (MR)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center">No.</th>
                <th className="py-3 px-3">No. Dokumen</th>
                <th className="py-3 px-3">Judul Dokumen</th>
                <th className="py-3 px-3">Departemen</th>
                <th className="py-3 px-3">Pembuat (User)</th>
                <th className="py-3 px-3">Atasan (Reviewer)</th>
                <th className="py-3 px-3">Pengesah (MR)</th>
                <th className="py-3 px-3 text-center">Tahap Saat Ini</th>
                <th className="py-3 px-3 text-center">Tgl. Pengajuan</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada berkas pada tahap ini</p>
                      <p className="text-xs text-slate-400">Semua dokumen dalam kategori ini telah diproses.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedDocs.map((doc, idx) => {
                  const isStage1 = doc.status === 'REVIEW';
                  const isStage2 = doc.status === 'VERIFIKASI';
                  const isStage3 = doc.status === 'APPROVAL';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        {doc.docNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-[190px] truncate" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.creator}</div>
                        <div className="text-[10px] text-slate-400">{doc.creatorPosition}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                          {doc.targetReviewer || doc.reviewerName || 'Atasan Departemen'}
                        </div>
                        {doc.reviewedBy && (
                          <div className="text-[10px] text-emerald-600 font-medium">✓ Disetujui: {doc.reviewedBy}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{doc.targetApprover || 'MR / Approver'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Format: {doc.verifierTeam || 'DCO'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isStage1 && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800">
                              Tahap 1: Review Atasan
                            </span>
                            <div className="text-[9.5px] text-slate-400 mt-0.5">Pemeriksaan Isi & Alur Kerja</div>
                          </div>
                        )}
                        {isStage2 && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                              Tahap 2: Verifikasi DCO
                            </span>
                            <div className="text-[9.5px] text-purple-700 font-medium mt-0.5">
                              Lolos Review oleh {doc.reviewedBy || 'Atasan'}
                            </div>
                          </div>
                        )}
                        {isStage3 && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
                              Tahap 3: Pengesahan MR
                            </span>
                            <div className="text-[9.5px] text-emerald-600 font-medium mt-0.5">
                              Format Lolos oleh {doc.verifiedBy || 'DCO'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {doc.createdDate}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Lihat Berkas */}
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* AKSI TAHAP 1 (REVIEW ISI OLEH ATASAN / REVIEWER) */}
                          {isStage1 && (
                            canReviewContent && isAssignedReviewer(doc) ? (
                              <>
                                <button
                                  onClick={() => handleOpenReviewModal(doc)}
                                  className="px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition flex items-center gap-1 cursor-pointer"
                                  title="Review Isi Dokumen & Alur Kerja (Atasan)"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Review Isi
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(doc, 'REVIEW')}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition flex items-center gap-1 cursor-pointer"
                                  title="Tolak Isi & Kembalikan ke Pembuat"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                                <Clock className="w-3 h-3 text-purple-500" />
                                Menunggu Review Atasan
                              </span>
                            )
                          )}

                          {/* AKSI TAHAP 2 (VERIFIKASI FORMAT OLEH DCO) */}
                          {isStage2 && (
                            canVerifyFormat ? (
                              <>
                                <button
                                  onClick={() => handleOpenVerifyModal(doc)}
                                  className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition flex items-center gap-1 cursor-pointer"
                                  title="Verifikasi Format Dokumen (DCO)"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Verifikasi Format
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(doc, 'FORMAT')}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition flex items-center gap-1 cursor-pointer"
                                  title="Tolak Format & Kembalikan ke Pembuat"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Menunggu DCO
                              </span>
                            )
                          )}

                          {/* AKSI TAHAP 3 (PENGESAHAN OLEH APPROVER / MR) */}
                          {isStage3 && (
                            canApproveDocument && isAssignedApprover(doc) ? (
                              <>
                                <button
                                  onClick={() => handleOpenApproveModal(doc)}
                                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition flex items-center gap-1 cursor-pointer"
                                  title="Sahkan & Terbitkan Dokumen Menjadi Aktif (MR)"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Setujui & Terbitkan
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(doc, 'APPROVAL')}
                                  className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition flex items-center gap-1 cursor-pointer"
                                  title="Tolak Pengesahan Dokumen"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Menunggu {doc.targetApprover || 'MR'}
                              </span>
                            )
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

      {/* ================= MODAL TAHAP 1: REVIEW ATASAN / REVIEWER ================= */}
      {selectedReviewDoc && (
        <Modal
          isOpen={Boolean(selectedReviewDoc)}
          onClose={() => setSelectedReviewDoc(null)}
          title="Review Isi Dokumen & Alur Kerja (Tahap 1 - Atasan Departemen)"
          subtitle={`No. Dokumen: ${selectedReviewDoc.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-300">
              <p className="font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" />
                Pemeriksaan Materi & Kesesuaian Operasional (ISO 9001)
              </p>
              <p className="mt-1 text-purple-700 dark:text-purple-400 leading-relaxed">
                Sebagai Atasan / Reviewer, periksa apakah isi dokumen, langkah kerja teknis, dan alur operasional telah sesuai dengan standar kerja departemen Anda. Setelah disetujui, dokumen akan <strong>diteruskan ke Document Control Officer (DCO)</strong> untuk verifikasi tata naskah & nomor master list.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Judul Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReviewDoc.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Departemen:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReviewDoc.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pembuat Berkas (Staff):</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedReviewDoc.creator} ({selectedReviewDoc.creatorPosition})</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pejabat Pengesah Akhir:</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{selectedReviewDoc.targetApprover || 'Management Representative (MR)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Reviewer (Saat Ini):</span>
                <span className="font-semibold text-purple-700 dark:text-purple-400">{currentUser.name} ({currentUser.position})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Pemeriksaan Isi Dokumen:
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedReviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1.5"
              >
                Loloskan ke Doc Control (Tahap 2)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL TAHAP 2: VERIFIKASI FORMAT DCO ================= */}
      {selectedVerifyDoc && (
        <Modal
          isOpen={Boolean(selectedVerifyDoc)}
          onClose={() => setSelectedVerifyDoc(null)}
          title="Verifikasi Format Dokumen (Tahap 2 - Document Control)"
          subtitle={`No. Dokumen: ${selectedVerifyDoc.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Pemeriksaan Format & Tata Naskah ISO 9001
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-400 leading-relaxed">
                Sebagai Document Control Officer, periksa penomoran resmi, tata naskah, dan kelengkapan master list. Dokumen ini telah <strong>disetujui isinya oleh {selectedVerifyDoc.reviewedBy || 'Atasan Departemen'}</strong>. Setelah diverifikasi, dokumen akan diteruskan ke <strong>Management Representative ({selectedVerifyDoc.targetApprover || 'MR'})</strong> untuk pengesahan resmi.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Judul Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVerifyDoc.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Departemen:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVerifyDoc.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pembuat Berkas:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedVerifyDoc.creator} ({selectedVerifyDoc.creatorPosition})</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Reviewer Atasan:</span>
                <span className="font-semibold text-purple-700 dark:text-purple-400">{selectedVerifyDoc.reviewedBy || 'Atasan Departemen'} ({selectedVerifyDoc.reviewedDate || 'Disetujui'})</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Target Pengesahan:</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">{selectedVerifyDoc.targetApprover || 'Management Representative (MR)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Verifikator Format (Saat Ini):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name} (Document Control Officer)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Pemeriksaan Format:
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedVerifyDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVerifyFormat}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1.5"
              >
                Loloskan ke MR (Tahap 3)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL TAHAP 3: PENGESAHAN APPROVER (MR) ================= */}
      {selectedApproveDoc && (
        <Modal
          isOpen={Boolean(selectedApproveDoc)}
          onClose={() => setSelectedApproveDoc(null)}
          title="Pengesahan Dokumen Terbit Resmi (Tahap 3 - Management Representative)"
          subtitle={`No. Dokumen: ${selectedApproveDoc.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Otorisasi Penerbitan Dokumen Resmi ISO 9001
              </p>
              <p className="mt-1 text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Dokumen ini telah <strong>lolos review isi oleh {selectedApproveDoc.reviewedBy || 'Atasan Dept'}</strong> serta <strong>lolos verifikasi format oleh {selectedApproveDoc.verifiedBy || 'Document Control'}</strong>. Dengan pengesahan MR, berkas resmi berstatus <strong>AKTIF</strong> dengan stempel Controlled Copy dan diberlakukan untuk operasional pabrik.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Judul Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApproveDoc.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pembuat Berkas:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedApproveDoc.creator} ({selectedApproveDoc.department})</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Status Review Atasan:</span>
                <span className="font-bold text-purple-700 dark:text-purple-400">Lolos Review oleh {selectedApproveDoc.reviewedBy || 'Atasan'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Status Format ISO:</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">Lolos Verifikasi oleh {selectedApproveDoc.verifiedBy || 'DCO'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pejabat Pengesah (MR):</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{currentUser.name} ({currentUser.position})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Pengesahan Manajemen:
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedApproveDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sahkan & Terbitkan Dokumen (AKTIF)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL PENOLAKAN DOKUMEN ================= */}
      {selectedRejectDoc && (
        <Modal
          isOpen={Boolean(selectedRejectDoc)}
          onClose={() => setSelectedRejectDoc(null)}
          title={`Penolakan Dokumen (${
            rejectStage === 'REVIEW'
              ? 'Tahap 1: Review Atasan'
              : rejectStage === 'FORMAT'
              ? 'Tahap 2: Verifikasi Format DCO'
              : 'Tahap 3: Pengesahan MR'
          })`}
          subtitle={`No. Dokumen: ${selectedRejectDoc.docNumber}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-300">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Pengembalian Berkas ke Pembuat ({selectedRejectDoc.creator})
              </p>
              <p className="mt-1 text-rose-700 dark:text-rose-400">
                Dokumen akan dialihkan statusnya menjadi <strong>DITOLAK</strong>. Pembuat berkas akan menerima notifikasi beserta catatan perbaikan yang Anda berikan untuk direvisi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Penolakan / Catatan Perbaikan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Tuliskan klausul, alur operasional, tata naskah, atau alasan perbaikan spesifik..."
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedRejectDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Konfirmasi Tolak Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
