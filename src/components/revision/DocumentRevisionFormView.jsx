import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  FileText,
  Send,
  Save,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Shield,
  ShieldCheck,
  Info,
  UploadCloud,
  FileCheck,
  History,
  Sparkles,
  Clock
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextRevisionCode, formatDocumentNumber } from '../../utils/numberingEngine';

export default function DocumentRevisionFormView() {
  const {
    documents,
    departments,
    employees,
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

  // 1. Ambil daftar Reviewer (Atasan Departemen) dari Master Data Departemen & Karyawan
  const availableReviewers = useMemo(() => {
    const list = [];
    const addedKeys = new Set();

    (departments || []).forEach(dept => {
      const headName = (dept.head || '').trim();
      if (!headName || headName.includes('---') || headName === '-') return;

      const normalized = headName.toUpperCase();
      const matchedEmp = (employees || []).find(e => {
        const empName = (e.name || '').toUpperCase().trim();
        return empName === normalized ||
          empName.includes(normalized) ||
          normalized.includes(empName);
      });

      const canonicalName = matchedEmp ? matchedEmp.name : headName;
      const canonicalKey = canonicalName.toUpperCase().trim();

      if (!addedKeys.has(canonicalKey)) {
        addedKeys.add(canonicalKey);
        list.push({
          nik: matchedEmp?.nik || `HEAD-${dept.code}`,
          name: canonicalName,
          position: matchedEmp?.position || `Kepala Departemen ${dept.name}`,
          department: matchedEmp?.department || dept.code,
          role: matchedEmp?.role || 'reviewer',
          status: 'Aktif'
        });
      }
    });

    (employees || []).forEach(emp => {
      if (emp.status !== 'Nonaktif' && (emp.role === 'reviewer' || emp.role === 'approver')) {
        const canonicalKey = (emp.name || '').toUpperCase().trim();
        if (!addedKeys.has(canonicalKey)) {
          addedKeys.add(canonicalKey);
          list.push(emp);
        }
      }
    });

    return list;
  }, [departments, employees]);

  // Routing otomatis Atasan berdasarkan Departemen Dokumen yang dipilih
  const getDefaultReviewerNik = (deptCode) => {
    const cleanDept = (deptCode || '').toUpperCase();
    const deptObj = (departments || []).find(d => d.code.toUpperCase() === cleanDept);
    const deptHeadName = (deptObj?.head || '').trim();

    if (deptHeadName && !deptHeadName.includes('---') && deptHeadName !== '-') {
      const matched = availableReviewers.find(r =>
        r.name.toUpperCase() === deptHeadName.toUpperCase() ||
        r.department === cleanDept
      );
      if (matched) return matched.nik;
    }

    const mr = availableReviewers.find(r =>
      r.department === 'HRGA' ||
      r.position?.toUpperCase().includes('MR') ||
      r.name.toUpperCase().includes('BABAN')
    );
    if (mr) return mr.nik;

    return availableReviewers[0]?.nik || '';
  };

  // 2. Available Approvers: Management Representative (MR) / Direksi / General Manager
  const availableApprovers = useMemo(() => {
    const list = (employees || []).filter(
      e => e.status !== 'Nonaktif' && (
        e.role === 'approver' ||
        e.department === 'MGMT' ||
        (e.position || '').toUpperCase().includes('GENERAL MANAGER') ||
        (e.position || '').toUpperCase().includes('DIREKSI') ||
        (e.position || '').toUpperCase().includes('MR')
      )
    );

    if (list.length === 0 && employees?.length > 0) {
      return employees.filter(e => e.status !== 'Nonaktif');
    }
    return list;
  }, [employees]);

  const getDefaultApproverNik = (currentReviewerNik) => {
    // Cari pejabat dengan jabatan MR atau role approver
    const mrApprover = availableApprovers.find(e =>
      e.role === 'approver' || (e.position || '').toUpperCase().includes('MR')
    );

    // Prinsip Pemisahan Kewenangan (Four-Eyes Principle ISO 9001):
    // Jika Atasan (Reviewer) dokumen adalah pejabat MR itu sendiri (misal BABAN di HRGA),
    // otomatis arahkan Pengesah (Approver) ke General Manager / Direksi agar tidak memeriksa & mengesahkan naskah sendiri.
    if (currentReviewerNik && mrApprover && mrApprover.nik === currentReviewerNik) {
      const altApprover = availableApprovers.find(e => e.nik !== currentReviewerNik);
      if (altApprover) return altApprover.nik;
    }

    if (mrApprover) return mrApprover.nik;
    return availableApprovers[0]?.nik || 'DJI012548';
  };

  const [selectedReviewerNik, setSelectedReviewerNik] = useState(() => getDefaultReviewerNik(currentDoc?.department));
  const [selectedApproverNik, setSelectedApproverNik] = useState(() =>
    getDefaultApproverNik(getDefaultReviewerNik(currentDoc?.department))
  );

  useEffect(() => {
    if (selectedDocForRevision) {
      setTargetDocId(selectedDocForRevision.id);
    }
  }, [selectedDocForRevision]);

  useEffect(() => {
    if (currentDoc) {
      setRevisedTitle(currentDoc.title);
      setRevisedContent(currentDoc.content || '');
      setSelectedVerifierTeam(currentDoc.verifierTeam || systemSettings?.defaultVerifierTeam || 'Document Control Team');
      
      const suggestedReviewerNik = getDefaultReviewerNik(currentDoc.department);
      if (suggestedReviewerNik) {
        setSelectedReviewerNik(suggestedReviewerNik);
      }
      
      const suggestedApproverNik = getDefaultApproverNik(suggestedReviewerNik);
      if (availableApprovers.some(a => a.nik === suggestedApproverNik)) {
        setSelectedApproverNik(suggestedApproverNik);
      }
    }
  }, [targetDocId, currentDoc, availableReviewers, availableApprovers]);

  const activeReviewer = availableReviewers.find(r => r.nik === selectedReviewerNik) || availableReviewers[0] || {
    name: 'AHMAD JAZULI',
    nik: 'DJI042211',
    position: 'Kepala Departemen Produksi',
    department: 'PRODUKSI'
  };

  const activeApprover = availableApprovers.find(a => a.nik === selectedApproverNik) || availableApprovers[0] || {
    name: 'DENI RAMDAN',
    nik: 'DJI092115',
    position: 'GENERAL MANAGER',
    department: 'MGMT',
    role: 'approver'
  };

  if (!currentDoc) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800">
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
        targetReviewer: activeReviewer?.name,
        reviewerNik: activeReviewer?.nik,
        reviewerName: activeReviewer?.name,
        reviewerPosition: activeReviewer?.position,
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
      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left 8-Cols: Form Cards */}
        <div className="xl:col-span-8 space-y-6">

          {/* Card 1: INFORMASI PERUBAHAN DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-400" />
                INFORMASI PERUBAHAN DOKUMEN (DCR)
              </h2>
              <span className="text-xs font-mono font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30 px-2.5 py-0.5 rounded">
                {newDocNumber}
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Row 1: Dokumen Aktif yang Direvisi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pilih Dokumen Aktif yang Akan Direvisi <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                    Total: {activeDocs.length} Dokumen Aktif
                  </span>
                </div>
                <select
                  value={targetDocId}
                  onChange={(e) => setTargetDocId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                >
                  {activeDocs.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.docNumber} - {doc.title} (Rev {doc.revision}) [{doc.department}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 2: Judul Dokumen Revisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Judul Dokumen Revisi
                </label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 uppercase font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                />
              </div>

              {/* Row 3: Alasan Perubahan & Klausul yang Diubah (2 Kolom) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Alasan Perubahan / Latar Belakang <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Contoh: Penyesuaian prosedur terhadap regulasi baru / efisiensi proses kerja..."
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Uraian Klausul yang Diubah (Summary of Changes)
                  </label>
                  <textarea
                    rows={3}
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    placeholder="Sebutkan pasal, halaman, atau klausul spesifik yang diperbaharui..."
                    className="w-full text-xs p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200 transition"
                  />
                </div>
              </div>

              {/* Row 4: Lampiran Berkas Revisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Lampiran Berkas Hasil Revisi (PDF / Word / Excel)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 text-center hover:bg-blue-50/40 dark:hover:bg-slate-800/70 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer relative">
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
                    <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            </div>
          </div>

          {/* Card 2: PENGESAHAN & PERSETUJUAN REVISI */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                PENGESAHAN & ALUR PERSETUJUAN REVISI
              </h2>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* 4-Stage Compact Approval Pipeline */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Step 1: Pembuat */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-blue-900 dark:text-blue-200 text-[11px] truncate">Pemohon</p>
                      <p className="text-[9.5px] text-blue-600 dark:text-blue-400 font-medium truncate">Draft Revisi</p>
                    </div>
                  </div>

                  {/* Step 2: Reviewer */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">Reviewer</p>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">Atasan Dept</p>
                    </div>
                  </div>

                  {/* Step 3: Doc Control */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">Doc Control</p>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">Verifikasi Format</p>
                    </div>
                  </div>

                  {/* Step 4: Approver MR */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">Approver</p>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">Pengesahan MR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviewer & Approver Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Reviewer (Atasan Departemen) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Dept. {currentDoc.department}
                    </span>
                  </div>
                  <select
                    value={selectedReviewerNik}
                    onChange={(e) => {
                      const newReviewerNik = e.target.value;
                      setSelectedReviewerNik(newReviewerNik);
                      if (selectedApproverNik === newReviewerNik) {
                        const alt = availableApprovers.find(a => a.nik !== newReviewerNik);
                        if (alt) setSelectedApproverNik(alt.nik);
                      }
                    }}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                  >
                    {availableReviewers.map((emp) => (
                      <option key={emp.nik} value={emp.nik}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Approver (Management Representative / MR) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Otoritas Tertinggi
                    </span>
                  </div>
                  <select
                    value={selectedApproverNik}
                    onChange={(e) => setSelectedApproverNik(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                  >
                    {availableApprovers.map((emp) => (
                      <option key={emp.nik} value={emp.nik}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedReviewerNik === selectedApproverNik && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold">Catatan Kepatuhan ISO:</strong> Reviewer dan Approver yang dipilih adalah pejabat yang sama (<strong>{activeReviewer?.name}</strong>). Untuk memenuhi prinsip <em>Four-Eyes</em> / pemisahan kewenangan, disarankan memilih General Manager atau Direksi sebagai pengesah.
                  </p>
                </div>
              )}

              {/* Mode DCO & Admin */}
              {isDcoOrAdmin && (
                <div className={`p-4 rounded-xl border transition-all space-y-3 ${
                  directPublish
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      directPublish
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${
                          directPublish
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          Mode Revisi Document Control
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          directPublish
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                        }`}>
                          {directPublish ? 'Langsung Terbit (Bypass)' : 'Alur Persetujuan'}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Sebagai DCO/Admin, jika naskah revisi sudah diverifikasi dan disetujui fisik, pengajuan dapat langsung diterbitkan atau diproses melalui alur persetujuan.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={directPublish}
                        onChange={(e) => setDirectPublish(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Revisi telah disahkan fisik / bertanda tangan basah
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Centang opsi ini jika naskah revisi sudah ditandatangani basah oleh pejabat berwenang. Revisi baru akan langsung <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">AKTIF</strong> dan versi lama ({currentDoc.docNumber}) otomatis diubah menjadi <strong className="text-rose-600 dark:text-rose-400 font-semibold">OBSOLETE</strong>.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Simpan Draft Revisi
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitRevision(false)}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition shadow-sm hover:shadow cursor-pointer ${
                    directPublish
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20'
                  }`}
                >
                  {directPublish ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Terbitkan Langsung Revisi (Aktif)
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ajukan Revisi Dokumen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4-Cols: Live Preview & Comparison */}
        <div className="xl:col-span-4 space-y-6">
          {/* Card 1: Komparasi Penomoran Revisi (Simple & Compact) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                Komparasi Nomor Revisi
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Rev {currentDoc.revision} → {nextRevCode}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* Compact Comparison Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2">
                {/* Dokumen Lama */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Versi Lama (Aktif)</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">
                    {currentDoc.docNumber}
                  </span>
                </div>

                {/* Dokumen Baru */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Revisi Baru
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                    {newDocNumber}
                  </span>
                </div>
              </div>

              {/* Status Awal */}
              <div className="flex items-center justify-between text-[11px] px-0.5 text-slate-500 dark:text-slate-400">
                <span>Status Awal:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  {directPublish ? 'Langsung Terbit (Aktif)' : 'Menunggu Review Atasan'}
                </span>
              </div>

              {/* Note Obsolete */}
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 px-0.5 leading-relaxed">
                *Dokumen lama otomatis dialihkan ke status <span className="text-rose-500 font-semibold">OBSOLETE</span> saat revisi baru disahkan.
              </p>
            </div>
          </div>

          {/* Card 2: Ringkasan Pengajuan Revisi (Live Summary) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                RINGKASAN PENGAJUAN
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                changeReason.trim()
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {changeReason.trim() ? 'Siap Diajukan' : 'Belum Lengkap'}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Target Dokumen */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {currentDoc.type}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Dept: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{currentDoc.department}</strong>
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                    "{revisedTitle || currentDoc.title}"
                  </p>
                </div>
              </div>

              {/* Alasan Perubahan */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Alasan Perubahan:
                </span>
                {changeReason.trim() ? (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] line-clamp-3">
                    {changeReason}
                  </p>
                ) : (
                  <p className="text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Alasan perubahan belum diisi pada form
                  </p>
                )}
              </div>

              {/* Alur Persetujuan (Pihak Terkait - 4 Tahap ISO) */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Pihak yang Menyetujui Revisi
                  </span>
                  <span className="text-[9.5px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    4 Tahap ISO
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Step 1: Pemohon */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9.5px] text-slate-400 block">Pemohon (Pembuat Revisi):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {currentUser?.name || 'Staff Pemohon'}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Reviewer */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9.5px] text-slate-400 block">Diperiksa oleh (Atasan):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {activeReviewer?.name || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Doc Control */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] text-slate-400 block">Diverifikasi oleh (Doc Control):</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {selectedVerifierTeam || 'Document Control Team'}
                        </span>
                        {directPublish && (
                          <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            Bypass Fisik
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Approver */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div className="min-w-0">
                      <span className="text-[9.5px] text-slate-400 block">Disahkan oleh (MR / GM):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {activeApprover?.name || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReviewerNik === selectedApproverNik && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Reviewer & Approver sama: {activeReviewer?.name}</span>
                  </div>
                )}
              </div>

              {/* Status File Lampiran */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Berkas Lampiran:
                  </span>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate block">
                    {fileAttachment ? fileAttachment.name : 'Menggunakan master sebelumnya'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  fileAttachment
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {fileAttachment ? 'Terlampir' : 'Default'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
