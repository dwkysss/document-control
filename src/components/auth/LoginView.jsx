import React, { useState } from 'react';
import { Mail, Eye, EyeOff, X, Info, CheckCircle2, ArrowRight, User, Building2, Briefcase, Lock, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function LoginView() {
  const { login, registerUser, requestPasswordReset, departments, companies, systemSettings, showToast } = useDocumentControl();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'success' | 'forgot-success'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Signup Form State
  const [signupForm, setSignupForm] = useState({
    name: '',
    nip: '',
    email: '',
    companyCode: 'DJI',
    department: 'FAT',
    position: '',
    password: '',
    confirmPassword: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Forgot Password Form State
  const [forgotForm, setForgotForm] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [resetRequestedUser, setResetRequestedUser] = useState(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      showToast('Silakan masukkan Email atau NIP pegawai!', 'danger');
      return;
    }

    setIsLoading(true);
    login(cleanId, password).finally(() => setIsLoading(false));
  };

  const handleSignupSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!signupForm.name.trim() || !signupForm.nip.trim() || !signupForm.email.trim() || !signupForm.password) {
      showToast('Harap lengkapi semua data wajib!', 'danger');
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      showToast('Konfirmasi kata sandi tidak cocok!', 'danger');
      return;
    }

    if (signupForm.password.length < 6) {
      showToast('Kata sandi minimal 6 karakter!', 'danger');
      return;
    }

    setIsLoading(true);
    const targetComp = (companies || []).find(c => c.code === signupForm.companyCode);
    const compName = targetComp?.name || (signupForm.companyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : signupForm.companyCode === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');

    const res = await registerUser({
      name: signupForm.name.trim(),
      nip: signupForm.nip.trim().toUpperCase(),
      email: signupForm.email.trim().toLowerCase(),
      companyCode: signupForm.companyCode,
      companyName: compName,
      department: signupForm.department,
      position: signupForm.position.trim() || 'Staff',
      password: signupForm.password,
    });

    setIsLoading(false);

    if (res.success) {
      setRegisteredUser({
        name: signupForm.name.trim(),
        nip: signupForm.nip.trim().toUpperCase(),
        companyName: compName,
        department: signupForm.department,
      });
      setAuthMode('success');
      showToast('Pendaftaran akun berhasil diajukan!', 'success');
    } else {
      showToast(res.message || 'Gagal mendaftarkan akun.', 'danger');
    }
  };

  const handleForgotSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanId = forgotForm.identifier.trim();
    if (!cleanId) {
      showToast('Harap masukkan NIP atau Email terdaftar!', 'danger');
      return;
    }
    if (!forgotForm.newPassword || forgotForm.newPassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter!', 'danger');
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok!', 'danger');
      return;
    }

    setIsForgotLoading(true);
    const res = await requestPasswordReset({
      identifier: cleanId,
      newPassword: forgotForm.newPassword
    });
    setIsForgotLoading(false);

    if (res.success) {
      setResetRequestedUser(res.employee);
      setAuthMode('forgot-success');
      showToast('Permintaan reset sandi berhasil diajukan!', 'success');
    } else {
      showToast(res.message || 'Gagal mengajukan reset kata sandi.', 'danger');
    }
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
          <div className="w-full max-w-[380px] mx-auto my-auto py-1">
            
            {/* ================= MODE: LOGIN ================= */}
            {authMode === 'login' && (
              <>
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email atau NIP (Nomor Induk Pegawai)
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-2 bg-white transition shadow-xs">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="w-[1px] h-3.5 bg-slate-300 mx-2.5 shrink-0" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-2 bg-white transition shadow-xs">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-500 hover:text-slate-700 p-1 rounded transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
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
                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

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

                <div className="mt-3 text-center">
                  <p className="text-xs text-slate-600">
                    Don’t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="font-bold underline text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      Sign Up here
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* ================= MODE: SIGN UP ================= */}
            {authMode === 'signup' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Verifikasi Admin/MR
                  </span>
                </div>

                <div className="mb-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1628] tracking-tight">
                    Pendaftaran Akun
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Isi data personil Anda untuk pengesahan akses sistem
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Nama Lengkap Pegawai <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 rounded-lg px-2.5 py-1.5 bg-white transition shadow-xs">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full ml-2 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Grid: NIP & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        NIP Pegawai <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={signupForm.nip}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, nip: e.target.value }))}
                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 focus:outline-none uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Grid: Perusahaan & Departemen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Perusahaan (PT) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={signupForm.companyCode}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, companyCode: e.target.value }))}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value="DJI">PT Dentelle Jaya Infinitex</option>
                        <option value="UMI">PT Ultimo Moda Indotex</option>
                        <option value="IMK">PT IMK</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Departemen <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={signupForm.department}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value="FAT">FAT (Finance & Accounting)</option>
                        <option value="PRODUKSI">PRODUKSI</option>
                        <option value="HRGA">HRGA & MR</option>
                        <option value="IT">IT (Information Technology)</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="QAQC">QA / QC (Quality Assurance)</option>
                        <option value="PPIC">PPIC</option>
                        <option value="GUDANG">GUDANG / WAREHOUSE</option>
                        <option value="MGMT">MANAGEMENT</option>
                        <option value="UMUM">UMUM</option>
                      </select>
                    </div>
                  </div>

                  {/* Jabatan / Posisi */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Jabatan / Posisi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={signupForm.position}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Contoh: Staff Accounting / Operator / Leader"
                      className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Grid: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 rounded-lg px-2 py-1.5 bg-white">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={signupForm.password}
                          onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Min 6 karakter"
                          className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none pr-6"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2 text-slate-400 hover:text-slate-600"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Ulangi Sandi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Ketik ulang sandi"
                        className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-white border border-slate-300 focus:border-blue-600 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-tight flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Akun baru berstatus <em>Menunggu Persetujuan</em> dan akan disahkan oleh <strong>Admin / MR</strong> sebelum dapat login.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                  >
                    {isLoading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Ajukan Pendaftaran Akun</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-600">
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold underline text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ================= MODE: FORGOT PASSWORD ================= */}
            {authMode === 'forgot' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Verifikasi Admin/MR
                  </span>
                </div>

                <div className="mb-4">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1628] tracking-tight">
                    Reset Kata Sandi
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Ajukan perubahan kata sandi untuk diverifikasi oleh Admin / MR
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      NIP atau Email Pegawai <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 rounded-lg px-2.5 py-1.5 bg-white transition shadow-xs">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={forgotForm.identifier}
                        onChange={(e) => setForgotForm(prev => ({ ...prev, identifier: e.target.value }))}
                        className="w-full ml-2 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 rounded-lg px-2.5 py-1.5 bg-white transition shadow-xs">
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
                        tabIndex={-1}
                      >
                        {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        value={forgotForm.newPassword}
                        onChange={(e) => setForgotForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Minimal 6 karakter"
                        className="w-full ml-2 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center border border-slate-300 focus-within:border-blue-600 rounded-lg px-2.5 py-1.5 bg-white transition shadow-xs">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        value={forgotForm.confirmPassword}
                        onChange={(e) => setForgotForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Ketik ulang kata sandi baru"
                        className="w-full ml-2 text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Policy Notice */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">Kebijakan Akses:</span> Pengajuan reset kata sandi akan diverifikasi oleh Admin/MR demi integritas keamanan dokumen.
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                  >
                    {isForgotLoading ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Ajukan Reset Sandi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-3 text-center">
                  <p className="text-xs text-slate-600">
                    Ingat kata sandi Anda?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="font-bold underline text-blue-600 hover:text-blue-800 transition cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ================= MODE: FORGOT SUCCESS CONFIRMATION ================= */}
            {authMode === 'forgot-success' && (
              <div className="text-center py-2 animate-fade-in space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Permintaan Reset Terkirim!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pengajuan perubahan kata sandi Anda telah dicatat dalam sistem.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pegawai:</span>
                    <span className="font-bold text-slate-800">{resetRequestedUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIP:</span>
                    <span className="font-mono font-bold text-slate-800">{resetRequestedUser?.nip}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Status Permintaan:</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Menunggu Verifikasi Admin / MR
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Begitu permintaan disahkan oleh <strong>System Admin (Dwiky)</strong> atau <strong>Management Representative (MR)</strong>, Anda dapat langsung login menggunakan kata sandi baru tersebut.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIdentifier(resetRequestedUser?.nip || '');
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            )}

            {/* ================= MODE: SUCCESS CONFIRMATION ================= */}
            {authMode === 'success' && (
              <div className="text-center py-2 animate-fade-in space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Pendaftaran Berhasil Dikirim!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Permohonan akun Anda telah dicatat dalam sistem.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama:</span>
                    <span className="font-bold text-slate-800">{registeredUser?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIP:</span>
                    <span className="font-mono font-bold text-slate-800">{registeredUser?.nip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Perusahaan:</span>
                    <span className="font-semibold text-slate-700">{registeredUser?.companyName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Status Akun:</span>
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Menunggu Persetujuan Admin / MR
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Silakan hubungi <strong>System Admin (Dwiky)</strong> atau <strong>Management Representative (MR)</strong> di perusahaan Anda untuk verifikasi dan pengesahan hak akses.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setIdentifier(registeredUser?.nip || '');
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
