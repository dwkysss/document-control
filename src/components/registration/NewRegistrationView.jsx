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
  ShieldCheck
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

  // 2. Filter authorized approvers: Khusus Management Representative (MR)
  const availableApprovers = (employees || []).filter(
    e => e.status !== 'Nonaktif' && e.role === 'approver'
  );

  // Pejabat Penyetuju (Approver) sesuai standar ISO 9001: Khusus Management Representative (MR)
  const getDefaultApproverNik = () => {
    const mr = availableApprovers.find(
      a => (a.position || '').toUpperCase().includes('MR') || a.role === 'approver'
    );
    if (mr) return mr.nik;
    return 'DJI012548'; // BABAN RACHMAT SUBAGJA (Manager HRGA & MR)
  };

  const [selectedApproverNik, setSelectedApproverNik] = useState(() => getDefaultApproverNik(selectedDept, selectedType));

  // Sync smart approver default when selected department or document type changes
  useEffect(() => {
    const suggestedNik = getDefaultApproverNik(selectedDept, selectedType);
    if (availableApprovers.some(a => a.nik === suggestedNik)) {
      setSelectedApproverNik(suggestedNik);
    }
  }, [selectedDept, selectedType, employees]);

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
      fileName: `${previewDocNumber}.pdf`,
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
      fileName: `${previewDocNumber}.pdf`,
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
    setIsSubmitting(false);
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

                  {/* Pembuat - Terkunci Otomatis Sesuai Akun Login */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        Pembuat Dokumen <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Otomatis Sesuai Akun Login
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl select-none">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                          {activeCreator.name
                            ? activeCreator.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                            : 'US'}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {activeCreator.name}
                            </span>
                            <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold uppercase shrink-0 border border-blue-200 dark:border-blue-800">
                              {activeCreator.role || 'STAFF'}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                            NIP: <span className="font-mono text-slate-700 dark:text-slate-300">{activeCreator.nik}</span> | {activeCreator.position} ({activeCreator.department})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pl-2 text-slate-400" title="Identitas pembuat terkunci otomatis sesuai sesi akun login">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
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
                      className="w-full text-xs uppercase font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:normal-case placeholder:text-slate-400"
                    />
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

          {/* Card: PENGESAHAN DOKUMEN & APPROVAL (ISO 9001:2015) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#102a4e] text-white px-5 py-3.5 flex items-center justify-between">
              <h2 className="text-sm font-extrabold tracking-wider uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                PENGESAHAN & PERSETUJUAN DOKUMEN (ISO 9001:2015)
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wide">
                Best Practice Standard
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* ISO 9001:2015 4-Stage Pipeline Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-emerald-50/30 dark:from-slate-800/80 dark:via-blue-950/20 dark:to-emerald-950/20 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Alur Persetujuan Dokumen ISO 9001:2015 (PT Dentelle Jaya Infinitex)</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">4 Peran & Tanggung Jawab</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {/* Step 1: User */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                      01
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 dark:text-white truncate">USER (Staff)</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Menyusun Draft & Usulan</p>
                    </div>
                  </div>

                  {/* Step 2: Reviewer */}
                  <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-sm">
                      02
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-purple-950 dark:text-purple-200 truncate">REVIEWER (Atasan)</p>
                      <p className="text-[10px] text-purple-800 dark:text-purple-400 truncate">Periksa Isi & Alur Kerja</p>
                    </div>
                  </div>

                  {/* Step 3: Document Control */}
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-sm">
                      03
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-blue-950 dark:text-blue-200 truncate">DOC CONTROL (DCO)</p>
                      <p className="text-[10px] text-blue-800 dark:text-blue-400 truncate">Verifikasi Format & Nomor</p>
                    </div>
                  </div>

                  {/* Step 4: Approver */}
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-sm">
                      04
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-emerald-950 dark:text-emerald-200 truncate">APPROVER (MR)</p>
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-400 truncate">Pengesahan Resmi Terbit</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Grid Sign-off Selectors: Atasan/Reviewer (Step 2) & Approver/MR (Step 4) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Reviewer (Atasan / Kepala Departemen) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      02. Reviewer (Atasan Departemen) <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-purple-600 font-semibold">
                      Pemeriksa Isi
                    </span>
                  </label>

                  <select
                    value={selectedReviewerNik}
                    onChange={(e) => setSelectedReviewerNik(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-sm"
                  >
                    {availableReviewers.map((emp) => (
                      <option key={emp.nik} value={emp.nik}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>

                  {activeReviewer && (
                    <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        {String(activeReviewer?.name || 'Rev').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="overflow-hidden text-xs">
                        <p className="font-bold text-purple-950 dark:text-purple-200 truncate">{activeReviewer?.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {activeReviewer?.position} • Dept: <strong>{activeReviewer?.department}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Pejabat Penyetuju (Approver / Management Representative) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      04. Approver (Management Representative / MR) <span className="text-red-500">*</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Pengesahan Terbit
                    </span>
                  </label>

                  <select
                    value={selectedApproverNik}
                    onChange={(e) => setSelectedApproverNik(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-sm"
                  >
                    {availableApprovers.map((emp) => (
                      <option key={emp.nik} value={emp.nik}>
                        {emp.name} — {emp.position} ({emp.department})
                      </option>
                    ))}
                  </select>

                  {activeApprover && (
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                        {String(activeApprover?.name || 'App').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="overflow-hidden text-xs">
                        <p className="font-bold text-emerald-950 dark:text-emerald-200 truncate">{activeApprover?.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {activeApprover?.position} • Dept: <strong>{activeApprover?.department}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4 text-blue-600" />
                  SIMPAN DRAFT
                </button>
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-lg transition shadow-md cursor-pointer ${
                    directPublish
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : currentUser?.role === 'staff'
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                      : currentUser?.role === 'reviewer'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {directPublish ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      TERBITKAN LANGSUNG (AKTIF)
                    </>
                  ) : currentUser?.role === 'staff' ? (
                    <>
                      <Send className="w-4 h-4" />
                      AJUKAN KE ATASAN (TAHAP 1: REVIEW)
                    </>
                  ) : currentUser?.role === 'reviewer' ? (
                    <>
                      <Send className="w-4 h-4" />
                      AJUKAN KE DOC CONTROL (TAHAP 2: FORMAT)
                    </>
                  ) : isDcoOrAdmin ? (
                    <>
                      <Send className="w-4 h-4" />
                      AJUKAN KE APPROVER MR (TAHAP 3)
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      AJUKAN PENGAJUAN DOKUMEN
                    </>
                  )}
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


    </div>
  );
}
