import React, { useState, useRef } from 'react';
import { 
  FileEdit, 
  Trash2, 
  Send, 
  Eye, 
  Plus, 
  Search, 
  UploadCloud, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  X,
  Clock,
  Save
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { uploadDocumentFile } from '../../lib/supabaseClient';

export default function DraftListView() {
  const {
    documents,
    departments,
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

  const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
  const [dcoScope, setDcoScope] = useState('ALL'); // 'ALL' | 'MINE'
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'DRAFT' | 'REVISION'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal State untuk Edit & Upload Berkas Revisi
  const [editingDraft, setEditingDraft] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Helper untuk memeriksa kepemilikan berkas (ISO 9001 Segregation of Duties)
  const checkIsOwner = (doc) => {
    if (!currentUser || !doc) return false;
    const userNik = (currentUser.nik || '').toUpperCase().trim();
    const userName = (currentUser.name || '').toUpperCase().trim();
    return Boolean(
      (doc.creatorNik && doc.creatorNik.toUpperCase().trim() === userNik) ||
      (doc.creator && doc.creator.toUpperCase().trim() === userName)
    );
  };

  // Seluruh draft dalam sistem
  const allDrafts = (documents || []).filter(d => d.status === 'DRAFT' || d.status === 'PERLU REVISI' || d.status === 'REVISI');

  // Draft yang berhak diakses oleh user saat ini
  const drafts = allDrafts.filter(doc => {
    if (!isDcoOrAdmin) {
      // Staf biasa: HANYA draft milik pribadi
      return checkIsOwner(doc);
    }
    // DCO / Admin: Berdasarkan toggle DCO Scope
    if (dcoScope === 'MINE') {
      return checkIsOwner(doc);
    }
    return true; // 'ALL' (Mode Pengawasan DCO)
  });

  const draftOnlyCount = drafts.filter(d => d.status === 'DRAFT').length;
  const revisionCount = drafts.filter(d => d.status === 'PERLU REVISI' || d.status === 'REVISI').length;
  const myDraftCount = allDrafts.filter(d => checkIsOwner(d)).length;

  const filteredDrafts = drafts.filter(doc => {
    const isNeedsRev = doc.status === 'PERLU REVISI' || doc.status === 'REVISI';
    if (activeTab === 'DRAFT' && isNeedsRev) return false;
    if (activeTab === 'REVISION' && !isNeedsRev) return false;

    const matchesSearch = (doc.docNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (doc.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (doc.creator || '').toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="space-y-5">
      {/* Header Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Draft & Dokumen Perlu Perbaikan
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {isDcoOrAdmin && dcoScope === 'ALL' ? `${drafts.length} Berkas Sistem` : `${drafts.length} Berkas Saya`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDcoOrAdmin
                ? 'Mode Otoritas DCO: Pantau dan kelola seluruh usulan dokumen draft dalam sistem perusahaan.'
                : 'Daftar berkas usulan dokumen yang Anda buat dan berkas yang memerlukan revisi sebelum diajukan.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* DCO Scope Switch (Hanya untuk Admin / DCO / Approver) */}
          {isDcoOrAdmin && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDcoScope('MINE')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  dcoScope === 'MINE'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Draft Saya ({myDraftCount})
              </button>
              <button
                type="button"
                onClick={() => setDcoScope('ALL')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  dcoScope === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua Draft ({allDrafts.length})
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveMenu('reg-new');
              setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrasi Baru
          </button>
        </div>
      </div>

      {/* Unified Table Container: Toolbar (Tabs + Search/Filter) & Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Semua</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                {drafts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DRAFT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'DRAFT'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Draft Mandiri</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                {draftOnlyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REVISION')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'REVISION'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Perlu Perbaikan</span>
              {revisionCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                  {revisionCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                  0
                </span>
              )}
            </button>
          </div>

          {/* Search & Dept Selector */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nomor, judul, atau pembuat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="shrink-0">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="ALL">Semua Dept</option>
                {departments && departments.length > 0 ? (
                  departments.map(d => (
                    <option key={d.id || d.code} value={d.code}>{d.code}</option>
                  ))
                ) : (
                  <>
                    <option value="HRGA">HRGA</option>
                    <option value="FAT">FAT</option>
                    <option value="PRODUKSI">PRODUKSI</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="QAQC">QAQC</option>
                    <option value="IT">IT</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Content Body: Empty State OR Streamlined Table */}
        {filteredDrafts.length === 0 ? (
          drafts.length === 0 ? (
            /* Empty State 1: Zero draft in database */
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-2xs">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {!isDcoOrAdmin || dcoScope === 'MINE'
                  ? 'Belum Ada Berkas Draft Pribadi yang Tersimpan'
                  : 'Belum Ada Berkas Draft yang Tersimpan di Sistem'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                {!isDcoOrAdmin || dcoScope === 'MINE'
                  ? 'Anda belum memiliki usulan dokumen yang tersimpan sebagai draft. Saat Anda mengisi formulir registrasi dokumen dan memilih Simpan Draft, berkas Anda akan tersimpan di sini secara aman.'
                  : 'Saat ini tidak ada staf yang sedang menyimpan draf atau dokumen dalam status perbaikan revisi.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu('reg-new');
                    setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Mulai Registrasi Dokumen Baru
                </button>
              </div>
            </div>
          ) : (
            /* Empty State 2: No match for current search/tab filter */
            <div className="py-14 px-4 text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2.5">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tidak ada berkas yang sesuai dengan filter
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Coba ubah kata kunci pencarian atau reset filter kategori/departemen.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedDept('ALL'); setActiveTab('ALL'); }}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 rounded-lg transition cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          )
        ) : (
          /* Streamlined 6-Column Table */
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-3.5 text-center w-12 whitespace-nowrap">No.</th>
                  <th className="py-3.5 px-4 min-w-[210px] whitespace-nowrap">Identitas Dokumen</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Judul Dokumen & Berkas</th>
                  <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">Pembuat & Tanggal</th>
                  <th className="py-3.5 px-4 text-center w-24 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[180px] whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDrafts.map((doc, idx) => {
                  const isNeedsRevision = doc.status === 'PERLU REVISI' || doc.status === 'REVISI';
                  const isOwner = checkIsOwner(doc);

                  return (
                    <tr
                      key={doc.id}
                      className={`transition ${
                        isNeedsRevision
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* 1. No (Rata Atas Simetris) */}
                      <td className="py-3.5 px-3.5 text-center text-slate-400 align-top font-medium text-xs whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {/* 2. Identitas Dokumen (Nomor + Tag Tipe & Dept) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap min-w-[210px]">
                        <span className="font-bold font-mono text-slate-900 dark:text-white block tracking-wide select-all text-xs whitespace-nowrap">
                          {doc.docNumber}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[9.5px] border border-blue-200/60 dark:border-blue-800/60 shrink-0">
                            {doc.type}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[9.5px] shrink-0">
                            {doc.department}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            Rev {doc.revision}
                          </span>
                        </div>
                      </td>

                      {/* 3. Judul Dokumen & Berkas Lampiran (+ Catatan Revisi) */}
                      <td className="py-3.5 px-4 align-top min-w-[220px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-relaxed" title={doc.title}>
                          {doc.title}
                        </div>

                        {/* Catatan Revisi jika ada permintaan revisi */}
                        {doc.revisionNotes && (
                          <div className="mt-1.5 text-[11px] text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 leading-snug">
                            <span className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-400">
                              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                              Catatan Revisi ({doc.revisionRequestedBy || 'Verifikator'}{
                                doc.revisionRequestedStage === 'FORMAT' || doc.revisionRequestedStage === 'VERIFIKASI'
                                  ? ' • DCO'
                                  : doc.revisionRequestedStage === 'APPROVAL'
                                  ? ' • MR'
                                  : ''
                              }):
                            </span>
                            <span className="mt-0.5 block italic text-slate-700 dark:text-slate-300 pl-4">
                              "{doc.revisionNotes}"
                            </span>
                          </div>
                        )}

                        {/* Info Berkas Lampiran (Pill Kapsul Kompak) */}
                        {doc.fileName && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 max-w-full">
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate max-w-[200px] font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                              {doc.fileName}
                            </span>
                            {doc.fileSize && (
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                • {doc.fileSize}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 4. Pembuat & Tanggal */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {doc.creator}
                          </span>
                          {isOwner ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                              Anda
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Rekan
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {doc.createdDate}
                        </span>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        <Badge status={doc.status} size="sm" />
                      </td>

                      {/* 6. Aksi (1 Baris Rapi & Berhierarki) */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* 1. Pratinjau Dokumen */}
                          <button
                            type="button"
                            onClick={() => setViewingDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                            title="Pratinjau Draft"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Edit / Upload Revisi */}
                          {(isOwner || isDcoOrAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(doc)}
                              className={`p-1.5 rounded-lg transition cursor-pointer border ${
                                isNeedsRevision
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 border-transparent hover:border-blue-200 dark:hover:border-blue-800'
                              }`}
                              title={
                                !isOwner && isDcoOrAdmin
                                  ? 'Edit Berkas (Otoritas DCO)'
                                  : isNeedsRevision
                                  ? 'Unggah Berkas Revisi Baru'
                                  : 'Edit Judul / Ganti Berkas'
                              }
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                          )}

                          {/* 3. Ajukan Verifikasi (Primary CTA) */}
                          {(isOwner || isDcoOrAdmin) && (
                            <button
                              type="button"
                              onClick={() => {
                                submitForVerification({
                                  ...doc,
                                  isResubmission: doc.status === 'PERLU REVISI' || doc.status === 'REVISI' || Boolean(doc.revisionNotes)
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-2xs transition cursor-pointer whitespace-nowrap"
                              title={
                                !isOwner && isDcoOrAdmin
                                  ? 'Ajukan Verifikasi (Otoritas DCO)'
                                  : doc.status === 'PERLU REVISI'
                                  ? 'Ajukan Ulang ke Tahap Terakhir'
                                  : 'Ajukan Verifikasi Sekarang'
                              }
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Ajukan</span>
                            </button>
                          )}

                          {/* 4. Hapus Draft */}
                          {(isAdmin || isOwner) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus draf ${doc.docNumber} (${doc.title})?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                              title="Hapus Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer info */}
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Menampilkan <strong>{filteredDrafts.length}</strong> dari <strong>{drafts.length}</strong> berkas draft</span>
              <span className="text-[10px] text-slate-400">ISO 9001:2015 Klausul 7.5</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL EDIT & UPLOAD ULANG BERKAS DOKUMEN ================= */}
      {editingDraft && (
        <Modal
          isOpen={Boolean(editingDraft)}
          onClose={() => !isSubmitting && setEditingDraft(null)}
          title={
            editingDraft.status === 'PERLU REVISI'
              ? 'Unggah Berkas Revisi & Ajukan Ulang'
              : 'Perbarui & Edit Berkas Draft'
          }
          subtitle={`Dibuat oleh: ${editingDraft.creator} • Departemen: ${editingDraft.department}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            {/* 1. Header Plate: Nomor Dokumen & Badge Kategori */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Nomor Dokumen Resmi
                </span>
                <span className="text-base font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wide select-all block truncate">
                  {editingDraft.docNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                  {editingDraft.type}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                  {editingDraft.department}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                  Rev {editingDraft.revision}
                </span>
              </div>
            </div>

            {/* 2. Catatan Revisi dari Verifikator (jika status PERLU REVISI) */}
            {editingDraft.revisionNotes && (
              <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                  <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Catatan Permintaan Revisi:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-semibold">
                    {editingDraft.revisionRequestedBy || 'Verifikator'}
                  </span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium italic pl-5">
                  "{editingDraft.revisionNotes}"
                </p>
              </div>
            )}

            {/* 3. Input Judul Dokumen (Textarea dengan Character Counter 0/200) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Judul Dokumen Resmi <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {editTitle.length}/200 karakter
                </span>
              </div>
              <textarea
                rows={2}
                maxLength={200}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Contoh: INSTRUKSI KERJA PENGOPERASIAN MESIN..."
                className="w-full text-xs uppercase font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs placeholder:normal-case"
              />
            </div>

            {/* 4. Berkas Saat Ini & Upload Berkas Baru */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Berkas Lampiran Dokumen (PDF, Word, Excel)
              </label>

              {/* Tampilan Berkas Aktif Saat Ini */}
              {editingDraft.fileName && !selectedFile && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-slate-800 dark:text-slate-200 text-[11px] font-semibold truncate">
                        {editingDraft.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Berkas aktif terlampir {editingDraft.fileSize ? `(${editingDraft.fileSize})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    Terlampir
                  </span>
                </div>
              )}

              {/* Tampilan Berkas Baru yang Dipilih */}
              {selectedFile ? (
                <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate font-mono">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        {(selectedFile.size / 1024).toFixed(0)} KB • Siap diunggah menggantikan berkas lama
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                    title="Batalkan pilihan berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Dropzone Unggah Berkas */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/40"
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
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {editingDraft.fileName ? 'Klik untuk memilih berkas pengganti baru' : 'Pilih file PDF / Word / Excel'}
                    </p>
                    <p className="text-[10.5px] text-slate-400">
                      Format: PDF, DOCX, XLSX, XLS, CSV (Maks. 25 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Catatan Perbaikan / Rincian Perubahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                {editingDraft.status === 'PERLU REVISI'
                  ? 'Catatan Perbaikan Dokumen (Rincian bagian yang diperbaiki)'
                  : 'Catatan Pengajuan (Opsional)'}
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={
                  editingDraft.status === 'PERLU REVISI'
                    ? 'Contoh: Bagian klausul 4.2 telah diperbaiki dan form checklist lampiran telah disesuaikan...'
                    : 'Tuliskan catatan pengajuan jika ada...'
                }
                className="w-full text-xs p-2.5 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs placeholder:text-slate-400"
              />
            </div>

            {/* 6. Tombol Aksi Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setEditingDraft(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveDraftEdit(false)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Simpan Draft</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveDraftEdit(true)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg shadow-sm hover:shadow transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting 
                      ? 'Memproses...' 
                      : editingDraft.status === 'PERLU REVISI'
                      ? 'Ajukan Verifikasi Ulang'
                      : 'Ajukan Dokumen Sekarang'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

