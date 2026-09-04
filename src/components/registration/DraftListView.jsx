import React, { useState } from 'react';
import { FileEdit, Trash2, Send, Eye, Plus, Search, Filter } from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DraftListView() {
  const { documents, deleteDocument, submitForVerification, setViewingDocument, setActiveMenu, setBreadcrumbs, currentUser, isAdmin } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const drafts = documents.filter(d => d.status === 'DRAFT');

  const filteredDrafts = drafts.filter(doc => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Draft Registrasi Dokumen</h2>
          <p className="text-xs text-slate-500 mt-0.5">Daftar berkas dokumen yang tersimpan sebagai draft dan belum diajukan ke tim verifikasi.</p>
        </div>
        <button
          onClick={() => {
            setActiveMenu('reg-new');
            setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Registrasi Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari draft berdasarkan nomor / judul / pembuat..."
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

      {/* Draft Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tgl. Simpan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDrafts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada draft dokumen yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.type}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{doc.creator}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">{doc.revision}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">{doc.createdDate}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Pratinjau Draft"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => submitForVerification(doc)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                          title="Ajukan Verifikasi Sekarang"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {(isAdmin || (currentUser && (currentUser.name === doc.creator || currentUser.nik === doc.creatorNik))) && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus draf ${doc.docNumber} (${doc.title})?`)) {
                                deleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Hapus Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
