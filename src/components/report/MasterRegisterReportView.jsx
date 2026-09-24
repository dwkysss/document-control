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
  ChevronsRight
} from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { exportToExcel, exportMasterRegisterPDF } from '../../utils/exportUtils';

export default function MasterRegisterReportView() {
  const {
    documents = [],
    departments = [],
    documentTypes = [],
    systemSettings = {},
    setViewingDocument,
    showToast
  } = useDocumentControl();

  // Status Filter: default 'AKTIF' sesuai kaidah ISO 9001
  const [statusFilter, setStatusFilter] = useState('AKTIF');
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterDept, searchTerm, pageSize]);

  // Filter dokumen
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Filter Status (Kaidah ISO: Default Aktif saja)
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) {
        return false;
      }

      // Filter Departemen
      if (filterDept !== 'ALL' && doc.department !== filterDept) {
        return false;
      }

      // Search (Nomor atau Judul)
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
  }, [documents, statusFilter, filterDept, searchTerm]);

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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            Daftar Induk Dokumen Terkendali
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar resmi dokumen terkendali ISO 9001:2015 ({totalEntries} dokumen)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (filtered.length === 0) {
                showToast('Tidak ada data dokumen untuk diunduh!', 'warning');
                return;
              }
              exportToExcel(filtered, 'Daftar_Induk_Dokumen_Terkendali');
              showToast('Laporan Excel berhasil diunduh!', 'success');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF Audit
          </button>
        </div>
      </div>

      {/* 2. Filter Bar Ringkas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor dokumen atau judul..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Status (Default: Hanya Aktif) */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="AKTIF">Hanya Dokumen Aktif (Standar ISO)</option>
              <option value="OBSOLETE">Arsip Obsolete (Kadaluarsa)</option>
              <option value="ALL">Semua Status (Audit Trail)</option>
            </select>
          </div>

          {/* Filter Departemen */}
          <div className="w-full sm:w-auto">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id || dept.code} value={dept.code}>
                  {dept.code} - {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter */}
          {isFiltered && (
            <button
              onClick={() => {
                setStatusFilter('AKTIF');
                setFilterDept('ALL');
                setSearchTerm('');
              }}
              className="flex items-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium transition cursor-pointer"
              title="Kembalikan ke default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabel Dokumen Bersih & Rapi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
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
                        {doc.effectiveDate || doc.createdDate || '-'}
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
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Kiri: Page Size Selector & Info Entri */}
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
              <span>per halaman</span>
            </div>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            <span className="font-mono text-[11.5px]">
              Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</strong> -{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, totalEntries)}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> dokumen
            </span>
          </div>

          {/* Kanan: Navigasi Tombol Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
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
                      <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400 font-mono">
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
