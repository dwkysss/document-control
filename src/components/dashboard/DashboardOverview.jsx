import React from 'react';
import {
  FileText,
  ShieldCheck,
  Clock,
  Archive,
  FilePlus2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ArrowUpRight,
  Building2,
  Layers,
  History,
  Download
} from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DashboardOverview() {
  const {
    documents,
    departments,
    documentTypes,
    auditLogs,
    systemSettings,
    setViewingDocument,
    setActiveMenu,
    setBreadcrumbs
  } = useDocumentControl();

  // Metrics
  const totalDocs = documents.length;
  const activeDocs = documents.filter(d => d.status === 'AKTIF').length;
  const pendingDocs = documents.filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL').length;
  const draftDocs = documents.filter(d => d.status === 'DRAFT').length;
  const obsoleteDocs = documents.filter(d => d.status === 'OBSOLETE').length;
  const rejectedDocs = documents.filter(d => d.status === 'DITOLAK').length;

  // Periodic review check (Langkah 8 ISO 9001)
  const reviewIntervalMonths = systemSettings.periodicReviewMonths || 12;
  const reviewDueDocs = documents.filter(d => {
    if (d.status !== 'AKTIF') return false;
    const baseDateStr = d.lastReviewedDate || d.effectiveDate || d.approvedDate || d.createdDate;
    if (!baseDateStr) return false;
    const baseDate = new Date(baseDateStr);
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + reviewIntervalMonths);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 30; // Due soon or overdue
  });

  const navigateTo = (menuKey, crumbs) => {
    setActiveMenu(menuKey);
    setBreadcrumbs(crumbs);
  };

  // Distribution by department
  const deptBreakdown = departments.map(dept => ({
    name: dept.code,
    fullName: dept.name,
    count: documents.filter(d => d.department === dept.code).length
  })).sort((a, b) => b.count - a.count);

  // Distribution by type
  const typeBreakdown = documentTypes.map(type => ({
    code: type.code,
    name: type.name,
    count: documents.filter(d => d.type === type.code).length
  }));

  const recentPending = documents.filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL').slice(0, 3);
  const recentActivities = auditLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#102a4e] to-[#1e3a8a] rounded-2xl shadow-elevated p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Background decorative watermark graphic */}
        <div className="absolute right-0 top-0 bottom-0 opacity-15 hidden md:flex items-center pr-8 pointer-events-none">
          <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xs">
            <img src="/dji-logo.png" alt="DJI Logo" className="w-64 h-auto object-contain filter drop-shadow-xl" />
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-300 text-xs font-semibold mb-3">
            <div className="w-5 h-5 rounded-md bg-white p-0.5 flex items-center justify-center">
              <img src="/dji-logo.png" alt="DJI" className="w-full h-full object-contain" />
            </div>
            <span>ISO 9001:2015 Clause 7.5 &bull; {systemSettings.companyTagline || 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Selamat Datang di {systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX'} Document Control System
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Platform sentralisasi pengelolaan seluruh prosedur (SOP), instruksi kerja (IK), kebijakan, formulir operasional, dan dokumen eksternal secara akuntabel dan terverifikasi otomatis.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => navigateTo('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 transition"
            >
              <FilePlus2 className="w-4 h-4" />
              Registrasi Dokumen Baru
            </button>
            <button
              onClick={() => navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-xs font-bold border border-purple-400/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Ajukan Revisi
            </button>
            <button
              onClick={() => navigateTo('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              Unduh Master Register ISO
            </button>
          </div>
        </div>
      </div>

      {/* Peringatan Monitoring & Review Berkala (Langkah 8 & 9 ISO 9001) */}
      {reviewDueDocs.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>Monitoring & Review Berkala (Langkah 8 ISO 9001:2015)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                  {reviewDueDocs.length} Dokumen
                </span>
              </h3>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300 mt-0.5">
                Ada dokumen aktif yang telah mendekati atau melewati siklus peninjauan {reviewIntervalMonths} bulan. Harap lakukan evaluasi apakah tetap berlaku atau memerlukan revisi.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <span>Tinjau Dokumen Sekarang</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Documents */}
        <div
          onClick={() => navigateTo('ctrl-all', ['Dashboard', 'Document Control', 'Semua Dokumen'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen</span>
            <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">
            {totalDocs}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Seluruh Master</span>
            <ArrowUpRight className="w-3 h-3 text-blue-500" />
          </div>
        </div>

        {/* Dokumen Aktif */}
        <div
          onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-emerald-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Dokumen Aktif</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
            {activeDocs}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-1 font-medium">
            Resmi Terkendali
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div
          onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-amber-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {pendingDocs}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-medium">
            Perlu Tindakan
          </div>
        </div>

        {/* Draft */}
        <div
          onClick={() => navigateTo('reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-sky-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Draft</span>
            <FilePlus2 className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400 mt-2 font-mono">
            {draftDocs}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Belum Diajukan
          </div>
        </div>

        {/* Obsolete */}
        <div
          onClick={() => navigateTo('ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-rose-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Obsolete</span>
            <Archive className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2 font-mono">
            {obsoleteDocs}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-1">
            Revisi Lama
          </div>
        </div>

        {/* Ditolak */}
        <div
          onClick={() => navigateTo('reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'])}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 cursor-pointer hover:border-red-400 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Ditolak</span>
            <AlertTriangle className="w-4 h-4 text-red-600 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2 font-mono">
            {rejectedDocs}
          </div>
          <div className="text-[10px] text-red-600/80 mt-1">
            Perlu Revisi
          </div>
        </div>
      </div>

      {/* 2-Column Analytics & Verification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8-Cols: Verification Queue & Department Stats */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Pending Verification Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Antrian Verifikasi Terbaru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Dokumen yang memerlukan peninjauan verifikator</p>
              </div>
              <button
                onClick={() => navigateTo('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Lihat Semua ({pendingDocs}) &rarr;
              </button>
            </div>

            {recentPending.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Tidak ada dokumen yang menunggu verifikasi.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentPending.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.docNumber}</span>
                        <Badge status={doc.status} size="sm" />
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5" title={doc.title}>
                        {doc.title}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Oleh: {doc.creator} ({doc.department}) • Tim: {doc.verifierTeam}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setViewingDocument(doc)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border rounded-md shadow-sm transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Tinjau
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Breakdown Bar Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Sebaran Dokumen per Departemen
              </h3>
              <button
                onClick={() => navigateTo('rep-dept', ['Dashboard', 'Report', 'Dokumen per Departemen'])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Detail Laporan &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {deptBreakdown.map(dept => {
                const percentage = totalDocs > 0 ? Math.round((dept.count / totalDocs) * 100) : 0;
                return (
                  <div key={dept.name} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dept.name}</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{dept.count} Dok ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 4-Cols: Recent Activities & ISO Reminder */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ISO Annual Review Reminder Widget */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-xl shadow-card border border-indigo-200 dark:border-slate-700 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>PENGINGAT TINJAUAN ISO (ANNUAL REVIEW)</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Sesuai klausul 7.5 ISO 9001, seluruh SOP dan Instruksi Kerja yang telah aktif lebih dari <strong>12 bulan</strong> wajib ditinjau ulang relevansinya.
            </p>
            <div className="p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-lg border border-indigo-100 dark:border-slate-700 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Dokumen Siap Ditinjau:</span>
                <span className="font-bold text-indigo-600">3 Dokumen</span>
              </div>
            </div>
          </div>

          {/* Recent Audit Activities Stream */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Aktivitas Dokumen Terkini
              </h3>
              <button
                onClick={() => navigateTo('rep-history', ['Dashboard', 'Report', 'History Revision'])}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Semua Log
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.map(log => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{log.docNumber}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp.slice(11)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">{log.details}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Oleh: {log.user}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
