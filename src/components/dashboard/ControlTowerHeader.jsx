import React from 'react';
import { ClipboardList, FilePenLine, FilePlus2, FolderOpen } from 'lucide-react';

export default function ControlTowerHeader({
  currentUser,
  systemSettings,
  companies = [],
  selectedCompanyFilter = 'ALL',
  isViewer,
  canRegisterDocument,
  canRequestRevision,
  canAccessReports,
  navigateTo
}) {
  // Active company resolution matching global header filter & user session
  const activeCompanyCode = (currentUser?.companyCode && currentUser.companyCode !== 'ALL')
    ? currentUser.companyCode
    : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'ALL');

  const activeCompanyObj = (companies || []).find(c => c.code === activeCompanyCode);
  const activeCompanyName = activeCompanyCode === 'ALL'
    ? 'Document Control Center'
    : (activeCompanyObj?.name || (activeCompanyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : activeCompanyCode === 'IMK' ? 'PT IMK' : (systemSettings?.companyName || 'PT Dentelle Jaya Infinitex')));
  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'doc_control':
        return 'Document Control Officer (DCO)';
      case 'approver':
        return 'Management Representative (Approver)';
      case 'reviewer':
        return 'Verifikator & Reviewer';
      case 'staff':
        return 'Operational Staff';
      case 'viewer':
        return 'Controlled Copy Viewer';
      default:
        return 'User';
    }
  };

  return (
    <div className="relative rounded-2xl bg-[#102a4e] text-white p-4 sm:p-6 shadow-sm border border-slate-800 overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5">
        {/* Left Column: Greeting & Info */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
            {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Rekan'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Selamat datang di <strong className="text-white font-semibold">{activeCompanyCode === 'ALL' ? 'Document Control Center' : `${activeCompanyName} Document Control Center`}</strong>. 
            {isViewer
              ? ' Telusuri SOP, Instruksi Kerja, dan formulir operasional terkendali resmi yang berlaku.'
              : ' Pantau integritas siklus dokumen, status verifikasi, dan audit kepatuhan mutu secara real-time.'}
          </p>

          {/* User Profile Meta */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-xs text-slate-300">
            <span className="font-semibold text-white tracking-wide">{currentUser?.name}</span>
            <span className="h-3 w-px bg-slate-500/80" aria-hidden="true" />
            <span className="font-mono font-medium text-sky-300">{currentUser?.department}</span>
            <span className="h-3 w-px bg-slate-500/80" aria-hidden="true" />
            <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-200">
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
        </div>

        {/* Right Column: Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2.5 md:w-auto flex-shrink-0">
          {isViewer ? (
            <button
              type="button"
              onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
              className="relative h-14 w-full rounded-xl bg-emerald-600 text-white shadow-xs transition hover:bg-emerald-500 active:scale-98 md:h-12 md:w-auto md:px-4 flex items-center justify-center gap-2 cursor-pointer"
              aria-label="Buka Master Dokumen Aktif"
              title="Buka Master Dokumen Aktif"
            >
              <FolderOpen className="h-5 w-5" aria-hidden="true" />
              <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold leading-none text-emerald-100 md:hidden">Aktif</span>
              <span className="hidden md:inline text-xs font-bold">Dokumen Aktif</span>
            </button>
          ) : (
            <>
              {canRegisterDocument && (
                <button
                  type="button"
                  onClick={() => navigateTo('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
                  className="relative h-14 w-full rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-500 active:scale-98 md:h-12 md:w-auto md:px-4 flex items-center justify-center gap-2 cursor-pointer"
                  aria-label="Buat dokumen baru"
                  title="Buat dokumen baru"
                >
                  <FilePlus2 className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold leading-none text-blue-100 md:hidden">Baru</span>
                  <span className="hidden md:inline text-xs font-bold">Dokumen Baru</span>
                </button>
              )}

              {canRequestRevision && (
                <button
                  type="button"
                  onClick={() => navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
                  className="relative h-14 w-full rounded-xl border border-indigo-500/40 bg-slate-800 text-indigo-200 transition hover:bg-slate-700 hover:text-white active:scale-98 md:h-12 md:w-auto md:px-4 flex items-center justify-center gap-2 cursor-pointer"
                  aria-label="Ajukan revisi dokumen"
                  title="Ajukan revisi dokumen"
                >
                  <FilePenLine className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold leading-none text-indigo-200 md:hidden">Revisi</span>
                  <span className="hidden md:inline text-xs font-bold">Ajukan Revisi</span>
                </button>
              )}

              {canAccessReports && (
                <button
                  type="button"
                  onClick={() => navigateTo('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
                  className="relative h-14 w-full rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-98 md:h-12 md:w-auto md:px-4 flex items-center justify-center gap-2 cursor-pointer"
                  aria-label="Buka register dokumen ISO"
                  title="Buka register dokumen ISO"
                >
                  <ClipboardList className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold leading-none text-slate-300 md:hidden">Register</span>
                  <span className="hidden md:inline text-xs font-semibold">Register ISO</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
