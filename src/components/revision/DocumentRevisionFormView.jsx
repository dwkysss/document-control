import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, Send, Save, AlertCircle, CheckCircle2, ArrowRight, Shield, UploadCloud } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextRevisionCode, formatDocumentNumber } from '../../utils/numberingEngine';
import Badge from '../common/Badge';

export default function DocumentRevisionFormView() {
  const {
    documents,
    employees,
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
  const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
  const [directPublish, setDirectPublish] = useState(false);

  const currentDoc = documents.find(d => d.id === targetDocId);

  // Available real approvers: Khusus Management Representative (MR)
  const availableApprovers = (employees || []).filter(
    e => e.status !== 'Nonaktif' && e.role === 'approver'
  );

  const getDefaultApproverNik = () => {
    return 'DJI012548'; // BABAN RACHMAT SUBAGJA (Manager HRGA & MR)
  };

  const [selectedApproverNik, setSelectedApproverNik] = useState(() => getDefaultApproverNik(currentDoc?.department));

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
      const suggestedNik = getDefaultApproverNik(currentDoc.department);
      if (availableApprovers.some(a => a.nik === suggestedNik)) {
        setSelectedApproverNik(suggestedNik);
      }
    }
  }, [targetDocId, currentDoc]);

  const activeApprover = availableApprovers.find(a => a.nik === selectedApproverNik) || availableApprovers[0] || {
    name: 'DENI RAMDAN',
    nik: 'DJI092115',
    position: 'GENERAL MANAGER',
    department: 'MGMT',
    role: 'approver'
  };

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
        targetApprover: activeApprover?.name || 'DENI RAMDAN',
        approverNik: activeApprover?.nik || 'DJI092115',
        approverName: activeApprover?.name || 'DENI RAMDAN',
        approverPosition: activeApprover?.position || 'GENERAL MANAGER',
        content: revisedContent,
        isDraft,
        directPublish: isDcoOrAdmin ? directPublish : false,
        fileName: fileAttachment ? fileAttachment.name : `${newDocNumber}.pdf`,
        fileSize: fileAttachment ? fileAttachment.size : null,
        fileType: fileAttachment ? fileAttachment.type : null,
        fileUrl: fileDataUrl
      });

      setSelectedDocForRevision(null);
      if (isDraft) {
        setActiveMenu('reg-draft');
        setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Draft']);
      } else if (isDcoOrAdmin && directPublish) {
        setActiveMenu('ctrl-all');
        setBreadcrumbs(['Dashboard', 'Master Dokumen', 'Semua Dokumen']);
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

              {/* ISO 9001 Pipeline Banner for Revision */}
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50/50 dark:from-purple-950/40 dark:to-blue-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tahap 1: Verifikasi Format ISO</span>
                    <p className="text-[11px] text-slate-500">Otomatis oleh: <strong className="text-blue-700 dark:text-blue-400">Document Control Team (SYAHLA NOVIYANA)</strong></p>
                  </div>
                  <div className="hidden sm:block text-slate-400 font-bold">➔</div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tahap 2: Otorisasi Pengesahan Revisi</span>
                    <p className="text-[11px] text-slate-500">Oleh: <strong className="text-purple-700 dark:text-purple-400">{activeApprover.name} ({activeApprover.position})</strong></p>
                  </div>
                </div>
              </div>

              {/* Pejabat Penyetuju (Approver) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Pejabat Penyetuju Revisi (Approver) <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400">Departemen {currentDoc.department}</span>
                </label>
                <select
                  value={selectedApproverNik}
                  onChange={(e) => setSelectedApproverNik(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                >
                  {availableApprovers.map((emp) => (
                    <option key={emp.nik} value={emp.nik}>
                      {emp.name} — {emp.position} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lampiran File Revisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lampiran Berkas Hasil Revisi (PDF / Word / Excel)
                </label>
                <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-xl p-4 bg-purple-50/40 dark:bg-slate-800/40 text-center hover:bg-purple-50/70 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
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
                      <div className="text-xs flex items-center justify-center gap-2 flex-wrap">
                        <span className="font-bold text-emerald-600">Berkas Revisi Terlampir:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{fileAttachment.name}</span>
                        <span className="text-[10px] text-slate-400">({(fileAttachment.size / 1024).toFixed(0)} KB)</span>
                        {/\.(xlsx?|csv)$/i.test(fileAttachment.name) && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            EXCEL / SPREADSHEET
                          </span>
                        )}
                        {/\.(docx?)$/i.test(fileAttachment.name) && (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                            WORD (.DOCX)
                          </span>
                        )}
                        {/\.pdf$/i.test(fileAttachment.name) && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                            PDF
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Klik untuk memilih berkas revisi atau seret file PDF / Word / Excel ke sini
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Format yang didukung: PDF, DOCX, XLSX, XLS, CSV (Maks. 25 MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Opsi Khusus DCO & Admin: Direct Publish Dokumen Fisik / Info Bypass */}
              {isDcoOrAdmin && (
                <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-purple-900 dark:text-purple-200">
                        Mode Revisi Document Control
                      </p>
                      <p className="text-purple-800 dark:text-purple-300 mt-0.5 leading-relaxed">
                        Sebagai DCO, pengajuan revisi otomatis lolos verifikasi format (Tahap 1) dan langsung masuk ke Pejabat Penyetuju (<strong>{activeApprover?.name || 'Approver'}</strong>) untuk pengesahan resmi.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={directPublish}
                        onChange={(e) => setDirectPublish(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Revisi telah disahkan fisik / bertanda tangan basah
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Centang opsi ini jika naskah revisi sudah ditandatangani basah oleh pejabat berwenang. Revisi baru akan langsung <strong>AKTIF</strong> dan versi lama ({currentDoc.docNumber}) otomatis diubah menjadi <strong>OBSOLETE</strong>.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Simpan Draft Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(false)}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow flex items-center gap-1.5 cursor-pointer ${
                    directPublish
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : isDcoOrAdmin
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {directPublish ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Terbitkan Langsung Revisi (Aktif)
                    </>
                  ) : isDcoOrAdmin ? (
                    <>
                      <Send className="w-4 h-4" />
                      Ajukan ke Approver (Tahap 2)
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ajukan Revisi untuk Verifikasi
                    </>
                  )}
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
