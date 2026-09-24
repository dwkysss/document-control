import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Archive,
  FileText,
  FileSpreadsheet,
  Search,
  Percent,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DepartmentReportView() {
  const { departments = [], documents = [], showToast } = useDocumentControl();
  const [viewMode, setViewMode] = useState('table'); // 'table' (default rapi) | 'grid'
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Agregasi Statistik per Departemen
  const deptStats = useMemo(() => {
    return departments.map((dept) => {
      const deptDocs = documents.filter((d) => d.department === dept.code);
      const active = deptDocs.filter((d) => d.status === 'AKTIF').length;
      const obsolete = deptDocs.filter((d) => d.status === 'OBSOLETE').length;
      const pending = deptDocs.filter((d) => d.status === 'VERIFIKASI' || d.status === 'REVIEW' || d.status === 'APPROVAL').length;
      const draft = deptDocs.filter((d) => d.status === 'DRAFT').length;
      const total = deptDocs.length;

      return {
        ...dept,
        total,
        active,
        obsolete,
        pending,
        draft,
        activeRate: total > 0 ? Math.round((active / total) * 100) : 0
      };
    });
  }, [departments, documents]);

  // Filter pencarian nama/kode departemen
  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return deptStats;
    const q = searchTerm.toLowerCase();
    return deptStats.filter(
      (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || (d.head || '').toLowerCase().includes(q)
    );
  }, [deptStats, searchTerm]);

  // Reset ke halaman 1 saat pencarian atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Pagination Calculation
  const totalEntries = filteredDepts.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDepts = useMemo(() => {
    return filteredDepts.slice(startIndex, startIndex + pageSize);
  }, [filteredDepts, startIndex, pageSize]);

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

  // Total Keseluruhan
  const totals = useMemo(() => {
    return deptStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
        active: acc.active + curr.active,
        pending: acc.pending + curr.pending,
        draft: acc.draft + curr.draft,
        obsolete: acc.obsolete + curr.obsolete
      }),
      { total: 0, active: 0, pending: 0, draft: 0, obsolete: 0 }
    );
  }, [deptStats]);

  const overallActiveRate = totals.total > 0 ? Math.round((totals.active / totals.total) * 100) : 0;

  // Ekspor Excel Resmi
  const handleExportExcel = () => {
    const exportData = filteredDepts.map((d, idx) => ({
      'No.': idx + 1,
      'Kode Departemen': d.code,
      'Nama Departemen': d.name,
      'Kepala Departemen': d.head && !d.head.includes('---') ? d.head : 'Belum Ditunjuk',
      'Dokumen Aktif': d.active,
      'Sedang Diproses': d.pending,
      'Draf': d.draft,
      'Obsolete': d.obsolete,
      'Total Dokumen': d.total,
      'Rasio Keaktifan': `${d.activeRate}%`
    }));

    // Tambah baris total
    exportData.push({
      'No.': 'TOTAL',
      'Kode Departemen': '-',
      'Nama Departemen': 'TOTAL SEMUA DEPARTEMEN',
      'Kepala Departemen': '-',
      'Dokumen Aktif': totals.active,
      'Sedang Diproses': totals.pending,
      'Draf': totals.draft,
      'Obsolete': totals.obsolete,
      'Total Dokumen': totals.total,
      'Rasio Keaktifan': `${overallActiveRate}%`
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribusi_Departemen');
    XLSX.writeFile(workbook, `Laporan_Distribusi_Departemen_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showToast('Laporan distribusi departemen berhasil diekspor!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar Ringkas & Rapi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
            Distribusi Dokumen per Departemen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {totals.total} dokumen tersebar di {departments.length} unit kerja • Rasio aktif {overallActiveRate}%
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              title="Tampilan Tabel (Lebih Rapi & Ringkas)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu Grid</span>
            </button>
          </div>

          {/* Unduh Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar Simpel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode departemen, nama, atau kepala seksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 3. TAMPILAN TABEL RAPI (DEFAULT) */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12 border-r border-slate-700/60">No.</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 w-28">Kode Dept</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 min-w-[200px]">Nama Departemen</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 min-w-[170px]">Kepala Bagian (PIC)</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Aktif</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Proses</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-20">Draf</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Obsolete</th>
                  <th className="py-3 px-3.5 text-center border-r border-slate-700/60 w-28 font-bold">Total Dok</th>
                  <th className="py-3 px-3.5 text-center w-36">Kepatuhan Aktif</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedDepts.length > 0 ? (
                  paginatedDepts.map((d, idx) => (
                    <tr
                      key={d.id || d.code}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">
                        {startIndex + idx + 1}
                      </td>

                      {/* Kode Dept */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs">
                          {d.code}
                        </span>
                      </td>

                      {/* Nama Departemen */}
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                        {d.name}
                      </td>

                      {/* Kepala Departemen */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                        {d.head && !d.head.includes('---') && d.head !== '-' ? (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {d.head}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- Belum Ditunjuk -</span>
                        )}
                      </td>

                      {/* Aktif */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {d.active}
                        </span>
                      </td>

                      {/* Proses */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${d.pending > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                          {d.pending}
                        </span>
                      </td>

                      {/* Draf */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${d.draft > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                          {d.draft}
                        </span>
                      </td>

                      {/* Obsolete */}
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${d.obsolete > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {d.obsolete}
                        </span>
                      </td>

                      {/* Total Dokumen */}
                      <td className="py-3 px-3.5 text-center font-mono font-extrabold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        {d.total}
                      </td>

                      {/* Rasio Keaktifan */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${d.activeRate}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 w-9 text-right shrink-0">
                            {d.activeRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada departemen yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Baris Total Keseluruhan */}
              {filteredDepts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                    <td colSpan={4} className="py-3.5 px-3.5 text-right uppercase tracking-wider text-[11px]">
                      Total Keseluruhan Dokumen:
                    </td>
                    <td className="py-3.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {totals.active}
                    </td>
                    <td className="py-3.5 px-3 text-center text-amber-600 dark:text-amber-400">
                      {totals.pending}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400">
                      {totals.draft}
                    </td>
                    <td className="py-3.5 px-3 text-center text-rose-600 dark:text-rose-400">
                      {totals.obsolete}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-mono font-extrabold text-sm bg-slate-100 dark:bg-slate-800">
                      {totals.total}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${overallActiveRate}%` }}
                          />
                        </div>
                        <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400 w-9 text-right shrink-0">
                          {overallActiveRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Footer Pagination Tabel */}
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>departemen / hal</span>
              </div>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

              <span className="font-mono text-[11.5px]">
                Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</strong> -{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, totalEntries)}</strong> dari{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> departemen
              </span>
            </div>

            {/* Kanan: Navigasi Tombol Pagination */}
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
                        <span key={`ellipsis-tbl-${i}`} className="px-1.5 text-slate-400 font-mono">
                          ...
                        </span>
                      );
                    }
                    const isActive = currentPage === page;
                    return (
                      <button
                        key={`page-tbl-${page}`}
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
      ) : (
        /* 4. TAMPILAN KARTU GRID (YANG SUDAH DIPERBAIKI TOTAL, TIDAK OVERLAP) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedDepts.map((d) => (
              <div
                key={d.id || d.code}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3"
              >
                {/* Header Kartu: Kode, Nama, dan Total Dokumen Rapi */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm block">
                      {d.code}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={d.name}>
                      {d.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5" title={d.head || 'Belum ada PIC'}>
                      PIC: {d.head && !d.head.includes('---') ? d.head : '-'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md block">
                      {d.total} Dok
                    </span>
                  </div>
                </div>

                {/* Rincian Status: 4 Kolom Bersih */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                    <strong className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {d.active}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                    <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Proses
                    </span>
                    <strong className="font-mono font-bold text-amber-800 dark:text-amber-300">
                      {d.pending}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Draf
                    </span>
                    <strong className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {d.draft}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                    <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
                      <Archive className="w-3 h-3" /> Obsolete
                    </span>
                    <strong className="font-mono font-bold text-rose-800 dark:text-rose-300">
                      {d.obsolete}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar Kepatuhan */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>Rasio Dokumen Aktif:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {d.activeRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${d.activeRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Pagination Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
                <span>kartu / hal</span>
              </div>

              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

              <span className="font-mono text-[11.5px]">
                Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{totalEntries > 0 ? startIndex + 1 : 0}</strong> -{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{Math.min(startIndex + pageSize, totalEntries)}</strong> dari{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> departemen
              </span>
            </div>

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
                        <span key={`ellipsis-grd-${i}`} className="px-1.5 text-slate-400 font-mono">
                          ...
                        </span>
                      );
                    }
                    const isActive = currentPage === page;
                    return (
                      <button
                        key={`page-grd-${page}`}
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
      )}
    </div>
  );
}
