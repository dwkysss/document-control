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
  AlertCircle
} from 'lucide-react';
import Badge from '../common/Badge';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { initialEmployees } from '../../data/initialData';
import { getNextSequenceNumber, formatDocumentNumber } from '../../utils/numberingEngine';
import { uploadDocumentFile } from '../../lib/supabaseClient';

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

  // Smart routing: tentukan Atasan / Reviewer otomatis dari Kepala Departemen yang dipilih di Master Departemen
  const getDefaultReviewerNik = (deptCode) => {
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

  const [selectedReviewerNik, setSelectedReviewerNik] = useState(() => getDefaultReviewerNik(selectedDept));

  useEffect(() => {
    const suggestedNik = getDefaultReviewerNik(selectedDept);
    if (availableReviewers.some(r => r.nik === suggestedNik)) {
      setSelectedReviewerNik(suggestedNik);
    }
  }, [selectedDept, availableReviewers]);

  const activeReviewer = availableReviewers.find(r => r.nik === selectedReviewerNik) || availableReviewers[0] || {
    name: 'DEDE SUHENDA',
    nik: 'DJI022203',
    position: 'KEPALA BAGIAN PRODUKSI',
    department: 'PRODUKSI',
    role: 'reviewer'
  };

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

  // Pejabat Penyetuju (Approver) sesuai standar ISO 9001: Khusus Management Representative (MR) / GM
  const getDefaultApproverNik = (currentReviewerNik) => {
    const mr = availableApprovers.find(
      a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
    );
    // Jika Atasan (Reviewer) dokumen adalah pejabat MR itu sendiri (misal Baban di HRGA),
    // otomatis arahkan Pengesah (Approver) ke General Manager / Direksi agar ada pemisahan kewenangan (Four-Eyes Principle)
    if (currentReviewerNik && mr && mr.nik === currentReviewerNik) {
      const altApprover = availableApprovers.find(e => e.nik !== currentReviewerNik);
      if (altApprover) return altApprover.nik;
    }
    if (mr) return mr.nik;
    return availableApprovers[0]?.nik || 'DJI012548';
  };

  const [selectedApproverNik, setSelectedApproverNik] = useState(() =>
    getDefaultApproverNik(getDefaultReviewerNik(selectedDept))
  );

  // Sync smart approver default when selected department or document type changes
  useEffect(() => {
    const reviewerNik = getDefaultReviewerNik(selectedDept);
    const suggestedApproverNik = getDefaultApproverNik(reviewerNik);
    if (availableApprovers.some(a => a.nik === suggestedApproverNik)) {
      setSelectedApproverNik(suggestedApproverNik);
    }
  }, [selectedDept, selectedType, availableApprovers]);

  const activeApprover = availableApprovers.find(a => a.nik === selectedApproverNik) || availableApprovers[0] || {
    name: 'BABAN RACHMAT SUBAGJA',
    nik: 'DJI012548',
    position: 'MANAGER HRGA & MR (MANAGEMENT REPRESENTATIVE)',
    department: 'HRGA',
    role: 'approver'
  };

  const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin';
  const [directPublish, setDirectPublish] = useState(false);
  const [notes, setNotes] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      targetApprover: activeApprover.name,
      approverNik: activeApprover.nik,
      approverName: activeApprover.name,
      approverPosition: activeApprover.position,
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
      targetApprover: activeApprover.name,
      approverNik: activeApprover.nik,
      approverName: activeApprover.name,
      approverPosition: activeApprover.position,
      notes: notes,
      createdDate,
      directPublish: isDcoOrAdmin ? directPublish : false,
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header: Bersih & Minimalis */}
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                INFORMASI DOKUMEN
              </h2>
              <span className="text-xs font-mono font-semibold text-sky-200 bg-sky-500/20 border border-sky-400/30 px-2.5 py-0.5 rounded">
                {previewDocNumber}
              </span>
            </div>


            {/* Active Form Inputs */}
            <div className="p-5 sm:p-6 space-y-5">
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
                  <span className="text-[10px] text-slate-400 font-mono">
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
            </div>
          </div>

          {/* Card: PENGESAHAN DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                PENGESAHAN & PERSETUJUAN DOKUMEN
              </h2>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Compact 4-Stage Approval Pipeline */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Step 1: Pembuat (Tahap Aktif Saat Ini) */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-blue-900 dark:text-blue-200 text-[11px] truncate">Pembuat</p>
                      <p className="text-[9.5px] text-blue-600 dark:text-blue-400 font-medium truncate">Draft Usulan</p>
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
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">Verifikasi No.</p>
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
                {/* 1. Reviewer */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Reviewer (Atasan Departemen) <span className="text-red-500">*</span>
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
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                  >
                    {availableReviewers.map((emp) => (
                      <option key={emp.nik} value={emp.nik}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Approver */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Approver (Management Representative / MR) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedApproverNik}
                    onChange={(e) => setSelectedApproverNik(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
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
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold">Catatan Kepatuhan ISO:</strong> Reviewer dan Approver yang dipilih adalah pejabat yang sama (<strong>{activeReviewer?.name}</strong>). Untuk memenuhi prinsip <em>Four-Eyes</em> / pemisahan kewenangan, disarankan memilih General Manager atau Direksi sebagai pengesah.
                  </p>
                </div>
              )}

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
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Lampiran Berkas Resmi (PDF / Word / Excel)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 text-center hover:bg-blue-50/30 transition cursor-pointer relative">
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
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    {fileAttachment ? (
                      <div className="text-xs flex items-center justify-center gap-2 flex-wrap">
                        <span className="font-bold text-emerald-600">Berkas Terlampir:</span>
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
                          Klik untuk memilih berkas atau seret file PDF / Word / Excel ke sini
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
                <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl space-y-2.5">
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

                  <div className="pt-2 border-t border-sky-200/60 dark:border-sky-800/60">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={directPublish}
                        onChange={(e) => setDirectPublish(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Dokumen telah disahkan secara fisik / bertanda tangan basah
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Centang opsi ini jika berkas merupakan arsip dokumen yang sudah ditandatangani basah di atas kertas oleh pejabat berwenang. Dokumen akan langsung diterbitkan dengan status <strong>AKTIF</strong> tanpa perlu menunggu tanda tangan digital ulang.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-300 dark:border-slate-700 rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition shadow-sm hover:shadow cursor-pointer ${directPublish
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20'
                    }`}
                >
                  {directPublish ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Terbitkan Dokumen
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ajukan Dokumen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right 4-Cols: Live Number Preview, Rules Sistem, Revision Flow */}
        <div className="xl:col-span-4 space-y-6">

          {/* Card 1: PREVIEW NOMOR DOKUMEN */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                PREVIEW NOMOR DOKUMEN
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
                Otomatis
              </span>
            </div>

            <div className="p-5 text-center space-y-2">
              <div className="py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider block select-all">
                  {previewDocNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dihasilkan otomatis sesuai jenis dokumen, departemen, dan nomor urut.
              </p>
            </div>
          </div>

          {/* Card 2: RINGKASAN PENGAJUAN (Intuitive Submission Summary) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                RINGKASAN PENGAJUAN
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                title.trim()
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {title.trim() ? 'Siap Diajukan' : 'Belum Lengkap'}
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* 1. Kategori & Judul Dokumen */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    {selectedType}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    {documentTypes.find(t => t.code === selectedType)?.name || selectedType}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Dept: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{selectedDept}</strong>
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70">
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
              </div>

              {/* 2. Alur Persetujuan Dokumen - 4 Tahap ISO */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Pihak yang Menyetujui
                  </span>
                  <span className="text-[9.5px] font-semibold text-blue-600 dark:text-blue-400 font-mono">
                    4 Tahap ISO
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Step 1: Pembuat */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">Dibuat oleh (Pemohon):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {activeCreator.name}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Reviewer */}
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block">Diperiksa oleh (Atasan):</span>
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
                      <span className="text-[10px] text-slate-400 block">Diverifikasi oleh (Doc Control):</span>
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
                      <span className="text-[10px] text-slate-400 block">Disahkan oleh (MR / GM):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">
                        {activeApprover?.name || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReviewerNik === selectedApproverNik && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Reviewer & Approver sama: {activeReviewer?.name}</span>
                  </div>
                )}
              </div>

              {/* 3. Berkas Lampiran */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    File Lampiran
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-[190px]">
                    {fileAttachment ? fileAttachment.name : 'Tidak ada berkas terlampir'}
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
