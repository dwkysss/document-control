import React, { useState, useRef } from 'react';
import { FileEdit, Trash2, Send, Eye, Plus, Search, Filter, UploadCloud, RotateCcw, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { uploadDocumentFile } from '../../lib/supabaseClient';

export default function DraftListView() {
  const {
    documents,
    deleteDocument,
    submitForVerification,
    saveDraft,
    setViewingDocument,
    setActiveMenu,
    setBreadcrumbs,
    currentUser,
    isAdmin,
    showToast
  } = useDocumentControl();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal State untuk Edit & Upload Berkas Revisi
  const [editingDraft, setEditingDraft] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const drafts = documents.filter(d => d.status === 'DRAFT' || d.status === 'PERLU REVISI' || d.status === 'REVISI');

  const filteredDrafts = drafts.filter(doc => {
    const matchesSearch = doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.creator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleOpenEditModal = (doc) => {
    setEditingDraft(doc);
    setEditTitle(doc.title || '');
    setEditNotes('');
    setSelectedFile(null);
  };

  const handleSaveDraftEdit = async (resubmit = false) => {
    if (!editingDraft) return;
    if (!editTitle.trim()) {
      showToast('Judul dokumen wajib diisi!', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileInfo = {
        fileName: editingDraft.fileName,
        fileSize: editingDraft.fileSize,
        fileType: editingDraft.fileType,
        fileUrl: editingDraft.fileUrl
      };

      if (selectedFile) {
        showToast('Mengunggah berkas baru ke cloud storage...', 'info');
        fileInfo = await uploadDocumentFile(selectedFile, editingDraft.docNumber);
      }

      const updatedDoc = {
        ...editingDraft,
        title: editTitle.trim().toUpperCase(),
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        fileUrl: fileInfo.fileUrl,
        notes: editNotes.trim()
          ? (editingDraft.notes ? `${editingDraft.notes} | [Catatan Revisi Pembuat: ${editNotes.trim()}]` : `[Catatan Revisi Pembuat: ${editNotes.trim()}]`)
          : editingDraft.notes
      };

      if (resubmit) {
        submitForVerification({
          ...updatedDoc,
          isResubmission: true
        });
      } else {
        saveDraft(updatedDoc);
        showToast(`Perubahan draft ${editingDraft.docNumber} berhasil disimpan.`, 'success');
      }

      setEditingDraft(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error saving/uploading draft:', err);
      showToast('Gagal memproses berkas: ' + (err?.message || 'Terjadi kesalahan sistem'), 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Draft & Dokumen Perlu Perbaikan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar berkas draft dan dokumen yang diminta revisi oleh atasan/verifikator untuk diperbaiki sebelum diajukan ulang.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveMenu('reg-new');
            setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
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
                    Tidak ada draft atau dokumen yang memerlukan revisi.
                  </td>
                </tr>
              ) : (
                filteredDrafts.map((doc, idx) => {
                  const isNeedsRevision = doc.status === 'PERLU REVISI' || doc.status === 'REVISI';

                  return (
                    <tr
                      key={doc.id}
                      className={`transition ${
                        isNeedsRevision
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        {doc.docNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[280px]">
                        <div className="font-bold truncate" title={doc.title}>{doc.title}</div>
                        {doc.revisionNotes && (
                          <div className="mt-1 text-[10.5px] text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 p-2 rounded-md border border-amber-300 dark:border-amber-800 leading-snug">
                            <span className="font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                              Catatan Revisi ({doc.revisionRequestedBy || 'Atasan'}):
                            </span>
                            <span className="mt-0.5 block italic">"{doc.revisionNotes}"</span>
                          </div>
                        )}
                        {doc.fileName && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono truncate">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.fileName}</span>
                            {doc.fileSize && <span className="text-slate-400">({doc.fileSize})</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.type}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600 dark:text-slate-400">{doc.department}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{doc.creator}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">{doc.revision}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge status={doc.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {doc.createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Pratinjau Dokumen */}
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Pratinjau Draft"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Tombol Utama: Upload Dokumen Baru / Revisi */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(doc)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition cursor-pointer shadow-xs ${
                              isNeedsRevision
                                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                            title={isNeedsRevision ? 'Unggah Berkas Revisi Baru' : 'Edit & Ganti Berkas Dokumen'}
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{isNeedsRevision ? 'Upload Revisi' : 'Upload Ulang'}</span>
                          </button>

                          {/* Ajukan Langsung ke Verifikator */}
                          <button
                            type="button"
                            onClick={() => {
                              submitForVerification({
                                ...doc,
                                isResubmission: doc.status === 'PERLU REVISI' || doc.status === 'REVISI' || Boolean(doc.revisionNotes)
                              });
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Ajukan Verifikasi Sekarang"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Hapus Dokumen */}
                          {(isAdmin || (currentUser && (currentUser.name === doc.creator || currentUser.nik === doc.creatorNik))) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus draf ${doc.docNumber} (${doc.title})?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Hapus Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL EDIT & UPLOAD ULANG BERKAS DOKUMEN ================= */}
      {editingDraft && (
        <Modal
          isOpen={Boolean(editingDraft)}
          onClose={() => !isSubmitting && setEditingDraft(null)}
          title={
            editingDraft.status === 'PERLU REVISI'
              ? 'Unggah Berkas Revisi & Ajukan Ulang'
              : 'Edit & Upload Ulang Berkas Draft'
          }
          subtitle={`No. Dokumen: ${editingDraft.docNumber}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* Box Catatan Revisi dari Verifikator jika ada */}
            {editingDraft.revisionNotes && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Catatan Permintaan Revisi dari {editingDraft.revisionRequestedBy || 'Atasan / Verifikator'}:
                </p>
                <p className="mt-1 text-amber-800 dark:text-amber-300 leading-relaxed font-medium pl-5">
                  "{editingDraft.revisionNotes}"
                </p>
              </div>
            )}

            {/* Metadata Dokumen */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px]">Departemen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{editingDraft.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jenis Dokumen:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {editingDraft.type} ({editingDraft.typeName || ''})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Pembuat:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{editingDraft.creator}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Berkas Saat Ini:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                  {editingDraft.fileName || 'Belum ada berkas'} {editingDraft.fileSize ? `(${editingDraft.fileSize})` : ''}
                </span>
              </div>
            </div>

            {/* Input Judul Dokumen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Judul Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Masukkan judul dokumen..."
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dropzone Upload Berkas Baru */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Upload Berkas Dokumen Baru / Yang Sudah Direvisi</span>
                <span className="text-[10px] text-slate-400 font-normal">PDF, DOCX, XLSX, XLS, CSV</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <UploadCloud className="w-8 h-8 text-blue-600" />
                  {selectedFile ? (
                    <div className="text-xs flex items-center justify-center gap-2 flex-wrap">
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Berkas Baru Dipilih:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Klik di sini atau seret file PDF / Word / Excel yang sudah direvisi
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {editingDraft.fileName
                          ? `Menggantikan berkas lama: ${editingDraft.fileName}`
                          : 'Pilih file lampiran dokumen (Maks. 25 MB)'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Catatan Perbaikan Pembuat */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Perbaikan / Rincian Perubahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Contoh: Lampiran flow chart proses telah diperbarui dan klausul 3.2 disesuaikan..."
                className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setEditingDraft(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveDraftEdit(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Simpan Draft Saja
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSaveDraftEdit(true)}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Mengunggah & Mengajukan...' : 'Upload & Ajukan Verifikasi Ulang'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

