import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  Shield,
  Building2,
  Sliders,
  CheckCircle2,
  Cloud,
  Lock,
  RefreshCw,
  Key,
  ShieldCheck,
  Database
} from 'lucide-react';
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

  // Mobile Viewport Detection (< 768px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile Section Tabs (< 1024px): 'company' | 'global' | 'database'
  const [mobileTab, setMobileTab] = useState('company');

  // Google Drive Backup Status & Action
  const [gdriveStatus, setGdriveStatus] = useState(null);
  const [isSyncingGDrive, setIsSyncingGDrive] = useState(false);

  useEffect(() => {
    fetch('/api/backup/gdrive/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setGdriveStatus(data);
      })
      .catch(() => {});
  }, []);

  const handleSyncGDrive = async () => {
    if (isSyncingGDrive) return;
    setIsSyncingGDrive(true);
    showToast('Memulai sinkronisasi berkas terenkripsi ke Google Drive...', 'info');
    try {
      const res = await fetch('/api/backup/gdrive/sync-all', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      showToast(
        `Berhasil mencadangkan ${data.successCount} dari ${data.total} berkas dokumen aktif ke Google Drive!`,
        'success'
      );
    } catch (e) {
      showToast(`Gagal sinkronisasi GDrive: ${e.message}`, 'danger');
    } finally {
      setIsSyncingGDrive(false);
    }
  };

  // Active Company Tab in Settings
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id || 'comp-dji');

  // Active company object
  const activeCompany = useMemo(() => {
    return (
      (companies || []).find((c) => c.id === selectedCompanyId) ||
      companies[0] || {
        id: 'comp-dji',
        code: 'DJI',
        name: 'PT Dentelle Jaya Infinitex',
        tagline: 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga'
      }
    );
  }, [companies, selectedCompanyId]);

  // Company-specific Form Data
  const [compForm, setCompForm] = useState({
    name: activeCompany.name || '',
    code: activeCompany.code || '',
    tagline: activeCompany.tagline || '',
    watermarkControlled:
      activeCompany.watermarkControlledText ||
      `CONTROLLED COPY - ${(activeCompany.name || '').toUpperCase()}`,
    logoUrl: activeCompany.logoUrl || (activeCompany.code === 'DJI' ? '/dji-logo.png' : null)
  });

  // Whenever the active company changes, sync form fields
  useEffect(() => {
    if (activeCompany) {
      setCompForm({
        name: activeCompany.name || '',
        code: activeCompany.code || '',
        tagline: activeCompany.tagline || '',
        watermarkControlled:
          activeCompany.watermarkControlledText ||
          `CONTROLLED COPY - ${(activeCompany.name || '').toUpperCase()}`,
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
      setCompForm((prev) => ({ ...prev, logoUrl: event.target.result }));
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
    setCompForm((prev) => {
      const next = { ...prev, [field]: value };
      if (
        field === 'name' &&
        (!prev.watermarkControlled || prev.watermarkControlled.startsWith('CONTROLLED COPY -'))
      ) {
        next.watermarkControlled = `CONTROLLED COPY - ${value.toUpperCase()}`;
      }
      return next;
    });
  };

  const handleGlobalChange = (field, value) => {
    setGlobalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast(
        'Akses ditolak! Hanya System Administrator yang dapat mengubah konfigurasi sistem.',
        'danger'
      );
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

  // Helper render for Multi-PT Selector
  const renderCompanySelector = () => (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          Pilih Unit Perusahaan
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {companies.length} Entitas Terdaftar
        </span>
      </div>

      {/* Grid 3 Kolom Rapi di Mobile */}
      <div className="grid grid-cols-3 gap-2">
        {companies.map((comp) => {
          const isSelected = comp.id === selectedCompanyId;
          const shortLabel =
            comp.code === 'DJI'
              ? 'Dentelle'
              : comp.code === 'UMI'
              ? 'Ultimo Moda'
              : comp.code === 'IMK'
              ? 'IMK'
              : comp.code;

          return (
            <button
              key={comp.id}
              type="button"
              onClick={() => setSelectedCompanyId(comp.id)}
              className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border text-center sm:text-left ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {comp.code}
              </span>
              <span className="truncate text-[10px] sm:text-xs leading-tight">
                {shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Helper render for Profil Unit Form
  const renderCompanyProfileSection = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          Profil Unit: {activeCompany.code} ({activeCompany.name})
        </h4>
        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
          Pengaturan Berlaku Khusus Unit Ini
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Nama Lengkap Perusahaan *
          </label>
          <input
            type="text"
            required
            value={compForm.name}
            onChange={(e) => handleCompChange('name', e.target.value)}
            className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-bold uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-medium italic text-sky-700 dark:text-sky-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Contoh: Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga"
        />
      </div>

      {/* Logo Resmi Perusahaan */}
      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
          Logo Resmi Perusahaan ({activeCompany.code})
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-white p-1.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {compForm.logoUrl ? (
                <img
                  src={compForm.logoUrl}
                  alt={`Logo ${activeCompany.code}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="sm:hidden flex-1">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Logo {activeCompany.code}
              </span>
              <span className="text-[10px] text-slate-400">
                {compForm.logoUrl ? 'Sudah terpasang' : 'Belum diunggah'}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs min-h-[38px]">
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
                  onClick={() => setCompForm((prev) => ({ ...prev, logoUrl: null }))}
                  className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition font-semibold cursor-pointer min-h-[38px]"
                >
                  Hapus
                </button>
              )}
            </div>
            <p className="text-[10.5px] text-slate-400 leading-tight">
              Otomatis diterapkan pada header, pratinjau dokumen, dan kop surat PDF unit {activeCompany.code}.
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
          className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-medium text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`CONTROLLED COPY - ${activeCompany.name.toUpperCase()}`}
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Stempel pengaman diagonal pada pratinjau dan cetak berkas PDF terkendali unit {activeCompany.code}.
        </p>
      </div>
    </div>
  );

  // Helper render for Kebijakan Global Holding
  const renderGlobalPolicySection = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          Kebijakan Global Holding (Seluruh Unit PT)
        </h4>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          Standar Mutu Seragam
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
            className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full p-2.5 sm:p-3 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-600 dark:text-slate-400 cursor-not-allowed"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Formula standar: {'{PT}-{JENIS}-{DEPT}-{NO:2}-{REV:2}'}
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
          className="w-full p-2.5 sm:p-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-medium text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          placeholder="OBSOLETE - DO NOT USE"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Stempel keamanan otomatis untuk dokumen yang telah digantikan oleh revisi baru.
        </p>
      </div>
    </div>
  );

  // Helper render for Database Tools & GDrive
  const renderDatabaseAndCloudTools = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Manajemen Database JSON */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          MANAJEMEN DATABASE
        </h3>

        {/* Backup */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600 shrink-0" />
            Cadangkan Database (Backup JSON)
          </span>
          <p className="text-[11px] text-slate-500">
            Unduh seluruh data dokumen, master karyawan, departemen, dan audit log dalam berkas JSON.
          </p>
          <button
            type="button"
            onClick={exportDatabaseJSON}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg transition cursor-pointer text-xs min-h-[40px] shadow-xs"
          >
            Unduh File Backup
          </button>
        </div>

        {/* Restore */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-blue-600 shrink-0" />
            Pulihkan Database (Restore JSON)
          </span>
          <p className="text-[11px] text-slate-500">
            Impor file cadangan JSON untuk memulihkan seluruh rekaman data dokumen dan audit log.
          </p>
          <label className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-lg transition text-center block cursor-pointer text-xs min-h-[40px] shadow-xs flex items-center justify-center">
            Pilih File JSON
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>

        {/* Reset */}
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 text-xs space-y-2">
          <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            Reset Data ke Default Demo
          </span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Kembalikan seluruh tabel ke kondisi demonstrasi awal standar ISO.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Yakin ingin mereset seluruh data kembali ke demo awal?')) {
                resetDemoData();
              }
            }}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-lg transition cursor-pointer text-xs min-h-[40px] shadow-xs"
          >
            Reset Database
          </button>
        </div>
      </div>

      {/* 2. Google Drive Encrypted Cloud Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-500 shrink-0" />
            PENCADANGAN GOOGLE DRIVE
          </h3>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Lock className="w-3 h-3 text-emerald-600" />
            AES-256
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Setiap kali dokumen disahkan (<span className="font-bold text-emerald-600">Status Aktif</span>
          ), berkas PDF otomatis diproteksi sandi standar AES-256 dan diunggah berformat{' '}
          <span className="font-bold text-sky-600">.pdf</span> ke Google Drive.
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status Koneksi:</span>
            {gdriveStatus?.configured ? (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung ({gdriveStatus.authMethod || 'OAuth 2.0'})
              </span>
            ) : (
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Menunggu Konfigurasi .env
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Format di Google Drive:</span>
            <span className="font-mono font-bold text-sky-700 dark:text-sky-300 text-[10px]">
              Langsung *.pdf (Password-Protected)
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sandi Buka PDF:</span>
            <span className="font-mono font-bold px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded text-[10px] select-all cursor-pointer">
              {gdriveStatus?.pdfPassword || 'DCS2026!'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pemicu Cadangan:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Otomatis saat Dokumen Aktif
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncGDrive}
          disabled={isSyncingGDrive}
          className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-lg transition cursor-pointer text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 min-h-[40px]"
        >
          {isSyncingGDrive ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Mencadangkan Berkas...
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5" />
              Sinkronkan Seluruh Dokumen ke GDrive
            </>
          )}
        </button>

        <div className="text-[10.5px] text-slate-400 dark:text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="font-bold text-slate-600 dark:text-slate-400 block">
            💡 Cara Buka di Google Drive:
          </span>
          <p>
            Cukup klik 2x file PDF di Google Drive atau buka di aplikasi HP / Acrobat, lalu masukkan sandi{' '}
            <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-amber-600 text-[10px]">
              {gdriveStatus?.pdfPassword || 'DCS2026!'}
            </code>{' '}
            untuk membaca dokumen.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600 shrink-0" />
            Pengaturan Sistem & Konfigurasi Holding
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola konfigurasi entitas Multi-PT, stempel watermark dokumen, dan pencadangan database holding.
          </p>
        </div>
      </div>

      {/* Non-Admin Read-Only Notice */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Baca (Read-Only):</strong> Anda saat ini tidak masuk sebagai System Administrator.
            Seluruh form pengaturan hanya dapat disimpan dan diubah oleh Administrator sistem.
          </span>
        </div>
      )}

      {/* Mobile Tab Navigator (< 1024px) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('company')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition cursor-pointer text-center ${
            mobileTab === 'company'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>Profil PT</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('global')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition cursor-pointer text-center ${
            mobileTab === 'global'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Kebijakan</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('database')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition cursor-pointer text-center ${
            mobileTab === 'database'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>Database</span>
        </button>
      </div>

      {/* Main Grid: Responsive 2-Col on Desktop, Tabbed on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-Cols: Settings Form */}
        <div
          className={`lg:col-span-8 space-y-6 ${
            mobileTab === 'database' ? 'hidden lg:block' : 'block'
          }`}
        >
          <form
            onSubmit={handleSaveSettings}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header Form */}
            <div className="bg-[#102a4e] text-white px-4 sm:px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
                KONFIGURASI PERUSAHAAN (MULTI-PT) & KEBIJAKAN HOLDING
              </h3>
            </div>

            {/* Bagian 1: Multi-PT Selector & Profil Perusahaan */}
            <div className={`${mobileTab === 'global' ? 'hidden lg:block' : 'block'}`}>
              {renderCompanySelector()}
              <div className="p-4 sm:p-6 text-xs">{renderCompanyProfileSection()}</div>
            </div>

            {/* Bagian 2: Kebijakan Global Holding */}
            <div
              className={`p-4 sm:p-6 text-xs border-t border-slate-200 dark:border-slate-800 ${
                mobileTab === 'company' ? 'hidden lg:block' : 'block'
              }`}
            >
              {renderGlobalPolicySection()}
            </div>

            {/* Action Save Button */}
            <div className="p-4 sm:p-6 pt-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition cursor-pointer min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 4-Cols: Database & Cloud Backup Tools */}
        <div
          className={`lg:col-span-4 space-y-6 ${
            mobileTab !== 'database' ? 'hidden lg:block' : 'block'
          }`}
        >
          {renderDatabaseAndCloudTools()}
        </div>
      </div>
    </div>
  );
}
