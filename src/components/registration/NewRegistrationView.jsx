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
  Lock,
  UserCheck,
  X,
  UploadCloud,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Sliders,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { getNextSequenceNumber, formatDocumentNumber } from '../../utils/numberingEngine';
import { uploadDocumentFile } from '../../lib/supabaseClient';

export default function NewRegistrationView() {
  const {
    companies,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    departments,
    documentTypes,
    employees,
    allEmployees,
    documents,
    currentUser,
    systemSettings,
    saveDraft,
    submitForVerification,
    setViewingDocument,
    setActiveMenu,
    showToast
  } = useDocumentControl();

  // Form State: Otomatis tersinkronisasi dengan filter perusahaan aktif di header
  const [selectedCompany, setSelectedCompany] = useState(() => (
    currentUser?.companyCode && currentUser.companyCode !== 'ALL'
      ? currentUser.companyCode
      : (selectedCompanyFilter && selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : (companies?.[0]?.code || 'DJI'))
  ));

  useEffect(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      setSelectedCompany(currentUser.companyCode);
    } else if (selectedCompanyFilter && selectedCompanyFilter !== 'ALL') {
      setSelectedCompany(selectedCompanyFilter);
    }
  }, [currentUser?.companyCode, selectedCompanyFilter]);

  const targetCompany = (selectedCompany || currentUser?.companyCode || 'DJI').toUpperCase();

  const [selectedType, setSelectedType] = useState('IK');
  const [selectedDept, setSelectedDept] = useState(() => currentUser?.department || 'PRODUKSI');

  // Creator automatically locked to logged-in user session
  const activeCreator = currentUser || employees?.[0] || {
    name: `Pegawai ${targetCompany}`,
    nip: '-',
    nik: '-',
    position: 'Staff',
    department: 'PRODUKSI',
    role: 'staff'
  };

  useEffect(() => {
    if (currentUser?.department) {
      const matchingDept = departments.find(
        d => d.code.toUpperCase() === currentUser.department.toUpperCase() ||
          d.name.toUpperCase() === currentUser.department.toUpperCase()
      );
      if (matchingDept) {
        setSelectedDept(matchingDept.code);
      }
    }
  }, [currentUser, departments]);

  const [title, setTitle] = useState('');
  const [createdDate, setCreatedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedVerifierTeam, setSelectedVerifierTeam] = useState('Document Control (DCO)');

  // 1. Ambil daftar Reviewer (Atasan) strictly terikat ke Unit Perusahaan yang dipilih (Zero Cross-PT Leak)
  const availableReviewers = React.useMemo(() => {
    const list = [];
    const addedKeys = new Set();
    const sourceEmps = allEmployees?.length > 0 ? allEmployees : (employees || []);

    // Filter seluruh pegawai aktif hanya dari perusahaan yang bersangkutan (termasuk Holding ALL)
    const companyEmps = sourceEmps.filter(e => {
      if (e.status === 'Nonaktif') return false;
      const empId = e.nip || e.nik;
      const empComp = (e.companyCode || (empId?.startsWith('UMI') ? 'UMI' : empId?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
      return empComp === targetCompany || empComp === 'ALL';
    });

    // A. Prioritaskan Kepala Departemen di Master Departemen HANYA jika ia terdaftar sebagai karyawan di PT ini
    (departments || []).forEach(dept => {
      const headName = (dept.head || '').trim();
      if (!headName || headName.includes('---') || headName === '-') return;

      const normalized = headName.toUpperCase();
      const matchedEmp = companyEmps.find(e => {
        const empName = (e.name || '').toUpperCase().trim();
        return empName === normalized || empName.includes(normalized) || normalized.includes(empName);
      });

      if (matchedEmp) {
        const canonicalKey = matchedEmp.name.toUpperCase().trim();
        if (!addedKeys.has(canonicalKey)) {
          addedKeys.add(canonicalKey);
          list.push(matchedEmp);
        }
      }
    });

    // B. Tambahkan akun pejabat review (reviewer, approver, manager, spv, lead) resmi dari PT ini
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

    // C. Fallback: jika tidak ada role reviewer eksplisit, masukkan karyawan aktif unit ini
    if (list.length === 0 && companyEmps.length > 0) {
      return companyEmps;
    }

    return list;
  }, [allEmployees, employees, departments, targetCompany]);

  // 2. Filter authorized approvers strictly per Perusahaan (atau Holding Direksi untuk Level 1 Kebijakan)
  const availableApprovers = React.useMemo(() => {
    const sourceEmps = allEmployees?.length > 0 ? allEmployees : (employees || []);
    const docType = (documentTypes || []).find(t => t.code === selectedType);
    const isLevel1 = docType?.level === 1;

    const companyEmps = sourceEmps.filter(e => {
      if (e.status === 'Nonaktif') return false;
      const empId = e.nip || e.nik;
      const empComp = (e.companyCode || (empId?.startsWith('UMI') ? 'UMI' : empId?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
      if (isLevel1) {
        // Dokumen Level 1 (Policy) mengizinkan MR Unit dan Pengesahan Akhir Direksi Holding
        return empComp === targetCompany || empComp === 'ALL' || empComp === 'DJI';
      }
      return empComp === targetCompany || empComp === 'ALL';
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
  }, [allEmployees, employees, targetCompany, selectedType, documentTypes]);

  // Smart routing: tentukan Reviewer otomatis berdasarkan Level Dokumen ISO & PT bersangkutan
  const getDefaultReviewerNip = (deptCode, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || selectedType));
    const level = docType?.level || 2;
    const cleanDept = (deptCode || selectedDept || '').toUpperCase();
    const creatorNip = currentUser?.nip || currentUser?.nik;

    if (level === 1) {
      // Level 1 (Policy): Telaah mutu ISO oleh Management Representative (MR) unit terkait
      const mr = availableReviewers.find(
        e => ((e.position || '').toUpperCase().includes('MR') ||
          (e.position || '').toUpperCase().includes('MANAGEMENT REPRESENTATIVE') ||
          e.role === 'approver') &&
          (e.nip || e.nik) !== creatorNip
      );
      if (mr) return mr.nip || mr.nik;
    }

    // 1. Cari reviewer yang departemennya sesuai dalam PT yang dipilih (kecuali jika orang tersebut adalah pembuat dokumen sendiri)
    const deptMatch = availableReviewers.find(r =>
      (r.department || '').toUpperCase() === cleanDept &&
      (r.nip || r.nik) !== creatorNip
    );
    if (deptMatch) return deptMatch.nip || deptMatch.nik;

    // 2. Jika belum ada reviewer lain di departemen ini (atau pembuat adalah Kepala Departemen):
    // Alihkan langsung ke Management Representative (MR) unit terkait
    const mr = availableReviewers.find(r =>
      ((r.department || '').toUpperCase() === 'HRGA' ||
      (r.position || '').toUpperCase().includes('MR') ||
      r.role === 'approver') &&
      (r.nip || r.nik) !== creatorNip
    );
    if (mr) return mr.nip || mr.nik;

    const gm = availableReviewers.find(r =>
      (r.department === 'MGMT' ||
      (r.position || '').toUpperCase().includes('GENERAL MANAGER') ||
      (r.position || '').toUpperCase().includes('DIREKSI')) &&
      (r.nip || r.nik) !== creatorNip
    );
    if (gm) return gm.nip || gm.nik;

    const otherCandidate = availableReviewers.find(r => (r.nip || r.nik) !== creatorNip);
    if (otherCandidate) return otherCandidate.nip || otherCandidate.nik;

    if (availableReviewers.length > 0) return availableReviewers[0].nip || availableReviewers[0].nik;

    if (targetCompany === 'UMI') return 'UMI01001';
    if (targetCompany === 'IMK') return 'IMK01001';
    return 'DJI022203';
  };

  const [selectedReviewerNip, setSelectedReviewerNip] = useState(() => getDefaultReviewerNip(selectedDept, selectedType));

  useEffect(() => {
    const suggestedNip = getDefaultReviewerNip(selectedDept, selectedType);
    if (availableReviewers.some(r => (r.nip || r.nik) === suggestedNip) || availableApprovers.some(a => (a.nip || a.nik) === suggestedNip)) {
      setSelectedReviewerNip(suggestedNip);
    } else if (availableReviewers.length > 0) {
      setSelectedReviewerNip(availableReviewers[0].nip || availableReviewers[0].nik);
    }
  }, [selectedDept, selectedType, availableReviewers, availableApprovers, targetCompany]);

  const activeReviewer = availableReviewers.find(r => (r.nip || r.nik) === selectedReviewerNip) ||
    availableApprovers.find(a => (a.nip || a.nik) === selectedReviewerNip) ||
    availableReviewers[0] || (
      targetCompany === 'UMI'
        ? { name: 'RATNA SARI', nip: 'UMI01001', nik: 'UMI01001', position: 'MANAGER HRGA & MR (UMI)', department: 'HRGA', role: 'approver' }
        : targetCompany === 'IMK'
          ? { name: 'BAMBANG WIJAYA', nip: 'IMK01001', nik: 'IMK01001', position: 'MANAGER HRGA & MR (IMK)', department: 'HRGA', role: 'approver' }
          : { name: 'DEDE SUHENDA', nip: 'DJI022203', nik: 'DJI022203', position: 'KEPALA BAGIAN PRODUKSI', department: 'PRODUKSI', role: 'reviewer' }
    );

  // Hierarki Mutu ISO 9001:2015 Clause 7.5:
  // Level 1: General Manager / Direksi Holding
  // Level 2 & 5: Management Representative (MR) Unit Terkait
  // Level 3 & 4: Jalur Cepat (Fast-Track) — Cukup Kepala Departemen & Verifikasi DCO
  const getDefaultApproverNip = (currentReviewerNip, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || selectedType));
    const level = docType?.level || 2;

    if (level === 1) {
      // Level 1: Prioritas General Manager / Direksi
      const gm = availableApprovers.find(
        a => a.department === 'MGMT' ||
          (a.position || '').toUpperCase().includes('GENERAL MANAGER') ||
          (a.position || '').toUpperCase().includes('DIREKSI')
      );
      if (gm) return gm.nip || gm.nik;
    } else if (level === 2 || level === 5) {
      // Level 2 (SOP) & Level 5 (EXT): Management Representative (MR) Unit
      const mr = availableApprovers.find(
        a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
      );
      if (currentReviewerNip && mr && (mr.nip || mr.nik) === currentReviewerNip) {
        const altApprover = availableApprovers.find(e => (e.nip || e.nik) !== currentReviewerNip);
        if (altApprover) return altApprover.nip || altApprover.nik;
      }
      if (mr) return mr.nip || mr.nik;
    } else if (level === 3 || level === 4) {
      // Level 3 (IK) & Level 4 (Formulir): Pengesahan teknis cukup Kepala Departemen bersangkutan
      if (currentReviewerNip) return currentReviewerNip;
    }

    const mr = availableApprovers.find(
      a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
    );
    if (currentReviewerNip && mr && (mr.nip || mr.nik) === currentReviewerNip) {
      const altApprover = availableApprovers.find(e => (e.nip || e.nik) !== currentReviewerNip);
      if (altApprover) return altApprover.nip || altApprover.nik;
    }
    if (mr) return mr.nip || mr.nik;
    if (availableApprovers.length > 0) return availableApprovers[0].nip || availableApprovers[0].nik;

    if (targetCompany === 'UMI') return 'UMI01001';
    if (targetCompany === 'IMK') return 'IMK01001';
    return 'DJI012548';
  };

  const [selectedApproverNip, setSelectedApproverNip] = useState(() =>
    getDefaultApproverNip(getDefaultReviewerNip(selectedDept, selectedType), selectedType)
  );

  // Sync smart approver default when selected department or document type changes
  useEffect(() => {
    const reviewerNip = getDefaultReviewerNip(selectedDept, selectedType);
    const suggestedApproverNip = getDefaultApproverNip(reviewerNip, selectedType);
    if (availableApprovers.some(a => (a.nip || a.nik) === suggestedApproverNip) || availableReviewers.some(r => (r.nip || r.nik) === suggestedApproverNip)) {
      setSelectedApproverNip(suggestedApproverNip);
    } else if (availableApprovers.length > 0) {
      setSelectedApproverNip(availableApprovers[0].nip || availableApprovers[0].nik);
    }
  }, [selectedDept, selectedType, availableApprovers, availableReviewers, targetCompany]);

  const activeApprover = availableApprovers.find(a => (a.nip || a.nik) === selectedApproverNip) ||
    availableReviewers.find(r => (r.nip || r.nik) === selectedApproverNip) ||
    availableApprovers[0] || (
      targetCompany === 'UMI'
        ? { name: 'RATNA SARI', nip: 'UMI01001', nik: 'UMI01001', position: 'MANAGER HRGA & MR (UMI)', department: 'HRGA', role: 'approver' }
        : targetCompany === 'IMK'
          ? { name: 'BAMBANG WIJAYA', nip: 'IMK01001', nik: 'IMK01001', position: 'MANAGER HRGA & MR (IMK)', department: 'HRGA', role: 'approver' }
          : { name: 'BABAN RACHMAT SUBAGJA', nip: 'DJI012548', nik: 'DJI012548', position: 'MANAGER HRGA & MR (MANAGEMENT REPRESENTATIVE)', department: 'HRGA', role: 'approver' }
    );

  const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin';
  const currentDocTypeObj = (documentTypes || []).find(t => t.code === selectedType) || { level: 2 };
  const docLevel = currentDocTypeObj.level || 2;
  const isFastTrack = docLevel === 3 || docLevel === 4;
  const [notes, setNotes] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomApprover, setShowCustomApprover] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(previewDocNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Live Auto-calculated Sequence Number based on selected Company, Type, and Department
  const nextSeq = getNextSequenceNumber(documents, selectedType, selectedDept, selectedCompany);
  const nextRev = '00';

  const selectedCompanyObj = companies.find(c => c.code === selectedCompany) || {
    code: selectedCompany,
    name: selectedCompany === 'UMI' ? 'PT Ultimo Moda Indotex' : selectedCompany === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex'
  };

  const previewDocNumber = formatDocumentNumber({
    companyCode: selectedCompany,
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

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Harap masukkan judul dokumen!', 'danger');
      return;
    }
    setIsSubmitting(true);
    let fileInfo = {
      fileName: null,
      fileSize: null,
      fileType: null,
      fileUrl: null
    };

    if (fileAttachment) {
      showToast('Mengunggah file ke cloud storage...', 'info');
      fileInfo = await uploadDocumentFile(fileAttachment, previewDocNumber);
    }

    saveDraft({
      companyCode: selectedCompany,
      companyName: selectedCompanyObj.name,
      title: title.toUpperCase().trim(),
      type: selectedType,
      typeName: (documentTypes || []).find(t => t.code === selectedType)?.name || (selectedType === 'IK' ? 'Instruksi Kerja (Work Instruction)' : 'Standar Operasional Prosedur'),
      department: selectedDept,
      creator: activeCreator.name,
      creatorNip: activeCreator.nip || activeCreator.nik,
      creatorNik: activeCreator.nip || activeCreator.nik,
      creatorPosition: activeCreator.position,
      seqNumber: nextSeq,
      revision: nextRev,
      verifierTeam: selectedVerifierTeam,
      targetReviewer: activeReviewer.name,
      reviewerNip: activeReviewer.nip || activeReviewer.nik,
      reviewerNik: activeReviewer.nip || activeReviewer.nik,
      reviewerName: activeReviewer.name,
      reviewerPosition: activeReviewer.position,
      targetApprover: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverNip: isFastTrack ? (activeReviewer.nip || activeReviewer.nik) : (activeApprover.nip || activeApprover.nik),
      approverNik: isFastTrack ? (activeReviewer.nip || activeReviewer.nik) : (activeApprover.nip || activeApprover.nik),
      approverName: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverPosition: isFastTrack ? activeReviewer.position : activeApprover.position,
      notes: notes,
      createdDate,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      fileUrl: fileInfo.fileUrl
    });
    setIsSubmitting(false);
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Harap masukkan judul dokumen!', 'danger');
      return;
    }
    setIsSubmitting(true);
    let fileInfo = {
      fileName: null,
      fileSize: null,
      fileType: null,
      fileUrl: null
    };

    if (fileAttachment) {
      showToast('Mengunggah file ke cloud storage...', 'info');
      fileInfo = await uploadDocumentFile(fileAttachment, previewDocNumber);
    }

    submitForVerification({
      companyCode: selectedCompany,
      companyName: selectedCompanyObj.name,
      title: title.toUpperCase().trim(),
      type: selectedType,
      typeName: (documentTypes || []).find(t => t.code === selectedType)?.name || (selectedType === 'IK' ? 'Instruksi Kerja (Work Instruction)' : 'Standar Operasional Prosedur'),
      department: selectedDept,
      creator: activeCreator.name,
      creatorNip: activeCreator.nip || activeCreator.nik,
      creatorNik: activeCreator.nip || activeCreator.nik,
      creatorPosition: activeCreator.position,
      seqNumber: nextSeq,
      revision: nextRev,
      verifierTeam: selectedVerifierTeam,
      targetReviewer: activeReviewer.name,
      reviewerNip: activeReviewer.nip || activeReviewer.nik,
      reviewerNik: activeReviewer.nip || activeReviewer.nik,
      reviewerName: activeReviewer.name,
      reviewerPosition: activeReviewer.position,
      targetApprover: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverNip: isFastTrack ? (activeReviewer.nip || activeReviewer.nik) : (activeApprover.nip || activeApprover.nik),
      approverNik: isFastTrack ? (activeReviewer.nip || activeReviewer.nik) : (activeApprover.nip || activeApprover.nik),
      approverName: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverPosition: isFastTrack ? activeReviewer.position : activeApprover.position,
      notes: notes,
      createdDate,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      fileUrl: fileInfo.fileUrl
    });
  };

  return (
    <div className="space-y-4 pb-20 sm:space-y-6 sm:pb-0">
      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-6">

        {/* Left 8-Cols: Main Document Information Form */}
        <div className="space-y-4 xl:col-span-8 xl:space-y-6">

          {/* Card: INFORMASI DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header: Bersih & Profesional */}
            <div className="flex items-center justify-between border-b border-slate-800/40 bg-[#102a4e] px-4 py-3 text-white sm:px-6 sm:py-4">
              <div>
                <h2 className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase sm:text-sm sm:tracking-wider">
                  <FileText className="w-4 h-4 text-sky-400" />
                  INFORMASI REGISTRASI DOKUMEN
                </h2>
              </div>
              <span className="hidden sm:inline-flex text-xs font-mono font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-lg">
                Rev 00
              </span>
            </div>


            {/* Active Form Inputs */}
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
              {/* Row 0: Pilihan Perusahaan Tujuan (Multi-Company) - Hanya ditampilkan untuk Akun Admin Holding */}
              {(!currentUser?.companyCode || currentUser.companyCode === 'ALL') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Perusahaan Pemilik <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(companies || []).map((c) => {
                      const isSelected = selectedCompany === c.code;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(c.code);
                            setSelectedCompanyFilter(c.code);
                          }}
                          aria-pressed={isSelected}
                          aria-label={`Pilih ${c.name}`}
                          className={`relative flex min-h-[52px] flex-col justify-between rounded-lg border p-2 text-left transition cursor-pointer ${isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/30 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${c.code === 'DJI'
                              ? 'bg-blue-600 text-white'
                              : c.code === 'UMI'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-600 text-white'
                              }`}>
                              {c.code}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="text-[9px] font-medium leading-tight text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                            {c.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row 1: Jenis Dokumen & Departemen – inline on mobile with 2-col grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Jenis Dokumen <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {documentTypes.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Departemen Pemilik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    disabled={Boolean(currentUser?.department)}
                    className={`h-9 w-full text-xs rounded-md px-2.5 font-medium transition shadow-xs ${currentUser?.department
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed select-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      }`}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Tanggal Pembuatan & Pembuat Dokumen */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Tanggal Pembuatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Pembuat Dokumen <span className="text-red-500">*</span>
                  </label>
                  <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 dark:border-slate-700 dark:bg-slate-800/80 select-none">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {activeCreator.name
                        ? activeCreator.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                        : 'US'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {activeCreator.name}
                        </span>
                        <span className="text-[8px] px-1 py-px rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold uppercase shrink-0">
                          {activeCreator.role || 'STAFF'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate leading-none mt-px">
                        NIP: {activeCreator.nip || activeCreator.nik} • {activeCreator.department}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Judul Dokumen (Full Width with Character Counter) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Judul Dokumen Resmi <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {title.length}/200
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: INSTRUKSI KERJA PENGOPERASIAN MESIN..."
                  className="w-full text-xs uppercase font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:normal-case placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>

              {/* Catatan & Lampiran — selalu tampil (tidak di-collapse) */}
              <div className="space-y-3">
              {/* Catatan Pengajuan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Catatan Pengajuan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan atau rincian perubahan dokumen..."
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>

              {/* Lampiran Berkas Dokumen (Upload PDF / Word / Excel) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Lampiran Berkas (PDF / Word / Excel)
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Maks. 25 MB
                  </span>
                </div>

                {fileAttachment ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {fileAttachment.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {(fileAttachment.size / 1024).toFixed(0)} KB
                          </span>
                          {/\.(xlsx?|csv)$/i.test(fileAttachment.name) && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold text-[9px]">
                              EXCEL
                            </span>
                          )}
                          {/\.(docx?)$/i.test(fileAttachment.name) && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold text-[9px]">
                              WORD
                            </span>
                          )}
                          {/\.pdf$/i.test(fileAttachment.name) && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-bold text-[9px]">
                              PDF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFileAttachment(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="Batalkan berkas ini"
                      aria-label="Hapus berkas lampiran"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 text-center hover:bg-blue-50/40 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                      aria-label="Pilih atau seret berkas dokumen resmi"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileAttachment(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                      <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Klik untuk memilih berkas atau seret file PDF / Word / Excel ke sini
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Format yang didukung: PDF, DOCX, XLSX, XLS, CSV (Maks. 25 MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Opsi Penyesuaian Pejabat Manual (Collapsible / Default Tertutup) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCustomApprover(!showCustomApprover)}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50/80 px-3 text-left text-xs font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                >
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{showCustomApprover ? 'Sembunyikan Penyesuaian Pejabat' : 'Sesuaikan Pejabat Penyetuju (Pengganti / Cuti)'}</span>
                  </div>
                  {showCustomApprover ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </button>

                {showCustomApprover && (
                  <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    {isFastTrack ? (
                      /* Fast-Track (Level 3 & 4): 1 Kolom Tunggal Kepala Departemen */
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Kepala Departemen <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 shrink-0" />
                            <span>Jalur Cepat L{docLevel}</span>
                          </span>
                        </div>
                        <select
                          value={selectedReviewerNip}
                          onChange={(e) => {
                            const newNip = e.target.value;
                            setSelectedReviewerNip(newNip);
                            setSelectedApproverNip(newNip);
                          }}
                          className="h-9 w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        >
                          {availableReviewers.map((emp) => (
                            <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                              {emp.name} - {emp.position} ({emp.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Standard (Level 1 & 2): 2 Kolom Berdampingan */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* 1. Reviewer */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1 ? 'Penelaah Mutu ISO (MR)' : 'Reviewer (Atasan Dept)'} <span className="text-red-500">*</span>
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
                            className="h-9 w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          >
                            {(docLevel === 1 ? availableApprovers : availableReviewers).map((emp) => (
                              <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                                {emp.name} - {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Approver */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1 ? 'Pengesah (GM / Direksi)' : 'Pengesah (MR)'} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedApproverNip}
                            onChange={(e) => setSelectedApproverNip(e.target.value)}
                            className="h-9 w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          >
                            {availableApprovers.map((emp) => (
                              <option key={emp.nip || emp.nik} value={emp.nip || emp.nik}>
                                {emp.name} - {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {!isFastTrack && selectedReviewerNip === selectedApproverNip && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-3 h-3 shrink-0 text-amber-600 mt-px" />
                        <p>Reviewer dan Approver sama (<strong>{activeReviewer?.name}</strong>). Disarankan memilih Direksi/GM.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info Khusus DCO & Admin: Verifikasi Otomatis Terusan ke MR */}
              {isDcoOrAdmin && (
                <div className="flex items-start gap-2.5 p-3 bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-px" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold text-sky-900 dark:text-sky-200">
                      {currentUser?.role === 'admin' ? 'Mode Administrator' : 'Mode Document Control'} —&nbsp;
                    </span>
                    <span className="text-sky-800 dark:text-sky-300">
                      {currentUser?.role === 'admin' ? (
                        <>Berkas langsung diteruskan ke MR (<strong>{activeApprover?.name || 'MR'}</strong>) tanpa verifikasi format.</>
                      ) : (
                        <>Berkas langsung diteruskan ke MR (<strong>{activeApprover?.name || 'MR'}</strong>) tanpa verifikasi format.</>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="hidden sm:flex sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setNotes('');
                    setFileAttachment(null);
                  }}
                  className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Reset Form
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 h-9 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-lg transition shadow-xs cursor-pointer active:scale-98"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    Simpan Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-1.5 px-5 py-2 h-9 text-xs font-bold text-white rounded-lg transition cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ajukan Registrasi
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 4-Cols: Sleek Unified Approval Timeline & Live Summary Panel */}
        <div className="xl:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden sticky top-6">

            {/* Header Ringkasan */}
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800/40">
              <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                RINGKASAN PENGAJUAN
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${title.trim()
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                {title.trim() ? 'Siap Diajukan' : 'Belum Lengkap'}
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">

              {/* Block 1: Nomor Dokumen Generator */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nomor Dokumen Terbit
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    title="Salin nomor dokumen"
                  >
                    {copiedNumber ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="py-2.5 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-center">
                  <span className="text-base sm:text-lg font-mono font-black text-blue-600 dark:text-blue-400 tracking-wider block select-all">
                    {previewDocNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Unit: <strong className="text-slate-700 dark:text-slate-300">{selectedCompany}</strong></span>
                  <span>Tipe: <strong className="text-slate-700 dark:text-slate-300">{selectedType}</strong></span>
                  <span>Dept: <strong className="text-slate-700 dark:text-slate-300">{selectedDept}</strong></span>
                </div>
              </div>

              {/* Block 2: Judul Dokumen Preview */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Judul Dokumen
                </span>
                {title.trim() ? (
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-relaxed">
                    "{title.toUpperCase()}"
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 py-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    Judul dokumen belum diisi pada form
                  </p>
                )}
              </div>

              {/* Block 3: Vertical Approval Timeline Spine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Alur Persetujuan ISO
                  </span>
                  <span className={`text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full ${isFastTrack
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                    {isFastTrack ? '3 Tahap (Jalur Cepat)' : '4 Tahap ISO'}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 py-1">
                  {/* Vertical Connecting Track Line */}
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-200 dark:bg-slate-700" />

                  {/* Node 1: Pemohon */}
                  <div className="relative flex items-start gap-2.5">
                    <span className="absolute -left-6 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shrink-0">
                      1
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Dibuat oleh (Pemohon)
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {activeCreator.name}
                      </p>
                    </div>
                  </div>

                  {/* Node 2: Pemeriksa Teknis */}
                  <div className="relative flex items-start gap-2.5">
                    <span className="absolute -left-6 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shrink-0">
                      2
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {docLevel === 1
                          ? 'Verifikasi Format (Doc Control)'
                          : isFastTrack
                            ? 'Telaah & Pengesahan Teknis (Atasan Dept)'
                            : 'Diperiksa oleh (Atasan Dept)'}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {docLevel === 1 ? 'Document Control (DCO)' : (activeReviewer?.name || '-')}
                      </p>
                    </div>
                  </div>

                  {/* Node 3: Verifikasi Tata Naskah / MR */}
                  <div className="relative flex items-start gap-2.5">
                    <span className={`absolute -left-6 w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shrink-0 ${isFastTrack ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {docLevel === 1
                          ? 'Telaah Mutu ISO (MR)'
                          : isFastTrack
                            ? 'Verifikasi & Rilis Aktif (DCO)'
                            : 'Verifikasi Tata Naskah (Doc Control)'}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {docLevel === 1 ? (activeReviewer?.name || '-') : 'Document Control (DCO)'}
                      </p>
                    </div>
                  </div>

                  {/* Node 4: Pengesahan Akhir (Hanya Level 1 & 2) */}
                  {!isFastTrack && (
                    <div className="relative flex items-start gap-2.5">
                      <span className="absolute -left-6 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shrink-0">
                        4
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          Pengesahan Akhir ({docLevel === 1 ? 'Direktur Utama / GM' : 'Management Representative'})
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {activeApprover?.name || '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isFastTrack && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10.5px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Berkas Level {docLevel} langsung aktif resmi setelah verifikasi DCO.</span>
                  </div>
                )}
              </div>

              {/* Block 4: Berkas Lampiran Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                    File Lampiran
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-[190px]">
                    {fileAttachment ? fileAttachment.name : 'Tidak ada berkas'}
                  </span>
                </div>
                {fileAttachment ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                    Terlampir
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 font-medium text-[10px] shrink-0">
                    Opsional
                  </span>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Mobile action bar keeps the submission path available throughout this long form. */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[auto_1fr] gap-2 border-t border-slate-200 bg-white/95 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Simpan sebagai draft"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>Draft</span>
        </button>
        <button
          type="button"
          onClick={handleSubmitVerification}
          disabled={isSubmitting}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Ajukan Registrasi
        </button>
      </div>

    </div>
  );
}
