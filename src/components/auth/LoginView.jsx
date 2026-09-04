import React, { useState } from 'react';
import { Mail, Eye, EyeOff, X, Shield, Info, CheckCircle2, ArrowRight } from 'lucide-react';
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

  // Demo accounts configured to match the application's actual role masters
  const demoAccounts = [
    {
      role: 'System Admin',
      name: 'Dwiky Sumarlin',
      nik: '123463',
      email: 'dwiky.sumarlin@dji-indonesia.com',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
    },
    {
      role: 'Doc Control',
      name: 'Siti Nurhaliza',
      nik: '123460',
      email: 'siti.nurhaliza@dji-indonesia.com',
      badge: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300'
    },
    {
      role: 'Approver',
      name: 'Agus Setiawan',
      nik: '123458',
      email: 'agus.setiawan@dji-indonesia.com',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
    },
    {
      role: 'Staff (Creator)',
      name: 'Baban Rachmat',
      nik: '123456',
      email: 'baban.rachmat@dji-indonesia.com',
      badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
    }
  ];

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070e18] p-3 sm:p-5 font-sans antialiased text-slate-800 relative selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* Real Karl Mayer Factory Photo Background (Optimized WebP, 41 KB only - Ultra Lightweight) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <picture>
          <source srcSet="/login-bg.webp" type="image/webp" />
          <img
            src="/login-bg.jpg"
            alt="Textile Factory Floor"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover animate-kenburns select-none brightness-85 contrast-105 scale-105"
          />
        </picture>

        {/* Sophisticated Deep Corporate Overlay for 100% Card Contrast & Legibility */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#060e1b]/92 via-[#0a1628]/85 to-[#0e213d]/80 backdrop-blur-[2px]" />
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-[550px] h-[350px] bg-sky-400/10 rounded-full blur-[130px]" />
      </div>

      {/* Main Split Card Container - Elevated & Perfectly Centered */}
      <div className="w-full max-w-4xl lg:max-w-[890px] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),0_0_50px_rgba(37,99,235,0.15)] border border-slate-200/60 overflow-hidden flex flex-col md:flex-row relative z-10 my-auto">

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
          <div className="flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
                <img src="/dji-logo.png" alt="PT DJI Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-white tracking-tight block leading-none">
                  {systemSettings.companyName || 'PT DJI'}
                </span>
                <span className="text-[9px] font-bold text-sky-400 tracking-wider block mt-0.5">
                  DOCUMENT CONTROL SYSTEM
                </span>
              </div>
            </div>

            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-sky-300 border border-sky-500/40 shadow-xs">
              ISO 9001:2015
            </span>
          </div>

          {/* Center 3D Interactive Floating Machine Element */}
          <div className="my-auto py-2 relative flex flex-col items-center justify-center z-10">
            
            {/* Minimalist Graphic Accent Elements */}
            <div className="absolute -top-4 -right-1 flex flex-col gap-1.5 opacity-60 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="w-6 h-2 rounded-full bg-sky-400"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="w-6 h-2 rounded-full bg-blue-500"></span>
              </div>
            </div>

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

              {/* Pure Transparent 3D Machine Silhouette */}
              <div className="relative w-full flex items-center justify-center z-10">
                <img
                  src="/login-machine-blueprint.png"
                  alt="Textile Machine 3D Element"
                  style={{
                    filter: 'drop-shadow(0 14px 28px rgba(56, 189, 248, 0.3)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))',
                  }}
                  className="w-full h-auto max-h-[220px] sm:max-h-[250px] object-contain select-none pointer-events-none transform transition-transform duration-500 hover:scale-102"
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

          {/* Bottom balancing space */}
          <div className="h-2" />

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

            {/* Divider "Or Continue With" */}
            <div className="flex items-center my-3.5">
              <div className="flex-1 border-t border-slate-200"></div>
              <span className="px-3 text-[10px] text-slate-400 font-medium">
                Or Continue With
              </span>
              <div className="flex-1 border-t border-slate-200"></div>
            </div>

            {/* Social / Quick Role Switcher Buttons */}
            <div className="flex items-center justify-center gap-3.5">
              
              {/* Google Button -> Quick Login Admin (Dwiky) */}
              <button
                type="button"
                onClick={() => handleQuickLogin(demoAccounts[0])}
                title="Login Cepat: Admin (Dwiky Sumarlin)"
                className="w-10 h-10 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center shadow-xs transition group cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </button>

              {/* Facebook Button -> Quick Login Approver (Agus Setiawan) */}
              <button
                type="button"
                onClick={() => handleQuickLogin(demoAccounts[2])}
                title="Login Cepat: Approver (Agus Setiawan)"
                className="w-10 h-10 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center shadow-xs transition group cursor-pointer"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Apple Button -> Quick Login Doc Control (Siti Nurhaliza) */}
              <button
                type="button"
                onClick={() => handleQuickLogin(demoAccounts[1])}
                title="Login Cepat: Doc Control (Siti Nurhaliza)"
                className="w-10 h-10 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center shadow-xs transition group cursor-pointer"
              >
                <svg className="w-4 h-4 fill-[#0a1628]" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-1 .04-2.18.67-2.87 1.48-.56.64-1.06 1.7-1.01 2.74 1.13.09 2.25-.6 2.87-1.35z" />
                </svg>
              </button>

            </div>

            {/* Quick Role Tester Bar */}
            <div className="mt-3 pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowQuickRoles(!showQuickRoles)}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 focus:outline-none uppercase tracking-wider transition inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Uji Cepat Role Karyawan ({showQuickRoles ? 'Tutup' : 'Buka'})</span>
              </button>

              {showQuickRoles && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 animate-fade-in text-left">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.nik}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition group cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-1 rounded border ${acc.badge}`}>
                          {acc.role}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 group-hover:text-blue-600 transition">
                          {acc.nik}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                        {acc.name}
                      </div>
                    </button>
                  ))}
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

          {/* Bottom Security clause note */}
          <div className="pt-1 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            <span>Akses sistem terkendali ISO 9001:2015 Clause 7.5</span>
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
                    handleQuickLogin(demoAccounts[0]);
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
                  <div className="font-bold text-slate-800">siti.nurhaliza@dji-indonesia.com</div>
                  <div className="text-[11px] text-slate-500">Document Control Officer</div>
                </div>
                <button
                  onClick={() => {
                    handleQuickLogin(demoAccounts[1]);
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
