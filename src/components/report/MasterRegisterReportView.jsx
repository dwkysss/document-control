import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Eye,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Building2,
  Calendar
} from 'lucide-react';
import Badge, { CompanyBadge, FileFormatBadge } from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { exportToExcel, exportMasterRegisterPDF } from '../../utils/exportUtils';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
};

export default function MasterRegisterReportView() {
  const {
    documents = [],
    departments = [],
    documentTypes = [],
    companies = [],
    selectedCompanyFilter,
    systemSettings = {},
    setViewingDocument,
    showToast
  } = useDocumentControl();

  // Status Filter: default 'AKTIF' sesuai kaidah ISO 9001
  const [statusFilter, setStatusFilter] = useState('AKTIF');
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterDept, searchTerm, pageSize, selectedCompanyFilter]);

  // Resolusi nama entitas perusahaan sesuai filter aktif
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

  // Filter dokumen
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // 0. Filter Scope Perusahaan
      if (selectedCompanyFilter && selectedCompanyFilter !== 'ALL') {
        const docCompany = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        if (docCompany !== selectedCompanyFilter.toUpperCase()) {
          return false;
        }
      }

      // 1. Filter Status (Kaidah ISO: Default Aktif saja)
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }

      // 2. Filter Departemen
      if (filterDept !== 'ALL' && doc.department !== filterDept) {
        return false;
      }

      // 3. Search (Nomor atau Judul)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const docNum = (doc.docNumber || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        if (!docNum.includes(q) && !title.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [documents, statusFilter, filterDept, searchTerm, selectedCompanyFilter]);

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

  const isFiltered = statusFilter !== 'AKTIF' || filterDept !== 'ALL' || searchTerm !== '';

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar Bersih & Simpel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            Daftar Induk Dokumen Terkendali
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
            Daftar resmi dokumen ISO 9001:2015 — <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeCompanyScopeName}</strong> ({totalEntries} dokumen)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
          <button
            onClick={() => {
              if (filtered.length === 0) {
                showToast('Tidak ada data dokumen untuk diunduh!', 'warning');
                return;
              }
              exportToExcel(filtered, 'Daftar_Induk_Dokumen_Terkendali');
              showToast('Laporan Excel berhasil diunduh!', 'success');
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={() => {
              if (filtered.length === 0) {
                showToast('Tidak ada data dokumen untuk dicetak!', 'warning');
                return;
              }
              exportMasterRegisterPDF(filtered, systemSettings);
              showToast('Laporan PDF audit ISO berhasil dibuat!', 'success');
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Cetak PDF Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar Ringkas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-2.5">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nomor dokumen atau judul..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2 Filter Dropdowns: Pada mobile 1 baris (2 kolom berdampingan) */}
          <div className="grid grid-cols-2 gap-1.5 w-full sm:flex sm:w-auto sm:gap-2">
            {/* Filter Status (Default: Hanya Aktif) */}
            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full sm:w-auto py-2 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold border transition cursor-pointer truncate ${
                  statusFilter !== 'AKTIF'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
                title="Filter Status"
              >
                <option value="AKTIF">{isMobile ? 'Aktif (ISO)' : 'Hanya Dokumen Aktif (Standar ISO)'}</option>
                <option value="OBSOLETE">{isMobile ? 'Obsolete' : 'Arsip Obsolete (Kadaluarsa)'}</option>
                <option value="ALL">{isMobile ? 'Semua Status' : 'Semua Status (Audit Trail)'}</option>
              </select>
            </div>

            {/* Filter Departemen */}
            <div className="w-full sm:w-auto">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className={`w-full sm:w-auto py-2 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold border transition cursor-pointer truncate ${
                  filterDept !== 'ALL'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
                title="Filter Departemen"
              >
                <option value="ALL">{isMobile ? 'Semua Dept' : 'Semua Departemen'}</option>
                {departments.map((dept) => (
                  <option key={dept.id || dept.code} value={dept.code}>
                    {isMobile ? dept.code : `${dept.code} - ${dept.name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filter */}
          {isFiltered && (
            <button
              onClick={() => {
                setStatusFilter('AKTIF');
                setFilterDept('ALL');
                setSearchTerm('');
              }}
              className="inline-flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2.5 sm:px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0"
              title="Kembalikan ke default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Daftar Dokumen: Card View di Mobile + Table di Desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Mobile Card List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedDocs.length > 0 ? (
            paginatedDocs.map((doc, idx) => {
              const rowNumber = startIndex + idx + 1;
              const docComp = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();

              return (
                <div
                  key={doc.id}
                  className="p-3.5 space-y-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                >
                  {/* Row 1: Nomor, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">#{rowNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        docComp === 'UMI'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : docComp === 'IMK'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {docComp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingDocument && setViewingDocument(doc)}
                        className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate"
                      >
                        {doc.docNumber}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge status={doc.status} size="sm" />
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        R{doc.revision || '00'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Judul Dokumen */}
                  <div
                    onClick={() => setViewingDocument && setViewingDocument(doc)}
                    className="font-bold text-xs text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 leading-relaxed"
                  >
                    {doc.title}
                  </div>

                  {/* Row 3: Meta & Aksi */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[10px] text-slate-700 dark:text-slate-300 shrink-0">
                        {doc.department}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[10px] text-slate-600 dark:text-slate-400 shrink-0">
                        {doc.type}
                      </span>
                      <FileFormatBadge doc={doc} />
                      <span className="text-[10.5px] font-mono text-slate-400 shrink-0">
                        {formatDate(doc.effectiveDate || doc.createdDate)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingDocument && setViewingDocument(doc)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-md text-[11px] font-bold flex items-center gap-1 transition shrink-0 active:scale-98 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Pratinjau</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400">
              <FileText className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
              <p className="text-xs font-medium text-slate-500">
                Tidak ada dokumen yang sesuai dengan filter.
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3 text-center w-12 border-r border-slate-700/60">No.</th>
                <th className="py-3 px-3 border-r border-slate-700/60 whitespace-nowrap">Nomor Dokumen</th>
                <th className="py-3 px-3 border-r border-slate-700/60">Judul Dokumen</th>
                <th className="py-3 px-3 text-center border-r border-slate-700/60 w-20">Jenis</th>
                <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Dept</th>
                <th className="py-3 px-3 text-center border-r border-slate-700/60 w-16">Revisi</th>
                <th className="py-3 px-3 text-center border-r border-slate-700/60 whitespace-nowrap w-28">Tgl. Efektif</th>
                <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Status</th>
                <th className="py-3 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedDocs.length > 0 ? (
                paginatedDocs.map((doc, idx) => {
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">
                        {rowNumber}
                      </td>

                      {/* Nomor Dokumen */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setViewingDocument && setViewingDocument(doc)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                          title="Buka naskah dokumen"
                        >
                          {doc.docNumber}
                        </button>
                      </td>

                      {/* Judul Dokumen */}
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 max-w-[280px] truncate" title={doc.title}>
                        {doc.title}
                      </td>

                      {/* Jenis */}
                      <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                        {doc.type}
                      </td>

                      {/* Dept */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {doc.department}
                        </span>
                      </td>

                      {/* Revisi */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                        {doc.revision || '00'}
                      </td>

                      {/* Tgl Efektif */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                        {formatDate(doc.effectiveDate || doc.createdDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <Badge status={doc.status} size="sm" />
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingDocument && setViewingDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Lihat Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-medium text-slate-500">
                        Tidak ada dokumen yang sesuai dengan filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer Pagination */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Kiri: Page Size Selector & Info Entri */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 text-slate-600 dark:text-slate-400 flex-wrap">
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
            </div>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <span className="font-mono text-[11px] sm:text-[11.5px]">
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</strong>-
              <strong className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, totalEntries)}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong>
            </span>
          </div>

          {/* Kanan: Navigasi Tombol Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center sm:justify-end gap-1">
              {/* Tombol Pertama */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Tombol Sebelumnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Angka Halaman */}
              <div className="flex items-center gap-1 mx-1">
                {pageNumbers.map((page, i) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${i}`} className="px-1 text-slate-400 font-mono text-xs">
                        ...
                      </span>
                    );
                  }

                  const isActive = currentPage === page;
                  return (
                    <button
                      key={`page-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[26px] sm:min-w-[28px] h-7 px-1.5 sm:px-2 text-xs font-mono rounded transition cursor-pointer ${
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

              {/* Tombol Selanjutnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Tombol Terakhir */}
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
    </div>
  );
}
