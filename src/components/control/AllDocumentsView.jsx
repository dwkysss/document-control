import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Eye,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Ban,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { exportToExcel, exportToCSV, exportMasterRegisterPDF } from '../../utils/exportUtils';

export default function AllDocumentsView() {
  const {
    documents,
    departments,
    documentTypes,
    systemSettings,
    setViewingDocument,
    setSelectedDocForRevision,
    setActiveMenu,
    setBreadcrumbs,
    cancelDocument,
    deleteDocument,
    isAdmin,
    showToast
  } = useDocumentControl();

  const [docToCancel, setDocToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'ALL' || doc.department === filterDept;
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  const handleExportExcel = () => {
    exportToExcel(filteredDocs, `Master_Register_DJI`);
    showToast('Berhasil mengekspor berkas Excel!', 'success');
  };

  const handleExportCSV = () => {
    exportToCSV(filteredDocs, `Master_Register_DJI`);
    showToast('Berhasil mengekspor berkas CSV!', 'success');
  };

  const handleExportPDF = () => {
    exportMasterRegisterPDF(filteredDocs, systemSettings);
    showToast('Berhasil membuat dokumen PDF Master Register!', 'success');
  };

  const handleRevisionClick = (doc) => {
    setSelectedDocForRevision(doc);
    setActiveMenu('rev-new');
    setBreadcrumbs(['Dashboard', 'Document Revision', 'Pengajuan Revisi']);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Master Document Control Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar induk seluruh dokumen terkendali perusahaan sesuai klausul 7.5 ISO 9001:2015.
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
            title="Ekspor ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition"
            title="Ekspor ke PDF ISO"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            Cetak PDF
          </button>
          <button
            onClick={() => {
              setActiveMenu('reg-new');
              setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Dokumen Baru
          </button>
        </div>
      </div>

      {/* Multi Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor / judul / pembuat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Departemen */}
        <div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Semua Departemen ({departments.length})</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Jenis Dokumen */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Semua Jenis Dokumen ({documentTypes.length})</option>
            {documentTypes.map(t => (
              <option key={t.id} value={t.code}>{t.code} - {t.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">Semua Status (Aktif, Draft, dll)</option>
            <option value="AKTIF">AKTIF (Berlaku Resmi)</option>
            <option value="VERIFIKASI">VERIFIKASI (Review)</option>
            <option value="DRAFT">DRAFT</option>
            <option value="OBSOLETE">OBSOLETE (Kadaluarsa)</option>
            <option value="DITOLAK">DITOLAK</option>
          </select>
        </div>
      </div>

      {/* Main Master Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102a4e] text-white uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5 text-center">No.</th>
                <th className="py-3 px-3.5">No. Dokumen</th>
                <th className="py-3 px-3.5">Judul Dokumen</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Dept</th>
                <th className="py-3 px-3.5">Pembuat</th>
                <th className="py-3 px-3.5 text-center">Revisi</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Tgl. Registrasi</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada dokumen yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {doc.docNumber}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={doc.title}>
                      {doc.title}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-600 dark:text-slate-400">{doc.type}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.creator}</td>
                    <td className="py-3 px-3.5 text-center font-mono font-bold">{doc.revision}</td>
                    <td className="py-3 px-3.5 text-center">
                      <Badge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3 px-3.5 text-center text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {doc.createdDate}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Pratinjau Dokumen Terkendali"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status === 'AKTIF' && (
                          <button
                            onClick={() => handleRevisionClick(doc)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                            title="Ajukan Revisi"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Batalkan Dokumen (Wewenang Khusus System Administrator) */}
                        {isAdmin && (doc.status === 'AKTIF' || doc.status === 'VERIFIKASI') && (
                          <button
                            onClick={() => {
                              setDocToCancel(doc);
                              setCancelReason('');
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                            title="Batalkan Dokumen (Ubah Status Menjadi Obsolete)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Hapus Dokumen (Wewenang Khusus System Administrator) */}
                        {isAdmin && (doc.status === 'DRAFT' || doc.status === 'DITOLAK' || doc.status === 'OBSOLETE') && (
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Dokumen dari Sistem"
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

        {/* Footer info count */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 px-4">
          <span>Menampilkan <strong>{filteredDocs.length}</strong> dari <strong>{documents.length}</strong> total dokumen</span>
          <span>PT {systemSettings.companyName} Document Control</span>
        </div>
      </div>

      {/* Admin Cancellation Modal */}
      {docToCancel && (
        <Modal
          isOpen={Boolean(docToCancel)}
          onClose={() => setDocToCancel(null)}
          title="Batalkan Dokumen (Penarikan / Obsolete)"
          subtitle={`No. Dokumen: ${docToCancel.docNumber} • ${docToCancel.title}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold">Ketentuan Pengendalian Dokumen ISO 9001:</p>
                <p className="mt-1 leading-relaxed">
                  Dokumen yang dibatalkan akan langsung ditarik dari peredaran kerja, diberi status <strong>OBSOLETE</strong>, dicap watermark penarikan resmi, dan tercatat di histori audit sistem.
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
                placeholder="Contoh: Peraturan direksi dicabut / digantikan standar mutu terbaru..."
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

      {/* Admin Delete Modal */}
      {docToDelete && (
        <Modal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          title="Konfirmasi Hapus Dokumen"
          subtitle={`No. Dokumen: ${docToDelete.docNumber}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <p className="font-bold">Hapus Dokumen ({docToDelete.status})</p>
                <p className="mt-1">
                  Sebagai Administrator, Anda akan menghapus dokumen <strong>{docToDelete.docNumber}</strong> ({docToDelete.title}) dari sistem secara permanen.
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
                onClick={() => {
                  deleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
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
