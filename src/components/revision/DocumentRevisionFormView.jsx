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
  Clock,
  Sliders,
  ChevronUp,
  ChevronDown,
  Zap
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextRevisionCode, formatDocumentNumber } from '../../utils/numberingEngine';

export default function DocumentRevisionFormView() {
  const {
    documents,
    departments,
    documentTypes,
    employees,
    allEmployees,
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
  const [showCustomApprover, setShowCustomApprover] = useState(false);
  const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';

  const currentDoc = documents.find(d => d.id === targetDocId);

  const targetCompany = (currentDoc?.companyCode || currentDoc?.docNumber?.split('-')[0] || currentUser?.companyCode || 'DJI').toUpperCase();

  // 1. Ambil daftar Reviewer (Atasan Departemen) strictly terikat ke Unit Perusahaan dokumen (Zero Leak)
  const availableReviewers = useMemo(() => {
    const list = [];
    const addedKeys = new Set();
    const sourceEmps = allEmployees?.length > 0 ? allEmployees : (employees || []);

    const companyEmps = sourceEmps.filter(e => {
      if (e.status === 'Nonaktif') return false;
      const empId = e.nip || e.nik;
      const empComp = (e.companyCode || (empId?.startsWith('UMI') ? 'UMI' : empId?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
      return empComp === targetCompany;
    });

    (departments || []).forEach(dept => {
      const headName = (dept.head || '').trim();
      if (!headName || headName.includes('---') || headName === '-') return;

      const normalized = headName.toUpperCase();
      const matchedEmp = companyEmps.find(e => {
        const empName = (e.name || '').toUpperCase().trim();
        return empName === normalized ||
          empName.includes(normalized) ||
          normalized.includes(empName);
      });

      if (matchedEmp) {
        const canonicalKey = matchedEmp.name.toUpperCase().trim();
        if (!addedKeys.has(canonicalKey)) {
          addedKeys.add(canonicalKey);
          list.push(matchedEmp);
        }
      }
    });

    companyEmps.forEach(emp => {
      const pos = (emp.position || '').toUpperCase();
      const isReviewAuthority = emp.role === 'reviewer' || emp.role === 'approver' ||
        pos.includes('HEAD') || pos.includes('KEPALA') || pos.includes('MANAGER') ||
        pos.includes('SUPERVISOR') || pos.includes('SPV') || pos.includes('LEAD') ||
        pos.includes('MR') || pos.includes('GENERAL MANAGER') || pos.includes('DIREKSI');

      if (isReviewAuthority) {
        const canonicalKey = (emp.name || '').toUpperCase().trim();
        if (!addedKeys.has(canonicalKey)) {
          addedKeys.add(canonicalKey);
          list.push(emp);
        }
      }
    });

    if (list.length === 0 && companyEmps.length > 0) {
      return companyEmps;
    }

    return list;
  }, [allEmployees, employees, departments, targetCompany]);

  const docTypeObj = (documentTypes || []).find(t => t.code === currentDoc?.type);
  const docLevel = docTypeObj?.level || 2;
  const isFastTrack = docLevel === 3 || docLevel === 4;

  // Routing otomatis Atasan berdasarkan Level Dokumen ISO & PT bersangkutan
  const getDefaultReviewerNip = (deptCode, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || currentDoc?.type));
    const level = docType?.level || 2;
    const cleanDept = (deptCode || currentDoc?.department || '').toUpperCase();

    if (level === 1) {
      // Level 1 (Policy): Telaah mutu ISO dilakukan oleh MR unit terkait
      const mr = availableReviewers.find(
        e => (e.position || '').toUpperCase().includes('MR') ||
             (e.position || '').toUpperCase().includes('MANAGEMENT REPRESENTATIVE') ||
             e.role === 'approver'
      );
      if (mr) return mr.nip || mr.nik;
    }

    const deptMatch = availableReviewers.find(r => (r.department || '').toUpperCase() === cleanDept);
    if (deptMatch) return deptMatch.nip || deptMatch.nik;

    const mr = availableReviewers.find(r =>
      (r.department || '').toUpperCase() === 'HRGA' ||
      (r.position || '').toUpperCase().includes('MR') ||
      r.role === 'approver'
    );
    if (mr) return mr.nip || mr.nik;

    if (availableReviewers.length > 0) return availableReviewers[0].nip || availableReviewers[0].nik;

    if (targetCompany === 'UMI') return 'UMI01001';
    if (targetCompany === 'IMK') return 'IMK01001';
    return 'DJI022203';
  };

  // 2. Available Approvers: Strictly per Perusahaan (atau Holding Direksi untuk Level 1 Kebijakan)
  const availableApprovers = useMemo(() => {
    const sourceEmps = allEmployees?.length > 0 ? allEmployees : (employees || []);
    const docType = (documentTypes || []).find(t => t.code === currentDoc?.type);
    const isLevel1 = docType?.level === 1;

    const companyEmps = sourceEmps.filter(e => {
      if (e.status === 'Nonaktif') return false;
      const empId = e.nip || e.nik;
      const empComp = (e.companyCode || (empId?.startsWith('UMI') ? 'UMI' : empId?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
      if (isLevel1) {
        return empComp === targetCompany || empComp === 'ALL' || empComp === 'DJI';
      }
      return empComp === targetCompany;
    });

    const list = companyEmps.filter(e =>
      e.role === 'approver' ||
      e.department === 'MGMT' ||
      (e.position || '').toUpperCase().includes('GENERAL MANAGER') ||
      (e.position || '').toUpperCase().includes('DIREKSI') ||
      (e.position || '').toUpperCase().includes('MR')
    );

    if (list.length > 0) return list;
    return companyEmps.length > 0 ? companyEmps : (employees || []);
  }, [allEmployees, employees, targetCompany, currentDoc?.type, documentTypes]);

  const getDefaultApproverNip = (currentReviewerNip, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || currentDoc?.type));
    const level = docType?.level || 2;

    if (level === 1) {
      const gm = availableApprovers.find(
        a => a.department === 'MGMT' ||
          (a.position || '').toUpperCase().includes('GENERAL MANAGER') ||
          (a.position || '').toUpperCase().includes('DIREKSI')
      );
      if (gm) return gm.nip || gm.nik;
    } else if (level === 2 || level === 5) {
      const mr = availableApprovers.find(
        a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
      );
      if (currentReviewerNip && mr && (mr.nip || mr.nik) === currentReviewerNip) {
        const altApprover = availableApprovers.find(e => (e.nip || e.nik) !== currentReviewerNip);
        if (altApprover) return altApprover.nip || altApprover.nik;
      }
      if (mr) return mr.nip || mr.nik;
    } else if (level === 3 || level === 4) {
      if (currentReviewerNip) return currentReviewerNip;
    }

    const mrApprover = availableApprovers.find(e =>
      e.role === 'approver' || (e.position || '').toUpperCase().includes('MR')
    );

    if (currentReviewerNip && mrApprover && (mrApprover.nip || mrApprover.nik) === currentReviewerNip) {
      const altApprover = availableApprovers.find(e => (e.nip || e.nik) !== currentReviewerNip);
      if (altApprover) return altApprover.nip || altApprover.nik;
    }

    if (mrApprover) return mrApprover.nip || mrApprover.nik;
    if (availableApprovers.length > 0) return availableApprovers[0].nip || availableApprovers[0].nik;

    if (targetCompany === 'UMI') return 'UMI01001';
    if (targetCompany === 'IMK') return 'IMK01001';
    return 'DJI012548';
  };

  const [selectedReviewerNip, setSelectedReviewerNip] = useState(() => getDefaultReviewerNip(currentDoc?.department, currentDoc?.type));
  const [selectedApproverNip, setSelectedApproverNip] = useState(() =>
    getDefaultApproverNip(getDefaultReviewerNip(currentDoc?.department, currentDoc?.type), currentDoc?.type)
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
      
      const suggestedReviewerNip = getDefaultReviewerNip(currentDoc.department, currentDoc.type);
      if (suggestedReviewerNip) {
        setSelectedReviewerNip(suggestedReviewerNip);
      }
      
      const suggestedApproverNip = getDefaultApproverNip(suggestedReviewerNip, currentDoc.type);
      if (availableApprovers.some(a => (a.nip || a.nik) === suggestedApproverNip) || availableReviewers.some(r => (r.nip || r.nik) === suggestedApproverNip)) {
        setSelectedApproverNip(suggestedApproverNip);
      } else if (availableApprovers.length > 0) {
        setSelectedApproverNip(availableApprovers[0].nip || availableApprovers[0].nik);
      }
    }
  }, [targetDocId, currentDoc, availableReviewers, availableApprovers, targetCompany]);

  const activeReviewer = availableReviewers.find(r => (r.nip || r.nik) === selectedReviewerNip) ||
    availableApprovers.find(a => (a.nip || a.nik) === selectedReviewerNip) ||
    availableReviewers[0] || (
      targetCompany === 'UMI'
        ? { name: 'RATNA SARI', nip: 'UMI01001', nik: 'UMI01001', position: 'MANAGER HRGA & MR (UMI)', department: 'HRGA', role: 'approver' }
        : targetCompany === 'IMK'
        ? { name: 'BAMBANG WIJAYA', nip: 'IMK01001', nik: 'IMK01001', position: 'MANAGER HRGA & MR (IMK)', department: 'HRGA', role: 'approver' }
        : { name: 'DEDE SUHENDA', nip: 'DJI022203', nik: 'DJI022203', position: 'KEPALA BAGIAN PRODUKSI', department: 'PRODUKSI', role: 'reviewer' }
    );

  const activeApprover = availableApprovers.find(a => (a.nip || a.nik) === selectedApproverNip) ||
    availableReviewers.find(r => (r.nip || r.nik) === selectedApproverNip) ||
    availableApprovers[0] || (
      targetCompany === 'UMI'
        ? { name: 'RATNA SARI', nip: 'UMI01001', nik: 'UMI01001', position: 'MANAGER HRGA & MR (UMI)', department: 'HRGA', role: 'approver' }
        : targetCompany === 'IMK'
        ? { name: 'BAMBANG WIJAYA', nip: 'IMK01001', nik: 'IMK01001', position: 'MANAGER HRGA & MR (IMK)', department: 'HRGA', role: 'approver' }
        : { name: 'BABAN RACHMAT SUBAGJA', nip: 'DJI012548', nik: 'DJI012548', position: 'MANAGER HRGA & MR', department: 'HRGA', role: 'approver' }
    );

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
        reviewerNip: activeReviewer?.nip || activeReviewer?.nik,
        reviewerNik: activeReviewer?.nip || activeReviewer?.nik,
        reviewerName: activeReviewer?.name,
        reviewerPosition: activeReviewer?.position,
        targetApprover: isFastTrack ? activeReviewer?.name : (activeApprover?.name || 'DENI RAMDAN'),
        approverNip: isFastTrack ? (activeReviewer?.nip || activeReviewer?.nik) : (activeApprover?.nip || activeApprover?.nik || 'DJI092115'),
        approverNik: isFastTrack ? (activeReviewer?.nip || activeReviewer?.nik) : (activeApprover?.nip || activeApprover?.nik || 'DJI092115'),
        approverName: isFastTrack ? activeReviewer?.name : (activeApprover?.name || 'DENI RAMDAN'),
        approverPosition: isFastTrack ? activeReviewer?.position : (activeApprover?.position || 'GENERAL MANAGER'),
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

              {/* Opsi Penyesuaian Pejabat Manual (Collapsible / Default Tertutup) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCustomApprover(!showCustomApprover)}
                  className="w-full sm:w-auto min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-100/90 hover:bg-blue-50/80 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between sm:justify-start gap-2.5 transition cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{showCustomApprover ? 'Sembunyikan Penyesuaian Pejabat' : 'Sesuaikan Pejabat Penyetuju (Khusus Pengganti / Cuti)'}</span>
                  </div>
                  {showCustomApprover ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {showCustomApprover && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    {isFastTrack ? (
                      /* Fast-Track (Level 3 & 4): 1 Kolom Tunggal Kepala Departemen */
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                            Kepala Departemen (Pemeriksa & Penyetuju Teknis) <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Jalur Cepat Level {docLevel}</span>
                          </span>
                        </div>
                        <select
                          value={selectedReviewerNip}
                          onChange={(e) => {
                            const newNip = e.target.value;
                            setSelectedReviewerNip(newNip);
                            setSelectedApproverNip(newNip);
                          }}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-xs"
                        >
                          {availableReviewers.map((emp) => (
                            <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                              {emp.name} — {emp.position} ({emp.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Standard (Level 1 & 2): 2 Kolom Berdampingan */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1
                              ? 'Penelaah Mutu ISO (MR)'
                              : 'Reviewer (Atasan Departemen)'} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedReviewerNip}
                            onChange={(e) => {
                              const newReviewerNip = e.target.value;
                              setSelectedReviewerNip(newReviewerNip);
                              if (selectedApproverNip === newReviewerNip) {
                                const alt = availableApprovers.find(a => (a.nip || a.nik) !== newReviewerNip);
                                if (alt) setSelectedApproverNip(alt.nip || alt.nik);
                              }
                            }}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs"
                          >
                            {(docLevel === 1 ? availableApprovers : availableReviewers).map((emp) => (
                              <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                                {emp.name} — {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1
                              ? 'Pengesah (General Manager / Direksi)'
                              : docLevel === 2
                              ? 'Pengesah (Management Representative / MR)'
                              : 'Pejabat Penyetuju'} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedApproverNip}
                            onChange={(e) => setSelectedApproverNip(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-xs"
                          >
                            {availableApprovers.map((emp) => (
                              <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                                {emp.name} — {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {!isFastTrack && selectedReviewerNip === selectedApproverNip && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <p className="leading-relaxed">
                          Reviewer dan Approver sama (<strong>{activeReviewer?.name}</strong>). Disarankan memilih Direksi/GM.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mode DCO & Admin */}
              {isDcoOrAdmin && (
                <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-sky-900 dark:text-sky-200">
                        Mode Pengajuan Revisi Document Control
                      </p>
                      <p className="text-sky-800 dark:text-sky-300 mt-0.5 leading-relaxed">
                        Sebagai Document Control Officer (DCO), revisi yang Anda daftarkan otomatis diverifikasi tata naskahnya dan langsung diteruskan ke Management Representative / General Manager (<strong>{activeApprover?.name || 'Approver'}</strong>) untuk pengesahan resmi.
                      </p>
                    </div>
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
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition shadow-sm hover:shadow cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20"
                >
                  <Send className="w-4 h-4" />
                  Ajukan Revisi Dokumen
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
                  {isDcoOrAdmin ? 'Menunggu Pengesahan MR' : 'Menunggu Review Atasan'}
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

              {/* Alur Persetujuan (Pihak Terkait) */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Pihak yang Menyetujui Revisi
                  </span>
                  <span className={`text-[9.5px] font-semibold font-mono ${isFastTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {isFastTrack ? '3 Tahap (Jalur Cepat)' : '4 Tahap ISO'}
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

                  {/* Step 2 */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] text-slate-400 block">
                        {docLevel === 1
                          ? 'Diverifikasi Format (Doc Control):'
                          : isFastTrack
                          ? 'Telaah & Pengesahan Teknis (Atasan):'
                          : 'Diperiksa oleh (Atasan):'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {docLevel === 1 ? (selectedVerifierTeam || 'Document Control Team') : (activeReviewer?.name || '-')}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2">
                    <span className={`w-4 h-4 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isFastTrack ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] text-slate-400 block">
                        {docLevel === 1
                          ? 'Ditelaah Mutu ISO (MR):'
                          : isFastTrack
                          ? 'Verifikasi & Rilis Aktif (DCO):'
                          : 'Diverifikasi oleh (Doc Control):'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
                        {docLevel === 1 ? (activeReviewer?.name || '-') : (selectedVerifierTeam || 'Document Control Team')}
                      </span>
                    </div>
                  </div>

                  {/* Step 4: Approver (Khusus Level 1 & 2) */}
                  {!isFastTrack && (
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <div className="min-w-0">
                        <span className="text-[9.5px] text-slate-400 block">
                          Disahkan oleh ({docLevel === 1 ? 'Direktur Utama / GM' : 'MR'}):
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                          {activeApprover?.name || '-'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {!isFastTrack && selectedReviewerNip === selectedApproverNip && (
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
