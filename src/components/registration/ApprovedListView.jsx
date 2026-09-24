import React, { useState } from 'react';
import { CheckCircle2, Eye, Printer, Download, Search, Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ApprovedListView() {
  const { documents, setViewingDocument, setActiveMenu, setBreadcrumbs, setSelectedDocForRevision } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const approvedDocs = documents.filter(d => d.status === 'AKTIF');

  const filteredDocs = approvedDocs.filter(doc => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleInitiateRevision = (doc) => {
    setSelectedDocForRevision(doc);
    setActiveMenu('rev-new');
    setBreadcrumbs(['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Dokumen Disetujui (Resmi Terbit)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh berkas dokumen yang telah lolos verifikasi dan sah menjadi dokumen operasional terkendali.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
          Total {approvedDocs.length} Dokumen Aktif
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari dokumen disetujui..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Semua Departemen</option>
            <option value="HRGA">HRGA</option>
            <option value="FAT">FAT</option>
            <option value="PRODUKSI">PRODUKSI</option>
            <option value="MARKETING">MARKETING</option>
            <option value="QAQC">QAQC</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center whitespace-nowrap w-12">No.</th>
                <th className="py-3 px-4 whitespace-nowrap">No. Dokumen</th>
                <th className="py-3 px-4 min-w-[200px]">Judul Dokumen</th>
                <th className="py-3 px-4 whitespace-nowrap">Departemen</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Pembuat</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Revisi</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">Tgl. Efektif</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{idx + 1}</td>
                  <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                    {doc.docNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate" title={doc.title}>
                    {doc.title}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.department}</td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.creator}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold whitespace-nowrap">{doc.revision}</td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <Badge status={doc.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {doc.effectiveDate || doc.createdDate}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewingDocument(doc)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1"
                        title="Buka Dokumen Terkendali"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Pratinjau
                      </button>
                      <button
                        onClick={() => handleInitiateRevision(doc)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition flex items-center gap-1"
                        title="Ajukan Revisi Dokumen"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Revisi
                      </button>
                    </div>
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
