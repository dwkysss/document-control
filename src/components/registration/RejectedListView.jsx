import React, { useState } from 'react';
import { XCircle, Eye, RefreshCw, AlertCircle, Search, Trash2, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function RejectedListView() {
  const { documents, setViewingDocument, setActiveMenu, setBreadcrumbs, saveDraft, deleteDocument, currentUser, isAdmin } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);

  const rejectedDocs = documents.filter(d => d.status === 'DITOLAK');

  const filteredDocs = rejectedDocs.filter(doc => {
    return doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (doc.rejectionReason && doc.rejectionReason.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleResubmitAsDraft = (doc) => {
    // Revert to draft status for editing
    saveDraft({
      ...doc,
      status: 'DRAFT',
      notes: `Perbaikan dari penolakan sebelumnya: ${doc.rejectionReason || ''}`
    });
    setActiveMenu('reg-draft');
    setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Draft']);
  };

  const handleConfirmDelete = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      setDocToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            Dokumen Ditolak Verifikator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pengajuan dokumen yang memerlukan perbaikan berdasarkan catatan evaluasi tim verifikasi.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
          {rejectedDocs.length} Dokumen Ditolak
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
                <th className="py-3 px-4 min-w-[180px]">Judul Dokumen</th>
                <th className="py-3 px-4 whitespace-nowrap">Departemen</th>
                <th className="py-3 px-4 whitespace-nowrap min-w-[140px]">Pembuat</th>
                <th className="py-3 px-4 min-w-[200px]">Alasan Penolakan</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[110px]">Tgl. Ditolak</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada dokumen yang ditolak.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-rose-50/30 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 min-w-[180px]" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.department}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">{doc.creator}</td>
                    <td className="py-3.5 px-4 text-rose-700 dark:text-rose-400 font-medium">
                      <div className="line-clamp-2" title={doc.rejectionReason}>
                        {doc.rejectionReason || 'Format klausul belum memenuhi standar.'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Oleh: {doc.rejectedBy || 'Verifikator'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      {doc.rejectedDate ? doc.rejectedDate.slice(0, 10) : doc.createdDate}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResubmitAsDraft(doc)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1"
                          title="Perbaiki & Simpan Sebagai Draft"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Perbaiki
                        </button>

                        {/* Opsi Hapus untuk Creator atau Admin */}
                        {(isAdmin || (currentUser && (currentUser.name === doc.creator || currentUser.nik === doc.creatorNik))) && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                            title="Hapus Pengajuan Ditolak"
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

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Konfirmasi Hapus Pengajuan Ditolak"
          subtitle={`No. Dokumen: ${docToDelete.docNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Hapus Dokumen Ditolak Secara Permanen</p>
                <p className="mt-1">
                  Pengajuan dokumen <strong>{docToDelete.docNumber}</strong> ({docToDelete.title}) akan dihapus dari daftar pengajuan ditolak. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDocToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
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
