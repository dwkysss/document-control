import React, { useState } from 'react';
import { CheckCircle2, Eye, Printer, Download, Search, Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import Badge, { CompanyBadge } from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ApprovedListView() {
  const {
    documents = [],
    departments = [],
    selectedCompanyFilter = 'ALL',
    setViewingDocument,
    setActiveMenu,
    setBreadcrumbs,
    setSelectedDocForRevision
  } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const approvedDocs = documents.filter(d => d.status === 'AKTIF');
  const departmentCount = new Set(approvedDocs.map(doc => doc.department).filter(Boolean)).size;

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
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Dokumen Disetujui (Resmi Terbit)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh berkas dokumen yang telah lolos verifikasi dan sah menjadi dokumen operasional terkendali.
            </p>
          </div>
        </div>
        <div className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md border border-slate-200 dark:border-slate-700">
          Total {approvedDocs.length} Dokumen Aktif
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Dokumen aktif</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{approvedDocs.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Departemen dengan dokumen aktif</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{departmentCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar dokumen aktif</h3>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Menampilkan {filteredDocs.length} dari {approvedDocs.length} dokumen</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative min-w-0 flex-1 sm:w-72">
              <span className="sr-only">Cari dokumen disetujui</span>
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input type="search" placeholder="Cari nomor, judul, pembuat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="flex items-center gap-2">
              <span className="sr-only">Filter departemen</span>
              <Filter className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-auto">
                <option value="ALL">Semua Departemen</option>
                {departments.map(d => (
                  <option key={d.id || d.code} value={d.code}>{d.code}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredDocs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {approvedDocs.length === 0 ? 'Belum ada dokumen yang disetujui' : 'Tidak ada dokumen yang cocok'}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {approvedDocs.length === 0
                  ? 'Dokumen akan tampil di sini setelah verifikasi selesai dan statusnya aktif.'
                  : 'Coba kata kunci atau departemen lain.'}
              </p>
              {approvedDocs.length > 0 && (searchTerm || selectedDept !== 'ALL') && (
                <button type="button" onClick={() => { setSearchTerm(''); setSelectedDept('ALL'); }} className="mt-3 rounded-md px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-300 dark:hover:bg-slate-800 cursor-pointer">
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-bold">
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
                  <tr key={doc.id} className="transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/70">
                    <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} />
                        <span>{doc.docNumber}</span>
                      </div>
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
                          className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          title="Buka Dokumen Terkendali"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Pratinjau
                        </button>
                        <button
                          onClick={() => handleInitiateRevision(doc)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
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
          )}
        </div>
      </div>
    </div>
  );
}
