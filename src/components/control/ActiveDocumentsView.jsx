import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  ChevronsRight,
  ScanBarcode,
  ChevronDown,
  ArrowLeftRight
} from 'lucide-react';
import Badge, { CompanyBadge, FileFormatBadge } from '../common/Badge';
import Modal from '../common/Modal';
import DocumentLabelModal from '../common/DocumentLabelModal';
import BarcodeScannerModal from '../common/BarcodeScannerModal';
import { useDocumentControl } from '../../context/DocumentControlContext';

const formatActiveDate = (value) => {
  if (!value) return 'Belum ditetapkan';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
};

/**
 * Utilitas untuk menghitung status jatuh tempo peninjauan berkala ISO 9001 (Langkah 8)
 */
function getPeriodicReviewInfo(doc, reviewIntervalMonths = 12, documentTypes = [], systemSettings = {}) {
  const baseDateStr = doc.lastReviewedDate || doc.effectiveDate || doc.approvedDate || doc.createdDate;
  if (!baseDateStr) {
    return { status: 'NORMAL', label: 'Terkendali', dueDateStr: '-', daysRemaining: 999, badgeColor: 'bg-slate-100 text-slate-700' };
  }

  // ISO 9001 Clause 7.5: Level 1 & 2 = 12 bulan, Level 3 & 4 = 24 bulan
  const typeCode = (doc.type || '').toUpperCase();
  const typeObj = (documentTypes || []).find(t => (t.code || '').toUpperCase() === typeCode);
  const docLevel = typeObj?.level || (
    typeCode.includes('POL') ? 1 :
    typeCode.includes('SOP') ? 2 :
    (typeCode.includes('IK') || typeCode.includes('WI')) ? 3 :
    (typeCode.includes('FORM') || typeCode.includes('MEM')) ? 4 : 2
  );
  const effectiveInterval = docLevel >= 3
    ? (systemSettings?.periodicReviewMonthsLevel34 || 24)
    : (systemSettings?.periodicReviewMonths || reviewIntervalMonths || 12);

  const baseDate = new Date(baseDateStr);
  const dueDate = new Date(baseDate);
  dueDate.setMonth(dueDate.getMonth() + effectiveInterval);

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
    companies = [],
    selectedCompanyFilter,
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

  // Responsive detection untuk tampilan mobile (anti-potong & layout tombol rapi)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resolusi nama entitas perusahaan sesuai filter aktif (Holding Group jika ALL)
  const activeCompanyScopeName = useMemo(() => {
    if (!selectedCompanyFilter || selectedCompanyFilter === 'ALL') {
      return 'Holding Group (Multi-PT)';
    }
    const matched = (companies || []).find(c => c.code === selectedCompanyFilter);
    if (matched) return matched.name;
    if (selectedCompanyFilter === 'DJI') return 'PT Dentelle Jaya Infinitex';
    if (selectedCompanyFilter === 'IMK') return 'PT IMK';
    if (selectedCompanyFilter === 'UMI') return 'PT Ultimo Moda Indotex';
    return `PT ${selectedCompanyFilter}`;
  }, [selectedCompanyFilter, companies]);

  // Modal State untuk Pembatalan (Admin)
  const [docToCancel, setDocToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedLabelDoc, setSelectedLabelDoc] = useState(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Modal State untuk Peninjauan Berkala (Langkah 8 & 9)
  const [docToReview, setDocToReview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Dropdown Tindakan State & Outside Click Handler
  const [openActionDocId, setOpenActionDocId] = useState(null);
  const actionDropdownRef = React.useRef(null);

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
        setOpenActionDocId(null);
      }
    }
    if (openActionDocId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionDocId]);

  const reviewIntervalMonths = systemSettings.periodicReviewMonths || 12;
  const activeDocs = useMemo(() => (documents || []).filter(d => d.status === 'AKTIF'), [documents]);

  // Hitung dokumen yang mendekati / lewat jatuh tempo review berkala
  const reviewDueDocs = useMemo(() => activeDocs.filter(d => {
    const info = getPeriodicReviewInfo(d, reviewIntervalMonths, documentTypes, systemSettings);
    return info.status === 'OVERDUE' || info.status === 'DUE_SOON';
  }), [activeDocs, reviewIntervalMonths, documentTypes, systemSettings]);

  // Hitung dokumen normal / terkendali
  const normalDocs = useMemo(() => activeDocs.filter(d => {
    const info = getPeriodicReviewInfo(d, reviewIntervalMonths, documentTypes, systemSettings);
    return info.status === 'NORMAL';
  }), [activeDocs, reviewIntervalMonths, documentTypes, systemSettings]);

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
      // 0. Filter Perusahaan (Multi-Company)
      if (selectedCompanyFilter !== 'ALL') {
        const docComp = (d.companyCode || d.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        if (docComp !== selectedCompanyFilter) return false;
      }

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
        const info = getPeriodicReviewInfo(d, reviewIntervalMonths, documentTypes, systemSettings);
        if (info.status !== 'OVERDUE' && info.status !== 'DUE_SOON') return false;
      } else if (filterMode === 'NORMAL') {
        const info = getPeriodicReviewInfo(d, reviewIntervalMonths, documentTypes, systemSettings);
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
  }, [activeDocs, searchTerm, filterMode, filterDept, filterType, sortBy, userDept, reviewIntervalMonths, selectedCompanyFilter]);

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
  }, [updateScrollIndicators, paginatedDocs]);

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
            Daftar seluruh dokumen resmi yang sedang berlaku operasional di lingkungan {activeCompanyScopeName}.
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:flex-wrap sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 text-center ${
                !userDept || myDeptDocs.length === 0 ? 'col-span-2 sm:col-span-1' : ''
              } ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isMobile ? `Semua (${activeDocs.length})` : `Semua Dokumen Aktif (${activeDocs.length})`}
            </button>

            {/* Quick Tab: Dokumen Departemen Saya (Sangat berguna untuk Karyawan/Operator) */}
            {userDept && myDeptDocs.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('MY_DEPT')}
                className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 text-center truncate ${
                  filterMode === 'MY_DEPT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900'
                }`}
                title={`Hanya tampilkan dokumen departemen ${userDept}`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isMobile ? `Dept Saya (${myDeptDocs.length})` : `Departemen Saya: ${userDept} (${myDeptDocs.length})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterMode('DUE')}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 text-center ${
                filterMode === 'DUE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{isMobile ? `Review (${reviewDueDocs.length})` : `Perlu Review Berkala (${reviewDueDocs.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('NORMAL')}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 text-center ${
                filterMode === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isMobile ? `Terkendali (${normalDocs.length})` : `Terkendali Normal (${normalDocs.length})`}</span>
            </button>
          </div>
        </div>

        {/* Multi Filter Controls Grid */}
        <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-12 sm:gap-3 items-center">
          {/* 1. Search Box with Scan QR Button (col-span-4) */}
          <div className="lg:col-span-4 flex items-center gap-1.5">
            <div className="relative flex-1">
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
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shrink-0"
              title="Pindai / Scan Barcode Dokumen"
            >
              <ScanBarcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* 3 Dropdown Filter di Mobile: 1 Baris Sejajar (3 Kolom) dengan teks ringkas anti-terpotong */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 sm:contents">
            {/* 2. Filter Departemen (col-span-3) */}
            <div className="lg:col-span-3">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className={`w-full text-[11px] sm:text-xs border rounded-lg px-2 sm:px-3 py-2 font-medium truncate transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  filterDept !== 'ALL'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Filter Departemen"
              >
                <option value="ALL">{isMobile ? 'Dept' : `Semua Dept. (${activeDocs.length})`}</option>
                {availableDepartments.map(d => {
                  const count = deptCountMap[d.code.toUpperCase()] || 0;
                  return (
                    <option key={d.id || d.code} value={d.code}>
                      {isMobile ? d.code : `${d.code} - ${d.name} (${count})`}
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
                className={`w-full text-[11px] sm:text-xs border rounded-lg px-2 sm:px-3 py-2 font-medium truncate transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  filterType !== 'ALL'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Filter Jenis Dokumen"
              >
                <option value="ALL">{isMobile ? 'Jenis' : `Semua Jenis (${activeDocs.length})`}</option>
                {availableDocTypes.map(t => {
                  const count = typeCountMap[t.code.toUpperCase()] || 0;
                  return (
                    <option key={t.id || t.code} value={t.code}>
                      {isMobile ? t.code : `${t.code} - ${t.name} (${count})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. Sort By & Reset (col-span-2) */}
            <div className="lg:col-span-2 flex items-center gap-1.5 min-w-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full text-[11px] sm:text-xs border rounded-lg px-2 sm:px-2.5 py-2 font-medium truncate transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  sortBy !== 'DATE_DESC'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Urutkan dokumen"
              >
                <option value="DATE_DESC">{isMobile ? 'Terbaru' : 'Tgl Terbaru'}</option>
                <option value="DATE_ASC">{isMobile ? 'Terlama' : 'Tgl Terlama'}</option>
                <option value="DOC_ASC">{isMobile ? 'No. (A-Z)' : 'No. Doc (A-Z)'}</option>
                <option value="DOC_DESC">{isMobile ? 'No. (Z-A)' : 'No. Doc (Z-A)'}</option>
                <option value="TITLE_ASC">{isMobile ? 'Judul (A-Z)' : 'Judul (A-Z)'}</option>
                <option value="REV_DESC">{isMobile ? 'Revisi (Max)' : 'Revisi Tertinggi'}</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="hidden sm:flex px-2 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 rounded-lg transition items-center gap-1 flex-shrink-0 cursor-pointer"
                  title="Reset semua filter ke standar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Reset</span>
                </button>
              )}
            </div>
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

      {/* Content: Mobile Card List + Desktop Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Mobile Accordion List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Filter className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Tidak ada dokumen aktif yang sesuai filter</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedDocs.map((doc) => {
              const isExpanded = expandedMobileDocIds.has(doc.id);
              const reviewInfo = getPeriodicReviewInfo(doc, reviewIntervalMonths, documentTypes, systemSettings);

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
                    {/* Circular Indicator Button: Amber/Orange like reference image */}
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

                    {/* Summary Info (Nomor Dokumen & Judul) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                        <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                          {doc.docNumber}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                          Rev {doc.revision}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={doc.title}>
                        {doc.title}
                      </p>
                    </div>

                    {/* Format Badge (Right side indicator) */}
                    <div className="shrink-0 flex items-center">
                      <FileFormatBadge doc={doc} />
                    </div>
                  </div>

                  {/* Accordion Content Details (Muncul saat diklik persis sesuai referensi) */}
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
                            {doc.type || '-'}
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
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Tgl. Efektif:</span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                            {formatActiveDate(doc.effectiveDate || doc.createdDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Status Review:</span>
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${reviewInfo.badgeColor}`}
                              title={`Jatuh Tempo: ${reviewInfo.dueDateStr}`}
                            >
                              {reviewInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons (Tindakan) */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDocument(doc);
                            }}
                            className="flex-1 min-h-[36px] py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Pratinjau</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLabelDoc(doc);
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-98 cursor-pointer"
                            title="Cetak Label Arsip"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Label</span>
                          </button>

                          {(canReviewContent || canVerifyFormat || canApproveDocument || isAdmin) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReviewModal(doc);
                              }}
                              className="min-h-[36px] px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-teal-200 dark:border-teal-800 transition active:scale-98 cursor-pointer"
                              title="Tinjau Berkala"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          )}

                          {canRequestRevision && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevisionClick(doc);
                              }}
                              className="min-h-[36px] px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800 transition active:scale-98 cursor-pointer"
                              title="Ajukan Revisi"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
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

        {/* Desktop Table (hidden md:block) */}
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
            <table className="w-full min-w-[1280px] table-fixed text-left border-collapse text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[6%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <th className="py-3 px-4">Dokumen</th>
                  <th className="py-3 px-3">Jenis</th>
                  <th className="py-3 px-3 text-center">Format</th>
                  <th className="py-3 px-3">Dept.</th>
                  <th className="py-3 px-3">Pembuat</th>
                  <th className="py-3 px-3 text-center">Rev.</th>
                  <th className="py-3 px-3">Tgl. berlaku</th>
                  <th className="py-3 px-3">Tinjauan berkala</th>
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
                        title="Ada kolom tersembunyi (Rev, Tgl. Berlaku, Tinjauan). Klik untuk geser tabel ke kanan"
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
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
                  const reviewInfo = getPeriodicReviewInfo(doc, reviewIntervalMonths, documentTypes, systemSettings);
                  const isActionOpen = openActionDocId === doc.id;
                  return (
                    <tr key={doc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                          <div className="min-w-0"><div className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white" title={doc.docNumber}>{doc.docNumber}</div><div className="mt-1 truncate text-xs text-slate-700 dark:text-slate-300" title={doc.title}>{doc.title}</div></div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{doc.type}</td>
                      <td className="py-4 px-3 text-center">
                        <FileFormatBadge doc={doc} />
                      </td>
                      <td className="py-4 px-3 text-xs text-slate-700 dark:text-slate-300">{doc.department}</td>
                      <td className="py-4 px-3 text-xs text-slate-700 dark:text-slate-300"><span className="block truncate" title={doc.creator}>{doc.creator}</span></td>
                      <td className="py-4 px-3 text-center font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {doc.revision}
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                        {formatActiveDate(doc.effectiveDate || doc.createdDate)}
                      </td>
                      {/* Kolom Review Status (Langkah 8) */}
                      <td className="py-4 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${reviewInfo.badgeColor}`} title={`Jatuh Tempo: ${reviewInfo.dueDateStr}`}>
                          {reviewInfo.label}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-3 text-right sticky right-0 bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800 transition-colors border-l ${
                          isActionOpen ? 'z-30' : 'z-10'
                        } ${
                          scrollState.canScrollRight
                            ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/80 dark:border-slate-800'
                            : 'shadow-none border-slate-100 dark:border-slate-850'
                        }`}
                      >
                        <div
                          className="relative inline-block text-left"
                          ref={isActionOpen ? actionDropdownRef : null}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionDocId(openActionDocId === doc.id ? null : doc.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition shadow-2xs cursor-pointer ${
                              openActionDocId === doc.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-750'
                            }`}
                            title="Pilih Tindakan Dokumen"
                          >
                            <span>Tindakan</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                openActionDocId === doc.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Action Dropdown Menu */}
                          {openActionDocId === doc.id && (
                            <div
                              className={`absolute right-0 ${
                                idx >= paginatedDocs.length - 2 && paginatedDocs.length > 2
                                  ? 'bottom-full mb-1.5'
                                  : 'top-full mt-1.5'
                              } w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 space-y-1`}
                            >
                              {/* 1. Pratinjau Dokumen */}
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDocument(doc);
                                  setOpenActionDocId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/80 rounded-lg transition text-left cursor-pointer"
                                title="Buka Dokumen Terkendali & Validasi QR"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                <span>Pratinjau</span>
                              </button>

                              {/* 2. Cetak Stiker Label Arsip */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLabelDoc(doc);
                                  setOpenActionDocId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/90 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 rounded-lg transition text-left cursor-pointer"
                                title="Cetak Stiker Label Arsip (Map / Ordner)"
                              >
                                <Tag className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                                <span>Label Arsip</span>
                              </button>

                              {/* 3. Tinjau / Review Berkala */}
                              {(canReviewContent || canVerifyFormat || canApproveDocument || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenReviewModal(doc);
                                    setOpenActionDocId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50/70 hover:bg-teal-100/90 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:bg-teal-950/80 rounded-lg transition text-left cursor-pointer"
                                  title="Monitoring & Peninjauan Berkala"
                                >
                                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span>Tinjau Berkala</span>
                                </button>
                              )}

                              {/* 4. Ajukan Revisi */}
                              {canRequestRevision && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleRevisionClick(doc);
                                    setOpenActionDocId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50/70 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/80 rounded-lg transition text-left cursor-pointer"
                                  title="Ajukan Revisi Dokumen"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                  <span>Ajukan Revisi</span>
                                </button>
                              )}

                              {/* 5. Batalkan Dokumen (Khusus Admin) */}
                              {isAdmin && (
                                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDocToCancel(doc);
                                      setCancelReason('');
                                      setOpenActionDocId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/80 rounded-lg transition text-left cursor-pointer"
                                    title="Batalkan Dokumen (Ubah Menjadi Obsolete)"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <span>Batalkan Dokumen</span>
                                  </button>
                                </div>
                              )}
                            </div>
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

            {scrollState.canScrollRight && (
              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/80 font-semibold shadow-2xs">
                <ArrowLeftRight className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Geser ke samping untuk kolom lengkap</span>
              </span>
            )}
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

      {/* Modal Cetak Label Stiker Arsip Dokumen */}
      <DocumentLabelModal
        isOpen={Boolean(selectedLabelDoc)}
        onClose={() => setSelectedLabelDoc(null)}
        doc={selectedLabelDoc}
        systemSettings={systemSettings}
      />

      {/* Modal Scanner Barcode / QR Dokumen */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </div>
  );
}
