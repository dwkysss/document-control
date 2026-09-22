import React, { useState } from 'react';
import { Mail, Eye, EyeOff, X, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function LoginView() {
  const { login, employees, systemSettings, showToast } = useDocumentControl();
  const [identifier, setIdentifier] = useState('dwiky.sumarlin@dji-indonesia.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(null); // 'forgot' | 'signup' | null
  const [showQuickRoles, setShowQuickRoles] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Fallback list of PT DJI actual registered employees
  const fallbackRealEmployees = [
    { nik: 'DJI092115', name: 'DENI RAMDAN', department: 'MGMT', position: 'GENERAL MANAGER', email: 'deni.ramdan@dji-indonesia.com', role: 'approver' },
    { nik: 'DJI022203', name: 'DEDE SUHENDA', department: 'PRODUKSI', position: 'KEPALA BAGIAN PRODUKSI', email: 'dede.suhenda@dji-indonesia.com', role: 'reviewer' },
    { nik: 'DJI012548', name: 'BABAN RACHMAT SUBAGJA', department: 'HRGA', position: 'MANAGER HRGA & MR', email: 'baban.rachmat.subagja@dji-indonesia.com', role: 'approver' },
    { nik: '123463', name: 'Dwiky Sumarlin', department: 'IT', position: 'Lead Systems Engineer', email: 'dwiky.sumarlin@dji-indonesia.com', role: 'admin' },
    { nik: 'DJI022550', name: 'SYAHLA NOVIYANA', department: 'FAT', position: 'DOCUMENT CONTROL OFFICER', email: 'syahla.noviyana@dji-indonesia.com', role: 'doc_control' },
    { nik: 'DJI102216', name: 'ZARRAH ALI MARIFAH', department: 'FAT', position: 'STAFF ACCOUNTING FINANCE', email: 'zarrah.ali.marifah@dji-indonesia.com', role: 'staff' },
    { nik: 'DJI032207', name: 'SITI NURDIANTI', department: 'PRODUKSI', position: 'STAFF PPIC', email: 'siti.nurdianti@dji-indonesia.com', role: 'staff' },
    { nik: 'DJI012202', name: 'ASIVA SITI FAUJIAH', department: 'PRODUKSI', position: 'STAFF ADM PRODUKSI', email: 'asiva.siti.faujiah@dji-indonesia.com', role: 'staff' },
    { nik: 'DJI042211', name: 'AHMAD FAUZI', department: 'PRODUKSI', position: 'OPERATOR PRODUKSI', email: 'ahmad.fauzi@dji-indonesia.com', role: 'viewer' },
    { nik: 'DJI052219', name: 'NURUL HIDAYAH', department: 'FAT', position: 'OPERATOR ADM KEUANGAN', email: 'nurul.hidayah@dji-indonesia.com', role: 'viewer' },
  ];

  // Exclude legacy dummy demo NIKs to ensure only 100% real accounts are shown
  const dummyNiks = ['123456', '123457', '123458', '123459', '123460', '123461', '123462'];
  const realEmployees = (employees && employees.length > 0)
    ? employees.filter(e => e.status !== 'Nonaktif' && !dummyNiks.includes(String(e.nik || '').trim()))
    : fallbackRealEmployees;

  const quickLoginList = realEmployees.length > 0 ? realEmployees : fallbackRealEmployees;

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'doc_control':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'approver':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'reviewer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'viewer':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'staff':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'SYSTEM ADMIN';
      case 'doc_control': return 'DOC CONTROL';
      case 'approver': return 'APPROVER (MR)';
      case 'reviewer': return 'REVIEWER';
      case 'viewer': return 'KARYAWAN (VIEWER)';
      case 'staff': default: return 'STAFF';
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      showToast('Silakan masukkan Email atau NIP karyawan!', 'danger');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(cleanId, password);
      setIsLoading(false);
    }, 200);
  };

  const handleQuickLogin = (account) => {
    setIdentifier(account.email);
    setPassword('••••••••');
    setIsLoading(true);
    setTimeout(() => {
      login(account.nik);
      setIsLoading(false);
    }, 200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100/80 p-3 sm:p-5 font-sans antialiased text-slate-800 relative selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* Subtle Soft Ambient Light Accents */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-blue-100/60 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[350px] bg-sky-100/50 rounded-full blur-[130px]" />
      </div>

      {/* Main Split Card Container - Elevated & Perfectly Centered */}
      <div className="w-full max-w-4xl lg:max-w-[890px] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-200/90 overflow-hidden flex flex-col md:flex-row relative z-10 my-auto">

        {/* ================= LEFT COLUMN: PT DJI Dark Navy Brand Panel ================= */}
        <div 
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
            setMousePos({ x, y });
          }}
          onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
          className="w-full md:w-[48%] bg-[#0a1628] p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden text-white min-h-[300px] md:min-h-[480px] group cursor-default"
        >
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

          {/* Top Brand Header (Matches the App's Sidebar Brand) */}
          <div className="flex items-center justify-between z-10 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
                <img src="/dji-logo.png" alt="PT DJI Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-brand font-black text-[20px] text-white tracking-wider block leading-tight">
                  {systemSettings.companyName || 'PT DJI'}
                </span>
              </div>
            </div>
          </div>

          {/* Center 3D Interactive Floating Machine Element */}
          <div className="my-auto py-2 relative flex flex-col items-center justify-center z-10">
            


            {/* 3D Floating Stage Container with Interactive Parallax */}
            <div 
              style={{
                transform: `perspective(900px) rotateY(${mousePos.x || -6}deg) rotateX(${mousePos.y || 6}deg) translateZ(25px)`,
                transition: mousePos.x === 0 ? 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 0.1s ease-out',
                transformStyle: 'preserve-3d'
              }}
              className="relative w-full flex flex-col items-center justify-center my-1"
            >
              {/* Subtle 3D Spatial Grid Backdrop */}
              <div 
                className="absolute inset-0 -inset-x-4 opacity-15 pointer-events-none rounded-2xl"
                style={{
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                  transform: 'translateZ(-15px) scale(0.95)'
                }}
              />

              {/* Pure Transparent 3D Document Archive Silhouette */}
              <div className="relative w-full flex items-center justify-center z-10">
                <img
                  src="/login-doc-blueprint.png"
                  alt="Digital Document Archive 3D Element"
                  style={{
                    filter: 'drop-shadow(0 14px 28px rgba(56, 189, 248, 0.3)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))',
                  }}
                  className="w-full h-auto max-h-[220px] sm:max-h-[245px] object-contain select-none pointer-events-none transform transition-transform duration-500 hover:scale-102"
                />
              </div>

              {/* 3D Ground Contact Shadow & Cyan Floor Glow Plane */}
              <div 
                className="w-4/5 h-6 mt-2 bg-gradient-to-r from-transparent via-sky-400/30 to-transparent rounded-[100%] blur-md pointer-events-none"
                style={{
                  transform: 'rotateX(78deg) translateZ(-15px) scaleY(0.7)',
                }}
              />
            </div>

          </div>

          {/* Bottom Brand Title: DOCUMENT CONTROL SYSTEM */}
          <div className="z-10 mt-auto pt-2 pb-1 flex items-center justify-center gap-3">
            <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-sky-400/50" />
            <span className="font-tech font-bold text-[10.5px] sm:text-[11.5px] text-sky-400 tracking-[0.25em] uppercase select-none text-center">
              DOCUMENT CONTROL SYSTEM
            </span>
            <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-sky-400/50" />
          </div>

        </div>


        {/* ================= RIGHT COLUMN: Form Panel (Enterprise Clean White) ================= */}
        <div className="w-full md:w-[52%] p-6 sm:p-7 lg:p-8 flex flex-col justify-between relative bg-white">
          
          {/* Top Close Button (X) */}
          <button
            type="button"
            onClick={() => {
              setIdentifier('');
              setPassword('');
              showToast('Formulir login di-reset.', 'info');
            }}
            title="Reset Form"
            className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-[340px] mx-auto my-auto py-1">
            
            {/* Heading */}
            <div className="text-center mb-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a1628] tracking-tight">
                Login
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Masuk ke Portal Document Control
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              
              {/* Email / NIP Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email atau NIP
                </label>
                <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-2 bg-white transition shadow-xs">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="w-[1px] h-3.5 bg-slate-300 mx-2.5 shrink-0" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@dji-indonesia.com / 123463"
                    className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-2 bg-white transition shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 shrink-0 transition cursor-pointer"
                    title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <div className="w-[1px] h-3.5 bg-slate-300 mx-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInfoModal('forgot')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Main Submit Button (PT DJI Blue #2563eb / #1d4ed8) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Role Tester Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowQuickRoles(!showQuickRoles)}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 focus:outline-none uppercase tracking-wider transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Uji Cepat Role Karyawan ({showQuickRoles ? 'Tutup' : 'Buka'})</span>
              </button>

              {showQuickRoles && (
                <div className="mt-2 p-2 bg-slate-50/90 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Personil Terdaftar ({quickLoginList.length})
                    </span>
                    <span className="text-[9px] text-slate-400">Pilih untuk login cepat</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-0.5 scrollbar-thin">
                    {quickLoginList.map((acc) => (
                      <button
                        key={acc.nik}
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xs text-left transition group cursor-pointer focus:outline-none"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[8px] font-bold px-1 rounded border ${getRoleBadge(acc.role)}`}>
                            {getRoleLabel(acc.role)}
                          </span>
                          <span className="font-mono text-[8.5px] font-semibold text-slate-400 group-hover:text-blue-600 transition truncate">
                            {acc.nik}
                          </span>
                        </div>
                        <div className="text-[10.5px] font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                          {acc.name}
                        </div>
                        <div className="text-[8.5px] text-slate-500 truncate mt-0.5">
                          {acc.department} • {acc.position}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Text */}
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-600">
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowInfoModal('signup')}
                  className="font-bold underline text-blue-600 hover:text-blue-800 transition cursor-pointer"
                >
                  Sign Up here
                </button>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Info / Feedback Modal for Forgot Password or Sign Up */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800 relative">
            <button
              onClick={() => setShowInfoModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Info className="w-5 h-5" />
            </div>

            {showInfoModal === 'forgot' ? (
              <>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Lupa Kata Sandi?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Sesuai prosedur keamanan ISO 27001 & Dokumen Kontrol PT DJI, reset kata sandi akun karyawan dilakukan oleh IT Administrator.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
                  <div className="text-slate-500">Kontak Admin IT:</div>
                  <div className="font-bold text-slate-800">dwiky.sumarlin@dji-indonesia.com</div>
                  <div className="text-[11px] text-slate-500">NIP: 123463 (Lead Systems Engineer)</div>
                </div>
                <button
                  onClick={() => {
                    const itAdmin = quickLoginList.find(e => e.nik === '123463') || quickLoginList[0];
                    if (itAdmin) handleQuickLogin(itAdmin);
                    setShowInfoModal(null);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Masuk sebagai IT Admin Sekarang
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Registrasi Akun Baru
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Akun pengguna baru dikonfigurasi melalui Master Karyawan oleh Departemen HRGA / Doc Control sesuai penugasan wewenang (Staff, Approver, Doc Control).
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
                  <div className="text-slate-500">Pusat Bantuan HRGA:</div>
                  <div className="font-bold text-slate-800">syahla.noviyana@dji-indonesia.com</div>
                  <div className="text-[11px] text-slate-500">Document Control Officer</div>
                </div>
                <button
                  onClick={() => {
                    const dcOfficer = quickLoginList.find(e => e.role === 'doc_control') || quickLoginList[0];
                    if (dcOfficer) handleQuickLogin(dcOfficer);
                    setShowInfoModal(null);
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  Masuk sebagai Doc Control
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
