import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle2, Eye, Search, Filter, RefreshCw, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import Badge, { CompanyBadge, FileFormatBadge } from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ApprovedListView() {
  const {
    documents = [],
    departments = [],
    selectedCompanyFilter = 'ALL',
    setViewingDocument,
    setActiveMenu,
    setBreadcrumbs,
    setSelectedDocForRevision
  } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

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

  const approvedDocs = documents.filter(d => d.status === 'AKTIF');
  const departmentCount = new Set(approvedDocs.map(doc => doc.department).filter(Boolean)).size;

  const formatDate = (raw) => {
    if (!raw) return '-';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return raw;
    }
  };

  const filteredDocs = approvedDocs.filter(doc => {
    const matchesSearch = (doc.docNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.creator || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleInitiateRevision = (doc) => {
    setSelectedDocForRevision(doc);
    setActiveMenu('rev-new');
    setBreadcrumbs(['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
  };

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

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Dokumen Disetujui (Resmi Terbit)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Daftar seluruh berkas dokumen yang telah lolos verifikasi dan sah menjadi dokumen operasional terkendali.
            </p>
          </div>
        </div>
        <div className="text-[11px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
          Total {approvedDocs.length} Dokumen Aktif
        </div>
      </div>

      {/* 1-Row Compact Stats for Mobile & Desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            Dokumen aktif
          </span>
          <span className="ml-2 text-base sm:text-xl font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
            {approvedDocs.length}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            Departemen aktif
          </span>
          <span className="ml-2 text-base sm:text-xl font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
            {departmentCount}
          </span>
        </div>
      </div>

      {/* Main Table / Mobile Card Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2.5 border-b border-slate-200 p-3 sm:px-4 sm:py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Daftar dokumen aktif</h3>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Menampilkan {filteredDocs.length} dari {approvedDocs.length} dokumen</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative min-w-0 flex-1 sm:w-64">
              <span className="sr-only">Cari dokumen disetujui</span>
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Cari nomor, judul, pembuat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Filter departemen</span>
              <Filter className="h-3.5 w-3.5 shrink-0 text-slate-400 hidden sm:block" aria-hidden="true" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto cursor-pointer"
              >
                <option value="ALL">Semua Departemen</option>
                {departments.map(d => (
                  <option key={d.id || d.code} value={d.code}>{d.code}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Content Body */}
        {filteredDocs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {approvedDocs.length === 0 ? 'Belum ada dokumen yang disetujui' : 'Tidak ada dokumen yang cocok'}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {approvedDocs.length === 0
                ? 'Dokumen akan tampil di sini setelah verifikasi selesai dan statusnya aktif.'
                : 'Coba kata kunci atau departemen lain.'}
            </p>
            {approvedDocs.length > 0 && (searchTerm || selectedDept !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedDept('ALL'); }}
                className="mt-3 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Accordion List View (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map((doc) => {
                const isExpanded = expandedMobileDocIds.has(doc.id);

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
                          <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                            {doc.docNumber}
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            Rev {doc.revision}
                          </span>
                          <Badge status={doc.status} size="sm" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={doc.title}>
                          {doc.title}
                        </p>
                      </div>

                      {/* Format Badge on right */}
                      <div className="shrink-0 flex items-center">
                        <FileFormatBadge doc={doc} />
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
                              {formatDate(doc.effectiveDate || doc.createdDate)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingDocument(doc);
                              }}
                              className="h-8 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pratinjau</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateRevision(doc);
                              }}
                              className="h-8 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Revisi</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
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
                <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold">
                      <th className="py-3 px-4 text-center whitespace-nowrap w-12">No.</th>
                      <th className="py-3 px-4 whitespace-nowrap">No. Dokumen</th>
                      <th className="py-3 px-4 min-w-[200px]">Judul Dokumen</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Format</th>
                      <th className="py-3 px-4 whitespace-nowrap">Departemen</th>
                      <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Pembuat</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Revisi</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">Tgl. Efektif</th>
                      <th
                        className={`py-3 px-4 text-center whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-800 z-20 border-l transition-shadow duration-200 ${
                          scrollState.canScrollRight
                            ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/90 dark:border-slate-700/90'
                            : 'shadow-none border-slate-200/50 dark:border-slate-800'
                        }`}
                      >
                        {/* Ikon Tombol Panah Pemisah: Terletak persis di antara kolom yang terpotong dengan kolom Aksi */}
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
                        <span>Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocs.map((doc, idx) => (
                      <tr key={doc.id} className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/70">
                        <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                            <span>{doc.docNumber}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate" title={doc.title}>
                          {doc.title}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <FileFormatBadge doc={doc} />
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.department}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.creator}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">{doc.revision}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Badge status={doc.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(doc.effectiveDate || doc.createdDate)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-blue-50/50 dark:bg-slate-900 dark:group-hover:bg-slate-800/90 transition-colors border-l z-10 ${
                            scrollState.canScrollRight
                              ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/80 dark:border-slate-800'
                              : 'shadow-none border-slate-100 dark:border-slate-850'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingDocument(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              title="Buka Dokumen Terkendali"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Pratinjau
                            </button>
                            <button
                              onClick={() => handleInitiateRevision(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                              title="Ajukan Revisi Dokumen"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Revisi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
