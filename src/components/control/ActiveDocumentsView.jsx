import React, { useState, useMemo, useEffect } from 'react';
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
  Building2,
  Filter,
  RotateCcw,
  X,
  FileText,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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
    departments = [],
    documentTypes = [],
    currentUser,
    canRequestRevision,
    canReviewContent,
    canVerifyFormat,
    canApproveDocument,
    isViewer,
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

  const userDept = currentUser?.department || currentUser?.dept || '';

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'MY_DEPT' | 'DUE' | 'NORMAL'
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');

  // Modal State untuk Pembatalan (Admin)
  const [docToCancel, setDocToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Modal State untuk Peninjauan Berkala (Langkah 8 & 9)
  const [docToReview, setDocToReview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const reviewIntervalMonths = systemSettings.periodicReviewMonths || 12;
  const activeDocs = useMemo(() => (documents || []).filter(d => d.status === 'AKTIF'), [documents]);

  // Hitung dokumen yang mendekati / lewat jatuh tempo review berkala
  const reviewDueDocs = useMemo(() => activeDocs.filter(d => {
    const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
    return info.status === 'OVERDUE' || info.status === 'DUE_SOON';
  }), [activeDocs, reviewIntervalMonths]);

  // Hitung dokumen normal / terkendali
  const normalDocs = useMemo(() => activeDocs.filter(d => {
    const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
    return info.status === 'NORMAL';
  }), [activeDocs, reviewIntervalMonths]);

  // Dokumen departemen user login
  const myDeptDocs = useMemo(() => {
    if (!userDept) return [];
    return activeDocs.filter(d => (d.department || '').toUpperCase() === userDept.toUpperCase());
  }, [activeDocs, userDept]);

  // Hitung distribusi jumlah dokumen per departemen
  const deptCountMap = useMemo(() => {
    const counts = {};
    activeDocs.forEach(d => {
      const code = (d.department || 'LAINNYA').toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [activeDocs]);

  // Hitung distribusi jumlah dokumen per tipe
  const typeCountMap = useMemo(() => {
    const counts = {};
    activeDocs.forEach(d => {
      const code = (d.type || 'LAINNYA').toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [activeDocs]);

  // Daftar unik departemen yang ada di database atau dokumen aktif
  const availableDepartments = useMemo(() => {
    const list = [...departments];
    Object.keys(deptCountMap).forEach(code => {
      if (!list.some(d => d.code.toUpperCase() === code)) {
        list.push({ id: `dept-extra-${code}`, code, name: code });
      }
    });
    return list;
  }, [departments, deptCountMap]);

  // Daftar unik tipe dokumen yang ada di database atau dokumen aktif
  const availableDocTypes = useMemo(() => {
    const list = [...documentTypes];
    Object.keys(typeCountMap).forEach(code => {
      if (!list.some(t => t.code.toUpperCase() === code)) {
        list.push({ id: `type-extra-${code}`, code, name: code });
      }
    });
    return list;
  }, [documentTypes, typeCountMap]);

  // Logika Filter & Sorting Dokumen
  const filtered = useMemo(() => {
    let result = activeDocs.filter(d => {
      // 1. Search term match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          (d.docNumber || '').toLowerCase().includes(q) ||
          (d.title || '').toLowerCase().includes(q) ||
          (d.department || '').toLowerCase().includes(q) ||
          (d.creator || '').toLowerCase().includes(q) ||
          (d.type || '').toLowerCase().includes(q) ||
          (d.revision || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Filter mode (tabs)
      if (filterMode === 'MY_DEPT') {
        if ((d.department || '').toUpperCase() !== userDept.toUpperCase()) return false;
      } else if (filterMode === 'DUE') {
        const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
        if (info.status !== 'OVERDUE' && info.status !== 'DUE_SOON') return false;
      } else if (filterMode === 'NORMAL') {
        const info = getPeriodicReviewInfo(d, reviewIntervalMonths);
        if (info.status !== 'NORMAL') return false;
      }

      // 3. Filter Departemen dropdown
      if (filterDept !== 'ALL') {
        if ((d.department || '').toUpperCase() !== filterDept.toUpperCase()) return false;
      }

      // 4. Filter Jenis Dokumen dropdown
      if (filterType !== 'ALL') {
        if ((d.type || '').toUpperCase() !== filterType.toUpperCase()) return false;
      }

      return true;
    });

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        const dateA = new Date(a.effectiveDate || a.approvedDate || a.createdDate || 0);
        const dateB = new Date(b.effectiveDate || b.approvedDate || b.createdDate || 0);
        return dateB - dateA;
      }
      if (sortBy === 'DATE_ASC') {
        const dateA = new Date(a.effectiveDate || a.approvedDate || a.createdDate || 0);
        const dateB = new Date(b.effectiveDate || b.approvedDate || b.createdDate || 0);
        return dateA - dateB;
      }
      if (sortBy === 'DOC_ASC') {
        return (a.docNumber || '').localeCompare(b.docNumber || '');
      }
      if (sortBy === 'DOC_DESC') {
        return (b.docNumber || '').localeCompare(a.docNumber || '');
      }
      if (sortBy === 'TITLE_ASC') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'REV_DESC') {
        const revA = parseInt(a.revision, 10) || 0;
        const revB = parseInt(b.revision, 10) || 0;
        return revB - revA;
      }
      return 0;
    });

    return result;
  }, [activeDocs, searchTerm, filterMode, filterDept, filterType, sortBy, userDept, reviewIntervalMonths]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 saat filter atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode, filterDept, filterType, sortBy, pageSize]);

  // Pagination Calculation
  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDocs = useMemo(() => {
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, startIndex, pageSize]);

  // Generate Page Numbers
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  // Cek apakah ada filter yang sedang aktif
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    filterMode !== 'ALL' ||
    filterDept !== 'ALL' ||
    filterType !== 'ALL' ||
    sortBy !== 'DATE_DESC';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMode('ALL');
    setFilterDept('ALL');
    setFilterType('ALL');
    setSortBy('DATE_DESC');
  };

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

      {/* Filter Tabs & Multi Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua Dokumen Aktif ({activeDocs.length})
            </button>

            {/* Quick Tab: Dokumen Departemen Saya (Sangat berguna untuk Karyawan/Operator) */}
            {userDept && myDeptDocs.length > 0 && (
              <button
                onClick={() => setFilterMode('MY_DEPT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  filterMode === 'MY_DEPT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900'
                }`}
                title={`Hanya tampilkan dokumen departemen ${userDept}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Departemen Saya: {userDept} ({myDeptDocs.length})
              </button>
            )}

            <button
              onClick={() => setFilterMode('DUE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterMode === 'DUE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Perlu Review Berkala ({reviewDueDocs.length})
            </button>

            <button
              onClick={() => setFilterMode('NORMAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterMode === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Terkendali Normal ({normalDocs.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              Interval Peninjauan ISO: <strong className="text-slate-700 dark:text-slate-300">{reviewIntervalMonths} Bulan</strong>
            </span>
          </div>
        </div>

        {/* Multi Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Search Box (col-span-4) */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              placeholder="Cari no. dokumen, judul, pembuat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Filter Departemen (col-span-3) */}
          <div className="lg:col-span-3">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Departemen ({activeDocs.length})</option>
              {availableDepartments.map(d => {
                const count = deptCountMap[d.code.toUpperCase()] || 0;
                return (
                  <option key={d.id || d.code} value={d.code}>
                    {d.code} - {d.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Filter Jenis Dokumen (col-span-3) */}
          <div className="lg:col-span-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Jenis Dokumen ({activeDocs.length})</option>
              {availableDocTypes.map(t => {
                const count = typeCountMap[t.code.toUpperCase()] || 0;
                return (
                  <option key={t.id || t.code} value={t.code}>
                    {t.code} - {t.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 4. Sort By & Reset (col-span-2) */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Urutkan dokumen"
            >
              <option value="DATE_DESC">Tgl Berlaku (Terbaru)</option>
              <option value="DATE_ASC">Tgl Berlaku (Terlama)</option>
              <option value="DOC_ASC">No. Dokumen (A - Z)</option>
              <option value="DOC_DESC">No. Dokumen (Z - A)</option>
              <option value="TITLE_ASC">Judul Dokumen (A - Z)</option>
              <option value="REV_DESC">Revisi Tertinggi</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg transition flex items-center gap-1 flex-shrink-0"
                title="Reset semua filter ke standar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Menampilkan <strong className="text-blue-600 dark:text-blue-400 font-bold">{filtered.length}</strong> dari {activeDocs.length} dokumen aktif
            </span>

            {/* Filter Chips */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px]">
                Cari: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-blue-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterDept !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 text-[11px]">
                Dept: {filterDept}
                <button onClick={() => setFilterDept('ALL')} className="hover:text-purple-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 text-[11px]">
                Jenis: {filterType}
                <button onClick={() => setFilterType('ALL')} className="hover:text-teal-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterMode === 'MY_DEPT' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-[11px]">
                Departemen Saya
                <button onClick={() => setFilterMode('ALL')} className="hover:text-indigo-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterMode === 'DUE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px]">
                Perlu Review Berkala
                <button onClick={() => setFilterMode('ALL')} className="hover:text-amber-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filterMode === 'NORMAL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 text-[11px]">
                Terkendali Normal
                <button onClick={() => setFilterMode('ALL')} className="hover:text-emerald-900 dark:hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition underline underline-offset-2 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Bersihkan Semua Filter
            </button>
          )}
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
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3 text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Filter className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          Tidak ada dokumen aktif yang sesuai filter
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Coba sesuaikan kata kunci pencarian atau ubah kriteria filter departemen dan jenis dokumen.
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const reviewInfo = getPeriodicReviewInfo(doc, reviewIntervalMonths);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400">{startIndex + idx + 1}</td>
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
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
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

                          {/* Tombol Tinjau / Review Berkala (Langkah 8 & 9 ISO 9001) - Hanya untuk Reviewer/DCO/MR/Admin */}
                          {(canReviewContent || canVerifyFormat || canApproveDocument || isAdmin) && (
                            <button
                              onClick={() => handleOpenReviewModal(doc)}
                              className="px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 rounded-md transition flex items-center gap-1"
                              title="Monitoring & Peninjauan Berkala (Klausul 7.5)"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Tinjau
                            </button>
                          )}

                          {/* Tombol Ajukan Revisi - Terbuka untuk Originator / Staff / Reviewer / DCO / Admin, Tersembunyi untuk Viewer */}
                          {canRequestRevision && (
                            <button
                              onClick={() => handleRevisionClick(doc)}
                              className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 rounded-md transition flex items-center gap-1"
                              title="Ajukan Revisi Dokumen"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Revisi
                            </button>
                          )}

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

        {/* Footer Pagination Lengkap */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Kiri: Page Size & Counter */}
          <div className="flex items-center gap-3 flex-wrap text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>dokumen / hal</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <span className="font-mono text-[11.5px]">
              Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</strong> -{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, totalEntries)}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> dokumen aktif
            </span>
          </div>

          {/* Kanan: Navigasi Halaman */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((page, i) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-act-${i}`} className="px-1.5 text-slate-400 font-mono">
                        ...
                      </span>
                    );
                  }
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={`page-act-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-mono rounded transition cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
