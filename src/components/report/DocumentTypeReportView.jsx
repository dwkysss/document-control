import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Table as TableIcon,
  LayoutGrid,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  Search,
  TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DocumentTypeReportView() {
  const {
    documentTypes = [],
    documents = [],
    showToast,
    selectedCompanyFilter = 'ALL',
    companies = []
  } = useDocumentControl();

  // Deteksi Mobile Viewport (< 768px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Di mobile otomatis default ke 'grid' (Kartu) agar tidak terpotong
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'grid';
    }
    return 'table';
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Scope Perusahaan Aktif
  const currentCompanyName = useMemo(() => {
    if (!selectedCompanyFilter || selectedCompanyFilter === 'ALL') {
      return 'Holding Group (Multi-PT)';
    }
    const found = companies.find((c) => c.code === selectedCompanyFilter);
    return found ? found.name : `PT ${selectedCompanyFilter}`;
  }, [selectedCompanyFilter, companies]);

  const companyBadgeText = selectedCompanyFilter === 'ALL' ? 'ALL PT' : selectedCompanyFilter;

  // Agregasi Statistik per Jenis Dokumen
  const typeStats = useMemo(() => {
    return documentTypes.map((type) => {
      const typeCodeUpper = (type.code || '').trim().toUpperCase();
      const matchedDocs = documents.filter((d) => {
        const docType = (d.type || '').trim().toUpperCase();
        const docNumType = (d.docNumber || '').split('-')[1]?.trim().toUpperCase();
        return docType === typeCodeUpper || docNumType === typeCodeUpper;
      });

      const active = matchedDocs.filter((d) => d.status === 'AKTIF').length;
      const obsolete = matchedDocs.filter((d) => d.status === 'OBSOLETE').length;
      const pending = matchedDocs.filter(
        (d) => d.status === 'VERIFIKASI' || d.status === 'REVIEW' || d.status === 'APPROVAL'
      ).length;
      const draft = matchedDocs.filter((d) => d.status === 'DRAFT').length;
      const total = matchedDocs.length;

      return {
        ...type,
        total,
        active,
        obsolete,
        pending,
        draft,
        ratio: documents.length > 0 ? Math.round((total / documents.length) * 100) : 0,
        activeRate: total > 0 ? Math.round((active / total) * 100) : 0
      };
    });
  }, [documentTypes, documents]);

  // Filter pencarian
  const filteredTypes = useMemo(() => {
    if (!searchTerm.trim()) return typeStats;
    const q = searchTerm.toLowerCase();
    return typeStats.filter(
      (t) => t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [typeStats, searchTerm]);

  // Total Keseluruhan
  const totals = useMemo(() => {
    return typeStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
        active: acc.active + curr.active,
        pending: acc.pending + curr.pending,
        draft: acc.draft + curr.draft,
        obsolete: acc.obsolete + curr.obsolete
      }),
      { total: 0, active: 0, pending: 0, draft: 0, obsolete: 0 }
    );
  }, [typeStats]);

  const overallActiveRate = totals.total > 0 ? Math.round((totals.active / totals.total) * 100) : 0;

  // Ekspor Excel
  const handleExportExcel = () => {
    const exportData = filteredTypes.map((t, idx) => ({
      'No.': idx + 1,
      'Kode Jenis': t.code,
      'Nama Dokumen': t.name,
      'Level Hierarki': t.level === 5 ? 'Dokumen Eksternal (Level 5)' : `Level ${t.level}`,
      'Dokumen Aktif': t.active,
      'Sedang Diproses': t.pending,
      'Draf': t.draft,
      'Obsolete': t.obsolete,
      'Total Dokumen': t.total,
      'Porsi (% Total)': `${t.ratio}%`,
      'Rasio Kepatuhan': `${t.activeRate}%`
    }));

    exportData.push({
      'No.': 'TOTAL',
      'Kode Jenis': '-',
      'Nama Dokumen': 'TOTAL SEMUA JENIS DOKUMEN',
      'Level Hierarki': '-',
      'Dokumen Aktif': totals.active,
      'Sedang Diproses': totals.pending,
      'Draf': totals.draft,
      'Obsolete': totals.obsolete,
      'Total Dokumen': totals.total,
      'Porsi (% Total)': '100%',
      'Rasio Kepatuhan': `${overallActiveRate}%`
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Distribusi_Jenis_Dokumen');
    XLSX.writeFile(
      workbook,
      `Laporan_Distribusi_Jenis_Dokumen_${companyBadgeText}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    showToast('Laporan distribusi jenis dokumen berhasil diekspor!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-600 shrink-0" />
              Distribusi Dokumen per Jenis (Hierarki Mutu)
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              {companyBadgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentCompanyName} • Total {totals.total} dokumen dalam {documentTypes.length} tingkatan hierarki mutu ISO 9001:2015
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Kartu Hierarki (Responsif di Layar HP)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Tabel Rapi"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          {/* Unduh Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dokumen
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {totals.total}
            </span>
            <span className="text-[11px] text-slate-400">dokumen</span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            {documentTypes.length} tingkatan hierarki
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Dokumen Aktif
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {totals.active}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({overallActiveRate}%)
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            Berlaku operasional
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Sedang Proses
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {totals.pending}
            </span>
            <span className="text-[11px] text-slate-400">dokumen</span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            Verifikasi / Approval
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Rasio Kepatuhan
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {overallActiveRate}%
            </span>
          </div>
          <div className="mt-1 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all"
              style={{ width: `${overallActiveRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Search Bar Simpel & Responsif */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={isMobile ? 'Cari kode atau jenis dokumen...' : 'Cari kode jenis atau nama tingkatan hierarki...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. TAMPILAN KARTU GRID (DEFAULT DI MOBILE) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTypes.length > 0 ? (
            filteredTypes.map((t) => (
              <div
                key={t.id || t.code}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3 hover:border-cyan-300 dark:hover:border-cyan-700 transition"
              >
                {/* Header Kartu */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-900 block">
                        {t.code}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t.level === 5 ? 'Eksternal (L5)' : `Level ${t.level}`}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-1.5" title={t.name}>
                      {t.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg block">
                      {t.total} <span className="text-[10px] font-normal text-slate-500">Dok</span>
                    </span>
                  </div>
                </div>

                {/* Rincian Status: 4 Kolom */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Aktif
                    </span>
                    <strong className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {t.active}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                    <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Proses
                    </span>
                    <strong className="font-mono font-bold text-amber-800 dark:text-amber-300">
                      {t.pending}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                      <FileText className="w-3.5 h-3.5 shrink-0" /> Draf
                    </span>
                    <strong className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {t.draft}
                    </strong>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                    <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                      <Archive className="w-3.5 h-3.5 shrink-0" /> Obsolete
                    </span>
                    <strong className="font-mono font-bold text-rose-800 dark:text-rose-300">
                      {t.obsolete}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar Porsi */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex justify-between items-center text-slate-500 mb-1">
                    <span>Porsi dari Total Dokumen</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {t.ratio}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${t.ratio}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Tidak ada jenis dokumen yang sesuai pencarian.
            </div>
          )}
        </div>
      ) : (
        /* 5. TAMPILAN TABEL STANDAR */
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden space-y-0">
          {/* Tip Scroll jika di mobile */}
          {isMobile && (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900 text-[11px] text-blue-700 dark:text-blue-300">
              <span>👉 Geser tabel ke samping untuk melihat seluruh kolom</span>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className="font-bold underline ml-2 cursor-pointer"
              >
                Ganti ke Kartu
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12 border-r border-slate-700/60">No.</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 w-28">Kode Jenis</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 min-w-[200px]">Nama Jenis Dokumen</th>
                  <th className="py-3 px-3.5 border-r border-slate-700/60 min-w-[150px]">Tingkatan Hierarki</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Aktif</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Proses</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-20">Draf</th>
                  <th className="py-3 px-3 text-center border-r border-slate-700/60 w-24">Obsolete</th>
                  <th className="py-3 px-3.5 text-center border-r border-slate-700/60 w-28 font-bold">Total Dok</th>
                  <th className="py-3 px-3.5 text-center w-36">Porsi Dokumen</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTypes.length > 0 ? (
                  filteredTypes.map((t, idx) => (
                    <tr
                      key={t.id || t.code}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-cyan-600 dark:text-cyan-400 border-r border-slate-100 dark:border-slate-800">
                        <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900 text-xs">
                          {t.code}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                        {t.name}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t.level === 5 ? 'Dokumen Eksternal (Level 5)' : `Level ${t.level} Hierarki Mutu`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {t.active}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${t.pending > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                          {t.pending}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${t.draft > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                          {t.draft}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <span className={`font-medium ${t.obsolete > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {t.obsolete}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-extrabold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                        {t.total}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                              style={{ width: `${t.ratio}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 w-9 text-right shrink-0">
                            {t.ratio}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada jenis dokumen yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Baris Total Keseluruhan */}
              {filteredTypes.length > 0 && (
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
                    <td className="py-3.5 px-3.5 text-center font-mono font-extrabold text-xs text-cyan-600 dark:text-cyan-400">
                      100%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
