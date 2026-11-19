import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

const formatPendingDate = (value) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return value;
  }
};

export default function PendingVerificationView() {
  const {
    documents,
    departments,
    documentTypes,
    selectedCompanyFilter,
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

  // Accordion state untuk tampilan Mobile
  const [expandedMobileDocIds, setExpandedMobileDocIds] = useState(new Set());

  const toggleExpandMobileDoc = (id) => {
    setExpandedMobileDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  // Ref & State untuk deteksi scroll horizontal tabel (Dynamic Scroll Indicators)
  const tableContainerRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const updateScrollIndicators = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setScrollState({
      canScrollLeft: scrollLeft > 6,
      canScrollRight: maxScroll > 6 && scrollLeft < maxScroll - 6,
    });
  }, []);

  const handleScrollRight = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  }, []);

  const handleScrollLeft = useCallback(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators, filteredDocs]);

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
    <div className="space-y-5">
      {/* 1. Header Bar (Clean & Simple) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Menunggu Verifikasi
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {pendingDocs.length} berkas
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Pantau posisi dokumen dan lanjutkan pemeriksaan sesuai wewenang Anda.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Card: Toolbar (Tabs + Search/Filter) & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Toolbar Header */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Antrean verifikasi</h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Menampilkan {filteredDocs.length} dari {pendingDocs.length} berkas</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <label className="relative min-w-0 flex-1 sm:w-72">
                <span className="sr-only">Cari nomor, judul, pembuat, atau departemen</span>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
                <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nomor, judul, pembuat" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </label>
              <label>
                <span className="sr-only">Filter departemen</span>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto">
                  <option value="ALL">Semua departemen</option>
                  {departments.map(d => <option key={d.id || d.code} value={d.code}>{d.code}</option>)}
                </select>
              </label>
              {(searchTerm || filterDept !== 'ALL') && (
                <button type="button" onClick={() => { setSearchTerm(''); setFilterDept('ALL'); }} className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer" title="Reset filter">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
                </button>
              )}
            </div>
          </div>

          <div role="group" aria-label="Filter tahap verifikasi" className="flex overflow-x-auto border-t border-slate-100 px-3 dark:border-slate-800">
            <button
              type="button"
              aria-pressed={activeTab === 'ALL'}
              onClick={() => setActiveTab('ALL')}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                activeTab === 'ALL'
                  ? 'border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>Semua Antrean</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {pendingDocs.length}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'REVIEW'}
              onClick={() => setActiveTab('REVIEW')}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-600 ${
                activeTab === 'REVIEW'
                  ? 'border-purple-600 text-purple-800 dark:text-purple-300'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>Tahap 1: Review Atasan</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {stage1Count}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'VERIFIKASI'}
              onClick={() => setActiveTab('VERIFIKASI')}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600 ${
                activeTab === 'VERIFIKASI'
                  ? 'border-amber-600 text-amber-800 dark:text-amber-300'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>Tahap 2: Verifikasi DCO</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {stage2Count}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === 'APPROVAL'}
              onClick={() => setActiveTab('APPROVAL')}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 ${
                activeTab === 'APPROVAL'
                  ? 'border-emerald-600 text-emerald-800 dark:text-emerald-300'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>Tahap 3: Pengesahan MR</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {stage3Count}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Accordion List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDocs.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 mx-auto">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                {pendingDocs.length === 0 ? 'Tidak ada antrean verifikasi' : 'Tidak ada dokumen pada tahap ini'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {pendingDocs.length === 0
                  ? 'Pengajuan baru akan muncul di antrean setelah dikirim.'
                  : 'Coba ubah kriteria pencarian atau departemen.'}
              </p>
              {(searchTerm || filterDept !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setFilterDept('ALL'); }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset filter
                </button>
              )}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isExpanded = expandedMobileDocIds.has(doc.id);
              const isStage1 = doc.status === 'REVIEW';
              const isStage2 = doc.status === 'VERIFIKASI';
              const isStage3 = doc.status === 'APPROVAL';
              const docTypeObj = (documentTypes || []).find(t => t.code === doc.type);
              const docLevel = docTypeObj?.level || 2;
              const isFastTrack = docLevel === 3 || docLevel === 4;

              const stageBadgeText = isStage1
                ? (docLevel === 1 ? 'Tahap 3: Telaah MR' : 'Tahap 1: Review Atasan')
                : isStage2
                ? (docLevel === 1 ? 'Tahap 2: Verifikasi DCO' : isFastTrack ? 'Tahap 2: Verifikasi (Fast)' : 'Tahap 2: Verifikasi DCO')
                : (docLevel === 1 ? 'Tahap 4: Pengesahan GM' : 'Tahap 3: Pengesahan MR');

              const stageBadgeColor = isStage1
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : isStage2
                ? (isFastTrack
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800')
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';

              return (
                <div
                  key={doc.id}
                  className={`transition-colors duration-150 ${
                    isExpanded ? 'bg-amber-50/25 dark:bg-amber-950/15' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Row Header (Clickable Accordion Trigger) */}
                  <div
                    onClick={() => toggleExpandMobileDoc(doc.id)}
                    className="p-3.5 flex items-center gap-3 cursor-pointer select-none active:bg-slate-100/60 dark:active:bg-slate-800/60"
                    role="button"
                    aria-expanded={isExpanded}
                  >
                    {/* Circular Indicator Button: Amber/Orange */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all duration-200 ${
                        isExpanded
                          ? 'bg-amber-500 text-white shadow-amber-500/30 scale-105'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Summary Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                          {doc.docNumber}
                        </span>
                        <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {doc.type || 'SOP'}
                        </span>
                        <span className="shrink-0 rounded border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                          {doc.department}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={doc.title}>
                        {doc.title}
                      </p>
                    </div>

                    {/* Stage Badge on right */}
                    <div className="shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageBadgeColor}`}>
                        {isStage1 ? 'Review' : isStage2 ? 'Verifikasi' : 'Pengesahan'}
                      </span>
                    </div>
                  </div>

                  {/* Accordion Content Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-xs border-t border-amber-100/70 dark:border-amber-950/40">
                      <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                        <div className="grid grid-cols-[105px_1fr] items-baseline gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Judul Lengkap:</span>
                          <span className="text-slate-900 dark:text-white font-semibold leading-snug break-words">
                            {doc.title}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Jenis Dokumen:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {doc.type || 'SOP'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Departemen:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {doc.department || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Pembuat:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {doc.creator || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Tgl. Dibuat:</span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            {formatPendingDate(doc.createdDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Tahap Saat Ini:</span>
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageBadgeColor}`}>
                              {stageBadgeText}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDocument(doc);
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-98 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>

                          {/* Stage 1 Actions */}
                          {isStage1 && canReviewContent && isAssignedReviewer(doc) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenReviewModal(doc);
                                }}
                                className="flex-1 min-h-[36px] px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98 cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{docLevel === 1 ? 'Telaah MR' : 'Review'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRevisionModal(doc, 'REVIEW');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Minta Revisi"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRejectModal(doc, 'REVIEW');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Tolak Berkas"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Stage 2 Actions */}
                          {isStage2 && canVerifyFormat && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenVerifyModal(doc);
                                }}
                                className={`flex-1 min-h-[36px] px-3 py-1.5 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98 cursor-pointer ${
                                  isFastTrack ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{isFastTrack ? 'Verifikasi & Rilis' : 'Verifikasi'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRevisionModal(doc, 'FORMAT');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Minta Revisi Format"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRejectModal(doc, 'FORMAT');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Tolak Format"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Stage 3 Actions */}
                          {isStage3 && canApproveDocument && isAssignedApprover(doc) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenApproveModal(doc);
                                }}
                                className="flex-1 min-h-[36px] px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{docLevel === 1 ? 'Sahkan GM' : 'Sahkan'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRevisionModal(doc, 'APPROVAL');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Minta Revisi"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRejectModal(doc, 'APPROVAL');
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center justify-center transition active:scale-98 cursor-pointer"
                                title="Tolak Berkas"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Wait state */}
                          {((isStage1 && (!canReviewContent || !isAssignedReviewer(doc))) ||
                            (isStage2 && !canVerifyFormat) ||
                            (isStage3 && (!canApproveDocument || !isAssignedApprover(doc)))) && (
                            <span className="flex-1 text-center text-[11px] text-slate-500 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                              {isStage1 ? (docLevel === 1 ? 'Menunggu Telaah MR' : 'Menunggu Atasan') : (isStage2 ? 'Menunggu DCO' : (docLevel === 1 ? 'Menunggu GM' : 'Menunggu MR'))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clean Table (hidden md:block) */}
        <div className="hidden md:block relative">
          {/* Indikator Gradien Kiri (Muncul saat user scroll ke kanan) */}
          <div
            className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/10 dark:from-black/40 to-transparent z-15 transition-opacity duration-200 ${
              scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Tombol Panah Kiri di Header Tabel (Muncul saat user geser ke kanan) */}
          {scrollState.canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              className="absolute left-1.5 top-2.5 w-7 h-7 rounded-full bg-slate-800/90 hover:bg-slate-900 text-white shadow-md border-2 border-white dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer z-30 hover:scale-110 active:scale-95 group"
              title="Geser kembali ke kolom awal (Dokumen)"
              aria-label="Geser kembali ke kolom awal"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}

          <div
            ref={tableContainerRef}
            className="overflow-x-auto min-h-[380px] table-scrollbar"
          >
            <table className="w-full min-w-[1100px] table-fixed text-left border-collapse text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[9%]" />
                <col className="w-[14%]" />
                <col className="w-[22%]" />
                <col className="w-[27%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold">
                  <th className="py-3 px-4">Dokumen</th>
                  <th className="py-3 px-3">Dept.</th>
                  <th className="py-3 px-3">Pembuat</th>
                  <th className="py-3 px-3">Tahap</th>
                  <th
                    className={`py-3 px-3 text-right sticky right-0 bg-slate-50 dark:bg-slate-800 z-20 border-l transition-shadow duration-200 ${
                      scrollState.canScrollRight
                        ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/90 dark:border-slate-700/90'
                        : 'shadow-none border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    {/* Ikon Tombol Panah Pemisah: Terletak persis di antara kolom yang terpotong dengan kolom Tindakan */}
                    {scrollState.canScrollRight && (
                      <button
                        type="button"
                        onClick={handleScrollRight}
                        className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md border-2 border-white dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer z-30 hover:scale-110 active:scale-95 group animate-pulse"
                        title="Ada kolom tersembunyi. Klik untuk geser tabel ke kanan"
                        aria-label="Geser melihat kolom tersembunyi"
                      >
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                    <span>Tindakan</span>
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <FileText className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {pendingDocs.length === 0 ? 'Tidak ada dokumen yang menunggu verifikasi' : 'Tidak ada dokumen pada tahap ini'}
                      </p>
                      <p className="max-w-md text-xs text-slate-600 dark:text-slate-300">
                        {pendingDocs.length === 0
                          ? 'Pengajuan baru akan muncul di antrean setelah dikirim untuk diverifikasi.'
                          : searchTerm || filterDept !== 'ALL'
                          ? 'Ubah kata kunci atau departemen, atau reset filter untuk melihat dokumen lain.'
                          : 'Semua dokumen pada tahap ini sudah diteruskan ke proses berikutnya.'}
                      </p>
                      {(searchTerm || filterDept !== 'ALL') && (
                        <button type="button" onClick={() => { setSearchTerm(''); setFilterDept('ALL'); }} className="mt-1 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer">Reset filter</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isStage1 = doc.status === 'REVIEW';
                  const isStage2 = doc.status === 'VERIFIKASI';
                  const isStage3 = doc.status === 'APPROVAL';
                  const docTypeObj = (documentTypes || []).find(t => t.code === doc.type);
                  const docLevel = docTypeObj?.level || 2;
                  const isFastTrack = docLevel === 3 || docLevel === 4;

                  return (
                    <tr key={doc.id} className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/70">
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <button type="button" onClick={() => setViewingDocument(doc)} className="truncate text-left font-mono text-xs font-bold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 cursor-pointer" title="Buka pratinjau dokumen">{doc.docNumber}</button>
                            <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{doc.type || 'SOP'}</span>
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={doc.title}>{doc.title}</p>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{doc.department}</span>
                      </td>

                      <td className="py-4 px-3">
                        <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200" title={doc.creator}>{doc.creator}</div>
                        <div className="mt-1 truncate text-[10px] text-slate-600 dark:text-slate-400" title={doc.createdDate}>{doc.createdDate}</div>
                      </td>

                      <td className="py-4 px-3">
                        {isStage1 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {docLevel === 1 ? 'Tahap 3: Telaah Mutu (MR)' : 'Tahap 1: Review Atasan'}
                          </span>
                        )}
                        {isStage2 && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isFastTrack
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}>
                            {docLevel === 1
                              ? 'Tahap 2: Verifikasi Format DCO'
                              : isFastTrack
                              ? 'Tahap 2: Verifikasi & Rilis (Fast-Track)'
                              : 'Tahap 2: Verifikasi DCO'}
                          </span>
                        )}
                        {isStage3 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {docLevel === 1 ? 'Tahap 4: Pengesahan GM / Direksi' : 'Tahap 3: Pengesahan MR'}
                          </span>
                        )}
                      </td>

                      {/* 7. Tindakan / Aksi */}
                      <td
                        className={`py-4 px-3 sticky right-0 bg-white group-hover:bg-blue-50/40 dark:bg-slate-900 dark:group-hover:bg-slate-800/90 transition-colors border-l z-10 ${
                          scrollState.canScrollRight
                            ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/80 dark:border-slate-800'
                            : 'shadow-none border-slate-100 dark:border-slate-850'
                        }`}
                      >
                        <div className="flex min-w-max flex-nowrap items-center justify-end gap-1.5">
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
                                <span>{docLevel === 1 ? 'Telaah MR' : 'Review'}</span>
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
                                className={`px-2.5 py-1 text-xs font-bold text-white rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer ${
                                  isFastTrack ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{isFastTrack ? 'Verifikasi & Rilis' : 'Verifikasi'}</span>
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
                                className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{docLevel === 1 ? 'Sahkan GM' : 'Sahkan'}</span>
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
                              {isStage1 ? (docLevel === 1 ? 'Menunggu Telaah MR' : 'Menunggu Atasan') : (isStage2 ? 'Menunggu DCO' : (docLevel === 1 ? 'Menunggu GM' : 'Menunggu MR'))}
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
