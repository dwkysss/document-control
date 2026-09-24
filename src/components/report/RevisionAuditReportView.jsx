import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RevisionAuditReportView() {
  const {
    auditLogs = [],
    documents = [],
    syncAuditLogsFromDocuments,
    setViewingDocument,
    showToast
  } = useDocumentControl();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Auto-sync jika auditLogs masih kosong padahal dokumen sudah ada
  useEffect(() => {
    if (auditLogs.length === 0 && documents.length > 0 && syncAuditLogsFromDocuments) {
      syncAuditLogsFromDocuments();
    }
  }, [auditLogs.length, documents.length]);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAction, pageSize]);

  // Filter Log
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Filter Tindakan
      if (filterAction !== 'ALL' && log.action !== filterAction) {
        return false;
      }

      // Filter Pencarian Teks
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const docNum = (log.docNumber || '').toLowerCase();
        const docTitle = (log.docTitle || '').toLowerCase();
        const user = (log.user || '').toLowerCase();
        const nik = (log.nik || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const action = (log.action || '').toLowerCase();

        if (
          !docNum.includes(q) &&
          !docTitle.includes(q) &&
          !user.includes(q) &&
          !nik.includes(q) &&
          !details.includes(q) &&
          !action.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, filterAction, searchTerm]);

  // Pagination Logic
  const totalEntries = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, startIndex, pageSize]);

  // Generate Array Nomor Halaman yang Tampil
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

  // Styling Badge Tindakan Audit
  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVE_DOCUMENT':
      case 'APPROVE_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            DISETUJUI (APPROVED)
          </span>
        );
      case 'REJECT_DOCUMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            DITOLAK (REJECTED)
          </span>
        );
      case 'CREATE_REVISION':
      case 'DIRECT_PUBLISH_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <RefreshCw className="w-3 h-3 text-purple-600" />
            REVISI DOKUMEN
          </span>
        );
      case 'SUBMIT_VERIFICATION':
      case 'SUBMIT_REVIEW':
      case 'SUBMIT_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600" />
            DIAJUKAN (SUBMITTED)
          </span>
        );
      case 'CANCEL_DOCUMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            OBSOLETE (DITARIK)
          </span>
        );
      case 'SAVE_DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <FileText className="w-3 h-3 text-slate-500" />
            SIMPAN DRAF
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  // Ekspor Excel Audit Trail
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      showToast('Tidak ada data log audit untuk diekspor!', 'warning');
      return;
    }

    const exportData = filteredLogs.map((log, idx) => ({
      'No.': idx + 1,
      'Waktu Timestamp': log.timestamp,
      'Nama Pelaksana': log.user,
      'NIK Pelaksana': log.nik || '-',
      'Tindakan': log.action,
      'Nomor Dokumen': log.docNumber,
      'Judul Dokumen': log.docTitle,
      'Rincian Aktivitas': log.details
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit_Trail_ISO9001');
    XLSX.writeFile(workbook, `Audit_Trail_Log_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showToast('Laporan Audit Trail Excel berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 shrink-0" />
            Audit Trail (Log Rekam Jejak Sistem)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log ketertelusuran otomatis seluruh transaksi dokumen sesuai kaidah ISO 9001:2015 Clause 7.5.3 ({totalEntries} entri)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Sinkronisasi Jejak Audit */}
          <button
            type="button"
            onClick={() => syncAuditLogsFromDocuments && syncAuditLogsFromDocuments()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title="Sinkronkan ulang jejak audit dari data dokumen terdaftar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Jejak Audit</span>
          </button>

          {/* Unduh Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel Log</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar Ringkas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari user, NIK, nomor dokumen, judul, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Tindakan */}
          <div className="w-full sm:w-auto">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full sm:w-auto py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="ALL">Semua Jenis Tindakan</option>
              <option value="APPROVE_DOCUMENT">Persetujuan Resmi (APPROVE)</option>
              <option value="SUBMIT_VERIFICATION">Pengajuan Dokumen (SUBMIT)</option>
              <option value="REJECT_DOCUMENT">Penolakan Dokumen (REJECT)</option>
              <option value="CREATE_REVISION">Pengajuan Revisi (REVISION)</option>
              <option value="CANCEL_DOCUMENT">Penarikan Dokumen (OBSOLETE)</option>
              <option value="SAVE_DRAFT">Penyimpanan Draf (DRAFT)</option>
            </select>
          </div>

          {/* Reset Filter */}
          {(searchTerm !== '' || filterAction !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAction('ALL');
              }}
              className="flex items-center gap-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium transition cursor-pointer"
              title="Reset pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabel Audit Trail */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3.5 text-center w-12 border-r border-slate-700/60">No.</th>
                <th className="py-3 px-3.5 border-r border-slate-700/60 whitespace-nowrap w-40">Waktu (Timestamp)</th>
                <th className="py-3 px-3.5 border-r border-slate-700/60 w-44">User Pelaksana</th>
                <th className="py-3 px-3.5 text-center border-r border-slate-700/60 w-40">Tindakan</th>
                <th className="py-3 px-3.5 border-r border-slate-700/60 whitespace-nowrap">Nomor Dokumen</th>
                <th className="py-3 px-3.5 border-r border-slate-700/60 min-w-[200px]">Judul Dokumen</th>
                <th className="py-3 px-3.5 min-w-[260px]">Rincian Aktivitas</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, idx) => {
                  const matchingDoc = documents.find(d => d.docNumber === log.docNumber);
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr
                      key={log.id || `${startIndex}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">
                        {rowNumber}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                        {log.timestamp}
                      </td>

                      {/* User Pelaksana */}
                      <td className="py-3 px-3.5 border-r border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]" title={log.user}>
                          {log.user}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {log.nik || '-'}
                        </div>
                      </td>

                      {/* Tindakan */}
                      <td className="py-3 px-3.5 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Nomor Dokumen */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                        {matchingDoc ? (
                          <button
                            type="button"
                            onClick={() => setViewingDocument && setViewingDocument(matchingDoc)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                            title="Buka naskah dokumen terkait"
                          >
                            {log.docNumber}
                          </button>
                        ) : (
                          <span>{log.docNumber}</span>
                        )}
                      </td>

                      {/* Judul Dokumen */}
                      <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] truncate border-r border-slate-100 dark:border-slate-800" title={log.docTitle}>
                        {log.docTitle || '-'}
                      </td>

                      {/* Rincian Aktivitas */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 leading-relaxed text-[11.5px]">
                        {log.details || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Belum ada jejak audit yang sesuai kriteria pencarian.
                      </p>
                      <button
                        type="button"
                        onClick={() => syncAuditLogsFromDocuments && syncAuditLogsFromDocuments()}
                        className="mt-1 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Sinkronkan Jejak Audit dari Dokumen Terdaftar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. FOOTER PAGINATION YANG LENGKAP & RAPI */}
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
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> entri
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
