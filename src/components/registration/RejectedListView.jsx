import React, { useState, useRef, useCallback, useEffect } from 'react';
import { XCircle, Eye, RefreshCw, AlertCircle, Search, Trash2, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import Badge, { CompanyBadge } from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RejectedListView() {
  const {
    documents = [],
    selectedCompanyFilter = 'ALL',
    setViewingDocument,
    setActiveMenu,
    setBreadcrumbs,
    saveDraft,
    deleteDocument,
    currentUser,
    isAdmin,
    canUserViewRejectedDoc
  } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);

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

  const rejectedDocs = documents.filter(d =>
    d.status === 'DITOLAK' &&
    (canUserViewRejectedDoc ? canUserViewRejectedDoc(d) : true)
  );
  const withReasonCount = rejectedDocs.filter(doc => doc.rejectionReason).length;

  const filteredDocs = rejectedDocs.filter(doc => {
    return doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.rejectionReason && doc.rejectionReason.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleResubmitAsDraft = (doc) => {
    // Revert to draft status for editing
    saveDraft({
      ...doc,
      status: 'DRAFT',
      notes: `Perbaikan dari penolakan sebelumnya: ${doc.rejectionReason || ''}`
    });
    setActiveMenu('reg-draft');
    setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Draft']);
  };

  const handleConfirmDelete = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            <XCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Dokumen Ditolak Verifikator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pengajuan dokumen yang memerlukan perbaikan berdasarkan catatan evaluasi tim verifikasi.
            </p>
          </div>
        </div>
        <div className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700">
          {rejectedDocs.length} Dokumen Ditolak
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pengajuan ditolak</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">{rejectedDocs.length}</span>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Memiliki catatan verifikator</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">{withReasonCount}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat pengajuan ditolak</h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Menampilkan {filteredDocs.length} dari {rejectedDocs.length} pengajuan</p>
          </div>
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Cari nomor, judul, atau alasan penolakan</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
            <input type="search" placeholder="Cari nomor, judul, atau alasan" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </label>
        </div>
        {/* Mobile Accordion List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredDocs.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {rejectedDocs.length === 0 ? <XCircle className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {rejectedDocs.length === 0 ? 'Belum ada pengajuan yang ditolak' : 'Tidak ada dokumen yang cocok'}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {rejectedDocs.length === 0 ? 'Pengajuan yang ditolak beserta catatan verifikator akan tercatat di sini.' : 'Coba kata kunci lain untuk mencari nomor, judul, atau alasan.'}
              </p>
              {rejectedDocs.length > 0 && searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-3 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hapus pencarian
                </button>
              )}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isExpanded = expandedMobileDocIds.has(doc.id);

              return (
                <div
                  key={doc.id}
                  className={`transition-colors duration-150 ${
                    isExpanded ? 'bg-rose-50/30 dark:bg-rose-950/20' : 'hover:bg-rose-50/15 dark:hover:bg-slate-800/40'
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
                        <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 truncate">
                          {doc.docNumber}
                        </span>
                        <Badge status={doc.status} size="sm" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={doc.title}>
                        {doc.title}
                      </p>
                    </div>
                  </div>

                  {/* Accordion Content Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-xs border-t border-rose-100/80 dark:border-rose-950/40">
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

                        {/* Rejection Note Plate */}
                        <div className="mt-2 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-2.5 text-rose-800 dark:text-rose-300">
                          <div className="font-bold flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Alasan Penolakan:
                          </div>
                          <p className="mt-1 text-slate-800 dark:text-slate-200 leading-snug">
                            "{doc.rejectionReason || 'Format klausul belum memenuhi standar.'}"
                          </p>
                          <div className="mt-1 text-[10px] text-slate-400">
                            Oleh: {doc.rejectedBy || 'Verifikator'} • {doc.rejectedDate ? doc.rejectedDate.slice(0, 10) : doc.createdDate}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResubmitAsDraft(doc);
                            }}
                            className="flex-1 min-h-[36px] py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Perbaiki Sebagai Draft</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDocument(doc);
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition active:scale-98 cursor-pointer"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Lihat</span>
                          </button>

                          {(isAdmin || (currentUser && (currentUser.name === doc.creator || (currentUser.nip || currentUser.nik) === (doc.creatorNip || doc.creatorNik)))) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocToDelete(doc);
                              }}
                              className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center border border-rose-200 dark:border-rose-800 transition active:scale-98 cursor-pointer"
                              title="Hapus Dokumen Ditolak"
                            >
                              <Trash2 className="w-4 h-4" />
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
            <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold">
                  <th className="py-3 px-4 text-center whitespace-nowrap w-12">No.</th>
                  <th className="py-3 px-4 whitespace-nowrap">No. Dokumen</th>
                  <th className="py-3 px-4 min-w-[180px]">Judul Dokumen</th>
                  <th className="py-3 px-4 whitespace-nowrap">Departemen</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Pembuat</th>
                  <th className="py-3 px-4 min-w-[200px]">Alasan Penolakan</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">Tgl. Ditolak</th>
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
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {rejectedDocs.length === 0 ? <XCircle className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {rejectedDocs.length === 0 ? 'Belum ada pengajuan yang ditolak' : 'Tidak ada dokumen yang cocok'}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {rejectedDocs.length === 0 ? 'Pengajuan yang ditolak beserta catatan verifikator akan tercatat di sini.' : 'Coba kata kunci lain untuk mencari nomor, judul, atau alasan penolakan.'}
                      </p>
                      {rejectedDocs.length > 0 && searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} className="mt-3 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer">
                          Hapus pencarian
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, idx) => (
                    <tr key={doc.id} className="group transition-colors hover:bg-rose-50/40 dark:hover:bg-slate-800/70">
                      <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                          <span>{doc.docNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 min-w-[180px]" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.department}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">{doc.creator}</td>
                      <td className="py-3.5 px-4 text-rose-700 dark:text-rose-400 font-medium">
                        <div className="line-clamp-2" title={doc.rejectionReason}>
                          {doc.rejectionReason || 'Format klausul belum memenuhi standar.'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Oleh: {doc.rejectedBy || 'Verifikator'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={doc.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {doc.rejectedDate ? doc.rejectedDate.slice(0, 10) : doc.createdDate}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-rose-50/40 dark:bg-slate-900 dark:group-hover:bg-slate-800/90 transition-colors border-l z-10 ${
                          scrollState.canScrollRight
                            ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/80 dark:border-slate-800'
                            : 'shadow-none border-slate-100 dark:border-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingDocument(doc)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            title="Pratinjau Dokumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResubmitAsDraft(doc)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            title="Perbaiki & Simpan Sebagai Draft"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Perbaiki
                          </button>

                          {/* Opsi Hapus untuk Creator atau Admin */}
                          {(isAdmin || (currentUser && (currentUser.name === doc.creator || (currentUser.nip || currentUser.nik) === (doc.creatorNip || doc.creatorNik)))) && (
                            <button
                              onClick={() => setDocToDelete(doc)}
                              className="p-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                              title="Hapus Pengajuan Ditolak"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Konfirmasi Hapus Pengajuan Ditolak"
          subtitle={`No. Dokumen: ${docToDelete.docNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Hapus Dokumen Ditolak Secara Permanen</p>
                <p className="mt-1">
                  Pengajuan dokumen <strong>{docToDelete.docNumber}</strong> ({docToDelete.title}) akan dihapus dari daftar pengajuan ditolak. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
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
