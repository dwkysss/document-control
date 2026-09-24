import React, { useState, useMemo, useEffect } from 'react';
import { Archive, Eye, AlertTriangle, Search, Trash2, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ObsoleteDocumentsView() {
  const { documents, departments = [], documentTypes = [], setViewingDocument, deleteDocument, isAdmin } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [docToDelete, setDocToDelete] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const obsoleteDocs = useMemo(() => (documents || []).filter(d => d.status === 'OBSOLETE'), [documents]);

  const filtered = useMemo(() => {
    return obsoleteDocs.filter(d => {
      const term = (searchTerm || '').toLowerCase();
      const matchesSearch =
        (d.docNumber || '').toLowerCase().includes(term) ||
        (d.title || '').toLowerCase().includes(term) ||
        (d.department || '').toLowerCase().includes(term) ||
        (d.creator || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (filterDept !== 'ALL' && (d.department || '').toUpperCase() !== filterDept.toUpperCase()) return false;
      if (filterType !== 'ALL' && (d.type || '').toUpperCase() !== filterType.toUpperCase()) return false;

      return true;
    });
  }, [obsoleteDocs, searchTerm, filterDept, filterType]);

  // Reset ke halaman 1 saat filter atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept, filterType, pageSize]);

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

  const hasActiveFilters = Boolean(searchTerm.trim()) || filterDept !== 'ALL' || filterType !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDept('ALL');
    setFilterType('ALL');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Bar (Clean & Simple) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Dokumen Obsolete
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono">
                {obsoleteDocs.length} Berkas
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arsip dokumen standar yang sudah tidak berlaku karena telah diterbitkan revisi baru atau ditarik.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Unified Container: Toolbar + Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor, judul, pembuat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map(d => (
                <option key={d.id || d.code} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">Semua Jenis Dokumen</option>
              {documentTypes.map(t => (
                <option key={t.id || t.code} value={t.code}>{t.code} - {t.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
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
                <th className="py-3.5 px-4 text-center whitespace-nowrap w-12">No.</th>
                <th className="py-3.5 px-4 whitespace-nowrap">No. Dokumen</th>
                <th className="py-3.5 px-4 min-w-[200px]">Judul Dokumen</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Departemen</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Pembuat</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Revisi</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Digantikan Oleh</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                        {obsoleteDocs.length === 0
                          ? 'Belum Ada Arsip Dokumen Obsolete'
                          : 'Tidak ada dokumen obsolete yang sesuai dengan filter'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {obsoleteDocs.length === 0
                          ? 'Dokumen yang telah diperbarui ke revisi baru atau ditarik dari operasional akan tersimpan otomatis di sini.'
                          : 'Coba ubah kata kunci pencarian atau reset filter departemen/jenis dokumen.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        >
                          Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-rose-50/20 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{startIndex + idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-500 whitespace-nowrap line-through">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 min-w-[200px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.department}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.creator}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                      {doc.revision}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {doc.supersededBy ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {doc.supersededBy}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Revisi Baru</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="Pratinjau Dokumen Obsolete (Watermarked)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Arsip</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition cursor-pointer"
                            title="Hapus Dokumen Obsolete dari Sistem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                className="py-1 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
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
              <strong className="text-slate-900 dark:text-white font-bold">{totalEntries}</strong> dokumen obsolete
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
                      <span key={`ellipsis-obs-${i}`} className="px-1.5 text-slate-400 font-mono">
                        ...
                      </span>
                    );
                  }
                  const isActive = currentPage === page;
                  return (
                    <button
                      key={`page-obs-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-mono rounded transition cursor-pointer ${
                        isActive
                          ? 'bg-rose-600 text-white font-bold shadow-xs'
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

      {/* Modal Konfirmasi Hapus Dokumen Obsolete */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Konfirmasi Hapus Dokumen Obsolete"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Hapus Arsip Dokumen Obsolete Permanen</p>
                <p className="mt-1">
                  Sebagai Administrator / Management Representative, Anda akan menghapus dokumen <strong>{docToDelete.docNumber}</strong> ({docToDelete.title}) dari sistem secara permanen.
                </p>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Pastikan arsip fisik atau rekam jejak audit ISO 9001 telah terpenuhi sebelum menghapus dokumen ini.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
