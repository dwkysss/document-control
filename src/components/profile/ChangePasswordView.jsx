import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ShieldCheck, ArrowLeft, User, Building2, Briefcase, Shield } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ChangePasswordView() {
  const { currentUser, changeUserPassword, setActiveMenu, showToast } = useDocumentControl();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak sesuai!');
      return;
    }

    if (currentPassword && currentPassword === newPassword) {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi saat ini!');
      return;
    }

    setIsLoading(true);
    const res = await changeUserPassword(currentPassword, newPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Kata sandi Anda berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } else {
      setErrorMsg(res.message || 'Gagal memperbarui kata sandi. Pastikan kata sandi saat ini benar.');
    }
  };

  const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
  const isMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-2xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ubah Kata Sandi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola keamanan akun dan perbarui kata sandi login personil
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveMenu('dashboard')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs hover:shadow-xs active:scale-98"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>

      {/* Main Grid: Profile Info & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Personnel Account Profile Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                {currentUser?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={currentUser?.name}>
                  {currentUser?.name || 'Nama Personil'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={currentUser?.position}>
                  {currentUser?.position || 'Staff'}
                </p>
                <div className="mt-1">
                  <span className="uppercase text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {currentUser?.role || 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">NIP Pegawai</p>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {currentUser?.nip || currentUser?.nik || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Perusahaan & Dept</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {currentUser?.companyName || 'PT Dentelle Jaya Infinitex'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Departemen: <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser?.department || '-'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Status Akun</p>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aktif & Terverifikasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Best Practice Notice */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/60 p-4 text-xs text-blue-900 dark:text-blue-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Petunjuk Keamanan Akun</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
              <li>Gunakan minimal 6 karakter.</li>
              <li>Kombinasikan huruf besar, kecil, angka, atau simbol.</li>
              <li>Jangan berikan kata sandi Anda kepada orang lain.</li>
              <li>Bagi pegawai yang belum pernah mengganti sandi, gunakan sandi bawaan <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold text-blue-700 dark:text-blue-300">admin123</code> sebagai sandi saat ini.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: Password Form Card (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Formulir Pembaruan Kata Sandi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pastikan data yang Anda masukkan sudah benar sebelum menekan tombol simpan
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{successMsg}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Perubahan langsung aktif dan telah dicatat dalam Audit Trail ISO 9001:2015.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Kata Sandi Lama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi Saat Ini (Lama) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center border border-slate-300 dark:border-slate-700 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 transition shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
                    title={showCurrent ? 'Sembunyikan' : 'Tampilkan sandi'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2.5 shrink-0" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ketik kata sandi Anda saat ini"
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  *Bagi pengguna bawaan sistem yang belum pernah mengatur kata sandi khusus, masukkan <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono font-bold">admin123</code>.
                </p>
              </div>

              {/* Field 2: Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center border border-slate-300 dark:border-slate-700 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40 rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 transition shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
                    title={showNew ? 'Sembunyikan' : 'Tampilkan sandi'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2.5 shrink-0" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                  <span className={`flex items-center gap-1 font-medium ${
                    newPassword.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Minimal 6 karakter</span>
                  </span>
                </div>
              </div>

              {/* Field 3: Konfirmasi Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className={`relative flex items-center border ${
                  isMatching
                    ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                    : isMismatch
                    ? 'border-rose-500 ring-2 ring-rose-500/15'
                    : 'border-slate-300 dark:border-slate-700 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/40'
                } rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-800 transition shadow-2xs`}>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition cursor-pointer"
                    title={showConfirm ? 'Sembunyikan' : 'Tampilkan sandi'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-2.5 shrink-0" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                    required
                  />
                  {isMatching && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cocok</span>
                    </span>
                  )}
                  {isMismatch && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                      Tidak cocok
                    </span>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveMenu('dashboard')}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword || isMismatch}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
