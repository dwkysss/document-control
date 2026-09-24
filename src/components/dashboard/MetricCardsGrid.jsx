import React from 'react';
import {
  ShieldCheck,
  Clock,
  CalendarClock,
  FilePlus2,
  Archive,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Layers
} from 'lucide-react';

export default function MetricCardsGrid({
  totalDocs = 0,
  activeDocs = 0,
  pendingDocs = 0,
  draftDocs = 0,
  obsoleteDocs = 0,
  rejectedDocs = 0,
  reviewDueCount = 0,
  departmentsCount = 0,
  documentTypesCount = 0,
  navigateTo,
  isViewer = false
}) {
  const complianceRate = totalDocs > 0 ? Math.round((activeDocs / totalDocs) * 100) : 100;

  if (isViewer) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Dokumen Aktif */}
        <div
          onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-900/50 shadow-card hover:shadow-lg hover:border-emerald-400 transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Dokumen Aktif Terkendali
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-900 dark:text-white">
              {activeDocs}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Controlled Copies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Resmi disetujui & siap digunakan dalam operasional kerja harian.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
            <span>Buka Katalog SOP & IK</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Departemen Terdaftar */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-lg hover:border-blue-400 transition-all duration-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Departemen Operasional
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {departmentsCount}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Divisi Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mencakup seluruh unit kerja operasional dan manajerial PT DJI.
          </p>
        </div>

        {/* Kategori Standar ISO */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-lg hover:border-purple-400 transition-all duration-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Hierarki Dokumen Mutu
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {documentTypesCount}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Tipe Dokumen ISO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Level 1 (Kebijakan) hingga Level 5 (Dokumen Eksternal & Standar).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Dokumen Aktif (Primary Card) */}
      <div
        onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200/90 dark:border-emerald-900/60 shadow-card hover:shadow-lg hover:border-emerald-400 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Dokumen Aktif
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-900 dark:text-white">
            {activeDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{complianceRate}% Terkendali</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-emerald-600">
          <span>Resmi Berlaku</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 2. Antrian Verifikasi (Action Needed) */}
      <div
        onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
          pendingDocs > 0
            ? 'border-amber-300 dark:border-amber-800 shadow-amber-500/10 shadow-md ring-1 ring-amber-400/30'
            : 'border-slate-200 dark:border-slate-800 shadow-card hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Perlu Tindakan
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className={`w-3.5 h-3.5 ${pendingDocs > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-900 dark:text-white">
            {pendingDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
            {pendingDocs > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                Antrian Verifikasi
              </span>
            ) : (
              <span className="text-slate-500">Antrian Kosong</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-amber-600">
          <span>Tinjau Antrian</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. Tinjauan Berkala (ISO Annual Review Due) */}
      <div
        onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
          reviewDueCount > 0
            ? 'border-orange-300 dark:border-orange-800 shadow-orange-500/10 shadow-md ring-1 ring-orange-400/30'
            : 'border-slate-200 dark:border-slate-800 shadow-card hover:border-orange-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
            Tinjauan ISO
          </span>
          <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-900 dark:text-white">
            {reviewDueCount}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-orange-700 dark:text-orange-300 font-medium">
            {reviewDueCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-orange-500 text-white font-bold">
                Jatuh Tempo &le;30h
              </span>
            ) : (
              <span className="text-slate-500">Siklus &gt; 12 Bulan</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-orange-600">
          <span>Audit Klausul 7.5</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 4. Draft Dokumen */}
      <div
        onClick={() => navigateTo('reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft'])}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-lg hover:border-sky-400 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
            Draft Dokumen
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FilePlus2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {draftDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
            <span>Belum Diajukan</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-sky-600">
          <span>Lanjutkan Draft</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 5. Obsolete */}
      <div
        onClick={() => navigateTo('ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete'])}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-lg hover:border-rose-400 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Obsolete
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Archive className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {obsoleteDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
            <span>Arsip Terkunci</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-rose-600">
          <span>Telusuri Arsip</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* 6. Ditolak / Perlu Perbaikan */}
      <div
        onClick={() => navigateTo('reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
          rejectedDocs > 0
            ? 'border-red-300 dark:border-red-800 shadow-red-500/10 shadow-md ring-1 ring-red-400/30'
            : 'border-slate-200 dark:border-slate-800 shadow-card hover:border-red-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            Ditolak / Catatan
          </span>
          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-900 dark:text-white">
            {rejectedDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-red-700 dark:text-red-300 font-medium">
            {rejectedDocs > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                Perlu Direvisi
              </span>
            ) : (
              <span className="text-slate-500">Nol Catatan</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-red-600">
          <span>Buka Catatan</span>
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
