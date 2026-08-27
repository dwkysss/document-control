import React, { useState } from 'react';
import { FileSpreadsheet, Printer, Download, Search, Filter, ShieldCheck, Building2 } from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { exportToExcel, exportToCSV, exportMasterRegisterPDF } from '../../utils/exportUtils';

export default function MasterRegisterReportView() {
  const { documents, systemSettings, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  const filtered = documents.filter(doc => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'ALL' || doc.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Laporan Daftar Induk Dokumen Terkendali (ISO 9001 Master List)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format laporan resmi untuk audit internal & eksternal sertifikasi mutu ISO 9001:2015.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportToExcel(filtered, 'Master_Document_Register_ISO9001');
              showToast('Laporan Excel berhasil diunduh!', 'success');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Excel
          </button>
          <button
            onClick={() => {
              exportMasterRegisterPDF(filtered, systemSettings);
              showToast('Laporan PDF audit ISO berhasil dibuat!', 'success');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF Audit
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor registrasi / judul dokumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ISO Standard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* ISO Paper Report Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-center">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            {systemSettings.companyName || 'PT DJI'}
          </h3>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mt-0.5">
            DAFTAR INDUK DOKUMEN INTERNAL & EKSTERNAL TERKENDALI
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Standar: {systemSettings.isoStandard} | Periode Tinjauan: {systemSettings.periodicReviewMonths} Bulan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center border-r border-slate-700">No.</th>
                <th className="py-3 px-3 border-r border-slate-700">Nomor Dokumen</th>
                <th className="py-3 px-3 border-r border-slate-700">Judul Dokumen</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Jenis</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Dept</th>
                <th className="py-3 px-3 border-r border-slate-700">Pembuat</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Revisi</th>
                <th className="py-3 px-3 text-center border-r border-slate-700">Status</th>
                <th className="py-3 px-3 text-center">Tgl. Efektif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 text-center text-slate-400 font-mono border-r border-slate-100 dark:border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                    {doc.docNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate border-r border-slate-100 dark:border-slate-800">
                    {doc.title}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                    {doc.type}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                    {doc.department}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                    {doc.creator}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold border-r border-slate-100 dark:border-slate-800">
                    {doc.revision}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                    <Badge status={doc.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {doc.effectiveDate || doc.createdDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
