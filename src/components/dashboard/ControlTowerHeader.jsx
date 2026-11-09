import React from 'react';

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
    ? 'Group Holding (Multi-PT)'
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
    <div className="relative rounded-2xl bg-[#102a4e] text-white p-5 sm:p-6 shadow-sm border border-slate-800 overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left Column: Greeting & Info */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Rekan'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Selamat datang di <strong className="text-white font-semibold">{activeCompanyName} Document Control Center</strong>. 
            {isViewer
              ? ' Telusuri SOP, Instruksi Kerja, dan formulir operasional terkendali resmi yang berlaku.'
              : ' Pantau integritas siklus dokumen, status verifikasi, dan audit kepatuhan mutu secara real-time.'}
          </p>

          {/* User Profile Meta */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-300">
            <span className="font-semibold text-white tracking-wide">{currentUser?.name}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-sky-300 font-mono font-medium">{currentUser?.department}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-200 border border-blue-400/30 text-[11px] font-semibold">
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
        </div>

        {/* Right Column: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 self-start lg:self-center">
          {isViewer ? (
            <button
              onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Buka Master Dokumen Aktif
            </button>
          ) : (
            <>
              {canRegisterDocument && (
                <button
                  onClick={() => navigateTo('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  + Dokumen Baru
                </button>
              )}

              {canRequestRevision && (
                <button
                  onClick={() => navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/40 transition cursor-pointer"
                >
                  Ajukan Revisi
                </button>
              )}

              {canAccessReports && (
                <button
                  onClick={() => navigateTo('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
                  className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  title="Unduh Master Register Dokumen Terkendali ISO"
                >
                  Register ISO
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
