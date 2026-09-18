import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  initialDepartments,
  initialDocumentTypes,
  initialEmployees,
  initialVerifierTeams,
  initialDocuments,
  initialAuditLogs,
  initialSystemSettings
} from '../data/initialData';
import { getNextSequenceNumber, getNextRevisionCode, formatDocumentNumber } from '../utils/numberingEngine';
import { supabase, isSupabaseConfigured, uploadDocumentFile } from '../lib/supabaseClient';

const DocumentControlContext = createContext(null);

export function DocumentControlProvider({ children }) {
  const [isLoadingCloud, setIsLoadingCloud] = useState(isSupabaseConfigured);

  // 1. Core State with LocalStorage Caching & Cloud Fallback
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('dji_dms_documents');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('dji_dms_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let updatedDepts = parsed.map(d => {
          if (d.code === 'MGMT') return { ...d, head: 'DENI RAMDAN' };
          if (d.code === 'HRGA') return { ...d, head: 'BABAN RACHMAT SUBAGJA' };
          if (d.code === 'IT') return { ...d, head: 'Dwiky Sumarlin' };
          if (d.code === 'PRODUKSI') return { ...d, head: 'DEDE SUHENDA' };
          if (d.code === 'QAQC') return { ...d, head: '------------' };
          if (d.code === 'WAREHOUSE') return { ...d, head: '------------' };
          if (d.code === 'MARKETING') return { ...d, head: '------------' };
          if (d.code === 'FAT') return { ...d, head: '------------' };
          return d;
        });
        if (!updatedDepts.some(d => d.code === 'MGMT')) {
          updatedDepts = [
            { id: 'dept-mgmt', code: 'MGMT', name: 'Top Management & Direksi', head: 'DENI RAMDAN', color: 'violet' },
            ...updatedDepts
          ];
        }
        localStorage.setItem('dji_dms_departments', JSON.stringify(updatedDepts));
        return updatedDepts;
      } catch (e) {}
    }
    return initialDepartments;
  });

  const [documentTypes, setDocumentTypes] = useState(() => {
    const saved = localStorage.getItem('dji_dms_doctypes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.some(t => t.code === 'EXT')) {
          const extType = { id: 'type-7', code: 'EXT', name: 'Dokumen Eksternal (External Document)', description: 'Peraturan perundangan (UU/Permenaker), standar pelanggan, sertifikasi eksternal', level: 5, prefix: 'EXT' };
          const updated = [...parsed, extType];
          localStorage.setItem('dji_dms_doctypes', JSON.stringify(updated));
          return updated;
        }
        return parsed;
      } catch (e) {}
    }
    return initialDocumentTypes;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('dji_dms_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const dummyNiks = [
          '123456', '123457', '123458', '123459', '123460', '123461', '123462', 'DJI000001',
          'DJI042211', 'DJI052212', 'DJI062213' // Mock NIKs to exclude
        ];
        let cleaned = parsed
          .filter(e => !dummyNiks.includes(String(e.nik || '').trim()))
          .map(e => {
            if (e.nik === 'DJI092115') return { ...e, department: 'MGMT', position: 'GENERAL MANAGER', role: 'reviewer' };
            if (e.nik === 'DJI022203') return { ...e, role: 'reviewer', position: 'KEPALA BAGIAN PRODUKSI', department: 'PRODUKSI' };
            if (e.nik === 'DJI012548') return { ...e, role: 'approver', position: 'MANAGER HRGA & MR', department: 'HRGA' };
            if (e.nik === 'DJI022550') return { ...e, role: 'doc_control', position: 'DOCUMENT CONTROL OFFICER' };
            if (e.nik === 'DJI102216') return { ...e, role: 'staff', position: 'STAFF ACCOUNTING FINANCE' };
            return e;
          });

        initialEmployees.forEach(initEmp => {
          if (!cleaned.some(e => String(e?.nik || '').trim() === String(initEmp.nik).trim())) {
            cleaned.push(initEmp);
          }
        });

        localStorage.setItem('dji_dms_employees', JSON.stringify(cleaned));
        if (cleaned.length > 0) return cleaned;
      } catch (e) {}
    }
    return initialEmployees;
  });

  const [verifierTeams, setVerifierTeams] = useState(() => {
    const saved = localStorage.getItem('dji_dms_verifierteams');
    return saved ? JSON.parse(saved) : initialVerifierTeams;
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('dji_dms_auditlogs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [systemSettings, setSystemSettings] = useState(() => {
    const saved = localStorage.getItem('dji_dms_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.companyName === 'DJI INDONESIA' || parsed.companyName === 'PT DJI') {
        parsed.companyName = 'PT DENTELLE JAYA INFINITEX';
        parsed.watermarkControlledText = 'CONTROLLED COPY - PT DENTELLE JAYA INFINITEX';
      }
      if (!parsed.companyTagline) {
        parsed.companyTagline = 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga';
      }
      return parsed;
    }
    return initialSystemSettings;
  });

  // Current Logged-in User Session (Stored in localStorage 'dji_auth_user')
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dji_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved session:', e);
    }
    return null; // Start logged out so user logs in with NIP
  });

  // Login handler by Email or NIP
  const login = (identifier, password = '') => {
    const cleanId = String(identifier || '').trim().toLowerCase();
    if (!cleanId) {
      showToast('Harap masukkan Email atau NIP karyawan!', 'danger');
      return { success: false, message: 'Identitas akun wajib diisi.' };
    }

    const foundEmp = employees.find(
      e => String(e.nik || '').trim().toLowerCase() === cleanId ||
           String(e.id || '').trim().toLowerCase() === cleanId ||
           String(e.email || '').trim().toLowerCase() === cleanId ||
           String(e.name || '').trim().toLowerCase() === cleanId
    );

    if (!foundEmp) {
      showToast(`Akun dengan Email/NIP "${identifier}" tidak terdaftar dalam sistem!`, 'danger');
      return { success: false, message: 'Akun tidak terdaftar.' };
    }

    if (foundEmp.status === 'Nonaktif') {
      showToast(`Akun ${cleanId} (${foundEmp.name}) berstatus Nonaktif! Hubungi Administrator.`, 'danger');
      return { success: false, message: 'Akun berstatus nonaktif.' };
    }

    setCurrentUser(foundEmp);
    try {
      localStorage.setItem('dji_auth_user', JSON.stringify(foundEmp));
    } catch (e) {
      console.warn('Error saving session:', e);
    }

    addAuditLog('USER_LOGIN', '-', '-', `Pengguna ${foundEmp.name} (${foundEmp.position} - ${foundEmp.role}) berhasil masuk ke sistem.`);
    showToast(`Selamat datang, ${foundEmp.name}! Berhasil masuk sebagai ${foundEmp.position}.`, 'success');
    return { success: true, user: foundEmp };
  };

  // Logout handler
  const logout = () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', '-', '-', `Pengguna ${currentUser.name} keluar dari sistem.`);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('dji_auth_user');
    } catch (e) {
      console.warn('Error clearing session:', e);
    }
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  // RBAC Permission Flags (ISO 9001:2015 Collaborative Roles)
  const role = currentUser?.role || 'staff';
  const isApprover = role === 'approver';
  // Role MR (Approver) memiliki hak akses setara dengan System Administrator
  const isAdmin = role === 'admin' || role === 'approver';
  const isReviewer = role === 'reviewer' || role === 'admin' || role === 'approver';
  const isDocControl = role === 'doc_control' || role === 'admin' || role === 'approver';
  const isStaff = role === 'staff';

  const isDeptHead = (departments || []).some(d =>
    d.head && !d.head.includes('---') &&
    currentUser?.name &&
    (d.head.toLowerCase() === currentUser.name.toLowerCase() ||
     currentUser.name.toLowerCase().includes(d.head.toLowerCase()))
  );
  const canSubmitDocument = Boolean(currentUser);
  const canReviewContent = isReviewer || isApprover || isDeptHead || isAdmin;
  const canVerifyFormat = isDocControl || isAdmin || isApprover;
  const canApproveDocument = isApprover || isAdmin;
  const canFinalizeDocument = isApprover || isAdmin;
  const canDeleteDocument = isAdmin;
  const canCancelDocument = isAdmin;
  const canManageMasterData = isAdmin;
  const canManageSettings = isAdmin;
  const canAccessReports = isReviewer || isDocControl || isApprover || isAdmin;

  // Scope akses berkas Menunggu Verifikasi berdasarkan Departemen & Role (ISO 9001 Segregation)
  const canUserViewPendingDoc = (doc) => {
    if (!doc) return false;
    if (!currentUser) return false;

    const userRole = currentUser.role || 'staff';
    const userDept = (currentUser.department || '').toUpperCase().trim();
    const docDept = (doc.department || '').toUpperCase().trim();
    const userName = (currentUser.name || '').toUpperCase().trim();
    const userNik = (currentUser.nik || '').toUpperCase().trim();

    // 1. Super Admin, Approver (MR), dan Document Control Officer (DCO) dapat melihat seluruh antrean verifikasi
    if (userRole === 'admin' || userRole === 'approver' || userRole === 'doc_control') {
      return true;
    }

    // 2. Atasan / Reviewer: HANYA dapat melihat dokumen dari departemennya sendiri
    //    atau jika ditunjuk secara spesifik sebagai Reviewer dokumen tersebut.
    if (userRole === 'reviewer') {
      // Sama departemen
      if (userDept && docDept && userDept === docDept) return true;

      // Terdaftar sebagai Kepala Departemen dari departemen dokumen di Master Departemen
      const isHeadOfDocDept = (departments || []).some(d => {
        if ((d.code || '').toUpperCase().trim() !== docDept) return false;
        const head = (d.head || '').toUpperCase().trim();
        return head && !head.includes('---') && (head === userName || head.includes(userName) || userName.includes(head));
      });
      if (isHeadOfDocDept) return true;

      // Ditunjuk secara spesifik sebagai target reviewer
      const isDesignatedReviewer = (doc.reviewerNik && doc.reviewerNik.toUpperCase().trim() === userNik) ||
                                   (doc.targetReviewer && doc.targetReviewer.toUpperCase().trim() === userName) ||
                                   (doc.targetReviewer && doc.targetReviewer.toUpperCase().includes(userName)) ||
                                   (userName && doc.targetReviewer && userName.includes(doc.targetReviewer.toUpperCase()));
      if (isDesignatedReviewer) return true;

      // Jika dari departemen lain, sembunyikan!
      return false;
    }

    // 3. Staff: Hanya melihat dokumen yang diajukan sendiri
    const isOwner = (doc.creatorNik && doc.creatorNik.toUpperCase().trim() === userNik) ||
                    (doc.creator && doc.creator.toUpperCase().trim() === userName);
    return Boolean(isOwner);
  };

  // Navigation Helpers & Persistence
  const getMenuBreadcrumbs = (key) => {
    switch (key) {
      case 'dashboard': return ['Dashboard', 'Overview'];
      case 'reg-new': return ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'];
      case 'reg-draft': return ['Dashboard', 'Registrasi Dokumen', 'Draft Dokumen'];
      case 'reg-pending': return ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'];
      case 'reg-approved': return ['Dashboard', 'Registrasi Dokumen', 'Disetujui'];
      case 'reg-rejected': return ['Dashboard', 'Registrasi Dokumen', 'Ditolak'];
      case 'ctrl-all': return ['Dashboard', 'Document Control', 'Semua Dokumen'];
      case 'ctrl-active': return ['Dashboard', 'Document Control', 'Dokumen Aktif'];
      case 'ctrl-obsolete': return ['Dashboard', 'Document Control', 'Dokumen Obsolete'];
      case 'ctrl-history': return ['Dashboard', 'Document Control', 'Riwayat Revisi'];
      case 'rev-new': return ['Dashboard', 'Document Revision', 'Pengajuan Revisi'];
      case 'master-emp': return ['Dashboard', 'Master Data', 'Karyawan'];
      case 'master-dept': return ['Dashboard', 'Master Data', 'Departemen'];
      case 'master-type': return ['Dashboard', 'Master Data', 'Jenis Dokumen'];
      case 'master-role': return ['Dashboard', 'Master Data', 'Role & Hak Akses'];
      case 'rep-register': return ['Dashboard', 'Laporan & Audit', 'Master Register'];
      case 'rep-dept': return ['Dashboard', 'Laporan & Audit', 'Per Departemen'];
      case 'rep-type': return ['Dashboard', 'Laporan & Audit', 'Per Jenis Dokumen'];
      case 'rep-history': return ['Dashboard', 'Laporan & Audit', 'Audit Log'];
      case 'settings': return ['Dashboard', 'Pengaturan', 'Sistem & Konfigurasi'];
      default: return ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'];
    }
  };

  const getInitialMenu = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== '/') return hash;
      const saved = localStorage.getItem('dji_dms_active_menu');
      if (saved && saved !== '/') return saved;
    }
    return 'dashboard';
  };

  // Active Menu / Navigation State with URL Hash & LocalStorage Persistence
  const [activeMenu, setActiveMenuState] = useState(getInitialMenu);
  const [breadcrumbs, setBreadcrumbs] = useState(() => getMenuBreadcrumbs(getInitialMenu()));

  const setActiveMenu = (menuKey) => {
    setActiveMenuState(menuKey);
    setBreadcrumbs(getMenuBreadcrumbs(menuKey));
    try {
      localStorage.setItem('dji_dms_active_menu', menuKey);
      window.location.hash = menuKey;
    } catch (e) {}
  };

  // Listen to browser hash changes & sync on mount
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== activeMenu) {
        setActiveMenuState(hash);
        setBreadcrumbs(getMenuBreadcrumbs(hash));
        try {
          localStorage.setItem('dji_dms_active_menu', hash);
        } catch (e) {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (activeMenu) {
      window.location.hash = activeMenu;
      try {
        localStorage.setItem('dji_dms_active_menu', activeMenu);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Global Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Document for Modal Viewer
  const [viewingDocument, setViewingDocument] = useState(null);

  // Selected Document for Revision Initiation
  const [selectedDocForRevision, setSelectedDocForRevision] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Selamat Datang di Sistem Document Control',
      message: 'Sistem siap digunakan. Silakan mulai mendaftarkan dokumen baru di menu Registrasi Dokumen.',
      time: 'Baru saja',
      read: false,
      type: 'info'
    }
  ]);

  // Helper sanitize for PostgreSQL date and time types
  const sanitizeDate = (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '' || val.trim() === '-') return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch (e) {}
    return null;
  };

  const sanitizeTime = (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') {
      return new Date().toTimeString().slice(0, 8);
    }
    const cleaned = val.trim().replace(/\./g, ':');
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(cleaned)) {
      return cleaned.length === 5 ? `${cleaned}:00` : cleaned;
    }
    return new Date().toTimeString().slice(0, 8);
  };

  // Helper conversion for Supabase snake_case schema
  const toSnakeCaseDoc = (d) => ({
    id: d.id,
    doc_number: d.docNumber,
    title: d.title || 'DOKUMEN TANPA JUDUL',
    type: d.type || 'SOP',
    type_name: d.typeName || d.type || 'SOP',
    department: d.department || 'HRGA',
    creator: d.creator || 'Staff',
    creator_nik: d.creatorNik || null,
    creator_position: d.creatorPosition || null,
    seq_number: d.seqNumber || '01',
    revision: d.revision || '00',
    status: d.status || 'DRAFT',
    created_date: sanitizeDate(d.createdDate) || new Date().toISOString().slice(0, 10),
    created_time: sanitizeTime(d.createdTime),
    effective_date: sanitizeDate(d.effectiveDate),
    verifier_team: d.targetApprover ? `${d.verifierTeam || 'Document Control Team'} [Approver: ${d.targetApprover}]` : (d.verifierTeam || 'Document Control Team'),
    notes: d.notes || null,
    content: d.content || null,
    file_name: d.fileName || null,
    file_size: d.fileSize || null,
    file_url: d.fileUrl || null,
    file_type: d.fileType || null,
    superseded_by: d.supersededBy || null,
    obsolete_date: sanitizeDate(d.obsoleteDate),
    change_reason: d.changeReason || null,
    change_description: d.changeDescription || null,
    rejection_reason: d.rejectionReason || null,
    rejected_by: d.rejectedBy || null,
    rejected_date: d.rejectedDate || null,
    approved_by: d.approvedBy || null,
    approved_date: sanitizeDate(d.approvedDate),
    revision_history: Array.isArray(d.revisionHistory) ? d.revisionHistory : [],
    updated_at: new Date().toISOString()
  });

  const fromSnakeCaseDoc = (d) => ({
    id: d.id,
    docNumber: d.doc_number,
    title: d.title,
    type: d.type,
    typeName: d.type_name,
    department: d.department,
    creator: d.creator,
    creatorNik: d.creator_nik,
    creatorPosition: d.creator_position,
    seqNumber: d.seq_number,
    revision: d.revision,
    status: d.status,
    createdDate: d.created_date,
    createdTime: d.created_time,
    effectiveDate: d.effective_date,
    verifierTeam: d.verifier_team ? d.verifier_team.replace(/\s*\[Approver:[^\]]+\]/, '').trim() : 'Document Control Team',
    targetApprover: d.target_approver || (d.verifier_team && d.verifier_team.includes('[Approver:') ? d.verifier_team.split('[Approver:')[1]?.replace(']', '').trim() : null),
    notes: d.notes,
    content: d.content,
    fileName: d.file_name,
    fileSize: d.file_size,
    fileUrl: d.file_url,
    fileType: d.file_type,
    supersededBy: d.superseded_by,
    obsoleteDate: d.obsolete_date,
    changeReason: d.change_reason,
    changeDescription: d.change_description,
    rejectionReason: d.rejection_reason,
    rejectedBy: d.rejected_by,
    rejectedDate: d.rejected_date,
    approvedBy: d.approved_by,
    approvedDate: d.approved_date,
    revisionHistory: d.revision_history || []
  });

  // 1.5 Fetch initial data from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoadingCloud(false);
      return;
    }

    let isMounted = true;

    async function loadCloudData() {
      setIsLoadingCloud(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase cloud fetch timeout (4s)')), 4000)
        );

        const fetchPromise = Promise.all([
          supabase.from('documents').select('*').order('created_at', { ascending: false }),
          supabase.from('departments').select('*'),
          supabase.from('document_types').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('verifier_teams').select('*'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
          supabase.from('system_settings').select('*').limit(1)
        ]);

        const [
          { data: cloudDocs, error: docsErr },
          { data: cloudDepts, error: deptsErr },
          { data: cloudTypes, error: typesErr },
          { data: cloudEmps, error: empsErr },
          { data: cloudTeams, error: teamsErr },
          { data: cloudLogs, error: logsErr },
          { data: cloudSettings, error: settingsErr }
        ] = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMounted) return;

        if (cloudDocs && !docsErr) {
          setDocuments(cloudDocs.map(fromSnakeCaseDoc));
        }

        if (cloudDepts && !deptsErr) {
          const sorted = [...cloudDepts].sort((a, b) => {
            if (a.code === 'MGMT') return -1;
            if (b.code === 'MGMT') return 1;
            return 0;
          });
          setDepartments(sorted);
        }
        if (cloudTypes && !typesErr) setDocumentTypes(cloudTypes);
        if (cloudEmps && !empsErr) {
          const dummyNiks = ['123456', '123457', '123458', '123459', '123460', '123461', '123462'];
          const cleanedEmps = cloudEmps.filter(e => !dummyNiks.includes(String(e.nik || '').trim()));
          const sortedEmps = cleanedEmps.sort((a, b) => {
            if (a.department === 'MGMT' || a.nik === 'DJI000001') return -1;
            if (b.department === 'MGMT' || b.nik === 'DJI000001') return 1;
            return 0;
          });
          setEmployees(sortedEmps);
        }
        if (cloudTeams && !teamsErr) setVerifierTeams(cloudTeams);
        if (cloudLogs && !logsErr) {
          setAuditLogs(cloudLogs.map(l => ({
            id: l.id,
            timestamp: l.timestamp,
            user: l.user_name,
            nik: l.nik,
            action: l.action,
            docNumber: l.doc_number,
            docTitle: l.doc_title,
            details: l.details
          })));
        }
        if (cloudSettings && cloudSettings.length > 0) {
          const s = cloudSettings[0];
          setSystemSettings({
            companyName: s.company_name || 'PT DJI',
            companyCode: s.company_code || 'DJI',
            systemName: s.system_name || 'DOCUMENT CONTROL SYSTEM',
            isoStandard: s.iso_standard || 'ISO 9001:2015',
            numberingFormat: s.numbering_format || '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
            defaultVerifierTeam: s.default_verifier_team || 'Document Control Team',
            watermarkControlledText: s.watermark_controlled_text || 'CONTROLLED COPY - PT DJI',
            watermarkObsoleteText: s.watermark_obsolete_text || 'OBSOLETE - DO NOT USE',
            watermarkDraftText: s.watermark_draft_text || 'DRAFT - NOT FOR OPERATIONAL USE',
            enableQRStamp: s.enable_qr_stamp ?? true,
            enableAuditAutoLog: s.enable_audit_auto_log ?? true,
            periodicReviewMonths: s.periodic_review_months || 12
          });
        }
      } catch (err) {
        console.warn('Supabase cloud fetch warning, falling back to local cache:', err);
      } finally {
        if (isMounted) setIsLoadingCloud(false);
      }
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // 2. LocalStorage Syncing with Quota Protection
  useEffect(() => {
    try {
      localStorage.setItem('dji_dms_documents', JSON.stringify(documents));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, optimizing document storage', e);
      try {
        const lightweightDocs = documents.map(d => ({
          ...d,
          fileUrl: d.fileUrl && d.fileUrl.length > 500000 ? null : d.fileUrl
        }));
        localStorage.setItem('dji_dms_documents', JSON.stringify(lightweightDocs));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('dji_dms_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('dji_dms_doctypes', JSON.stringify(documentTypes));
  }, [documentTypes]);

  useEffect(() => {
    localStorage.setItem('dji_dms_employees', JSON.stringify(employees));
  }, [employees]);

  // Sinkronisasi otomatis agar akun resmi PT DJI tersedia dan dummy lama dibersihkan
  useEffect(() => {
    setEmployees(prev => {
      const dummyNiks = new Set([
        '123456', '123457', '123458', '123459', '123460', '123461', '123462', 'DJI000001',
        'DJI042211', 'DJI052212', 'DJI062213'
      ]);
      let changed = false;
      let list = (prev || []).filter(e => !dummyNiks.has(String(e?.nik || '').trim()));
      if (list.length !== (prev || []).length) {
        changed = true;
      }

      initialEmployees.forEach(initEmp => {
        if (!list.some(e => String(e?.nik || '').trim() === String(initEmp.nik).trim())) {
          list.push(initEmp);
          changed = true;
        }
      });

      list = list.map(e => {
        if (e.nik === 'DJI092115' && e.role !== 'reviewer') {
          changed = true;
          return { ...e, role: 'reviewer' };
        }
        return e;
      });

      if (changed) {
        localStorage.setItem('dji_dms_employees', JSON.stringify(list));
        return list;
      }
      return prev;
    });
  }, []);

  // Sinkronisasi otomatis Kepala Departemen dengan Single Source of Truth di Master Karyawan
  useEffect(() => {
    if (!employees || employees.length === 0) return;
    setDepartments(prev => {
      let changed = false;
      const updated = (prev || []).map(d => {
        if (!d.head || d.head === '------------' || d.head.includes('---')) return d;
        const norm = d.head.toUpperCase().trim();
        const matched = employees.find(e => {
          const en = (e.name || '').toUpperCase().trim();
          return en === norm || en.includes(norm) || norm.includes(en);
        });
        if (matched && matched.name !== d.head) {
          changed = true;
          return { ...d, head: matched.name };
        }
        return d;
      });
      if (changed) {
        localStorage.setItem('dji_dms_departments', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('dji_dms_verifierteams', JSON.stringify(verifierTeams));
  }, [verifierTeams]);

  useEffect(() => {
    localStorage.setItem('dji_dms_auditlogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('dji_dms_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Toast Trigger Helper
  const showToast = (message, type = 'success', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // Helper to log audit trail
  const addAuditLog = (action, docNumber, docTitle, details) => {
    const now = new Date();
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('id-ID')}`,
      user: currentUser.name,
      nik: currentUser.nik,
      action,
      docNumber,
      docTitle,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper to add in-app notification
  const addNotification = (title, message, type = 'info', docId = null) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      time: 'Baru saja',
      read: false,
      type,
      docId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // 3. Document Action Methods

  /**
   * Simpan Dokumen sebagai Draft
   */
  const saveDraft = (docData) => {
    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = now.toLocaleTimeString('id-ID');

    // Tentukan sequence number
    let seqNumber = docData.seqNumber;
    if (!seqNumber || seqNumber === '( Otomatis oleh sistem )') {
      seqNumber = getNextSequenceNumber(documents, docData.type, docData.department);
    }

    const revision = docData.revision || '00';
    const docNumber = formatDocumentNumber({
      companyCode: systemSettings.companyCode,
      docType: docData.type,
      department: docData.department,
      seqNumber,
      revision
    });

    const newDoc = {
      id: docData.id || `doc-${Date.now()}`,
      docNumber,
      title: docData.title,
      type: docData.type,
      typeName: documentTypes.find(t => t.code === docData.type)?.name || docData.type,
      department: docData.department,
      creator: docData.creator || currentUser.name,
      creatorNik: docData.creatorNik || currentUser.nik,
      creatorPosition: docData.creatorPosition || currentUser.position,
      seqNumber,
      revision,
      status: 'DRAFT',
      createdDate: docData.createdDate || createdDate,
      createdTime: docData.createdTime || createdTime,
      effectiveDate: null,
      verifierTeam: docData.verifierTeam || 'Document Control Team',
      targetApprover: docData.targetApprover || docData.approverName || null,
      approverNik: docData.approverNik || null,
      approverPosition: docData.approverPosition || null,
      notes: docData.notes || '',
      content: docData.content || `1. TUJUAN\nDokumen ${docData.title} dibuat untuk standardisasi operasional.\n\n2. RUANG LINGKUP\nBerlaku di lingkungan departemen ${docData.department}.\n\n3. PROSEDUR PELAKSANAAN\n3.1 Pelaksanaan standar operasional sesuai kaidah ISO 9001.`,
      fileName: docData.fileName || `${docNumber}.pdf`,
      fileSize: docData.fileSize || '350 KB',
      fileType: docData.fileType || null,
      fileUrl: docData.fileUrl || null,
      revisionHistory: docData.revisionHistory || [
        { revision, date: createdDate, author: currentUser.name, note: 'Draft inisial' }
      ]
    };

    setDocuments(prev => {
      const existsIndex = prev.findIndex(d => d.id === newDoc.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newDoc;
        return updated;
      }
      return [newDoc, ...prev];
    });

    addAuditLog('SAVE_DRAFT', newDoc.docNumber, newDoc.title, 'Menyimpan dokumen sebagai DRAFT');

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').upsert([toSnakeCaseDoc(newDoc)]).then(({ error }) => {
        if (error) console.warn('Supabase saveDraft warning:', error);
      });
    }

    showToast(`Dokumen draft ${newDoc.docNumber} berhasil disimpan!`, 'info');
    return newDoc;
  };

  /**
   * Ajukan Verifikasi Dokumen
   */
  const submitForVerification = (docData) => {
    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = now.toLocaleTimeString('id-ID');

    let seqNumber = docData.seqNumber;
    if (!seqNumber || seqNumber === '( Otomatis oleh sistem )') {
      seqNumber = getNextSequenceNumber(documents, docData.type, docData.department);
    }

    const revision = docData.revision || '00';
    const docNumber = formatDocumentNumber({
      companyCode: systemSettings.companyCode,
      docType: docData.type,
      department: docData.department,
      seqNumber,
      revision
    });

    const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
    const isReviewerUser = currentUser?.role === 'reviewer';
    const isDirectPublish = Boolean(isDcoOrAdmin && docData.directPublish);

    let docStatus = 'REVIEW'; // Default for Staff/User: Menunggu Review Atasan/Kepala Dept
    let reviewedBy = null;
    let reviewedDate = null;
    let reviewNotes = null;
    let verifiedBy = null;
    let verifiedDate = null;
    let verificationNotes = null;
    let effectiveDate = docData.effectiveDate || null;
    let approvedBy = null;
    let approvedDate = null;
    let approvalNotes = null;

    if (isDirectPublish) {
      docStatus = 'AKTIF';
      verifiedBy = currentUser?.name || 'Document Control';
      verifiedDate = createdDate;
      verificationNotes = 'Disahkan langsung melalui registrasi berkas bertanda tangan fisik / arsip master.';
      effectiveDate = docData.effectiveDate || createdDate;
      approvedBy = docData.targetApprover || currentUser?.name || 'Authorized Approver';
      approvedDate = createdDate;
      approvalNotes = 'Diterbitkan langsung sebagai Dokumen Aktif bertanda tangan basah.';
    } else if (isDcoOrAdmin) {
      // DCO / Admin: Otomatis lolos Tahap 1 (Review) & Tahap 2 (Format), langsung Tahap 3 (APPROVAL)
      docStatus = 'APPROVAL';
      reviewedBy = currentUser?.name || 'Reviewer (Bypass DCO)';
      reviewedDate = createdDate;
      reviewNotes = 'Diajukan langsung oleh Document Control.';
      verifiedBy = currentUser?.name || 'Document Control';
      verifiedDate = createdDate;
      verificationNotes = 'Format dan tata naskah diverifikasi langsung oleh Document Control saat pendaftaran.';
    } else if (isReviewerUser) {
      // Reviewer (Atasan / Kepala Dept) mendaftarkan sendiri dokumen:
      // Otomatis lolos Tahap 1 (Review), langsung Tahap 2 (VERIFIKASI DCO)
      docStatus = 'VERIFIKASI';
      reviewedBy = currentUser?.name;
      reviewedDate = createdDate;
      reviewNotes = 'Disusun dan ditelaah langsung oleh Kepala Departemen / Reviewer.';
    }

    const newDoc = {
      id: docData.id || `doc-${Date.now()}`,
      docNumber,
      title: docData.title,
      type: docData.type,
      typeName: documentTypes.find(t => t.code === docData.type)?.name || docData.type,
      department: docData.department,
      creator: docData.creator || currentUser.name,
      creatorNik: docData.creatorNik || currentUser.nik,
      creatorPosition: docData.creatorPosition || currentUser.position,
      seqNumber,
      revision,
      status: docStatus,
      createdDate: docData.createdDate || createdDate,
      createdTime: docData.createdTime || createdTime,
      effectiveDate,
      reviewedBy,
      reviewedDate,
      reviewNotes,
      verifiedBy,
      verifiedDate,
      verificationNotes,
      approvedBy,
      approvedDate,
      approvalNotes,
      targetReviewer: docData.targetReviewer || null,
      reviewerNik: docData.reviewerNik || null,
      verifierTeam: docData.verifierTeam || 'Document Control Team',
      targetApprover: docData.targetApprover || docData.approverName || null,
      approverNik: docData.approverNik || null,
      approverPosition: docData.approverPosition || null,
      notes: docData.notes || '',
      content: docData.content || `1. TUJUAN\nDokumen ${docData.title} dibuat untuk standardisasi operasional.\n\n2. RUANG LINGKUP\nBerlaku di lingkungan departemen ${docData.department}.\n\n3. PROSEDUR PELAKSANAAN\n3.1 Pelaksanaan standar operasional sesuai kaidah ISO 9001.`,
      fileName: docData.fileName || `${docNumber}.pdf`,
      fileSize: docData.fileSize || '520 KB',
      fileType: docData.fileType || null,
      fileUrl: docData.fileUrl || null,
      revisionHistory: docData.revisionHistory || [
        {
          revision,
          date: createdDate,
          author: currentUser.name,
          note: isDirectPublish
            ? `Penerbitan langsung dokumen aktif bertanda tangan fisik oleh ${currentUser.name}`
            : isDcoOrAdmin
            ? `Pendaftaran oleh DCO & verifikasi format otomatis. Menunggu pengesahan ${docData.targetApprover || 'Approver'}`
            : 'Pengajuan verifikasi dokumen (Tahap 1 DCO)'
        }
      ]
    };

    setDocuments(prev => {
      let updatedList = prev.filter(d => d.id !== newDoc.id);

      if (isDirectPublish) {
        // Auto-obsolete older active revisions of same type, department, seqNumber
        updatedList = updatedList.map(doc => {
          if (
            doc.type === newDoc.type &&
            doc.department === newDoc.department &&
            doc.seqNumber === newDoc.seqNumber &&
            doc.status === 'AKTIF'
          ) {
            return {
              ...doc,
              status: 'OBSOLETE',
              supersededBy: newDoc.docNumber,
              obsoleteDate: createdDate,
              notes: `${doc.notes ? doc.notes + ' ' : ''}[Otomatis Obsolete - digantikan oleh ${newDoc.docNumber}]`
            };
          }
          return doc;
        });
      }

      return [newDoc, ...updatedList];
    });

    if (isDirectPublish) {
      addAuditLog('DIRECT_PUBLISH', newDoc.docNumber, newDoc.title, `Diterbitkan langsung sebagai Dokumen Aktif oleh ${currentUser.name}`);
      addNotification('Penerbitan Dokumen Aktif', `${newDoc.docNumber} - ${newDoc.title} telah diterbitkan aktif langsung ke Master Dokumen.`, 'success', newDoc.id);
      showToast(`Dokumen ${newDoc.docNumber} berhasil diterbitkan langsung sebagai Dokumen Aktif!`, 'success');
    } else if (isDcoOrAdmin) {
      addAuditLog('SUBMIT_APPROVAL', newDoc.docNumber, newDoc.title, `Didaftarkan oleh DCO, format lolos otomatis. Menunggu pengesahan ${newDoc.targetApprover || 'Approver'}`);
      addNotification('Pengajuan Pengesahan Dokumen', `${newDoc.docNumber} - ${newDoc.title} siap disahkan oleh ${newDoc.targetApprover || 'Approver'}.`, 'warning', newDoc.id);
      showToast(`Dokumen ${newDoc.docNumber} berhasil diajukan! Format lolos otomatis dan langsung diteruskan ke ${newDoc.targetApprover || 'Pejabat Penyetuju'}.`, 'success');
    } else {
      addAuditLog('SUBMIT_VERIFICATION', newDoc.docNumber, newDoc.title, `Diajukan ke ${newDoc.verifierTeam}`);
      addNotification('Pengajuan Verifikasi Baru', `${newDoc.docNumber} - ${newDoc.title} diajukan untuk verifikasi.`, 'warning', newDoc.id);
      showToast(`Dokumen ${newDoc.docNumber} berhasil diajukan untuk verifikasi format!`, 'success');
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').upsert([toSnakeCaseDoc(newDoc)]).then(({ error }) => {
        if (error) console.warn('Supabase submitForVerification warning:', error);
      });
    }

    return newDoc;
  };

  /**
   * Tahap 1 (ISO 9001:2015): Pemeriksaan Isi Teknis & Proses oleh REVIEWER (Atasan / Kepala Departemen)
   * Menelaah kesesuaian operasional proses kerja, lalu meloloskan ke Tahap 2 (VERIFIKASI - Document Control).
   */
  const reviewDocumentContent = (docId, reviewNotes = '') => {
    if (!canReviewContent) {
      showToast('Akses ditolak! Hanya Reviewer (Atasan / Kepala Departemen) atau Administrator yang berwenang menelaah dokumen.', 'danger');
      return false;
    }

    const existingTarget = documents.find(d => d.id === docId);
    if (existingTarget && !canUserViewPendingDoc(existingTarget)) {
      showToast(`Akses ditolak! Dokumen ini hanya dapat direview oleh Atasan Departemen ${existingTarget.department}.`, 'danger');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;

    setDocuments(prevDocs => {
      const target = prevDocs.find(d => d.id === docId);
      if (!target) return prevDocs;
      targetDoc = target;

      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === docId) {
          const noteText = reviewNotes || 'Isi teknis dan kesesuaian alur kerja operasional telah diperiksa dan disetujui oleh Atasan/Reviewer.';
          return {
            ...doc,
            status: 'VERIFIKASI',
            reviewedBy: currentUser.name,
            reviewedDate: today,
            reviewNotes: noteText,
            notes: doc.notes ? `${doc.notes} | [Review Atasan Lolos: ${currentUser.name}]` : `[Review Atasan Lolos: ${currentUser.name}]`,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: `Review teknis disetujui oleh ${currentUser.name} (${currentUser.position}). Diteruskan ke Document Control.`
              }
            ]
          };
        }
        return doc;
      });

      if (isSupabaseConfigured && supabase) {
        const updatedTarget = updatedDocs.find(d => d.id === docId);
        if (updatedTarget) {
          supabase.from('documents').upsert([toSnakeCaseDoc(updatedTarget)]).then(({ error }) => {
            if (error) console.warn('Supabase reviewDocumentContent error:', error);
          });
        }
      }

      return updatedDocs;
    });

    if (targetDoc) {
      addAuditLog('REVIEW_DOCUMENT', targetDoc.docNumber, targetDoc.title, `Review teknis disetujui oleh ${currentUser.name} (${currentUser.position}). Diteruskan ke Document Control.`);
      addNotification('Review Atasan Disetujui', `${targetDoc.docNumber} lolos review teknis oleh ${currentUser.name}. Menunggu verifikasi format Document Control.`, 'info', targetDoc.id);
      showToast(`Dokumen ${targetDoc.docNumber} lolos review Atasan dan diteruskan ke Document Control!`, 'success');
      return true;
    }
    return false;
  };

  /**
   * Tahap 2 (ISO 9001:2015): Verifikasi Format & Penomoran oleh DOCUMENT CONTROL (DCO)
   * Memeriksa format baku ISO, penomoran, kelengkapan berkas,
   * lalu meloloskan berkas ke tahap pengesahan Approver / MR (status: APPROVAL).
   */
  const verifyDocumentFormat = (docId, notes = '') => {
    if (!canVerifyFormat) {
      showToast('Akses ditolak! Hanya Document Control Officer (DCO) atau Administrator yang dapat memverifikasi format dokumen.', 'danger');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;

    setDocuments(prevDocs => {
      const target = prevDocs.find(d => d.id === docId);
      if (!target) return prevDocs;
      targetDoc = target;

      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === docId) {
          const verifyNote = notes || 'Format dokumen, tata naskah, dan penomoran telah diverifikasi memenuhi standar ISO 9001.';
          return {
            ...doc,
            status: 'APPROVAL',
            verifiedBy: currentUser.name,
            verifiedDate: today,
            verificationNotes: verifyNote,
            notes: doc.notes ? `${doc.notes} | [Format Lolos DCO: ${currentUser.name}]` : `[Format Lolos DCO: ${currentUser.name}]`,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: `Format diverifikasi oleh ${currentUser.name} (DCO). Diteruskan ke ${doc.targetApprover || 'Pejabat Penyetuju'}.`
              }
            ]
          };
        }
        return doc;
      });

      if (isSupabaseConfigured && supabase) {
        const updatedTarget = updatedDocs.find(d => d.id === docId);
        if (updatedTarget) {
          supabase.from('documents').upsert([toSnakeCaseDoc(updatedTarget)]).then(({ error }) => {
            if (error) console.warn('Supabase verifyDocumentFormat error:', error);
          });
        }
      }

      return updatedDocs;
    });

    if (targetDoc) {
      addAuditLog('VERIFY_FORMAT', targetDoc.docNumber, targetDoc.title, `Format diverifikasi oleh ${currentUser.name} (DCO). Menunggu pengesahan ${targetDoc.targetApprover || 'Approver'}.`);
      addNotification('Format Dokumen Terverifikasi', `${targetDoc.docNumber} telah diverifikasi oleh DCO dan menunggu pengesahan ${targetDoc.targetApprover || 'Approver'}.`, 'info', targetDoc.id);
      showToast(`Format dokumen ${targetDoc.docNumber} berhasil diverifikasi! Diteruskan ke ${targetDoc.targetApprover || 'Pejabat Penyetuju'}.`, 'success');
    }
    return true;
  };

  /**
   * Tahap 2: Pengesahan Akhir oleh Pejabat Penyetuju (Approver Sign-off)
   * Menyetujui materi teknis operasional, mengubah status menjadi AKTIF,
   * dan secara otomatis mengubah revisi sebelumnya menjadi OBSOLETE!
   */
  const approveDocument = (docId, approverNotes = '') => {
    if (!canApproveDocument) {
      showToast('Akses ditolak! Hanya Pejabat Penyetuju (Approver) atau Administrator yang berwenang mengesahkan dokumen.', 'danger');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;

    setDocuments(prevDocs => {
      const target = prevDocs.find(d => d.id === docId);
      if (!target) return prevDocs;
      targetDoc = target;

      // Update target document to AKTIF
      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'AKTIF',
            effectiveDate: today,
            approvedBy: currentUser.name,
            approvedDate: today,
            approvalNotes: approverNotes,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: `Disetujui & Diterbitkan Aktif oleh ${currentUser.name} (${currentUser.position})`
              }
            ]
          };
        }

        // AUTO-OBSOLETE RULE:
        // Jika ada dokumen lain dengan type, department, dan seqNumber yang sama dan berstatus AKTIF (revisi lebih lama),
        // ubah statusnya menjadi OBSOLETE!
        if (
          doc.id !== docId &&
          doc.type === target.type &&
          doc.department === target.department &&
          doc.seqNumber === target.seqNumber &&
          doc.status === 'AKTIF'
        ) {
          return {
            ...doc,
            status: 'OBSOLETE',
            supersededBy: target.docNumber,
            obsoleteDate: today,
            notes: `${doc.notes ? doc.notes + ' ' : ''}[Otomatis Obsolete - digantikan oleh ${target.docNumber}]`
          };
        }

        return doc;
      });

      if (isSupabaseConfigured && supabase) {
        updatedDocs.forEach(d => {
          supabase.from('documents').upsert([toSnakeCaseDoc(d)]).then(({ error }) => {
            if (error) console.warn('Supabase document update error:', error);
          });
        });
      }

      return updatedDocs;
    });

    if (targetDoc) {
      addAuditLog('APPROVE_DOCUMENT', targetDoc.docNumber, targetDoc.title, `Disetujui oleh ${currentUser.name}. Status: AKTIF`);
      addNotification('Dokumen Disetujui & Aktif', `${targetDoc.docNumber} telah resmi disetujui dan berstatus AKTIF.`, 'success', targetDoc.id);
      
      // Trigger festive celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`Dokumen ${targetDoc.docNumber} berhasil DISETUJUI dan berstatus AKTIF!`, 'success');
    }
  };

  /**
   * Tolak Dokumen (Reject Workflow)
   */
  const rejectDocument = (docId, rejectionReason) => {
    if (!canReviewContent && !canVerifyFormat && !canApproveDocument) {
      showToast('Akses ditolak! Anda tidak memiliki wewenang menolak pengajuan dokumen.', 'danger');
      return false;
    }

    let targetDoc = null;
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('id-ID')}`;

    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === docId) {
          targetDoc = doc;
          return {
            ...doc,
            status: 'DITOLAK',
            rejectionReason: rejectionReason || 'Tidak memenuhi kriteria kelengkapan ISO.',
            rejectedBy: currentUser.name,
            rejectedDate: timestamp,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: now.toISOString().slice(0, 10),
                author: currentUser.name,
                note: `Ditolak oleh ${currentUser.name}: ${rejectionReason}`
              }
            ]
          };
        }
        return doc;
      });
    });

    if (targetDoc) {
      addAuditLog('REJECT_DOCUMENT', targetDoc.docNumber, targetDoc.title, `Ditolak oleh ${currentUser.name}: ${rejectionReason}`);
      addNotification('Dokumen Ditolak', `${targetDoc.docNumber} ditolak oleh verifikator: "${rejectionReason}"`, 'danger', targetDoc.id);

      if (isSupabaseConfigured && supabase) {
        supabase.from('documents').update({
          status: 'DITOLAK',
          rejection_reason: targetDoc.rejectionReason || rejectionReason,
          rejected_by: currentUser.name,
          rejected_date: timestamp,
          updated_at: new Date().toISOString()
        }).eq('id', docId).then(({ error }) => {
          if (error) console.warn('Supabase reject warning:', error);
        });
      }

      showToast(`Dokumen ${targetDoc.docNumber} DITOLAK.`, 'danger');
    }
  };

  /**
   * Buat Pengajuan Revisi Baru dari Dokumen Aktif
   */
  const createDocumentRevision = (originalDoc, revisionData) => {
    const nextRev = getNextRevisionCode(originalDoc.revision);
    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = now.toLocaleTimeString('id-ID');

    const newDocNumber = formatDocumentNumber({
      companyCode: systemSettings.companyCode,
      docType: originalDoc.type,
      department: originalDoc.department,
      seqNumber: originalDoc.seqNumber,
      revision: nextRev
    });

    const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
    const isDirectPublish = Boolean(isDcoOrAdmin && revisionData.directPublish);

    let docStatus = 'VERIFIKASI';
    let verifiedBy = null;
    let verifiedDate = null;
    let verificationNotes = null;
    let effectiveDate = revisionData.effectiveDate || null;
    let approvedBy = null;
    let approvedDate = null;
    let approvalNotes = null;

    if (revisionData.isDraft) {
      docStatus = 'DRAFT';
    } else if (isDirectPublish) {
      docStatus = 'AKTIF';
      verifiedBy = currentUser?.name || 'Document Control';
      verifiedDate = createdDate;
      verificationNotes = 'Disahkan langsung melalui registrasi revisi bertanda tangan fisik / arsip master.';
      effectiveDate = revisionData.effectiveDate || createdDate;
      approvedBy = revisionData.targetApprover || currentUser?.name || 'Authorized Approver';
      approvedDate = createdDate;
      approvalNotes = 'Diterbitkan langsung sebagai Dokumen Aktif bertanda tangan basah.';
    } else if (isDcoOrAdmin) {
      docStatus = 'APPROVAL';
      verifiedBy = currentUser?.name || 'Document Control';
      verifiedDate = createdDate;
      verificationNotes = 'Format revisi diverifikasi langsung oleh Document Control saat pendaftaran.';
    }

    const newRevisedDoc = {
      id: `doc-${Date.now()}`,
      docNumber: newDocNumber,
      title: revisionData.title || originalDoc.title,
      type: originalDoc.type,
      typeName: originalDoc.typeName,
      department: originalDoc.department,
      creator: currentUser.name,
      creatorNik: currentUser.nik,
      creatorPosition: currentUser.position,
      seqNumber: originalDoc.seqNumber,
      revision: nextRev,
      status: docStatus,
      createdDate,
      createdTime,
      effectiveDate,
      verifiedBy,
      verifiedDate,
      verificationNotes,
      approvedBy,
      approvedDate,
      approvalNotes,
      verifierTeam: revisionData.verifierTeam || originalDoc.verifierTeam || 'Document Control Team',
      targetApprover: revisionData.targetApprover || originalDoc.targetApprover || null,
      approverNik: revisionData.approverNik || originalDoc.approverNik || null,
      approverPosition: revisionData.approverPosition || originalDoc.approverPosition || null,
      notes: revisionData.changeReason || `Pengajuan Revisi ${nextRev} dari dokumen ${originalDoc.docNumber}`,
      changeReason: revisionData.changeReason,
      changeDescription: revisionData.changeDescription,
      supersedesDocNumber: originalDoc.docNumber,
      content: revisionData.content || originalDoc.content,
      fileName: revisionData.fileName || `${newDocNumber}.pdf`,
      fileSize: revisionData.fileSize || '680 KB',
      fileType: revisionData.fileType || null,
      fileUrl: revisionData.fileUrl || null,
      revisionHistory: [
        ...(originalDoc.revisionHistory || []),
        {
          revision: nextRev,
          date: createdDate,
          author: currentUser.name,
          note: isDirectPublish
            ? `Penerbitan langsung revisi aktif bertanda tangan fisik oleh ${currentUser.name}`
            : isDcoOrAdmin
            ? `Pengajuan Revisi ${nextRev} oleh DCO (format lolos otomatis). Menunggu pengesahan ${revisionData.targetApprover || 'Approver'}`
            : `Pengajuan Revisi ${nextRev}: ${revisionData.changeReason || 'Penyempurnaan klausul'}`
        }
      ]
    };

    setDocuments(prev => {
      let updated = [newRevisedDoc, ...prev];
      if (isDirectPublish) {
        // Auto-obsolete older active revision of the same doc
        updated = updated.map(doc => {
          if (
            doc.id === originalDoc.id || (
              doc.type === newRevisedDoc.type &&
              doc.department === newRevisedDoc.department &&
              doc.seqNumber === newRevisedDoc.seqNumber &&
              doc.id !== newRevisedDoc.id &&
              doc.status === 'AKTIF'
            )
          ) {
            return {
              ...doc,
              status: 'OBSOLETE',
              supersededBy: newDocNumber,
              obsoleteDate: createdDate,
              notes: `${doc.notes ? doc.notes + ' ' : ''}[Otomatis Obsolete - digantikan oleh ${newDocNumber}]`
            };
          }
          return doc;
        });
      }
      return updated;
    });

    if (isDirectPublish) {
      addAuditLog('DIRECT_PUBLISH_REVISION', newDocNumber, newRevisedDoc.title, `Revisi ${nextRev} diterbitkan langsung aktif oleh ${currentUser.name} (Menggantikan ${originalDoc.docNumber})`);
      addNotification('Penerbitan Revisi Aktif', `${newDocNumber} telah diterbitkan aktif langsung ke Master Dokumen.`, 'success', newRevisedDoc.id);
      showToast(`Revisi ${newDocNumber} berhasil diterbitkan langsung sebagai Dokumen Aktif!`, 'success');
    } else if (isDcoOrAdmin && !revisionData.isDraft) {
      addAuditLog('CREATE_REVISION', newDocNumber, newRevisedDoc.title, `Pengajuan Revisi ${nextRev} oleh DCO. Menunggu pengesahan ${newRevisedDoc.targetApprover || 'Approver'}`);
      addNotification('Pengajuan Pengesahan Revisi', `Revisi ${newDocNumber} siap disahkan oleh ${newRevisedDoc.targetApprover || 'Approver'}.`, 'warning', newRevisedDoc.id);
      showToast(`Pengajuan revisi ${newDocNumber} berhasil! Format lolos otomatis dan langsung diteruskan ke ${newRevisedDoc.targetApprover || 'Approver'}.`, 'success');
    } else {
      addAuditLog('CREATE_REVISION', newDocNumber, newRevisedDoc.title, `Pengajuan Revisi ${nextRev} (Menggantikan ${originalDoc.docNumber})`);
      addNotification('Pengajuan Revisi Dokumen', `Revisi baru ${newDocNumber} diajukan untuk verifikasi.`, 'warning', newRevisedDoc.id);
      showToast(`Pengajuan revisi ${newDocNumber} berhasil dibuat!`, 'success');
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').upsert([toSnakeCaseDoc(newRevisedDoc)]).then(({ error }) => {
        if (error) console.warn('Supabase revision upsert warning:', error);
      });
    }

    return newRevisedDoc;
  };

  /**
   * Batalkan Dokumen (Mark Obsolete / Void)
   * Wewenang eksklusif System Administrator untuk menarik/membatalkan dokumen aktif atau pengajuan.
   */
  const cancelDocument = (docId, cancelReason = '') => {
    if (!isAdmin) {
      showToast('Akses ditolak! Hanya System Administrator yang berhak membatalkan dokumen.', 'danger');
      return false;
    }

    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc) return false;

    const today = new Date().toISOString().slice(0, 10);
    const cancellationDetail = `Dibatalkan oleh Administrator (${currentUser ? currentUser.name : 'Admin'}): ${cancelReason || 'Penarikan/Pembatalan dokumen resmi'}`;

    const updatedDocs = documents.map(d => {
      if (d.id === docId) {
        const revHistory = Array.isArray(d.revisionHistory) ? [...d.revisionHistory] : [];
        revHistory.push({
          revision: d.revision || '00',
          date: today,
          author: currentUser ? currentUser.name : 'System Administrator',
          note: `[PEMBATALAN DOKUMEN] ${cancelReason || 'Dibatalkan oleh Administrator'}`
        });

        return {
          ...d,
          status: 'OBSOLETE',
          obsoleteDate: today,
          notes: d.notes ? `${d.notes}\n[${cancellationDetail}]` : `[${cancellationDetail}]`,
          revisionHistory: revHistory
        };
      }
      return d;
    });

    setDocuments(updatedDocs);
    addAuditLog('CANCEL_DOCUMENT', targetDoc.docNumber, targetDoc.title, cancellationDetail);

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').update({
        status: 'OBSOLETE',
        obsolete_date: today,
        notes: targetDoc.notes ? `${targetDoc.notes}\n[${cancellationDetail}]` : `[${cancellationDetail}]`
      }).eq('id', docId).then(({ error }) => {
        if (error) console.warn('Supabase cancelDocument warning:', error);
      });
    }

    showToast(`Dokumen ${targetDoc.docNumber} berhasil dibatalkan dan berstatus OBSOLETE!`, 'warning');
    return true;
  };

  /**
   * Konfirmasi Monitoring & Review Berkala (Langkah 8 & 9 ISO 9001:2015 Clause 7.5)
   * Dokumen dikonfirmasi "Tetap Berlaku" tanpa revisi operasional, memperpanjang siklus review berkala.
   */
  const confirmDocumentPeriodicReview = (docId, reviewNotes = '') => {
    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;

    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === docId) {
          targetDoc = doc;
          return {
            ...doc,
            lastReviewedDate: today,
            lastReviewedBy: currentUser?.name || 'Document Control Officer',
            reviewNotes: reviewNotes || 'Peninjauan berkala ISO 9001:2015 - status dikonfirmasi Tetap Berlaku.'
          };
        }
        return doc;
      });
    });

    if (targetDoc) {
      addAuditLog(
        'PERIODIC_REVIEW_CONFIRMED',
        targetDoc.docNumber,
        targetDoc.title,
        `Peninjauan berkala oleh ${currentUser?.name || 'User'}: Dikonfirmasi Tetap Berlaku (${reviewNotes || 'Sesuai regulasi & proses terkini'}).`
      );
      addNotification(
        'Peninjauan Berkala Selesai',
        `Dokumen ${targetDoc.docNumber} dikonfirmasi Tetap Berlaku oleh ${currentUser?.name || 'DCO'}.`,
        'success',
        targetDoc.id
      );

      if (isSupabaseConfigured && supabase) {
        supabase.from('documents').update({
          notes: targetDoc.notes ? `${targetDoc.notes}\n[Review Berkala ${today} oleh ${currentUser?.name}: Tetap Berlaku]` : `[Review Berkala ${today} oleh ${currentUser?.name}: Tetap Berlaku]`,
          updated_at: new Date().toISOString()
        }).eq('id', docId).then(({ error }) => {
          if (error) console.warn('Supabase confirm review warning:', error);
        });
      }

      showToast(`Dokumen ${targetDoc.docNumber} berhasil ditinjau berkala dan dikonfirmasi Tetap Berlaku!`, 'success');
      return true;
    }
    return false;
  };

  /**
   * Hapus Dokumen:
   * - System Administrator dapat menghapus draft, dokumen ditolak, obsolete, atau kesalahan entri.
   * - Pembuat dokumen (Creator) dapat menghapus draf miliknya atau pengajuan miliknya yang DITOLAK.
   */
  const deleteDocument = (docId) => {
    const docToDelete = documents.find(d => d.id === docId);
    if (!docToDelete) return false;

    const isCreator = currentUser && (
      currentUser.name === docToDelete.creator ||
      currentUser.nik === docToDelete.creatorNik
    );

    // Permission check
    if (!isAdmin && !isCreator) {
      showToast('Akses ditolak! Anda tidak memiliki wewenang untuk menghapus dokumen ini.', 'danger');
      return false;
    }

    // Non-admin can only delete DRAFT or DITOLAK
    if (!isAdmin && docToDelete.status !== 'DRAFT' && docToDelete.status !== 'DITOLAK') {
      showToast('Dokumen yang sudah diverifikasi / disetujui tidak dapat langsung dihapus (ISO Rule #7). Gunakan opsi Batalkan Dokumen untuk menjadikannya Obsolete!', 'danger');
      return false;
    }

    setDocuments(prev => prev.filter(d => d.id !== docId));
    addAuditLog(
      'DELETE_DOCUMENT',
      docToDelete.docNumber,
      docToDelete.title,
      `Dihapus oleh ${currentUser ? currentUser.name : 'User'} (${docToDelete.status})`
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').delete().eq('id', docId).then(({ error }) => {
        if (error) console.warn('Supabase document delete warning:', error);
      });
    }

    showToast(`Dokumen ${docToDelete.docNumber} (${docToDelete.status}) berhasil dihapus.`, 'info');
    return true;
  };

  // 4. Master Data CRUD Handlers with Supabase Sync
  const addDepartment = (dept) => {
    const newDept = { ...dept, id: `dept-${Date.now()}` };
    setDepartments(prev => [...prev, newDept]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('departments').upsert([{
        id: newDept.id,
        code: newDept.code,
        name: newDept.name,
        head: newDept.head || null
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addDepartment warning:', error);
      });
    }

    showToast(`Departemen ${newDept.code} berhasil ditambahkan!`, 'success');
  };

  const updateDepartment = (id, updatedData) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updatedData } : d));

    if (isSupabaseConfigured && supabase) {
      supabase.from('departments').update({
        code: updatedData.code,
        name: updatedData.name,
        head: updatedData.head || null
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase updateDepartment warning:', error);
      });
    }

    showToast('Departemen berhasil diperbarui!', 'success');
  };

  const deleteDepartment = (id) => {
    setDepartments(prev => prev.filter(d => d.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('departments').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteDepartment warning:', error);
      });
    }

    showToast('Departemen berhasil dihapus.', 'info');
  };

  const addDocumentType = (type) => {
    const newType = { ...type, id: `type-${Date.now()}` };
    setDocumentTypes(prev => [...prev, newType]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('document_types').upsert([{
        id: newType.id,
        code: newType.code,
        name: newType.name,
        level: newType.level || 2,
        prefix: newType.prefix || newType.code,
        description: newType.description || null
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addDocumentType warning:', error);
      });
    }

    showToast(`Jenis Dokumen ${newType.code} berhasil ditambahkan!`, 'success');
  };

  const updateDocumentType = (id, updatedData) => {
    setDocumentTypes(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

    if (isSupabaseConfigured && supabase) {
      supabase.from('document_types').update({
        code: updatedData.code,
        name: updatedData.name,
        level: updatedData.level || 2,
        prefix: updatedData.prefix || updatedData.code,
        description: updatedData.description || null
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase updateDocumentType warning:', error);
      });
    }

    showToast('Jenis Dokumen berhasil diperbarui!', 'success');
  };

  const deleteDocumentType = (id) => {
    setDocumentTypes(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('document_types').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteDocumentType warning:', error);
      });
    }

    showToast('Jenis Dokumen berhasil dihapus.', 'info');
  };

  const addEmployee = (emp) => {
    const newEmp = { ...emp, id: `emp-${Date.now()}` };
    setEmployees(prev => [...prev, newEmp]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').upsert([{
        id: newEmp.id,
        nik: newEmp.nik,
        name: newEmp.name,
        department: newEmp.department,
        position: newEmp.position,
        email: newEmp.email || null,
        role: newEmp.role || 'staff',
        status: newEmp.status || 'Aktif'
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addEmployee warning:', error);
      });
    }

    showToast(`Karyawan ${newEmp.name} berhasil ditambahkan!`, 'success');
  };

  const updateEmployee = (id, updatedData) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedData } : e));

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').update({
        nik: updatedData.nik,
        name: updatedData.name,
        department: updatedData.department,
        position: updatedData.position,
        email: updatedData.email || null,
        role: updatedData.role || 'staff',
        status: updatedData.status || 'Aktif'
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase updateEmployee warning:', error);
      });
    }

    showToast('Data Karyawan berhasil diperbarui!', 'success');
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteEmployee warning:', error);
      });
    }

    showToast('Data Karyawan berhasil dihapus.', 'info');
  };

  const addVerifierTeam = (team) => {
    const newTeam = { ...team, id: `team-${Date.now()}` };
    setVerifierTeams(prev => [...prev, newTeam]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('verifier_teams').upsert([{
        id: newTeam.id,
        name: newTeam.name,
        leader: newTeam.leader,
        members: Array.isArray(newTeam.members) ? newTeam.members : [],
        description: newTeam.description || null
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addVerifierTeam warning:', error);
      });
    }

    showToast(`Tim Verifikator ${newTeam.name} berhasil ditambahkan!`, 'success');
  };

  const updateVerifierTeam = (id, updatedData) => {
    setVerifierTeams(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

    if (isSupabaseConfigured && supabase) {
      supabase.from('verifier_teams').update({
        name: updatedData.name,
        leader: updatedData.leader,
        members: Array.isArray(updatedData.members) ? updatedData.members : [],
        description: updatedData.description || null
      }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase updateVerifierTeam warning:', error);
      });
    }

    showToast('Tim Verifikator berhasil diperbarui!', 'success');
  };

  const deleteVerifierTeam = (id) => {
    setVerifierTeams(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('verifier_teams').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteVerifierTeam warning:', error);
      });
    }

    showToast('Tim Verifikator berhasil dihapus.', 'info');
  };

  // 5. Database & Settings Handlers
  const resetDemoData = () => {
    setDocuments(initialDocuments);
    setDepartments(initialDepartments);
    setDocumentTypes(initialDocumentTypes);
    setEmployees(initialEmployees);
    setVerifierTeams(initialVerifierTeams);
    setAuditLogs(initialAuditLogs);
    setSystemSettings(initialSystemSettings);
    setCurrentUser(initialEmployees[0]);

    localStorage.removeItem('dji_dms_documents');
    localStorage.removeItem('dji_dms_departments');
    localStorage.removeItem('dji_dms_doctypes');
    localStorage.removeItem('dji_dms_employees');
    localStorage.removeItem('dji_dms_verifierteams');
    localStorage.removeItem('dji_dms_auditlogs');
    localStorage.removeItem('dji_dms_settings');

    showToast('Semua data berhasil direset ke standar demo default!', 'info');
  };

  const exportDatabaseJSON = () => {
    const dbPayload = {
      exportedAt: new Date().toISOString(),
      systemSettings,
      documents,
      departments,
      documentTypes,
      employees,
      verifierTeams,
      auditLogs
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DJI_DMS_Database_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup database JSON berhasil diunduh!', 'success');
  };

  const importDatabaseJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.documents) setDocuments(data.documents);
      if (data.departments) setDepartments(data.departments);
      if (data.documentTypes) setDocumentTypes(data.documentTypes);
      if (data.employees) setEmployees(data.employees);
      if (data.verifierTeams) setVerifierTeams(data.verifierTeams);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.systemSettings) setSystemSettings(data.systemSettings);
      
      showToast('Database berhasil dipulihkan dari file backup JSON!', 'success');
      return true;
    } catch (e) {
      showToast('Format file JSON tidak valid!', 'danger');
      return false;
    }
  };

  const attachFileToDocument = async (docId, file) => {
    showToast(`Mengunggah berkas ${file.name} ke cloud storage...`, 'info');
    const targetDoc = documents.find(d => d.id === docId);
    const docNumber = targetDoc ? targetDoc.docNumber : 'DOC';
    
    const fileInfo = await uploadDocumentFile(file, docNumber);

    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          fileUrl: fileInfo.fileUrl
        };
      }
      return d;
    }));

    setViewingDocument(prev => prev && prev.id === docId ? {
      ...prev,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      fileUrl: fileInfo.fileUrl
    } : prev);

    if (isSupabaseConfigured && supabase) {
      supabase.from('documents').update({
        file_name: fileInfo.fileName,
        file_size: fileInfo.fileSize,
        file_type: fileInfo.fileType,
        file_url: fileInfo.fileUrl,
        updated_at: new Date().toISOString()
      }).eq('id', docId).then(({ error }) => {
        if (error) console.warn('Supabase document file update warning:', error);
      });
    }

    showToast(`Berkas ${file.name} berhasil disimpan ke cloud storage dan dapat diakses publik!`, 'success');
  };

  const markNotificationAsRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <DocumentControlContext.Provider
      value={{
        documents,
        departments,
        documentTypes,
        employees,
        verifierTeams,
        auditLogs,
        systemSettings,
        setSystemSettings,
        currentUser,
        setCurrentUser,
        isAuthenticated: Boolean(currentUser),
        login,
        logout,
        role,
        isAdmin,
        isReviewer,
        isApprover,
        isDocControl,
        isStaff,
        canSubmitDocument,
        canReviewContent,
        canVerifyFormat,
        canApproveDocument,
        canFinalizeDocument,
        canDeleteDocument,
        canCancelDocument,
        canManageMasterData,
        canManageSettings,
        canAccessReports,
        canUserViewPendingDoc,
        cancelDocument,
        confirmDocumentPeriodicReview,
        reviewDocumentContent,
        verifyDocumentFormat,
        approveDocument,
        rejectDocument,
        activeMenu,
        setActiveMenu,
        breadcrumbs,
        setBreadcrumbs,
        searchQuery,
        setSearchQuery,
        viewingDocument,
        setViewingDocument,
        selectedDocForRevision,
        setSelectedDocForRevision,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        toast,
        showToast,
        saveDraft,
        submitForVerification,
        createDocumentRevision,
        deleteDocument,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addDocumentType,
        updateDocumentType,
        deleteDocumentType,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addVerifierTeam,
        updateVerifierTeam,
        deleteVerifierTeam,
        attachFileToDocument,
        isCloudConnected: isSupabaseConfigured,
        isLoadingCloud,
        resetDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </DocumentControlContext.Provider>
  );
}

export function useDocumentControl() {
  const context = useContext(DocumentControlContext);
  if (!context) {
    throw new Error('useDocumentControl must be used within a DocumentControlProvider');
  }
  return context;
}
