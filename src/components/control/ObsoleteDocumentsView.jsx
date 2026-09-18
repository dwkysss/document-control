import React, { useState } from 'react';
import { Archive, Eye, AlertTriangle, Search, Trash2 } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ObsoleteDocumentsView() {
  const { documents, setViewingDocument, deleteDocument, isAdmin } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);

  const obsoleteDocs = (documents || []).filter(d => d.status === 'OBSOLETE');

  const filtered = obsoleteDocs.filter(d => {
    const term = (searchTerm || '').toLowerCase();
    return (
      (d.docNumber || '').toLowerCase().includes(term) ||
      (d.title || '').toLowerCase().includes(term) ||
      (d.department || '').toLowerCase().includes(term) ||
      (d.creator || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-rose-600" />
            Dokumen Obsolete (Kadaluarsa / Ditarik)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Arsip dokumen standar yang sudah tidak berlaku karena telah diterbitkan revisi baru atau penarikan operasional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor, judul, dept..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 dark:text-white"
            />
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900 whitespace-nowrap">
            {obsoleteDocs.length} Dokumen Obsolete Tersimpan
          </div>
        </div>
      </div>

      {/* ISO Warning Callout */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Kepatuhan ISO 9001 (Klausul 7.5.3.2) - Pengendalian Dokumen Kadaluarsa:</h4>
          <p className="mt-0.5 text-slate-700 dark:text-slate-300">
            Dokumen obsolete tetap disimpan untuk keperluan audit rekam jejak, namun telah dicap watermark <strong>OBSOLETE</strong> dan tidak boleh digunakan di area operasional kerja. Administrator dan MR memiliki wewenang untuk membersihkan atau menghapus berkas yang sudah kadaluarsa jika masa retensi telah berakhir.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center">No.</th>
                <th className="py-3 px-4">No. Dokumen</th>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4">Digantikan Oleh</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada arsip dokumen obsolete yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-rose-50/20 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap line-through text-slate-500">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{doc.creator}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                      {doc.revision}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {doc.supersededBy ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          {doc.supersededBy}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Revisi Baru</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="Pratinjau Dokumen Obsolete (Watermarked)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Arsip
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition cursor-pointer"
                            title="Hapus Dokumen Obsolete dari Sistem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Konfirmasi Hapus Dokumen Obsolete */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Konfirmasi Hapus Dokumen Obsolete"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Hapus Arsip Dokumen Obsolete Permanen</p>
                <p className="mt-1">
                  Sebagai Administrator / Management Representative, Anda akan menghapus dokumen <strong>{docToDelete.docNumber}</strong> ({docToDelete.title}) dari sistem secara permanen.
                </p>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  Pastikan arsip fisik atau rekam jejak audit ISO 9001 telah terpenuhi sebelum menghapus dokumen ini.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
