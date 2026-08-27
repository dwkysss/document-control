import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Info,
  Calendar,
  User,
  Search,
  X,
  UploadCloud,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextSequenceNumber, formatDocumentNumber } from '../../utils/numberingEngine';

export default function NewRegistrationView() {
  const {
    departments,
    documentTypes,
    employees,
    verifierTeams,
    documents,
    currentUser,
    systemSettings,
    saveDraft,
    submitForVerification,
    setViewingDocument,
    setActiveMenu,
    showToast
  } = useDocumentControl();

  // Form State
  const [selectedType, setSelectedType] = useState('IK');
  const [selectedDept, setSelectedDept] = useState('HRGA');
  const [selectedCreator, setSelectedCreator] = useState(currentUser);
  const [title, setTitle] = useState('PROSEDUR PENGAJUAN CUTI KARYAWAN');
  const [createdDate, setCreatedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedVerifierTeam, setSelectedVerifierTeam] = useState('Document Control Team');
  const [notes, setNotes] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Live Auto-calculated Sequence Number
  const nextSeq = getNextSequenceNumber(documents, selectedType, selectedDept);
  const nextRev = '00';

  const previewDocNumber = formatDocumentNumber({
    companyCode: systemSettings.companyCode || 'DJI',
    docType: selectedType,
    department: selectedDept,
    seqNumber: nextSeq,
    revision: nextRev
  });

  const nowTimestamp = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + new Date().toLocaleTimeString('id-ID');

  const handleSaveDraft = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Harap masukkan judul dokumen!', 'danger');
      return;
    }
    if (!selectedCreator) {
      showToast('Harap pilih pembuat dokumen!', 'danger');
      return;
    }

    if (fileAttachment) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveDraft({
          title: title.toUpperCase().trim(),
          type: selectedType,
          department: selectedDept,
          creator: selectedCreator.name,
          creatorNik: selectedCreator.nik,
          creatorPosition: selectedCreator.position,
          seqNumber: nextSeq,
          revision: nextRev,
          verifierTeam: selectedVerifierTeam,
          notes: notes,
          createdDate,
          fileName: fileAttachment.name,
          fileSize: fileAttachment.size,
          fileType: fileAttachment.type,
          fileUrl: event.target.result
        });
      };
      reader.readAsDataURL(fileAttachment);
    } else {
      saveDraft({
        title: title.toUpperCase().trim(),
        type: selectedType,
        department: selectedDept,
        creator: selectedCreator.name,
        creatorNik: selectedCreator.nik,
        creatorPosition: selectedCreator.position,
        seqNumber: nextSeq,
        revision: nextRev,
        verifierTeam: selectedVerifierTeam,
        notes: notes,
        createdDate,
        fileName: `${previewDocNumber}.pdf`,
        fileUrl: null
      });
    }
  };

  const handleSubmitVerification = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Harap masukkan judul dokumen!', 'danger');
      return;
    }
    if (!selectedCreator) {
      showToast('Harap pilih pembuat dokumen!', 'danger');
      return;
    }

    if (fileAttachment) {
      const reader = new FileReader();
      reader.onload = (event) => {
        submitForVerification({
          title: title.toUpperCase().trim(),
          type: selectedType,
          department: selectedDept,
          creator: selectedCreator.name,
          creatorNik: selectedCreator.nik,
          creatorPosition: selectedCreator.position,
          seqNumber: nextSeq,
          revision: nextRev,
          verifierTeam: selectedVerifierTeam,
          notes: notes,
          createdDate,
          fileName: fileAttachment.name,
          fileSize: fileAttachment.size,
          fileType: fileAttachment.type,
          fileUrl: event.target.result
        });
      };
      reader.readAsDataURL(fileAttachment);
    } else {
      submitForVerification({
        title: title.toUpperCase().trim(),
        type: selectedType,
        department: selectedDept,
        creator: selectedCreator.name,
        creatorNik: selectedCreator.nik,
        creatorPosition: selectedCreator.position,
        seqNumber: nextSeq,
        revision: nextRev,
        verifierTeam: selectedVerifierTeam,
        notes: notes,
        createdDate,
        fileName: `${previewDocNumber}.pdf`,
        fileUrl: null
      });
    }
  };

  // Recent 5 documents
  const recentDocuments = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left 8-Cols: Main Document Information Form */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Card: INFORMASI DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                INFORMASI DOKUMEN
              </h2>
              <span className="text-[11px] text-sky-300 font-medium">Form Registrasi Awal ISO 9001</span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Column 1 Inputs */}
                <div className="space-y-4">
                  {/* Jenis Dokumen */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Jenis Dokumen <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {documentTypes.map((t) => (
                        <option key={t.id} value={t.code}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Departemen */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Departemen <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pembuat */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Pembuat <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-lg transition ${
                      !selectedCreator ? 'border-red-400 bg-red-50/20' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          {selectedCreator ? (
                            <>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {selectedCreator.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                NIK, {selectedCreator.nik} | {selectedCreator.position}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              ( Pilih karyawan pembuat dokumen )
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedCreator && (
                          <button
                            type="button"
                            onClick={() => setSelectedCreator(null)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Hapus Pembuat"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowEmployeeModal(true)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Pilih Karyawan Lain"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {!selectedCreator && (
                      <span className="text-[10px] text-red-500 font-medium mt-1 block">
                        Pembuat dokumen wajib dipilih.
                      </span>
                    )}
                  </div>

                  {/* Judul Dokumen */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Judul Dokumen <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {title.length}/200
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={200}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Masukkan judul dokumen resmi..."
                      className={`w-full text-xs uppercase font-medium bg-white dark:bg-slate-800 border rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 transition ${
                        !title.trim() ? 'border-red-400 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                      }`}
                    />
                    {!title.trim() && (
                      <span className="text-[10px] text-red-500 font-medium mt-0.5 block">
                        Judul dokumen tidak boleh kosong.
                      </span>
                    )}
                  </div>

                  {/* Tanggal Pembuatan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      Tanggal Pembuatan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={createdDate}
                        onChange={(e) => setCreatedDate(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2 Inputs (System Read-only values) */}
                <div className="space-y-4">
                  {/* Nomor Registrasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nomor Registrasi
                    </label>
                    <input
                      type="text"
                      disabled
                      value="( Otomatis oleh sistem )"
                      className="w-full text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-400 font-mono italic"
                    />
                  </div>

                  {/* No. Urut */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      No. Urut
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`( Otomatis oleh sistem: ${nextSeq} )`}
                      className="w-full text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-500 font-mono italic"
                    />
                  </div>

                  {/* Revisi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Revisi
                    </label>
                    <input
                      type="text"
                      disabled
                      value="( Otomatis oleh sistem: 00 )"
                      className="w-full text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-500 font-mono italic"
                    />
                  </div>

                  {/* Status Dokumen */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Status Dokumen
                    </label>
                    <div className="p-2 border border-sky-300 bg-sky-50 dark:bg-sky-950/40 rounded-lg text-center font-bold text-sky-700 dark:text-sky-300 text-xs tracking-wider">
                      DRAFT
                    </div>
                  </div>

                  {/* Tanggal Registrasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tanggal Registrasi
                    </label>
                    <input
                      type="text"
                      disabled
                      value={nowTimestamp}
                      className="w-full text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-600 font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card: VERIFIKASI */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                VERIFIKASI
              </h2>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Team Verifikator */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Team Verifikator <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVerifierTeam}
                    onChange={(e) => setSelectedVerifierTeam(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {verifierTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name} ({team.leader})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Catatan
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tuliskan catatan jika diperlukan..."
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Lampiran Berkas Dokumen (Upload PDF) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Lampiran Berkas Resmi (PDF / DOCX)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 text-center hover:bg-blue-50/30 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileAttachment(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    {fileAttachment ? (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-600">Berkas Terlampir:</span> {fileAttachment.name} ({(fileAttachment.size / 1024).toFixed(0)} KB)
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Klik untuk memilih berkas atau seret file PDF ke sini
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Format yang didukung: PDF, DOCX (Maks. 25 MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition shadow-sm"
                >
                  <Save className="w-4 h-4 text-blue-600" />
                  SIMPAN DRAFT
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  AJUKAN VERIFIKASI
                </button>
              </div>
            </div>
          </div>

          {/* Card: DAFTAR DOKUMEN TERBARU */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-wider uppercase">
                DAFTAR DOKUMEN TERBARU
              </h2>
              <button
                onClick={() => setActiveMenu('ctrl-all')}
                className="text-xs text-sky-300 hover:text-white font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3.5 text-center">No.</th>
                    <th className="py-3 px-3.5">No. Dokumen</th>
                    <th className="py-3 px-3.5">Judul Dokumen</th>
                    <th className="py-3 px-3.5">Departemen</th>
                    <th className="py-3 px-3.5">Pembuat</th>
                    <th className="py-3 px-3.5 text-center">Revisi</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Tgl. Registrasi</th>
                    <th className="py-3 px-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentDocuments.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                        {doc.docNumber}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={doc.title}>
                        {doc.title}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-600 dark:text-slate-400">
                        {doc.department}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {doc.creator}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {doc.revision}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <Badge status={doc.status} size="sm" />
                      </td>
                      <td className="py-3 px-3.5 text-center text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {doc.createdDate}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition"
                          title="Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 4-Cols: Live Number Preview, Rules Sistem, Revision Flow */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Card 1: PREVIEW NOMOR DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
            <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              PREVIEW NOMOR DOKUMEN
            </h3>

            {/* Big Code Preview */}
            <div className="py-3 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {previewDocNumber}
              </span>
            </div>

            {/* 5-Block Segment Visualizer */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {/* Block 1: DJI */}
              <div className="border border-slate-200 dark:border-slate-700 border-t-4 border-t-blue-600 rounded-lg p-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {systemSettings.companyCode || 'DJI'}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1">
                  Kode Perusahaan
                </div>
              </div>

              {/* Block 2: Jenis */}
              <div className="border border-slate-200 dark:border-slate-700 border-t-4 border-t-cyan-500 rounded-lg p-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {selectedType}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1">
                  Jenis Dokumen
                </div>
              </div>

              {/* Block 3: Dept */}
              <div className="border border-slate-200 dark:border-slate-700 border-t-4 border-t-emerald-500 rounded-lg p-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {selectedDept}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1">
                  Departemen
                </div>
              </div>

              {/* Block 4: No Urut */}
              <div className="border border-slate-200 dark:border-slate-700 border-t-4 border-t-amber-500 rounded-lg p-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {nextSeq}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1">
                  No Urut Dokumen
                </div>
              </div>

              {/* Block 5: Revisi */}
              <div className="border border-slate-200 dark:border-slate-700 border-t-4 border-t-rose-500 rounded-lg p-2 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                  {nextRev}
                </div>
                <div className="text-[9px] text-slate-500 leading-tight mt-1">
                  Revisi Dokumen
                </div>
              </div>
            </div>

            {/* Info Callout */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Nomor dokumen dibuat otomatis oleh sistem berdasarkan jenis dokumen, departemen, nomor urut dan revisi.
              </p>
            </div>
          </div>

          {/* Card 2: RULES SISTEM */}
          <div className="bg-amber-50/60 dark:bg-slate-900 rounded-xl shadow-card border border-amber-200 dark:border-slate-800 p-5 space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase text-amber-900 dark:text-amber-400 tracking-wider">
              RULES SISTEM
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Nomor dokumen dibuat otomatis oleh sistem.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Nomor urut berdasarkan jenis dokumen + departemen.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Dokumen baru dimulai dari revisi 00.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Revisi dokumen akan naik otomatis (01, 02, 03, ...).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Nomor dokumen tidak boleh diubah manual.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Dokumen yang sudah disetujui tidak dapat dihapus.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Dokumen lama berubah status menjadi <strong className="text-rose-600 font-bold">OBSOLETE</strong> jika ada revisi baru.</span>
              </li>
            </ul>
          </div>

          {/* Card 3: CONTOH ALUR REVISI */}
          <div className="bg-purple-50/50 dark:bg-slate-900 rounded-xl shadow-card border border-purple-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-purple-900 dark:text-purple-300 tracking-wider">
              CONTOH ALUR REVISI
            </h3>

            {/* Revision Timeline Graphic */}
            <div className="space-y-3 pl-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Dokumen Baru</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">DJI-IK-HRGA-01-00</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Aktif</span>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-1 pl-4 space-y-2.5 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Revisi 1</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800 dark:text-slate-200">DJI-IK-HRGA-01-01</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Aktif</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Revisi 2</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800 dark:text-slate-200">DJI-IK-HRGA-01-02</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Aktif</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Revisi 3</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-800 dark:text-slate-200">DJI-IK-HRGA-01-03</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-purple-100/70 dark:bg-purple-950/40 rounded-lg flex items-start gap-2 text-[11px] text-purple-900 dark:text-purple-300">
              <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span>Nomor urut tetap sama, yang berubah hanya nomor revisi.</span>
            </div>
          </div>

        </div>

      </div>

      {/* Employee Selector Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pilih Pembuat Dokumen (Karyawan)</h3>
              <button onClick={() => setShowEmployeeModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Cari nama karyawan / NIK / departemen..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg dark:bg-slate-800"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {employees
                .filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase()) || e.nik.includes(employeeSearch) || e.department.toLowerCase().includes(employeeSearch.toLowerCase()))
                .map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedCreator(emp);
                      setSelectedDept(emp.department);
                      setShowEmployeeModal(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</p>
                      <p className="text-[11px] text-slate-500">NIK: {emp.nik} | {emp.position} ({emp.department})</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">Pilih &rarr;</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
