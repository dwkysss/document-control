import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Search
} from 'lucide-react';
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
    requestDocumentRevision,
    setViewingDocument,
    currentUser,
    canReviewContent,
    canVerifyFormat,
    canApproveDocument,
    showToast
  } = useDocumentControl();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'REVIEW' | 'VERIFIKASI' | 'APPROVAL'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

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

  // State Permintaan Revisi Berkas (Return for Revision)
  const [selectedRevisionDoc, setSelectedRevisionDoc] = useState(null);
  const [revisionStage, setRevisionStage] = useState('REVIEW'); // 'REVIEW' | 'FORMAT' | 'APPROVAL'
  const [revisionNotes, setRevisionNotes] = useState('');

  // Antrian berkas: difilter strictly berdasarkan wewenang departemen user saat ini (ISO 9001 Segregation)
  const pendingDocs = documents
    .filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL')
    .filter(d => (canUserViewPendingDoc ? canUserViewPendingDoc(d) : true));
  const stage1Count = pendingDocs.filter(d => d.status === 'REVIEW').length;
  const stage2Count = pendingDocs.filter(d => d.status === 'VERIFIKASI').length;
  const stage3Count = pendingDocs.filter(d => d.status === 'APPROVAL').length;

  // Berkas terfilter berdasarkan Tab aktif dan Pencarian
  const displayedDocs = activeTab === 'ALL'
    ? pendingDocs
    : pendingDocs.filter(d => d.status === activeTab);

  const filteredDocs = displayedDocs.filter(d => {
    if (filterDept !== 'ALL' && (d.department || '').toUpperCase() !== filterDept.toUpperCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = (d.docNumber || '').toLowerCase().includes(q);
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchCreator = (d.creator || '').toLowerCase().includes(q);
      const matchDept = (d.department || '').toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchCreator && !matchDept) return false;
    }
    return true;
  });

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

  // Handler Permintaan Revisi ke Pembuat Berkas
  const handleOpenRevisionModal = (doc, stage) => {
    if (!canReviewContent && !canVerifyFormat && !canApproveDocument) {
      showToast('Akses ditolak! Anda tidak memiliki wewenang meminta revisi dokumen.', 'danger');
      return;
    }
    if (stage === 'REVIEW' && currentUser?.role === 'reviewer' && canUserViewPendingDoc && !canUserViewPendingDoc(doc)) {
      showToast(`Akses ditolak! Dokumen ini hanya dapat direview oleh Atasan Departemen ${doc.department}.`, 'danger');
      return;
    }
    setSelectedRevisionDoc(doc);
    setRevisionStage(stage);
    setRevisionNotes('');
  };

  const handleConfirmRevision = () => {
    if (!revisionNotes.trim()) {
      showToast('Harap masukkan poin-poin perbaikan yang harus direvisi oleh pembuat dokumen!', 'danger');
      return;
    }
    if (selectedRevisionDoc) {
      requestDocumentRevision(selectedRevisionDoc.id, revisionNotes.trim(), revisionStage);
      setSelectedRevisionDoc(null);
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
    <div className="space-y-4">
      {/* 1. Header Bar (Clean & Simple) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Menunggu Verifikasi
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                {pendingDocs.length} Berkas
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Antrean verifikasi 3 tahap (Review Atasan, Verifikasi DCO, Pengesahan MR).
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Card: Toolbar (Tabs + Search/Filter) & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Semua Antrean</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'ALL' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {pendingDocs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REVIEW')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'REVIEW'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Tahap 1: Review Atasan</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'REVIEW' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {stage1Count}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('VERIFIKASI')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'VERIFIKASI'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Tahap 2: Verifikasi DCO</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'VERIFIKASI' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {stage2Count}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('APPROVAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'APPROVAL'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Tahap 3: Pengesahan MR</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'APPROVAL' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {stage3Count}
              </span>
            </button>
          </div>

          {/* Search & Dept Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nomor, judul, pembuat..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Dept</option>
              {departments.map(d => (
                <option key={d.id || d.code} value={d.code}>{d.code}</option>
              ))}
            </select>

            {(searchTerm || filterDept !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setFilterDept('ALL'); }}
                className="p-1.5 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Clean Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4 text-center w-12 whitespace-nowrap">No.</th>
                <th className="py-3.5 px-4 whitespace-nowrap">No. Dokumen</th>
                <th className="py-3.5 px-4">Judul Dokumen</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Departemen</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Pembuat</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tahap Berjalan</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tidak ada berkas pada antrean ini</p>
                      <p className="text-xs text-slate-400">Semua dokumen pada kategori ini telah selesai diproses.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const isStage1 = doc.status === 'REVIEW';
                  const isStage2 = doc.status === 'VERIFIKASI';
                  const isStage3 = doc.status === 'APPROVAL';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* 2. No Dokumen */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="font-bold font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs"
                            title="Buka Pratinjau Dokumen"
                          >
                            {doc.docNumber}
                          </button>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {doc.type || 'SOP'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Judul Dokumen */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white max-w-[260px] truncate" title={doc.title}>
                          {doc.title}
                        </div>
                      </td>

                      {/* 4. Departemen */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {doc.department}
                        </span>
                      </td>

                      {/* 5. Pembuat */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          {doc.creator}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.createdDate}
                        </div>
                      </td>

                      {/* 6. Tahap Berjalan */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isStage1 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            Tahap 1: Review Atasan
                          </span>
                        )}
                        {isStage2 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Tahap 2: Verifikasi DCO
                          </span>
                        )}
                        {isStage3 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Tahap 3: Pengesahan MR
                          </span>
                        )}
                      </td>

                      {/* 7. Tindakan / Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Preview Button */}
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition flex items-center gap-1 cursor-pointer"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Lihat</span>
                          </button>

                          {/* Tombol Otorisasi Tahap 1 */}
                          {isStage1 && canReviewContent && isAssignedReviewer(doc) && (
                            <>
                              <button
                                onClick={() => handleOpenReviewModal(doc)}
                                className="px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Review</span>
                              </button>
                              <button
                                onClick={() => handleOpenRevisionModal(doc, 'REVIEW')}
                                className="p-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 rounded-md transition cursor-pointer"
                                title="Minta Revisi"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(doc, 'REVIEW')}
                                className="p-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition cursor-pointer"
                                title="Tolak Berkas"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          )}

                          {/* Tombol Otorisasi Tahap 2 */}
                          {isStage2 && canVerifyFormat && (
                            <>
                              <button
                                onClick={() => handleOpenVerifyModal(doc)}
                                className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verifikasi</span>
                              </button>
                              <button
                                onClick={() => handleOpenRevisionModal(doc, 'FORMAT')}
                                className="p-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 rounded-md transition cursor-pointer"
                                title="Minta Revisi Format"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(doc, 'FORMAT')}
                                className="p-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition cursor-pointer"
                                title="Tolak Format"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          )}

                          {/* Tombol Otorisasi Tahap 3 */}
                          {isStage3 && canApproveDocument && isAssignedApprover(doc) && (
                            <>
                              <button
                                onClick={() => handleOpenApproveModal(doc)}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sahkan</span>
                              </button>
                              <button
                                onClick={() => handleOpenRevisionModal(doc, 'APPROVAL')}
                                className="p-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 rounded-md transition cursor-pointer"
                                title="Minta Revisi sebelum Pengesahan"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(doc, 'APPROVAL')}
                                className="p-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition cursor-pointer"
                                title="Tolak Pengesahan"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            </>
                          )}

                          {/* Jika user hanya memantau (Staff / bukan giliran otorisasi) */}
                          {((isStage1 && (!canReviewContent || !isAssignedReviewer(doc))) ||
                            (isStage2 && !canVerifyFormat) ||
                            (isStage3 && (!canApproveDocument || !isAssignedApprover(doc)))) && (
                            <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {isStage1 ? 'Menunggu Atasan' : (isStage2 ? 'Menunggu DCO' : 'Menunggu MR')}
                            </span>
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

      {/* ================= MODAL PERMINTAAN REVISI DOKUMEN ================= */}
      {selectedRevisionDoc && (
        <Modal
          isOpen={Boolean(selectedRevisionDoc)}
          onClose={() => setSelectedRevisionDoc(null)}
          title={`Permintaan Revisi Dokumen (${
            revisionStage === 'REVIEW'
              ? 'Tahap 1: Review Atasan'
              : revisionStage === 'FORMAT'
              ? 'Tahap 2: Verifikasi Format DCO'
              : 'Tahap 3: Pengesahan MR'
          })`}
          subtitle={`No. Dokumen: ${selectedRevisionDoc.docNumber}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Kembalikan Berkas ke Pembuat ({selectedRevisionDoc.creator})
              </p>
              <p className="mt-1 text-amber-700 dark:text-amber-300 leading-relaxed">
                Dokumen akan berstatus <strong>PERLU REVISI</strong> dan dikembalikan ke antrean draft/perbaikan pembuat berkas. Pembuat akan menerima notifikasi beserta rincian catatan revisi agar dapat langsung diperbaiki dan diajukan ulang.
              </p>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Judul Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRevisionDoc.title}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Departemen:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRevisionDoc.department}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Pembuat:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedRevisionDoc.creator}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Revisi / Poin-Poin yang Harus Diperbaiki <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Contoh: Tolong perbaiki klausul operasional 3.2 mengenai alur kerja mesin, serta lampirkan lembar flow chart proses terbaru..."
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Catatan ini akan tersimpan ke riwayat audit dokumen dan tampil di daftar draft pembuat dokumen.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedRevisionDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Kirim Permintaan Revisi
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
