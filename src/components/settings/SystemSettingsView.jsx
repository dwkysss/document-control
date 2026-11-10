import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, Download, Upload, RotateCcw, Shield, Building2, Sliders, CheckCircle2 } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function SystemSettingsView() {
  const {
    systemSettings,
    setSystemSettings,
    updateSystemSettings,
    companies = [],
    updateCompany,
    resetDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    isAdmin,
    showToast
  } = useDocumentControl();

  // Active Company Tab in Settings
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || 'comp-dji');

  // Active company object
  const activeCompany = useMemo(() => {
    return (companies || []).find(c => c.id === selectedCompanyId) || companies[0] || {
      id: 'comp-dji',
      code: 'DJI',
      name: 'PT Dentelle Jaya Infinitex',
      tagline: 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga'
    };
  }, [companies, selectedCompanyId]);

  // Company-specific Form Data
  const [compForm, setCompForm] = useState({
    name: activeCompany.name || '',
    code: activeCompany.code || '',
    tagline: activeCompany.tagline || '',
    watermarkControlled: activeCompany.watermarkControlledText || `CONTROLLED COPY - ${(activeCompany.name || '').toUpperCase()}`,
    logoUrl: activeCompany.logoUrl || (activeCompany.code === 'DJI' ? '/dji-logo.png' : null)
  });

  // Whenever the active company changes, sync form fields
  useEffect(() => {
    if (activeCompany) {
      setCompForm({
        name: activeCompany.name || '',
        code: activeCompany.code || '',
        tagline: activeCompany.tagline || '',
        watermarkControlled: activeCompany.watermarkControlledText || `CONTROLLED COPY - ${(activeCompany.name || '').toUpperCase()}`,
        logoUrl: activeCompany.logoUrl || (activeCompany.code === 'DJI' ? '/dji-logo.png' : null)
      });
    }
  }, [activeCompany]);

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran berkas logo maksimal 2 MB!', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCompForm(prev => ({ ...prev, logoUrl: event.target.result }));
      showToast('Logo berhasil dimuat! Klik Simpan Pengaturan untuk menerapkan.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Global Settings Form Data
  const [globalForm, setGlobalForm] = useState({
    periodicReviewMonths: systemSettings?.periodicReviewMonths || 12,
    numberingFormat: systemSettings?.numberingFormat || '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
    watermarkObsoleteText: systemSettings?.watermarkObsoleteText || 'OBSOLETE - DO NOT USE'
  });

  useEffect(() => {
    if (systemSettings) {
      setGlobalForm({
        periodicReviewMonths: systemSettings.periodicReviewMonths || 12,
        numberingFormat: systemSettings.numberingFormat || '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
        watermarkObsoleteText: systemSettings.watermarkObsoleteText || 'OBSOLETE - DO NOT USE'
      });
    }
  }, [systemSettings]);

  const handleCompChange = (field, value) => {
    setCompForm(prev => {
      const next = { ...prev, [field]: value };
      // Otomatis update watermark jika nama perusahaan diubah dan user belum mengubah watermark secara kustom
      if (field === 'name' && (!prev.watermarkControlled || prev.watermarkControlled.startsWith('CONTROLLED COPY -'))) {
        next.watermarkControlled = `CONTROLLED COPY - ${value.toUpperCase()}`;
      }
      return next;
    });
  };

  const handleGlobalChange = (field, value) => {
    setGlobalForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Akses ditolak! Hanya System Administrator yang dapat mengubah konfigurasi sistem.', 'danger');
      return;
    }

    const cleanCode = (compForm.code || '').trim().toUpperCase();
    const cleanName = (compForm.name || '').trim();

    if (!cleanCode || !cleanName) {
      showToast('Kode dan Nama Perusahaan wajib diisi!', 'danger');
      return;
    }

    // 1. Update entitas perusahaan aktif
    if (updateCompany && activeCompany?.id) {
      updateCompany(activeCompany.id, {
        ...activeCompany,
        name: cleanName,
        code: cleanCode,
        tagline: (compForm.tagline || '').trim(),
        watermarkControlledText: (compForm.watermarkControlled || '').trim(),
        logoUrl: compForm.logoUrl || (cleanCode === 'DJI' ? '/dji-logo.png' : null)
      });
    }

    // 2. Update konfigurasi global sistem holding
    const updatedGlobal = {
      ...systemSettings,
      periodicReviewMonths: parseInt(globalForm.periodicReviewMonths, 10) || 12,
      watermarkObsoleteText: (globalForm.watermarkObsoleteText || 'OBSOLETE - DO NOT USE').trim()
    };

    // Sinkronisasi fallback jika unit aktif adalah DJI
    if (cleanCode === 'DJI') {
      updatedGlobal.companyName = cleanName;
      updatedGlobal.companyCode = cleanCode;
      updatedGlobal.companyTagline = (compForm.tagline || '').trim();
      updatedGlobal.watermarkControlledText = (compForm.watermarkControlled || '').trim();
    }

    if (updateSystemSettings) {
      updateSystemSettings(updatedGlobal);
    } else {
      setSystemSettings(updatedGlobal);
    }

    showToast(`Pengaturan ${cleanCode} dan konfigurasi sistem berhasil disimpan!`, 'success');
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        importDatabaseJSON(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Sistem & Konfigurasi Holding
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola konfigurasi entitas Multi-PT, stempel watermark dokumen, dan pencadangan database holding.
          </p>
        </div>
      </div>

      {/* Non-Admin Read-Only Notice */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Mode Baca (Read-Only):</strong> Anda saat ini tidak masuk sebagai System Administrator. Seluruh form pengaturan hanya dapat disimpan dan diubah oleh Administrator sistem.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-Cols: Settings Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header Form */}
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                KONFIGURASI PERUSAHAAN (MULTI-PT) & KEBIJAKAN HOLDING
              </h3>
            </div>

            {/* Multi-PT Selector Tabs */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Pilih Unit Perusahaan yang Dikonfigurasi
                </span>
                <span className="text-[10px] text-slate-400">
                  {companies.length} Entitas Terdaftar
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {companies.map(comp => {
                  const isSelected = comp.id === selectedCompanyId;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedCompanyId(comp.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {comp.code}
                      </span>
                      <span>{comp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Bagian 1: Pengaturan Entitas Unit PT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    Profil Unit: {activeCompany.code} ({activeCompany.name})
                  </h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    Pengaturan Berlaku Khusus Unit Ini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Perusahaan *
                    </label>
                    <input
                      type="text"
                      required
                      value={compForm.name}
                      onChange={(e) => handleCompChange('name', e.target.value)}
                      className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-bold"
                      placeholder="Contoh: PT Dentelle Jaya Infinitex"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kode Singkatan Perusahaan (Prefix Dokumen) *
                    </label>
                    <input
                      type="text"
                      required
                      value={compForm.code}
                      onChange={(e) => handleCompChange('code', e.target.value.toUpperCase())}
                      className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono font-bold uppercase"
                      placeholder="Contoh: DJI"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Slogan Mutu Perusahaan
                  </label>
                  <input
                    type="text"
                    value={compForm.tagline}
                    onChange={(e) => handleCompChange('tagline', e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium italic text-sky-700 dark:text-sky-300"
                    placeholder="Contoh: Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga"
                  />
                </div>

                {/* Logo Resmi Perusahaan */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Logo Resmi Perusahaan ({activeCompany.code})
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-14 h-14 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {compForm.logoUrl ? (
                        <img src={compForm.logoUrl} alt={`Logo ${activeCompany.code}`} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{compForm.logoUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            onChange={handleLogoFileChange}
                            className="hidden"
                          />
                        </label>
                        {compForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setCompForm(prev => ({ ...prev, logoUrl: null }))}
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition font-semibold cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Logo ini otomatis diterapkan pada header sidebar, pratinjau dokumen, dan stempel kop surat PDF unit {activeCompany.code}.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Watermark Dokumen Aktif (Controlled Copy)
                  </label>
                  <input
                    type="text"
                    value={compForm.watermarkControlled}
                    onChange={(e) => handleCompChange('watermarkControlled', e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-blue-700 dark:text-blue-300 font-mono"
                    placeholder={`CONTROLLED COPY - ${activeCompany.name.toUpperCase()}`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Stempel pengaman otomatis diagonal pada pratinjau dan cetak berkas PDF terkendali unit {activeCompany.code}.
                  </p>
                </div>
              </div>

              {/* Bagian 2: Pengaturan Global Holding */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                    Kebijakan Global Holding (Berlaku untuk Semua Unit PT)
                  </h4>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Standar Mutu Seragam
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Siklus Monitoring & Review Berkala (Bulan) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      required
                      value={globalForm.periodicReviewMonths}
                      onChange={(e) => handleGlobalChange('periodicReviewMonths', e.target.value)}
                      className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Standar evaluasi berkala ISO (Rekomendasi: 12 Bulan / 1 Tahun).
                    </p>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Format Penomoran Dokumen Otomatis
                    </label>
                    <input
                      type="text"
                      disabled
                      value={globalForm.numberingFormat}
                      className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-lg font-mono text-slate-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Formula standar: {'{KODE_PERUSAHAAN}-{JENIS_DOKUMEN}-{DEPARTEMEN}-{NO_URUT:2}-{REVISI:2}'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teks Watermark Dokumen Obsolete (Kadaluarsa)
                  </label>
                  <input
                    type="text"
                    value={globalForm.watermarkObsoleteText}
                    onChange={(e) => handleGlobalChange('watermarkObsoleteText', e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-rose-600 font-mono"
                    placeholder="OBSOLETE - DO NOT USE"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Stempel keamanan otomatis untuk dokumen yang telah digantikan oleh revisi baru.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right 4-Cols: Database Tools */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-600" />
              MANAJEMEN DATABASE
            </h3>

            {/* Backup */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                Cadangkan Database (Backup JSON)
              </span>
              <p className="text-[11px] text-slate-500">
                Unduh seluruh data dokumen, master karyawan, departemen, dan audit log dalam berkas JSON.
              </p>
              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
              >
                Unduh File Backup
              </button>
            </div>

            {/* Restore */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                Pulihkan Database (Restore JSON)
              </span>
              <p className="text-[11px] text-slate-500">
                Impor file cadangan JSON untuk memulihkan state data aplikasi.
              </p>
              <label className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-center block cursor-pointer text-xs">
                Pilih File JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 text-xs space-y-2">
              <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Reset Data ke Default Demo
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Kembalikan semua tabel ke kondisi data awal demonstrasi ISO.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin mereset seluruh data kembali ke demo awal?')) {
                    resetDemoData();
                  }
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
