import React from 'react';

export default function ControlTowerHeader({
  currentUser,
  systemSettings,
  isViewer,
  canRegisterDocument,
  canRequestRevision,
  canAccessReports,
  navigateTo
}) {
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
    <div className="relative rounded-2xl bg-gradient-to-br from-[#071326] via-[#0d2244] to-[#143265] text-white p-5 sm:p-6 shadow-elevated border border-blue-950/60 overflow-hidden">
      {/* Background Decorative Patterns */}
      <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Subtle Grid Watermark Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left Column: Greeting & Info */}
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {getGreeting()}, {currentUser?.name?.split(' ')[0] || 'Rekan'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Selamat datang di <strong className="text-white font-semibold">{systemSettings?.companyName || 'PT DJI'} Document Control Center</strong>. 
            {isViewer
              ? ' Telusuri SOP, Instruksi Kerja, dan formulir operasional terkendali resmi yang berlaku.'
              : ' Pantau integritas siklus dokumen, status verifikasi, dan audit kepatuhan mutu secara real-time.'}
          </p>

          {/* User Profile Meta */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-300">
            <span className="font-semibold text-white tracking-wide">{currentUser?.name}</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-sky-300 font-mono font-medium">{currentUser?.department}</span>
            <span className="text-slate-500">&bull;</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-200 border border-blue-400/30 text-[11px] font-medium">
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
        </div>

        {/* Right Column: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 self-start lg:self-center">
          {isViewer ? (
            <button
              onClick={() => navigateTo('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Buka Master Dokumen Aktif
            </button>
          ) : (
            <>
              {canRegisterDocument && (
                <button
                  onClick={() => navigateTo('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  + Dokumen Baru
                </button>
              )}

              {canRequestRevision && (
                <button
                  onClick={() => navigateTo('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
                  className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-indigo-200 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Ajukan Revisi
                </button>
              )}

              {canAccessReports && (
                <button
                  onClick={() => navigateTo('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
                  className="px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/60 transition"
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
