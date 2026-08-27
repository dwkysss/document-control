import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye, ShieldAlert, FileText, User, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function PendingVerificationView() {
  const { documents, approveDocument, rejectDocument, setViewingDocument, currentUser, showToast } = useDocumentControl();
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const pendingDocs = documents.filter(d => d.status === 'VERIFIKASI');

  const handleOpenApproveModal = (doc) => {
    setSelectedReviewDoc(doc);
    setApprovalNotes('Dokumen telah diverifikasi dan memenuhi kaidah standardisasi ISO 9001.');
  };

  const handleOpenRejectModal = (doc) => {
    setSelectedReviewDoc(doc);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmApprove = () => {
    if (selectedReviewDoc) {
      approveDocument(selectedReviewDoc.id, approvalNotes);
      setSelectedReviewDoc(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('Harap tuliskan alasan penolakan agar pembuat dapat memperbaiki dokumen!', 'danger');
      return;
    }
    if (selectedReviewDoc) {
      rejectDocument(selectedReviewDoc.id, rejectionReason.trim());
      setIsRejectModalOpen(false);
      setSelectedReviewDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Dokumen Menunggu Verifikasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Antrian berkas yang diajukan untuk ditinjau oleh Verifikator & Document Control Team sebelum diterbitkan aktif.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>{pendingDocs.length} Dokumen Membutuhkan Tindakan</span>
        </div>
      </div>

      {/* Pending Table */}
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
                <th className="py-3 px-4">Tim Verifikator</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tgl. Pengajuan</th>
                <th className="py-3 px-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Semua dokumen telah diverifikasi!</p>
                      <p className="text-xs text-slate-400">Tidak ada berkas yang menunggu review saat ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/60 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[220px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <div>{doc.creator}</div>
                      <div className="text-[10px] text-slate-400">{doc.creatorPosition}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {doc.verifierTeam}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">{doc.revision}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {doc.createdDate}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenApproveModal(doc)}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition flex items-center gap-1"
                          title="Setujui & Terbitkan Dokumen"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Setujui
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(doc)}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md transition flex items-center gap-1"
                          title="Tolak Pengajuan"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {selectedReviewDoc && !isRejectModalOpen && (
        <Modal
          isOpen={Boolean(selectedReviewDoc)}
          onClose={() => setSelectedReviewDoc(null)}
          title="Persetujuan Verifikasi Dokumen"
          subtitle={`No. Dokumen: ${selectedReviewDoc.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Konfirmasi Penerbitan Dokumen Resmi (Aktif)
              </p>
              <p className="mt-1 text-emerald-700 dark:text-emerald-400">
                Dengan menyetujui dokumen ini, status akan berubah menjadi <strong>AKTIF</strong>. Jika dokumen ini merupakan revisi baru, sistem akan <strong>otomatis mengubah revisi lama menjadi OBSOLETE</strong> sesuai aturan standar ISO.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Judul Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReviewDoc.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Pembuat:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedReviewDoc.creator} ({selectedReviewDoc.department})</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Verifikator:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{currentUser.name} ({currentUser.position})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Pengesahan (Opsional):
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedReviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
              >
                Konfirmasi & Terbitkan Aktif
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedReviewDoc && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => {
            setIsRejectModalOpen(false);
            setSelectedReviewDoc(null);
          }}
          title="Penolakan Verifikasi Dokumen"
          subtitle={`No. Dokumen: ${selectedReviewDoc.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-300">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Catatan Penolakan Dokumen
              </p>
              <p className="mt-1">
                Dokumen akan dialihkan ke daftar <strong>Ditolak</strong>. Harap berikan alasan yang jelas agar pembuat dapat merevisi berkas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alasan / Rekomendasi Perbaikan <span className="text-red-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Format klausul belum memenuhi standar ISO 9001 / ada tabel lampiran yang belum lengkap..."
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setSelectedReviewDoc(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
