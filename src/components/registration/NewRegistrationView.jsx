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
import { initialEmployees } from '../../data/initialData';
import { getNextSequenceNumber, formatDocumentNumber } from '../../utils/numberingEngine';
import { uploadDocumentFile } from '../../lib/supabaseClient';

export default function NewRegistrationView() {
  const {
    companies,
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
  const [selectedCompany, setSelectedCompany] = useState(() => (
    currentUser?.companyCode && currentUser.companyCode !== 'ALL'
      ? currentUser.companyCode
      : (companies?.[0]?.code || 'DJI')
  ));

  useEffect(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      setSelectedCompany(currentUser.companyCode);
    }
  }, [currentUser?.companyCode]);

  const [selectedType, setSelectedType] = useState('IK');
  const [selectedDept, setSelectedDept] = useState(() => currentUser?.department || 'PRODUKSI');

  // Creator automatically locked to logged-in user session
  const activeCreator = currentUser || employees?.[0] || {
    name: 'Karyawan PT DJI',
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
  const [selectedVerifierTeam, setSelectedVerifierTeam] = useState('Document Control Team');

  // 1. Ambil daftar Reviewer (Atasan) langsung mengacu ke Master Data Karyawan resmi
  const availableReviewers = React.useMemo(() => {
    const list = [];
    const addedKeys = new Set();

    // Prioritaskan seluruh Kepala Departemen yang terdaftar di Master Data Departemen
    (departments || []).forEach(dept => {
      const headName = (dept.head || '').trim();
      // Lewati jika belum ada pejabatnya (tanda garis '------------')
      if (!headName || headName.includes('---') || headName === '-') return;

      const normalized = headName.toUpperCase();
      // Hubungkan dengan profil resmi di Master Karyawan
      const matchedEmp = (employees || []).find(e => {
        const empName = (e.name || '').toUpperCase().trim();
        return empName === normalized ||
          empName.includes(normalized) ||
          normalized.includes(empName);
      });

      // Selalu gunakan nama & jabatan resmi dari Master Karyawan sebagai Single Source of Truth
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

    // Tambahkan juga akun Reviewer resmi dari Master Karyawan jika belum masuk
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

  // 2. Filter authorized approvers: Khusus Management Representative (MR) & Direksi
  const availableApprovers = React.useMemo(() => {
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

  // Smart routing: tentukan Reviewer otomatis berdasarkan Level Dokumen ISO
  // Level 1: Management Representative (MR) untuk telaah mutu ISO (setelah format diverifikasi DCO)
  // Level 2, 3, 4: Kepala Departemen pemilik dokumen
  const getDefaultReviewerNik = (deptCode, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || selectedType));
    const level = docType?.level || 2;

    if (level === 1) {
      // Level 1 (Policy): Telaah mutu ISO dilakukan oleh Management Representative (MR)
      const mr = (employees || []).find(
        e => (e.position || '').toUpperCase().includes('MR') ||
          (e.position || '').toUpperCase().includes('MANAGEMENT REPRESENTATIVE') ||
          e.role === 'approver'
      );
      if (mr) return mr.nik;
    }

    const cleanDept = (deptCode || '').toUpperCase();
    const deptObj = (departments || []).find(d => d.code.toUpperCase() === cleanDept);
    const deptHeadName = (deptObj?.head || '').trim();

    // Jika departemen ini memiliki Kepala Departemen yang terdaftar di Master Data Departemen
    if (deptHeadName && !deptHeadName.includes('---') && deptHeadName !== '-') {
      const matched = availableReviewers.find(r =>
        r.name.toUpperCase() === deptHeadName.toUpperCase() ||
        r.department === cleanDept
      );
      if (matched) return matched.nik;
    }

    // Jika belum ada kepala seksi tersendiri (seperti QAQC & Warehouse dengan tanda garis '------------'),
    // otomatis dialihkan ke Management Representative (Baban Rachmat Subagja) atau General Manager (Deni Ramdan)
    const mr = availableReviewers.find(r =>
      r.department === 'HRGA' ||
      r.position?.toUpperCase().includes('MR') ||
      r.name.toUpperCase().includes('BABAN')
    );
    if (mr) return mr.nik;

    return availableReviewers[0]?.nik || 'DJI022203';
  };

  const [selectedReviewerNik, setSelectedReviewerNik] = useState(() => getDefaultReviewerNik(selectedDept, selectedType));

  useEffect(() => {
    const suggestedNik = getDefaultReviewerNik(selectedDept, selectedType);
    if (availableReviewers.some(r => r.nik === suggestedNik) || availableApprovers.some(a => a.nik === suggestedNik)) {
      setSelectedReviewerNik(suggestedNik);
    }
  }, [selectedDept, selectedType, availableReviewers, availableApprovers]);

  const activeReviewer = availableReviewers.find(r => r.nik === selectedReviewerNik) ||
    availableApprovers.find(a => a.nik === selectedReviewerNik) ||
    availableReviewers[0] || {
    name: 'DEDE SUHENDA',
    nik: 'DJI022203',
    position: 'KEPALA BAGIAN PRODUKSI',
    department: 'PRODUKSI',
    role: 'reviewer'
  };

  // Hierarki Mutu ISO 9001:2015 Clause 7.5:
  // Level 1: General Manager / Direksi
  // Level 2 & 5: Management Representative (MR)
  // Level 3 & 4: Jalur Cepat (Fast-Track) — Cukup Kepala Departemen & Verifikasi DCO
  const getDefaultApproverNik = (currentReviewerNik, typeCode) => {
    const docType = (documentTypes || []).find(t => t.code === (typeCode || selectedType));
    const level = docType?.level || 2;

    if (level === 1) {
      // Level 1: Prioritas General Manager / Direksi
      const gm = availableApprovers.find(
        a => a.department === 'MGMT' ||
          (a.position || '').toUpperCase().includes('GENERAL MANAGER') ||
          (a.position || '').toUpperCase().includes('DIREKSI')
      );
      if (gm) return gm.nik;
    } else if (level === 2 || level === 5) {
      // Level 2 (SOP) & Level 5 (EXT): Management Representative (MR)
      const mr = availableApprovers.find(
        a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
      );
      if (currentReviewerNik && mr && mr.nik === currentReviewerNik) {
        const altApprover = availableApprovers.find(e => e.nik !== currentReviewerNik);
        if (altApprover) return altApprover.nik;
      }
      if (mr) return mr.nik;
    } else if (level === 3 || level === 4) {
      // Level 3 (IK) & Level 4 (Formulir): Pengesahan teknis cukup Kepala Departemen bersangkutan
      if (currentReviewerNik) return currentReviewerNik;
    }

    const mr = availableApprovers.find(
      a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
    );
    if (currentReviewerNik && mr && mr.nik === currentReviewerNik) {
      const altApprover = availableApprovers.find(e => e.nik !== currentReviewerNik);
      if (altApprover) return altApprover.nik;
    }
    if (mr) return mr.nik;
    return availableApprovers[0]?.nik || 'DJI012548';
  };

  const [selectedApproverNik, setSelectedApproverNik] = useState(() =>
    getDefaultApproverNik(getDefaultReviewerNik(selectedDept), selectedType)
  );

  // Sync smart approver default when selected department or document type changes
  useEffect(() => {
    const reviewerNik = getDefaultReviewerNik(selectedDept);
    const suggestedApproverNik = getDefaultApproverNik(reviewerNik, selectedType);
    if (availableApprovers.some(a => a.nik === suggestedApproverNik) || availableReviewers.some(r => r.nik === suggestedApproverNik)) {
      setSelectedApproverNik(suggestedApproverNik);
    }
  }, [selectedDept, selectedType, availableApprovers, availableReviewers]);

  const activeApprover = availableApprovers.find(a => a.nik === selectedApproverNik) ||
    availableReviewers.find(r => r.nik === selectedApproverNik) ||
    availableApprovers[0] || {
    name: 'BABAN RACHMAT SUBAGJA',
    nik: 'DJI012548',
    position: 'MANAGER HRGA & MR (MANAGEMENT REPRESENTATIVE)',
    department: 'HRGA',
    role: 'approver'
  };

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
      department: selectedDept,
      creator: activeCreator.name,
      creatorNik: activeCreator.nik,
      creatorPosition: activeCreator.position,
      seqNumber: nextSeq,
      revision: nextRev,
      verifierTeam: selectedVerifierTeam,
      targetReviewer: activeReviewer.name,
      reviewerNik: activeReviewer.nik,
      reviewerName: activeReviewer.name,
      reviewerPosition: activeReviewer.position,
      targetApprover: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverNik: isFastTrack ? activeReviewer.nik : activeApprover.nik,
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
      department: selectedDept,
      creator: activeCreator.name,
      creatorNik: activeCreator.nik,
      creatorPosition: activeCreator.position,
      seqNumber: nextSeq,
      revision: nextRev,
      verifierTeam: selectedVerifierTeam,
      targetReviewer: activeReviewer.name,
      reviewerNik: activeReviewer.nik,
      reviewerName: activeReviewer.name,
      reviewerPosition: activeReviewer.position,
      targetApprover: isFastTrack ? activeReviewer.name : activeApprover.name,
      approverNik: isFastTrack ? activeReviewer.nik : activeApprover.nik,
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
    <div className="space-y-6">
      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left 8-Cols: Main Document Information Form */}
        <div className="xl:col-span-8 space-y-6">

          {/* Card: INFORMASI DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header: Bersih & Profesional */}
            <div className="bg-[#102a4e] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800/40">
              <div>
                <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  INFORMASI REGISTRASI DOKUMEN
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Standar Pengendalian Informasi Terdokumentasi ISO 9001:2015 Klausul 7.5
                </p>
              </div>
              <span className="hidden sm:inline-flex text-xs font-mono font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-lg">
                Rev 00
              </span>
            </div>


            {/* Active Form Inputs */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Row 0: Pilihan Perusahaan Tujuan (Multi-Company) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Pilih Perusahaan Pemilik Dokumen <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    Prefix nomor dokumen disesuaikan otomatis
                  </span>
                </div>
                {currentUser?.companyCode && currentUser.companyCode !== 'ALL' ? (
                  <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${selectedCompany === 'UMI'
                          ? 'bg-indigo-600 text-white'
                          : selectedCompany === 'IMK'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                        {selectedCompany}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {selectedCompanyObj.name}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Dokumen diterbitkan di bawah unit usaha resmi ini (Akses akun Anda terikat ke {selectedCompany}).
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-md font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs">
                      <Lock className="w-3 h-3 text-amber-500" /> Terkunci Otomatis
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(companies || []).map((c) => {
                      const isSelected = selectedCompany === c.code;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCompany(c.code)}
                          className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${c.code === 'DJI'
                                ? 'bg-blue-600 text-white'
                                : c.code === 'UMI'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}>
                              {c.code}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {c.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Row 1: Jenis Dokumen & Departemen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Jenis Dokumen <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                  >
                    {documentTypes.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${docLevel === 1
                        ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                        : docLevel === 2
                          ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                          : docLevel === 3
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
                            : docLevel === 4
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                      ISO Level {docLevel}: {currentDocTypeObj.name || selectedType}
                    </span>
                    {isFastTrack ? (
                      <span className="text-[10.5px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Jalur Cepat: Verifikasi DCO & Review Atasan Dept</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Pengesahan Akhir: {docLevel === 1 ? 'General Manager / Direksi' : 'Management Representative (MR)'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Departemen Pemilik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Pembuat Dokumen <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Akun Login Aktif
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg select-none">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-xs">
                        {activeCreator.name
                          ? activeCreator.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                          : 'US'}
                      </div>
                      <div className="truncate text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {activeCreator.name}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold uppercase shrink-0">
                            {activeCreator.role || 'STAFF'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          NIP: {activeCreator.nik} • {activeCreator.department}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Judul Dokumen (Full Width with Character Counter) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Judul Dokumen Resmi <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {title.length}/200 karakter
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={title}

                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: INSTRUKSI KERJA PENGOPERASIAN MESIN..."
                  className="w-full text-xs uppercase font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:normal-case placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Catatan Pengajuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Catatan Pengajuan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan catatan pengajuan atau rincian perubahan dokumen jika diperlukan..."
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Lampiran Berkas Dokumen (Upload PDF / Word / Excel) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Lampiran Berkas Resmi (PDF / Word / Excel)
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Opsional (Maks. 25 MB)
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
                            <span>Jalur Cepat L{docLevel}</span>
                          </span>
                        </div>
                        <select
                          value={selectedReviewerNik}
                          onChange={(e) => {
                            const newNik = e.target.value;
                            setSelectedReviewerNik(newNik);
                            setSelectedApproverNik(newNik);
                          }}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
                        >
                          {availableReviewers.map((emp) => (
                            <option key={emp.nik} value={emp.nik}>
                              {emp.name} - {emp.position} ({emp.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Standard (Level 1 & 2): 2 Kolom Berdampingan */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Reviewer */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1
                              ? 'Penelaah Mutu ISO (MR)'
                              : 'Reviewer (Atasan Departemen)'} <span className="text-red-500">*</span>
                          </label>
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
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                          >
                            {(docLevel === 1 ? availableApprovers : availableReviewers).map((emp) => (
                              <option key={emp.nik} value={emp.nik}>
                                {emp.name} - {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Approver */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                            {docLevel === 1
                              ? 'Pengesah (General Manager / Direksi)'
                              : 'Pengesah (Management Representative / MR)'} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedApproverNik}
                            onChange={(e) => setSelectedApproverNik(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                          >
                            {availableApprovers.map((emp) => (
                              <option key={emp.nik} value={emp.nik}>
                                {emp.name} - {emp.position} ({emp.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {!isFastTrack && selectedReviewerNik === selectedApproverNik && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <p className="leading-relaxed">
                          Reviewer dan Approver sama (<strong>{activeReviewer?.name}</strong>). Disarankan memilih Direksi/GM.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info Khusus DCO & Admin: Verifikasi Otomatis Terusan ke MR */}
              {isDcoOrAdmin && (
                <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-sky-900 dark:text-sky-200">
                        Mode Pendaftaran Document Control
                      </p>
                      <p className="text-sky-800 dark:text-sky-300 mt-0.5 leading-relaxed">
                        Sebagai Document Control Officer (DCO), berkas yang Anda daftarkan otomatis lolos verifikasi format dan langsung diteruskan ke Management Representative (<strong>{activeApprover?.name || 'MR'}</strong>) untuk pengesahan resmi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setNotes('');
                    setFileAttachment(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  Reset Form
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    Simpan Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition shadow-sm hover:shadow cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20"
                  >
                    <Send className="w-4 h-4" />
                    Ajukan Registrasi Dokumen
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
                        {docLevel === 1 ? (selectedVerifierTeam || 'Document Control Team') : (activeReviewer?.name || '-')}
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
                        {docLevel === 1 ? (activeReviewer?.name || '-') : isFastTrack ? (selectedVerifierTeam || 'Document Control Team') : (selectedVerifierTeam || 'Document Control Team')}
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


    </div>
  );
}
