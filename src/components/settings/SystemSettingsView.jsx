import React, { useState } from 'react';
import { Settings, Save, Download, Upload, RotateCcw, Shield, Building2, QrCode, CheckCircle2 } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function SystemSettingsView() {
  const {
    systemSettings,
    setSystemSettings,
    resetDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    showToast
  } = useDocumentControl();

  const [formData, setFormData] = useState({ ...systemSettings });
  const [jsonInput, setJsonInput] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSystemSettings(formData);
    showToast('Pengaturan sistem berhasil disimpan!', 'success');
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
            Pengaturan Sistem & Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi format penomoran dokumen, stempel keamanan watermark, dan cadangan database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-Cols: Settings Form */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">KONFIGURASI PERUSAHAAN & PENOMORAN</h3>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Singkatan Perusahaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyCode}
                    onChange={(e) => handleChange('companyCode', e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Format Penomoran Dokumen Otomatis
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.numberingFormat}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-lg font-mono text-slate-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Formula standar: {'{KODE_PERUSAHAAN}-{JENIS_DOKUMEN}-{DEPARTEMEN}-{NO_URUT:2}-{REVISI:2}'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Watermark Dokumen Aktif (Controlled Copy)
                </label>
                <input
                  type="text"
                  value={formData.watermarkControlledText}
                  onChange={(e) => handleChange('watermarkControlledText', e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Watermark Dokumen Obsolete
                </label>
                <input
                  type="text"
                  value={formData.watermarkObsoleteText}
                  onChange={(e) => handleChange('watermarkObsoleteText', e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-rose-600"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
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
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              MANAJEMEN DATABASE
            </h3>

            {/* Backup */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border space-y-2 text-xs">
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
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
              >
                Unduh File Backup
              </button>
            </div>

            {/* Restore */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border space-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                Pulihkan Database (Restore JSON)
              </span>
              <p className="text-[11px] text-slate-500">
                Impor file cadangan JSON untuk memulihkan state data aplikasi.
              </p>
              <label className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-center block cursor-pointer">
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
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 text-xs space-y-2">
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
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
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
