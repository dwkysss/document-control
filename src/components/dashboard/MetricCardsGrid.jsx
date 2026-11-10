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
          className="group relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Dokumen Aktif Terkendali
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-950 dark:text-emerald-100">
              {activeDocs}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Controlled Copies
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Resmi disetujui & siap digunakan dalam operasional kerja harian.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span>Buka Katalog SOP & IK</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Departemen Terdaftar */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 hover:shadow-sm transition overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
              Departemen Operasional
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {departmentsCount}
            </span>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Divisi Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Mencakup seluruh unit kerja operasional dan manajerial resmi perusahaan.
          </p>
        </div>

        {/* Kategori Standar ISO */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 hover:shadow-sm transition overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400">
              Hierarki Dokumen Mutu
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              {documentTypesCount}
            </span>
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
              Tipe Dokumen ISO
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Level 1 (Kebijakan) hingga Level 5 (Dokumen Eksternal & Standar).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
      {/* 1. Dokumen Aktif (Primary Card) */}
      <div
        onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
        className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs hover:border-emerald-500 hover:shadow-sm transition cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Dokumen Aktif
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950 dark:text-emerald-100">
            {activeDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{complianceRate}% Terkendali</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span>Katalog Aktif</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 2. Antrian Verifikasi (Action Needed) */}
      <div
        onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-xl p-4 border transition cursor-pointer overflow-hidden flex flex-col justify-between ${
          pendingDocs > 0
            ? 'border-amber-400/90 dark:border-amber-700 shadow-xs bg-amber-50/20 dark:bg-amber-950/10'
            : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Verifikasi DCO
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-950 dark:text-amber-100">
            {pendingDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            {pendingDocs > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700">
                Menunggu Review
              </span>
            ) : (
              <span className="text-slate-500">Antrian Kosong</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-400">
          <span>Periksa Antrian</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 3. Tinjauan Berkala (ISO Annual Review Due) */}
      <div
        onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-xl p-4 border transition cursor-pointer overflow-hidden flex flex-col justify-between ${
          reviewDueCount > 0
            ? 'border-orange-400/90 dark:border-orange-700 shadow-xs bg-orange-50/20 dark:bg-orange-950/10'
            : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-orange-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-400">
            Tinjauan ISO
          </span>
          <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-orange-950 dark:text-orange-100">
            {reviewDueCount}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-orange-800 dark:text-orange-300 font-medium">
            {reviewDueCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200 font-bold border border-orange-300 dark:border-orange-700">
                Jatuh Tempo &le;30h
              </span>
            ) : (
              <span className="text-slate-500">Siklus Terkendali</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-orange-800 dark:text-orange-400">
          <span>Evaluasi Dokumen</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 4. Draft Dokumen */}
      <div
        onClick={() => navigateTo('reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft'])}
        className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500 hover:shadow-sm transition cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400">
            Draft Usulan
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
            <FilePlus2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {draftDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
            <span>Konsep Belum Diajukan</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-sky-700 dark:text-sky-400">
          <span>Buka Draft</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 5. Obsolete */}
      <div
        onClick={() => navigateTo('ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete'])}
        className="group relative bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-400 hover:shadow-sm transition cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Obsolete
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
            <Archive className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {obsoleteDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
            <span>Arsip Tidak Berlaku</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          <span>Telusuri Arsip</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* 6. Ditolak / Perlu Perbaikan */}
      <div
        onClick={() => navigateTo('reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'])}
        className={`group relative bg-white dark:bg-slate-900 rounded-xl p-4 border transition cursor-pointer overflow-hidden flex flex-col justify-between ${
          rejectedDocs > 0
            ? 'border-red-400/90 dark:border-red-700 shadow-xs bg-red-50/20 dark:bg-red-950/10'
            : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-red-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 dark:text-red-400">
            Catatan Revisi
          </span>
          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-950 dark:text-red-100">
            {rejectedDocs}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-red-800 dark:text-red-300 font-medium">
            {rejectedDocs > 0 ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-200 font-bold border border-red-300 dark:border-red-700">
                Perlu Perbaikan
              </span>
            ) : (
              <span className="text-slate-500">Nol Catatan</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-red-800 dark:text-red-400">
          <span>Buka Koreksi</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  );
}
