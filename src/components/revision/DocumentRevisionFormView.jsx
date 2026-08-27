import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, Send, Save, AlertCircle, CheckCircle2, ArrowRight, Shield, UploadCloud } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextRevisionCode, formatDocumentNumber } from '../../utils/numberingEngine';
import Badge from '../common/Badge';

export default function DocumentRevisionFormView() {
  const {
    documents,
    verifierTeams,
    currentUser,
    systemSettings,
    selectedDocForRevision,
    setSelectedDocForRevision,
    createDocumentRevision,
    setActiveMenu,
    setBreadcrumbs,
    showToast
  } = useDocumentControl();

  const activeDocs = documents.filter(d => d.status === 'AKTIF');

  const [targetDocId, setTargetDocId] = useState(
    selectedDocForRevision ? selectedDocForRevision.id : (activeDocs[0]?.id || '')
  );
  const [changeReason, setChangeReason] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [revisedTitle, setRevisedTitle] = useState('');
  const [selectedVerifierTeam, setSelectedVerifierTeam] = useState('Document Control Team');
  const [revisedContent, setRevisedContent] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);

  const currentDoc = documents.find(d => d.id === targetDocId);

  useEffect(() => {
    if (selectedDocForRevision) {
      setTargetDocId(selectedDocForRevision.id);
    }
  }, [selectedDocForRevision]);

  useEffect(() => {
    if (currentDoc) {
      setRevisedTitle(currentDoc.title);
      setRevisedContent(currentDoc.content || '');
      setSelectedVerifierTeam(currentDoc.verifierTeam || 'Document Control Team');
    }
  }, [targetDocId, currentDoc]);

  if (!currentDoc) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200">
        <p className="text-slate-500">Tidak ada dokumen aktif yang dapat direvisi saat ini.</p>
      </div>
    );
  }

  const nextRevCode = getNextRevisionCode(currentDoc.revision);
  const newDocNumber = formatDocumentNumber({
    companyCode: systemSettings.companyCode || 'DJI',
    docType: currentDoc.type,
    department: currentDoc.department,
    seqNumber: currentDoc.seqNumber,
    revision: nextRevCode
  });

  const handleSubmitRevision = (isDraft = false) => {
    if (!changeReason.trim()) {
      showToast('Harap masukkan alasan pengajuan perubahan/revisi!', 'danger');
      return;
    }

    const doSubmit = (fileDataUrl = null) => {
      createDocumentRevision(currentDoc, {
        title: revisedTitle,
        changeReason,
        changeDescription,
        verifierTeam: selectedVerifierTeam,
        content: revisedContent,
        isDraft,
        fileName: fileAttachment ? fileAttachment.name : `${newDocNumber}.pdf`,
        fileSize: fileAttachment ? fileAttachment.size : null,
        fileType: fileAttachment ? fileAttachment.type : null,
        fileUrl: fileDataUrl
      });

      setSelectedDocForRevision(null);
      if (isDraft) {
        setActiveMenu('reg-draft');
        setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Draft']);
      } else {
        setActiveMenu('reg-pending');
        setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi']);
      }
    };

    if (fileAttachment) {
      const reader = new FileReader();
      reader.onload = (event) => {
        doSubmit(event.target.result);
      };
      reader.readAsDataURL(fileAttachment);
    } else {
      doSubmit(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            Pengajuan Revisi Dokumen (Document Change Request - DCR)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulir permohonan perubahan resmi untuk memperbaharui dokumen terkendali yang sedang aktif.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">PILIH DOKUMEN & INFORMASI PERUBAHAN</h3>
            </div>

            <div className="p-6 space-y-5">
              {/* Document Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Dokumen Aktif yang Akan Direvisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetDocId}
                  onChange={(e) => setTargetDocId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500"
                >
                  {activeDocs.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.docNumber} - {doc.title} (Rev {doc.revision}) [{doc.department}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Judul Dokumen (Bisa diubah jika perlu perbaikan judul) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Dokumen Revisi
                </label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 uppercase font-medium"
                />
              </div>

              {/* Alasan Perubahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alasan Perubahan / Latar Belakang Revisi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Contoh: Penyesuaian prosedur terhadap regulasi baru / peningkatan efisiensi proses mesin..."
                  className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Uraian Perubahan (Diff summary) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Uraian Detail Klausul yang Diubah (Summary of Changes)
                </label>
                <textarea
                  rows={3}
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Sebutkan pasal, halaman, atau klausul spesifik yang diperbaharui..."
                  className="w-full text-xs p-2.5 border rounded-lg dark:bg-slate-800"
                />
              </div>

              {/* Draft Isi Dokumen Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Draft Isi / Uraian Dokumen Baru
                </label>
                <textarea
                  rows={5}
                  value={revisedContent}
                  onChange={(e) => setRevisedContent(e.target.value)}
                  className="w-full font-mono text-xs p-3 border rounded-lg dark:bg-slate-800"
                />
              </div>

              {/* Tim Verifikator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tim Verifikator Penguji <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVerifierTeam}
                  onChange={(e) => setSelectedVerifierTeam(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5"
                >
                  {verifierTeams.map(t => (
                    <option key={t.id} value={t.name}>{t.name} (Lead: {t.leader})</option>
                  ))}
                </select>
              </div>

              {/* Lampiran File Revisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lampiran Berkas Hasil Revisi (PDF / DOCX)
                </label>
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-4 bg-purple-50/40 dark:bg-slate-800/40 text-center hover:bg-purple-50/70 transition cursor-pointer relative">
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
                    <UploadCloud className="w-6 h-6 text-purple-600" />
                    {fileAttachment ? (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-600">Berkas Revisi Terlampir:</span> {fileAttachment.name} ({(fileAttachment.size / 1024).toFixed(0)} KB)
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Klik untuk memilih berkas revisi atau seret file PDF ke sini
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Simpan Draft Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Ajukan Revisi untuk Verifikasi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Preview Comparison */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              KOMPARASI PENOMORAN REVISI
            </h3>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border text-xs space-y-1">
              <span className="text-slate-500 font-semibold">Versi Aktif Saat Ini:</span>
              <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {currentDoc.docNumber}
              </div>
              <div className="text-[11px] text-slate-500">Revisi: {currentDoc.revision} (Status: AKTIF)</div>
            </div>

            <div className="flex justify-center text-purple-600">
              <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
            </div>

            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800 text-xs space-y-1">
              <span className="text-purple-700 dark:text-purple-300 font-semibold">Nomor Dokumen Revisi Baru:</span>
              <div className="font-mono font-bold text-purple-900 dark:text-purple-200 text-base">
                {newDocNumber}
              </div>
              <div className="text-[11px] text-purple-700 dark:text-purple-300">
                Revisi: <strong>{nextRevCode}</strong> (Status Awal: Menunggu Verifikasi)
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Dampak terhadap Dokumen Lama:
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Saat revisi <strong>{nextRevCode}</strong> disetujui, dokumen versi <strong>{currentDoc.revision}</strong> akan otomatis berganti status menjadi <strong>OBSOLETE</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
