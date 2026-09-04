import React, { useState } from 'react';
import { ShieldCheck, Eye, RefreshCw, Calendar, Search, Download, CheckCircle2, Ban, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function ActiveDocumentsView() {
  const { documents, setViewingDocument, setSelectedDocForRevision, setActiveMenu, setBreadcrumbs, cancelDocument, isAdmin, showToast } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [docToCancel, setDocToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const activeDocs = documents.filter(d => d.status === 'AKTIF');

  const filtered = activeDocs.filter(d => {
    return d.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           d.department.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleRevisionClick = (doc) => {
    setSelectedDocForRevision(doc);
    setActiveMenu('rev-new');
    setBreadcrumbs(['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Dokumen Aktif & Terkendali (Controlled Copies)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh dokumen resmi yang sedang berlaku operasional di lingkungan PT DJI.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200">
          {activeDocs.length} Dokumen Berlaku Resmi
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4">
        <input
          type="text"
          placeholder="Cari dokumen aktif berdasarkan nomor / judul / divisi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Departemen</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Revisi</th>
                <th className="py-3 px-4 text-center">Tgl. Berlaku</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((doc, idx) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
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
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {doc.revision}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {doc.effectiveDate || doc.createdDate}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewingDocument(doc)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition flex items-center gap-1"
                        title="Buka Dokumen Terkendali & Validasi QR"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Pratinjau
                      </button>
                      <button
                        onClick={() => handleRevisionClick(doc)}
                        className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition flex items-center gap-1"
                        title="Ajukan Revisi Dokumen"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Revisi
                      </button>

                      {/* Batalkan Dokumen (Wewenang Khusus System Administrator) */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setDocToCancel(doc);
                            setCancelReason('');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition flex items-center gap-1"
                          title="Batalkan Dokumen (Ubah Menjadi Obsolete)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Batalkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Modal */}
      {docToCancel && (
        <Modal
          isOpen={Boolean(docToCancel)}
          onClose={() => setDocToCancel(null)}
          title="Konfirmasi Pembatalan Dokumen (Penarikan / Obsolete)"
          subtitle={`No. Dokumen: ${docToCancel.docNumber} • ${docToCancel.title}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">Perhatian Standar ISO 9001 Clause 7.5:</p>
                <p className="mt-1 leading-relaxed">
                  Dokumen yang dibatalkan akan langsung ditarik dari peredaran operasional dan statusnya berubah menjadi <strong>OBSOLETE</strong> serta dicap watermark penarikan. Rekam jejak audit pembatalan akan dicatat di log sistem.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Alasan Pembatalan Dokumen <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Kebijakan dicabut oleh Direksi / SOP tidak lagi relevan dengan alur proses baru..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDocToCancel(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    showToast('Harap isi alasan pembatalan dokumen!', 'danger');
                    return;
                  }
                  cancelDocument(docToCancel.id, cancelReason.trim());
                  setDocToCancel(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                Ya, Batalkan Dokumen
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
