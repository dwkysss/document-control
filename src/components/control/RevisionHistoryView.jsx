import React, { useState, useMemo, useEffect } from 'react';
import {
  GitBranch,
  FileText,
  Search,
  ArrowRight,
  Eye,
  RotateCcw,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RevisionHistoryView() {
  const { documents = [], departments = [], documentTypes = [], setViewingDocument } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'MULTI' | 'INITIAL'
  const [selectedSeriesBaseKey, setSelectedSeriesBaseKey] = useState(null);

  // Fungsi mendapatkan base code dokumen tanpa versi revisi (e.g. DJI-IK-PRODUKSI-08)
  const getBaseKey = (doc) => {
    if (doc.docNumber) {
      const parts = doc.docNumber.split('-');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join('-');
      }
    }
    return `${doc.type || 'SOP'}-${doc.department || 'GEN'}-${doc.seqNumber || '01'}`;
  };

  // Hitung jumlah iterasi revisi untuk setiap seri dokumen
  const versionCountMap = useMemo(() => {
    const map = {};
    (documents || []).forEach(d => {
      const key = getBaseKey(d);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [documents]);

  const totalDocuments = (documents || []).length;
  const multiVersionDocsCount = (documents || []).filter(d => (versionCountMap[getBaseKey(d)] || 1) > 1).length;
  const initialDocsCount = totalDocuments - multiVersionDocsCount;

  // Filter dokumen untuk tabel riwayat revisi
  const filteredDocs = useMemo(() => {
    return (documents || []).filter(doc => {
      const baseKey = getBaseKey(doc);
      const isMulti = (versionCountMap[baseKey] || 1) > 1;

      if (activeTab === 'MULTI' && !isMulti) return false;
      if (activeTab === 'INITIAL' && isMulti) return false;

      if (selectedDept !== 'ALL' && (doc.department || '').toUpperCase() !== selectedDept.toUpperCase()) {
        return false;
      }

      if (selectedType !== 'ALL' && (doc.type || '').toUpperCase() !== selectedType.toUpperCase()) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = (doc.docNumber || '').toLowerCase().includes(q);
        const matchTitle = (doc.title || '').toLowerCase().includes(q);
        const matchCreator = (doc.creator || '').toLowerCase().includes(q);
        const matchNotes = (doc.notes || '').toLowerCase().includes(q);
        const matchBase = baseKey.toLowerCase().includes(q);
        if (!matchNo && !matchTitle && !matchCreator && !matchNotes && !matchBase) return false;
      }

      return true;
    });
  }, [documents, versionCountMap, activeTab, selectedDept, selectedType, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm.trim()) || selectedDept !== 'ALL' || selectedType !== 'ALL' || activeTab !== 'ALL';

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept, selectedType, activeTab, pageSize]);

  // Pagination Calculation
  const totalEntries = filteredDocs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDocs = useMemo(() => {
    return filteredDocs.slice(startIndex, startIndex + pageSize);
  }, [filteredDocs, startIndex, pageSize]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedType('ALL');
    setActiveTab('ALL');
  };

  // Dokumen-dokumen dalam seri yang dipilih untuk modal silsilah
  const selectedSeriesDocs = useMemo(() => {
    if (!selectedSeriesBaseKey) return [];
    return (documents || [])
      .filter(d => getBaseKey(d) === selectedSeriesBaseKey)
      .sort((a, b) => parseInt(a.revision || '0', 10) - parseInt(b.revision || '0', 10));
  }, [selectedSeriesBaseKey, documents]);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar (Clean & Simple) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Riwayat Revisi Dokumen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log dan rekam jejak perubahan versi dokumen ISO 9001.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
          Total {totalDocuments} Dokumen Terdaftar
        </div>
      </div>

      {/* 2. Unified Container: Toolbar + Table (Zero Wasted Space) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Tier 1: Segmented Filter Tabs Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Semua Riwayat</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'ALL' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {totalDocuments}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MULTI')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'MULTI'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Pernah Direvisi</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'MULTI' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {multiVersionDocsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INITIAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'INITIAL'
                  ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Versi Inisial (Rev 00)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'INITIAL' ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {initialDocsCount}
              </span>
            </button>
          </div>

          {/* Quick Active Filter Indicator / Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium transition cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Tier 2: Search & Filter Controls Bar */}
        <div className="p-3 sm:px-4 sm:py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900">
          {/* Search Box with Clear Button */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor, judul, pembuat..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Hapus kata kunci"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Select Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map(d => (
                <option key={d.id || d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="ALL">Semua Jenis</option>
              {documentTypes.map(t => (
                <option key={t.id || t.code} value={t.code}>{t.code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dense, Clean Table (100% Width, Zero Empty Holes) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4 text-center whitespace-nowrap w-12">No.</th>
                <th className="py-3.5 px-4 whitespace-nowrap">No. Dokumen</th>
                <th className="py-3.5 px-4 min-w-[200px]">Judul Dokumen</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Departemen</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Revisi</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">Tgl. Efektif</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Pembuat</th>
                <th className="py-3.5 px-4 min-w-[220px]">Catatan / Alasan Revisi</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GitBranch className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        Tidak ada riwayat dokumen yang sesuai dengan filter
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Coba sesuaikan kata kunci pencarian atau ubah filter departemen/jenis dokumen.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 rounded-lg transition cursor-pointer"
                        >
                          Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const baseKey = getBaseKey(doc);
                  const seriesCount = versionCountMap[baseKey] || 1;
                  const isMulti = seriesCount > 1;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap font-medium">
                        {startIndex + idx + 1}
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
                        <div className="font-semibold text-slate-900 dark:text-white max-w-[240px] truncate" title={doc.title}>
                          {doc.title}
                        </div>
                      </td>

                      {/* 4. Departemen */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {doc.department}
                        </span>
                      </td>

                      {/* 5. Revisi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          Rev. {doc.revision || '00'}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={doc.status} size="sm" />
                      </td>

                      {/* 7. Tanggal Efektif (Single Line) */}
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {doc.effectiveDate || doc.createdDate || '-'}
                      </td>

                      {/* 8. Pembuat */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {doc.creator}
                      </td>

                      {/* 9. Catatan / Alasan Revisi */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {doc.notes || doc.changeReason ? (
                          <div className="line-clamp-2 italic text-[11px]" title={doc.notes || doc.changeReason}>
                            "{doc.notes || doc.changeReason}"
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {parseInt(doc.revision || '0', 10) === 0 ? 'Versi Inisial (Inisiasi Awal)' : 'Pembaruan Rutin'}
                          </span>
                        )}
                      </td>

                      {/* 10. Aksi */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-md transition flex items-center gap-1 cursor-pointer"
                            title="Pratinjau Dokumen Ini"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>

                          {/* Tombol Silsilah jika seri memiliki lebih dari 1 versi */}
                          {isMulti ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSeriesBaseKey(baseKey)}
                              className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md transition flex items-center gap-1 cursor-pointer"
                              title="Lihat Pohon Silsilah Revisi Dokumen"
                            >
                              <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                              <span>Silsilah ({seriesCount})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedSeriesBaseKey(baseKey)}
                              className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                              title="Lihat Detail Seri"
                            >
                              <History className="w-3.5 h-3.5" />
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
                className="py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
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
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> arsip revisi
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
                      <span key={`ellipsis-rev-${i}`} className="px-1.5 text-slate-400 font-mono">
                        ...
                      </span>
                    );
                  }
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={`page-rev-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-mono rounded transition cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white font-bold shadow-xs'
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

      {/* Modal Detail Silsilah Revisi */}
      {selectedSeriesBaseKey && (
        <Modal
          isOpen={Boolean(selectedSeriesBaseKey)}
          onClose={() => setSelectedSeriesBaseKey(null)}
          title={`Silsilah & Riwayat Kronologis: ${selectedSeriesBaseKey}`}
          subtitle={selectedSeriesDocs[0]?.title || 'Pohon evolusi versi dokumen'}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 text-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-purple-900 dark:text-purple-300">
                  Total {selectedSeriesDocs.length} Iterasi Versi Terdaftar
                </span>
              </div>
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Departemen: <strong>{selectedSeriesDocs[0]?.department || '-'}</strong>
              </span>
            </div>

            {/* Stepper Timeline Diagram */}
            <div className="space-y-3">
              {selectedSeriesDocs.map((doc, idx) => {
                const isLatest = idx === selectedSeriesDocs.length - 1;
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      doc.status === 'AKTIF'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : doc.status === 'OBSOLETE'
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-80'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          Rev. {doc.revision || '00'}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {doc.docNumber}
                        </span>
                        <Badge status={doc.status} size="sm" />
                        {isLatest && doc.status === 'AKTIF' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            ✓ Versi Berlaku Saat Ini
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>Tanggal: <strong className="font-mono text-slate-700 dark:text-slate-300">{doc.effectiveDate || doc.createdDate || '-'}</strong></span>
                        <span>&bull;</span>
                        <span>Pembuat: <strong className="text-slate-700 dark:text-slate-300">{doc.creator}</strong></span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
                          Catatan: "{doc.notes}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingDocument(doc);
                        setSelectedSeriesBaseKey(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-200 dark:border-blue-800 rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Dokumen</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSeriesBaseKey(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
