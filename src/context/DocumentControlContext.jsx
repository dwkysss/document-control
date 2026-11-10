import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  initialCompanies,
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
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('dji_dms_companies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialCompanies;
  });

  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');

  // Master Raw Documents (Holding all records in cache / database)
  const [rawDocuments, setRawDocuments] = useState(() => {
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

  // Master Raw Employees (Holding all personnel across all companies)
  const [rawEmployees, setRawEmployees] = useState(() => {
    const saved = localStorage.getItem('dji_dms_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const dummyNiks = [
          '123456', '123457', '123458', '123459', '123460', '123461', '123462', 'DJI000001',
          'DJI042211', 'DJI052212', 'DJI062213'
        ];
        let cleaned = parsed
          .filter(e => !dummyNiks.includes(String(e.nip || e.nik || '').trim()))
          .map(e => {
            const empIdVal = e.nip || e.nik || '';
            const forcedComp = empIdVal.startsWith('UMI')
              ? 'UMI'
              : empIdVal.startsWith('IMK')
              ? 'IMK'
              : empIdVal === '123463'
              ? 'ALL'
              : (e.companyCode || 'DJI');
            const forcedCompName = forcedComp === 'UMI'
              ? 'PT Ultimo Moda Indotex'
              : forcedComp === 'IMK'
              ? 'PT IMK'
              : forcedComp === 'ALL'
              ? 'Holding (Multi-Company)'
              : 'PT Dentelle Jaya Infinitex';
            return {
              ...e,
              nip: e.nip || e.nik,
              nik: e.nik || e.nip,
              companyCode: forcedComp,
              companyName: forcedCompName
            };
          });

        initialEmployees.forEach(initEmp => {
          const existingIdx = cleaned.findIndex(e => String(e?.nip || e?.nik || '').trim() === String(initEmp.nip || initEmp.nik).trim());
          if (existingIdx >= 0) {
            cleaned[existingIdx] = {
              ...cleaned[existingIdx],
              nip: initEmp.nip || cleaned[existingIdx].nip || initEmp.nik,
              nik: initEmp.nik || cleaned[existingIdx].nik || initEmp.nip,
              companyCode: initEmp.companyCode,
              companyName: initEmp.companyName,
              role: cleaned[existingIdx].role || initEmp.role,
              department: cleaned[existingIdx].department || initEmp.department,
              position: cleaned[existingIdx].position || initEmp.position
            };
          } else {
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

  // Helper untuk merekonstruksi jejak audit resmi dari data dokumen
  const generateAuditLogsFromDocuments = (docsList = []) => {
    const logs = [];
    (docsList || []).forEach((doc, idx) => {
      const creatorName = doc.creator || 'Staff Pemohon';
      const creatorNip = doc.creatorNip || doc.creatorNik || 'DJI032207';
      const createdDate = doc.createdDate || '2026-09-20';
      const docNum = doc.docNumber || '-';
      const title = doc.title || '-';
      const docComp = doc.companyCode || (docNum.includes('-') ? docNum.split('-')[0] : (creatorNip.startsWith('UMI') ? 'UMI' : creatorNip.startsWith('IMK') ? 'IMK' : 'DJI'));

      // 1. Log Registrasi / Usulan Awal
      logs.push({
        id: `log-reg-${doc.id || idx}-1`,
        timestamp: `${createdDate} 08:30:00`,
        user: creatorName,
        nip: creatorNip,
        nik: creatorNip,
        companyCode: docComp,
        action: doc.status === 'DRAFT' ? 'SAVE_DRAFT' : 'SUBMIT_VERIFICATION',
        docNumber: docNum,
        docTitle: title,
        details: doc.status === 'DRAFT'
          ? `Dokumen baru disimpan sebagai DRAFT oleh ${creatorName}.`
          : `Pengajuan dokumen baru ${doc.type || 'SOP'} (${doc.department || 'GEN'}) oleh ${creatorName}. Menunggu verifikasi format DCO.`
      });

      // 2. Log Approval jika AKTIF
      if (doc.status === 'AKTIF') {
        const approverName = doc.approvedBy || doc.targetApprover || doc.approverName || 'BABAN RACHMAT SUBAGJA';
        const effectiveDate = doc.effectiveDate || createdDate;
        const appNip = approverName.includes('BABAN') ? 'DJI012548' : (approverName.includes('DENI') ? 'DJI092115' : 'DJI012548');
        logs.push({
          id: `log-app-${doc.id || idx}-2`,
          timestamp: `${effectiveDate} 14:15:00`,
          user: approverName,
          nip: appNip,
          nik: appNip,
          companyCode: docComp,
          action: 'APPROVE_DOCUMENT',
          docNumber: docNum,
          docTitle: title,
          details: `Pengesahan resmi ISO 9001 oleh ${approverName}. Dokumen berstatus AKTIF (Controlled Copy).`
        });
      } else if (doc.status === 'DITOLAK') {
        logs.push({
          id: `log-rej-${doc.id || idx}-3`,
          timestamp: `${createdDate} 16:45:00`,
          user: 'BABAN RACHMAT SUBAGJA',
          nip: 'DJI012548',
          nik: 'DJI012548',
          companyCode: docComp,
          action: 'REJECT_DOCUMENT',
          docNumber: docNum,
          docTitle: title,
          details: doc.rejectionReason || 'Naskah dikembalikan untuk penyesuaian klausul mutu dan format lampiran.'
        });
      } else if (doc.status === 'OBSOLETE') {
        logs.push({
          id: `log-obs-${doc.id || idx}-4`,
          timestamp: `${createdDate} 11:20:00`,
          user: 'SYAHLA NOVIYANA',
          nip: 'DJI022550',
          nik: 'DJI022550',
          companyCode: docComp,
          action: 'CANCEL_DOCUMENT',
          docNumber: docNum,
          docTitle: title,
          details: 'Dokumen kadaluarsa resmi ditarik dari peredaran dan diubah menjadi OBSOLETE.'
        });
      }
    });

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  };

  const [rawAuditLogs, setRawAuditLogs] = useState(() => {
    const saved = localStorage.getItem('dji_dms_auditlogs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Jika auditLogs masih kosong tapi documents sudah ada di localStorage, auto-generate!
    try {
      const savedDocs = localStorage.getItem('dji_dms_documents');
      if (savedDocs) {
        const parsedDocs = JSON.parse(savedDocs);
        if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
          const generated = generateAuditLogsFromDocuments(parsedDocs);
          localStorage.setItem('dji_dms_auditlogs', JSON.stringify(generated));
          return generated;
        }
      }
    } catch (e) {}
    return initialAuditLogs;
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.companyCode) {
          const empId = parsed.nip || parsed.nik;
          parsed.companyCode = empId?.startsWith('UMI') ? 'UMI' : empId?.startsWith('IMK') ? 'IMK' : (empId === '123463' ? 'ALL' : 'DJI');
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved session:', e);
    }
    return null; // Start logged out so user logs in with NIP
  });

  // Ensure all baseline personnel across companies (IMK, UMI, DJI) are merged into rawEmployees & persisted
  useEffect(() => {
    setRawEmployees(prev => {
      let changed = false;
      const updated = (prev || []).map(e => {
        const empId = e.nip || e.nik;
        const canonicalComp = empId?.startsWith('UMI')
          ? 'UMI'
          : empId?.startsWith('IMK')
          ? 'IMK'
          : empId === '123463'
          ? 'ALL'
          : (e.companyCode || 'DJI');
        if (e.companyCode !== canonicalComp) {
          changed = true;
          return {
            ...e,
            companyCode: canonicalComp,
            companyName: canonicalComp === 'UMI' ? 'PT Ultimo Moda Indotex' : canonicalComp === 'IMK' ? 'PT IMK' : canonicalComp === 'ALL' ? 'Holding (Multi-Company)' : 'PT Dentelle Jaya Infinitex'
          };
        }
        return e;
      });

      initialEmployees.forEach(initEmp => {
        const found = updated.find(e => String(e?.nip || e?.nik || '').trim() === String(initEmp.nip || initEmp.nik).trim());
        if (!found) {
          updated.push(initEmp);
          changed = true;
        } else if (found.companyCode !== initEmp.companyCode) {
          found.companyCode = initEmp.companyCode;
          found.companyName = initEmp.companyName;
          changed = true;
        }
      });

      if (changed) {
        try {
          localStorage.setItem('dji_dms_employees', JSON.stringify(updated));
        } catch (e) {}
        return [...updated];
      }
      return prev;
    });
  }, []);

  // Strict Tenant Isolation: Whenever currentUser changes, enforce company scope
  useEffect(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      setSelectedCompanyFilter(currentUser.companyCode);
    }
  }, [currentUser?.companyCode]);

  // Scoped documents: Users of company A can NEVER see company B documents
  const documents = useMemo(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      return rawDocuments.filter(d => {
        const docCompany = (d.companyCode || d.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        return docCompany === userCompany;
      });
    }

    if (selectedCompanyFilter !== 'ALL') {
      const targetCompany = selectedCompanyFilter.toUpperCase();
      return rawDocuments.filter(d => {
        const docCompany = (d.companyCode || d.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        return docCompany === targetCompany;
      });
    }

    return rawDocuments;
  }, [rawDocuments, currentUser?.companyCode, selectedCompanyFilter]);

  // Scoped employees: Users of company A only see company A employees (+ Holding Admin ALL)
  const employees = useMemo(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      return rawEmployees.filter(e => {
        const empCompany = (e.companyCode || 'DJI').toUpperCase();
        return empCompany === userCompany || empCompany === 'ALL';
      });
    }

    if (selectedCompanyFilter !== 'ALL') {
      const targetCompany = selectedCompanyFilter.toUpperCase();
      return rawEmployees.filter(e => {
        const empCompany = (e.companyCode || 'DJI').toUpperCase();
        return empCompany === targetCompany || empCompany === 'ALL';
      });
    }

    return rawEmployees;
  }, [rawEmployees, currentUser?.companyCode, selectedCompanyFilter]);

  // State setters that update raw state and persist to localStorage
  const setDocuments = (valOrFn) => {
    setRawDocuments(prev => {
      const updated = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      try {
        localStorage.setItem('dji_dms_documents', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const setEmployees = (valOrFn) => {
    setRawEmployees(prev => {
      const updated = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      try {
        localStorage.setItem('dji_dms_employees', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Scoped audit logs: Users of company A only see audit logs of company A (+ Holding Admin ALL)
  const auditLogs = useMemo(() => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      return rawAuditLogs.filter(log => {
        const logNip = log.nip || log.nik;
        const logComp = (log.companyCode || (log.docNumber?.split('-')[0]) || (logNip?.startsWith('UMI') ? 'UMI' : logNip?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
        return logComp === userCompany;
      });
    }

    if (selectedCompanyFilter !== 'ALL') {
      const targetCompany = selectedCompanyFilter.toUpperCase();
      return rawAuditLogs.filter(log => {
        const logNip = log.nip || log.nik;
        const logComp = (log.companyCode || (log.docNumber?.split('-')[0]) || (logNip?.startsWith('UMI') ? 'UMI' : logNip?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
        return logComp === targetCompany;
      });
    }

    return rawAuditLogs;
  }, [rawAuditLogs, currentUser?.companyCode, selectedCompanyFilter]);

  const setAuditLogs = (valOrFn) => {
    setRawAuditLogs(prev => {
      const updated = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      try {
        localStorage.setItem('dji_dms_auditlogs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Login handler by Email or NIP
  const login = (identifier, password = '') => {
    const cleanId = String(identifier || '').trim().toLowerCase();
    if (!cleanId) {
      showToast('Harap masukkan Email atau NIP pegawai!', 'danger');
      return { success: false, message: 'Identitas akun wajib diisi.' };
    }

    const foundEmp = rawEmployees.find(
      e => String(e.nip || e.nik || '').trim().toLowerCase() === cleanId ||
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
    if (foundEmp.companyCode && foundEmp.companyCode !== 'ALL') {
      setSelectedCompanyFilter(foundEmp.companyCode);
    }
    try {
      localStorage.setItem('dji_auth_user', JSON.stringify(foundEmp));
    } catch (e) {
      console.warn('Error saving session:', e);
    }

    addAuditLog('USER_LOGIN', '-', '-', `Pengguna ${foundEmp.name} (${foundEmp.position} - ${foundEmp.role}) berhasil masuk ke sistem.`, foundEmp);
    showToast(`Selamat datang, ${foundEmp.name}! Berhasil masuk sebagai ${foundEmp.position} (${foundEmp.companyCode || 'DJI'}).`, 'success');
    return { success: true, user: foundEmp };
  };

  // Logout handler
  const logout = () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', '-', '-', `Pengguna ${currentUser.name} keluar dari sistem.`);
    }
    setCurrentUser(null);
    setSelectedCompanyFilter('ALL');
    try {
      localStorage.removeItem('dji_auth_user');
    } catch (e) {
      console.warn('Error clearing session:', e);
    }
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  // RBAC Permission Flags (ISO 9001:2015 6 Collaborative Roles)
  const role = currentUser?.role || 'staff';
  const isViewer = role === 'viewer';
  const isStaff = role === 'staff';
  const isApprover = role === 'approver';
  // Role MR (Approver) memiliki hak akses setara dengan System Administrator
  const isAdmin = role === 'admin' || role === 'approver';
  const isReviewer = role === 'reviewer' || role === 'admin' || role === 'approver';
  const isDocControl = role === 'doc_control' || role === 'admin' || role === 'approver';

  const isDeptHead = (departments || []).some(d =>
    d.head && !d.head.includes('---') &&
    currentUser?.name &&
    (d.head.toLowerCase() === currentUser.name.toLowerCase() ||
     currentUser.name.toLowerCase().includes(d.head.toLowerCase()))
  );

  // Functional permission flags based on ISO 9001:2015 Segregation of Duties
  const canRegisterDocument = !isViewer && Boolean(currentUser);
  const canSubmitDocument = canRegisterDocument;
  const canManageDrafts = !isViewer && Boolean(currentUser);
  const canViewPendingVerification = !isViewer && Boolean(currentUser);
  const canRequestRevision = !isViewer && Boolean(currentUser);
  const canReviewContent = (isReviewer || isDeptHead) && !isViewer;
  const canVerifyFormat = isDocControl && !isViewer;
  const canApproveDocument = (isApprover || isAdmin) && !isViewer;
  const canFinalizeDocument = (isApprover || isAdmin) && !isViewer;
  const canDeleteDocument = isAdmin && !isViewer;
  const canCancelDocument = isAdmin && !isViewer;
  const canManageMasterData = isAdmin && !isViewer;
  const canManageSettings = isAdmin && !isViewer;
  const canAccessReports = (isReviewer || isDocControl || isApprover || isAdmin) && !isViewer;
  const canViewObsolete = (isReviewer || isDocControl || isApprover || isAdmin) && !isViewer;
  const canViewAllDocuments = (isReviewer || isDocControl || isApprover || isAdmin) && !isViewer;

  // Scope akses berkas Menunggu Verifikasi berdasarkan Departemen & Role (ISO 9001 Segregation)
  const canUserViewPendingDoc = (doc) => {
    if (!doc) return false;
    if (!currentUser) return false;

    // Strict multi-tenant isolation: Users cannot view pending documents of other companies
    if (currentUser.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) return false;
    }

    const userRole = currentUser.role || 'staff';
    // 0. Viewer tidak memiliki akses ke antrean verifikasi
    if (userRole === 'viewer') return false;

    const userDept = (currentUser.department || '').toUpperCase().trim();
    const docDept = (doc.department || '').toUpperCase().trim();
    const userName = (currentUser.name || '').toUpperCase().trim();
    const userNip = (currentUser.nip || currentUser.nik || '').toUpperCase().trim();

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
      const reviewerIdentifier = (doc.reviewerNip || doc.reviewerNik || '').toUpperCase().trim();
      const isDesignatedReviewer = (reviewerIdentifier && reviewerIdentifier === userNip) ||
                                   (doc.targetReviewer && doc.targetReviewer.toUpperCase().trim() === userName) ||
                                   (doc.targetReviewer && doc.targetReviewer.toUpperCase().includes(userName)) ||
                                   (userName && doc.targetReviewer && userName.includes(doc.targetReviewer.toUpperCase()));
      if (isDesignatedReviewer) return true;

      // Jika dari departemen lain, sembunyikan!
      return false;
    }

    // 3. Staff: Hanya melihat dokumen yang diajukan sendiri
    const docCreatorNip = (doc.creatorNip || doc.creatorNik || '').toUpperCase().trim();
    const isOwner = (docCreatorNip && docCreatorNip === userNip) ||
                    (doc.creator && doc.creator.toUpperCase().trim() === userName);
    return Boolean(isOwner);
  };

  // Scope akses berkas Draft Dokumen berdasarkan Kepemilikan & Role (ISO 9001:2015 Clause 7.5 Segregation)
  const canUserViewDraftDoc = (doc) => {
    if (!doc) return false;
    if (!currentUser) return false;

    // Strict multi-tenant isolation: Users cannot view draft documents of other companies
    if (currentUser.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) return false;
    }

    const userRole = currentUser.role || 'staff';
    if (userRole === 'viewer') return false;

    // 1. Super Admin, Approver (MR), dan Document Control Officer (DCO) dapat memantau seluruh draft sistem
    if (userRole === 'admin' || userRole === 'approver' || userRole === 'doc_control') {
      return true;
    }

    // 2. Staff / Reviewer: HANYA dapat melihat draft miliknya sendiri (Personal Draft)
    const userName = (currentUser.name || '').toUpperCase().trim();
    const userNip = (currentUser.nip || currentUser.nik || '').toUpperCase().trim();
    const docCreatorNip = (doc.creatorNip || doc.creatorNik || '').toUpperCase().trim();
    const isOwner = (docCreatorNip && docCreatorNip === userNip) ||
                    (doc.creator && doc.creator.toUpperCase().trim() === userName);
    return Boolean(isOwner);
  };

  // Scope akses berkas Ditolak berdasarkan Kepemilikan & Role
  const canUserViewRejectedDoc = (doc) => {
    if (!doc) return false;
    if (!currentUser) return false;

    // Strict multi-tenant isolation
    if (currentUser.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) return false;
    }

    const userRole = currentUser.role || 'staff';
    if (userRole === 'viewer') return false;

    // 1. Admin, Approver (MR), dan DCO dapat memantau seluruh dokumen yang ditolak
    if (userRole === 'admin' || userRole === 'approver' || userRole === 'doc_control') {
      return true;
    }

    // 2. Reviewer (Atasan Dept): Melihat dokumen ditolak dari departemennya
    if (userRole === 'reviewer') {
      const userDept = (currentUser.department || '').toUpperCase().trim();
      const docDept = (doc.department || '').toUpperCase().trim();
      if (userDept && docDept && userDept === docDept) return true;
    }

    // 3. Staff: Hanya dokumen ditolak yang diajukan oleh dirinya sendiri
    const userName = (currentUser.name || '').toUpperCase().trim();
    const userNip = (currentUser.nip || currentUser.nik || '').toUpperCase().trim();
    const docCreatorNip = (doc.creatorNip || doc.creatorNik || '').toUpperCase().trim();
    const isOwner = (docCreatorNip && docCreatorNip === userNip) ||
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

  // Role Access Guard: Otomatis alihkan halaman jika user mencoba membuka menu yang tidak berizin
  useEffect(() => {
    if (!currentUser) return;
    const userRole = currentUser.role || 'staff';

    if (userRole === 'viewer') {
      const allowedViewerMenus = ['dashboard', 'ctrl-active'];
      if (!allowedViewerMenus.includes(activeMenu)) {
        setActiveMenu('ctrl-active');
      }
    } else if (userRole === 'staff') {
      const forbiddenStaff = ['settings', 'ctrl-obsolete', 'ctrl-all'];
      if (activeMenu.startsWith('master-') || activeMenu.startsWith('rep-') || forbiddenStaff.includes(activeMenu)) {
        setActiveMenu('dashboard');
      }
    } else if (userRole === 'reviewer') {
      if (activeMenu.startsWith('master-') || activeMenu === 'settings') {
        setActiveMenu('dashboard');
      }
    } else if (userRole === 'doc_control') {
      if (activeMenu === 'settings') {
        setActiveMenu('dashboard');
      }
    }
  }, [currentUser, activeMenu]);

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

  // Helper conversion for database snake_case schema
  const toSnakeCaseDoc = (d) => {
    const inferredCompanyCode = d.companyCode || (d.docNumber ? d.docNumber.split('-')[0] : 'DJI');
    const matchedCompany = companies.find(c => c.code === inferredCompanyCode);
    const inferredCompanyName = d.companyName || matchedCompany?.name || (inferredCompanyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : inferredCompanyCode === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');

    return {
      id: d.id,
      doc_number: d.docNumber,
      company_code: inferredCompanyCode,
      company_name: inferredCompanyName,
      title: d.title || 'DOKUMEN TANPA JUDUL',
      type: d.type || 'SOP',
      type_name: d.typeName || d.type || 'SOP',
      department: d.department || 'HRGA',
      creator: d.creator || 'Staff',
      creator_nip: d.creatorNip || d.creatorNik || null,
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
    };
  };

  const fromSnakeCaseDoc = (d) => {
    const inferredCompanyCode = d.company_code || (d.doc_number ? d.doc_number.split('-')[0] : 'DJI');
    const matchedCompany = companies.find(c => c.code === inferredCompanyCode);
    const inferredCompanyName = d.company_name || matchedCompany?.name || (inferredCompanyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : inferredCompanyCode === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');

    return {
      id: d.id,
      docNumber: d.doc_number,
      companyCode: inferredCompanyCode,
      companyName: inferredCompanyName,
      title: d.title,
      type: d.type,
      typeName: d.type_name,
      department: d.department,
      creator: d.creator,
      creatorNip: d.creator_nip || d.creator_nik,
      creatorNik: d.creator_nip || d.creator_nik,
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
    };
  };

  // 1.5 Fetch initial data from self-hosted API (PostgreSQL)
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
          setTimeout(() => reject(new Error('API database fetch timeout (4s)')), 4000)
        );

        const fetchPromise = Promise.all([
          supabase.from('documents').select('*').order('created_at', { ascending: false }),
          supabase.from('departments').select('*'),
          supabase.from('document_types').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('verifier_teams').select('*'),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
          supabase.from('system_settings').select('*').limit(1),
          supabase.from('companies').select('*')
        ]);

        const [
          { data: cloudDocs, error: docsErr },
          { data: cloudDepts, error: deptsErr },
          { data: cloudTypes, error: typesErr },
          { data: cloudEmps, error: empsErr },
          { data: cloudTeams, error: teamsErr },
          { data: cloudLogs, error: logsErr },
          { data: cloudSettings, error: settingsErr },
          { data: cloudCompanies, error: companiesErr }
        ] = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMounted) return;

        if (cloudCompanies && !companiesErr && cloudCompanies.length > 0) {
          setCompanies(cloudCompanies);
          localStorage.setItem('dji_dms_companies', JSON.stringify(cloudCompanies));
        }

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
          const dummyNips = ['123456', '123457', '123458', '123459', '123460', '123461', '123462'];
          const cleanedEmps = cloudEmps
            .filter(e => !dummyNips.includes(String(e.nip || e.nik || '').trim()))
            .map(e => {
              const nip = String(e.nip || e.nik || '').trim().toUpperCase();
              const companyCode = String(
                nip.startsWith('UMI') ? 'UMI' : nip.startsWith('IMK') ? 'IMK' : nip === '123463' ? 'ALL' : (e.company_code || e.companyCode || 'DJI')
              ).toUpperCase();
              return {
                ...e,
                nip: e.nip || e.nik,
                nik: e.nip || e.nik,
                companyCode,
                companyName: e.company_name || e.companyName || (
                  companyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : companyCode === 'IMK' ? 'PT IMK' : companyCode === 'ALL' ? 'Holding (Multi-Company)' : 'PT Dentelle Jaya Infinitex'
                )
              };
            });
          const employeesByNip = new Map(
            cleanedEmps.map(employee => [String(employee.nip || employee.nik || '').trim().toUpperCase(), employee])
          );
          initialEmployees.forEach(employee => {
            const nip = String(employee.nip || employee.nik || '').trim().toUpperCase();
            if (nip && !employeesByNip.has(nip)) employeesByNip.set(nip, employee);
          });
          const sortedEmps = [...employeesByNip.values()].sort((a, b) => {
            const aNip = a.nip || a.nik;
            const bNip = b.nip || b.nik;
            if (a.department === 'MGMT' || aNip === 'DJI000001') return -1;
            if (b.department === 'MGMT' || bNip === 'DJI000001') return 1;
            return 0;
          });
          setEmployees(sortedEmps);
        }
        if (cloudTeams && !teamsErr) setVerifierTeams(cloudTeams);
        if (cloudLogs && !logsErr) {
          setRawAuditLogs(cloudLogs.map(l => {
            const logNip = l.nip || l.nik;
            return {
              id: l.id,
              timestamp: l.timestamp,
              user: l.user_name,
              nip: logNip,
              nik: logNip,
              companyCode: l.company_code || (l.doc_number?.split('-')[0]) || (logNip?.startsWith('UMI') ? 'UMI' : logNip?.startsWith('IMK') ? 'IMK' : 'DJI'),
              action: l.action,
              docNumber: l.doc_number,
              docTitle: l.doc_title,
              details: l.details
            };
          }));
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
        console.warn('Database fetch warning, falling back to local cache:', err);
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

  // 2. LocalStorage Syncing with Quota Protection (Persist Raw Multi-Tenant Datasets)
  useEffect(() => {
    try {
      localStorage.setItem('dji_dms_documents', JSON.stringify(rawDocuments));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, optimizing document storage', e);
      try {
        const lightweightDocs = rawDocuments.map(d => ({
          ...d,
          fileUrl: d.fileUrl && d.fileUrl.length > 500000 ? null : d.fileUrl
        }));
        localStorage.setItem('dji_dms_documents', JSON.stringify(lightweightDocs));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [rawDocuments]);

  useEffect(() => {
    localStorage.setItem('dji_dms_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('dji_dms_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('dji_dms_doctypes', JSON.stringify(documentTypes));
  }, [documentTypes]);

  useEffect(() => {
    localStorage.setItem('dji_dms_employees', JSON.stringify(rawEmployees));
  }, [rawEmployees]);

  // Sinkronisasi otomatis agar akun resmi PT DJI tersedia dan dummy lama dibersihkan
  useEffect(() => {
    setEmployees(prev => {
      const dummyNips = new Set([
        '123456', '123457', '123458', '123459', '123460', '123461', '123462', 'DJI000001',
        'DJI042211', 'DJI052212', 'DJI062213'
      ]);
      let changed = false;
      let list = (prev || []).filter(e => !dummyNips.has(String(e?.nip || e?.nik || '').trim()));
      if (list.length !== (prev || []).length) {
        changed = true;
      }

      initialEmployees.forEach(initEmp => {
        if (!list.some(e => String(e?.nip || e?.nik || '').trim() === String(initEmp.nip || initEmp.nik).trim())) {
          list.push(initEmp);
          changed = true;
        }
      });

      list = list.map(e => {
        const empId = e.nip || e.nik;
        if (empId === 'DJI092115' && e.role !== 'reviewer') {
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
    localStorage.setItem('dji_dms_auditlogs', JSON.stringify(rawAuditLogs));
  }, [rawAuditLogs]);

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
  const addAuditLog = (action, docNumber, docTitle, details, userOverride = null) => {
    const now = new Date();
    const activeUser = userOverride || currentUser || { name: 'Sistem', nip: '-', nik: '-' };
    const empId = activeUser.nip || activeUser.nik || '';
    const userCompany = activeUser.companyCode || (empId.startsWith('UMI') ? 'UMI' : empId.startsWith('IMK') ? 'IMK' : 'DJI');
    const docCompany = (docNumber && docNumber.includes('-') && docNumber !== '-') ? docNumber.split('-')[0] : userCompany;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('id-ID')}`,
      user: activeUser.name || 'Sistem',
      nip: activeUser.nip || activeUser.nik || '-',
      nik: activeUser.nip || activeUser.nik || '-',
      companyCode: docCompany || userCompany || 'DJI',
      action,
      docNumber,
      docTitle,
      details
    };
    setRawAuditLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').upsert([{
        id: newLog.id,
        timestamp: newLog.timestamp,
        user_name: newLog.user,
        nip: newLog.nip,
        company_code: newLog.companyCode,
        action: newLog.action,
        doc_number: newLog.docNumber,
        doc_title: newLog.docTitle,
        details: newLog.details
      }]).then(({ error }) => {
        if (error) console.warn('Supabase addAuditLog warning:', error);
      });
    }
  };

  // Sinkronisasi Jejak Audit dari dokumen yang sudah ada
  const syncAuditLogsFromDocuments = () => {
    const generated = generateAuditLogsFromDocuments(rawDocuments);
    setRawAuditLogs(generated);
    localStorage.setItem('dji_dms_auditlogs', JSON.stringify(generated));
    showToast(`Berhasil menyinkronkan ${generated.length} entri jejak audit dari dokumen!`, 'success');
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

    const compCode = docData.companyCode || (docData.docNumber ? docData.docNumber.split('-')[0] : (systemSettings.companyCode || 'DJI'));
    const compName = docData.companyName || companies.find(c => c.code === compCode)?.name || (systemSettings.companyName || 'PT DJI');

    // Tentukan sequence number
    let seqNumber = docData.seqNumber;
    if (!seqNumber || seqNumber === '( Otomatis oleh sistem )') {
      seqNumber = getNextSequenceNumber(documents, docData.type, docData.department, compCode);
    }

    const revision = docData.revision || '00';
    const docNumber = docData.docNumber || formatDocumentNumber({
      companyCode: compCode,
      docType: docData.type,
      department: docData.department,
      seqNumber,
      revision
    });

    const newDoc = {
      id: docData.id || `doc-${Date.now()}`,
      docNumber,
      companyCode: compCode,
      companyName: compName,
      title: docData.title,
      type: docData.type,
      typeName: documentTypes.find(t => t.code === docData.type)?.name || docData.type,
      department: docData.department,
      creator: docData.creator || currentUser.name,
      creatorNip: docData.creatorNip || docData.creatorNik || currentUser.nip || currentUser.nik,
      creatorNik: docData.creatorNip || docData.creatorNik || currentUser.nip || currentUser.nik,
      creatorPosition: docData.creatorPosition || currentUser.position,
      seqNumber,
      revision,
      status: 'DRAFT',
      createdDate: docData.createdDate || createdDate,
      createdTime: docData.createdTime || createdTime,
      effectiveDate: null,
      targetReviewer: docData.targetReviewer || null,
      reviewerNip: docData.reviewerNip || docData.reviewerNik || null,
      reviewerNik: docData.reviewerNip || docData.reviewerNik || null,
      verifierTeam: docData.verifierTeam || 'Document Control Team',
      targetApprover: docData.targetApprover || docData.approverName || null,
      approverNip: docData.approverNip || docData.approverNik || null,
      approverNik: docData.approverNip || docData.approverNik || null,
      notes: docData.notes || '',
      content: docData.content || `1. TUJUAN\nDokumen ${docData.title} dibuat untuk standardisasi operasional.\n\n2. RUANG LINGKUP\nBerlaku di lingkungan departemen ${docData.department}.\n\n3. PROSEDUR PELAKSANAAN\n3.1 Pelaksanaan standar operasional sesuai kaidah ISO 9001.`,
      fileName: docData.fileName || (docData.fileUrl ? `${docNumber}.pdf` : null),
      fileSize: docData.fileSize || (docData.fileUrl ? '350 KB' : null),
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

    const compCode = docData.companyCode || (docData.docNumber ? docData.docNumber.split('-')[0] : (systemSettings.companyCode || 'DJI'));
    const compName = docData.companyName || companies.find(c => c.code === compCode)?.name || (systemSettings.companyName || 'PT DJI');

    let seqNumber = docData.seqNumber;
    if (!seqNumber || seqNumber === '( Otomatis oleh sistem )') {
      seqNumber = getNextSequenceNumber(documents, docData.type, docData.department, compCode);
    }

    const revision = docData.revision || '00';
    const docNumber = docData.docNumber || formatDocumentNumber({
      companyCode: compCode,
      docType: docData.type,
      department: docData.department,
      seqNumber,
      revision
    });

    const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
    const isReviewerUser = currentUser?.role === 'reviewer';

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

    // Cek apakah dokumen ini merupakan pengajuan ulang dari perbaikan/revisi
    // atau berkas milik staff yang tidak boleh membypass alur verifikasi Atasan
    const isResubmission = Boolean(
      docData.isResubmission ||
      docData.status === 'PERLU REVISI' ||
      docData.status === 'REVISI' ||
      docData.revisionRequestedBy ||
      docData.revisionNotes ||
      docData.revisionRequestedStage
    );

    const docCreatorId = (docData.creatorNip || docData.creatorNik || '').trim().toUpperCase();
    const currentUserId = (currentUser?.nip || currentUser?.nik || '').trim().toUpperCase();
    const isDifferentCreator = Boolean(
      (docCreatorId && currentUserId && (docCreatorId !== currentUserId)) ||
      (docData.creator && currentUser?.name && (docData.creator.trim().toLowerCase() !== currentUser.name.trim().toLowerCase()))
    );

    const docTypeObj = (documentTypes || []).find(t => t.code === docData.type);
    const docLevel = docTypeObj?.level || 2;
    const isFastTrack = docLevel === 3 || docLevel === 4;

    if (isResubmission) {
      // Dokumen ini merupakan pengajuan ulang setelah perbaikan / revisi.
      // Kembalikan ke tahap terakhir asalnya sebelum diminta revisi:
      let targetStage = 'REVIEW';
      if (docData.returnStage) {
        targetStage = docData.returnStage;
      } else if (docData.revisionRequestedStage === 'FORMAT' || docData.revisionRequestedStage === 'VERIFIKASI') {
        targetStage = 'VERIFIKASI';
      } else if (docData.revisionRequestedStage === 'APPROVAL') {
        targetStage = isFastTrack ? 'VERIFIKASI' : 'APPROVAL';
      } else if (docData.previousStatus && ['REVIEW', 'VERIFIKASI', 'APPROVAL'].includes(docData.previousStatus)) {
        targetStage = docData.previousStatus;
      } else if (docData.verifiedBy) {
        targetStage = isFastTrack ? 'VERIFIKASI' : 'APPROVAL';
      } else if (docData.reviewedBy) {
        targetStage = 'VERIFIKASI';
      } else {
        targetStage = 'REVIEW';
      }

      docStatus = targetStage;

      if (targetStage === 'APPROVAL') {
        // Diminta revisi oleh Approver / MR (Tahap 3):
        // Review Atasan (Tahap 1) dan Verifikasi Format DCO (Tahap 2) tetap sah
        reviewedBy = docData.reviewedBy || null;
        reviewedDate = docData.reviewedDate || null;
        reviewNotes = docData.reviewNotes || null;
        verifiedBy = docData.verifiedBy || null;
        verifiedDate = docData.verifiedDate || null;
        verificationNotes = docData.verificationNotes || null;
        approvedBy = null;
        approvedDate = null;
        approvalNotes = null;
      } else if (targetStage === 'VERIFIKASI') {
        // Diminta revisi format oleh DCO (Tahap 2):
        // Review Atasan (Tahap 1) tetap sah, verifikasi format direset untuk diperiksa DCO
        reviewedBy = docData.reviewedBy || null;
        reviewedDate = docData.reviewedDate || null;
        reviewNotes = docData.reviewNotes || null;
        verifiedBy = null;
        verifiedDate = null;
        verificationNotes = null;
        approvedBy = null;
        approvedDate = null;
        approvalNotes = null;
      } else {
        // Diminta revisi isi oleh Atasan (Tahap 1):
        // Kembali ke Tahap 1 untuk ditelaah ulang oleh Atasan Departemen
        docStatus = 'REVIEW';
        reviewedBy = null;
        reviewedDate = null;
        reviewNotes = null;
        verifiedBy = null;
        verifiedDate = null;
        verificationNotes = null;
        approvedBy = null;
        approvedDate = null;
        approvalNotes = null;
      }
    } else if (isDifferentCreator) {
      if (docLevel === 1) {
        // Alur Dokumen Level 1 (Policy / Kebijakan Mutu):
        // Sesuai ISO 9001: Masuk ke DCO terlebih dahulu untuk dirapikan formatnya (Tahap 2),
        // sebelum ditelaah oleh MR (Tahap 3) dan disahkan GM (Tahap 4).
        docStatus = 'VERIFIKASI';
        reviewedBy = null;
        reviewedDate = null;
        reviewNotes = null;
        verifiedBy = null;
        verifiedDate = null;
        verificationNotes = null;
        approvedBy = null;
        approvedDate = null;
        approvalNotes = null;
      } else {
        // Pendaftaran dokumen baru Level 2/3/4 oleh staf: WAJIB mulai dari Tahap 1 (Review Atasan)
        docStatus = 'REVIEW';
        reviewedBy = null;
        reviewedDate = null;
        reviewNotes = null;
        verifiedBy = null;
        verifiedDate = null;
        verificationNotes = null;
        approvedBy = null;
        approvedDate = null;
        approvalNotes = null;
      }
    } else if (isDcoOrAdmin && (!docData.creator || docData.creator === currentUser?.name)) {
      if (docLevel === 1) {
        // Dokumen Kebijakan Mutu Level 1 yang didaftarkan DCO:
        // Format otomatis terverifikasi DCO, langsung diteruskan ke Review Mutu ISO oleh MR
        docStatus = 'REVIEW';
        reviewedBy = null;
        reviewedDate = null;
        reviewNotes = null;
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format tata naskah kebijakan mutu diverifikasi langsung oleh Document Control saat pendaftaran.';
      } else if (isFastTrack) {
        // ISO Level 3/4 (IK/Formulir) yang didaftarkan DCO:
        // Format baku sudah diverifikasi DCO, diarahkan ke Review teknis Atasan Departemen (Tahap 1).
        // Begitu Atasan menyetujui materi teknis, berkas langsung terbit AKTIF!
        docStatus = 'REVIEW';
        reviewedBy = null;
        reviewedDate = null;
        reviewNotes = null;
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format tata naskah diverifikasi langsung oleh Document Control saat pendaftaran.';
      } else {
        // ISO Level 2: Lolos Tahap 1 & Tahap 2, langsung Tahap 3 (APPROVAL GM/MR)
        docStatus = 'APPROVAL';
        reviewedBy = currentUser?.name || 'Reviewer (Bypass DCO)';
        reviewedDate = createdDate;
        reviewNotes = 'Diajukan langsung oleh Document Control.';
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format dan tata naskah diverifikasi langsung oleh Document Control saat pendaftaran.';
      }
    } else if (isReviewerUser && (!docData.creator || docData.creator === currentUser?.name)) {
      // Reviewer (Atasan / Kepala Dept) mendaftarkan dokumen baru atas namanya sendiri:
      // Otomatis lolos Tahap 1 (Review), langsung Tahap 2 (VERIFIKASI DCO)
      docStatus = 'VERIFIKASI';
      reviewedBy = currentUser?.name;
      reviewedDate = createdDate;
      reviewNotes = 'Disusun dan ditelaah langsung oleh Kepala Departemen / Reviewer.';
    }

    const newDoc = {
      id: docData.id || `doc-${Date.now()}`,
      docNumber,
      companyCode: compCode,
      companyName: compName,
      title: docData.title,
      type: docData.type,
      typeName: documentTypes.find(t => t.code === docData.type)?.name || docData.type,
      department: docData.department,
      creator: docData.creator || currentUser.name,
      creatorNip: docData.creatorNip || docData.creatorNik || currentUser.nip || currentUser.nik,
      creatorNik: docData.creatorNip || docData.creatorNik || currentUser.nip || currentUser.nik,
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
      reviewerNip: docData.reviewerNip || docData.reviewerNik || null,
      reviewerNik: docData.reviewerNip || docData.reviewerNik || null,
      verifierTeam: docData.verifierTeam || 'Document Control Team',
      targetApprover: docData.targetApprover || docData.approverName || null,
      approverNip: docData.approverNip || docData.approverNik || null,
      approverNik: docData.approverNip || docData.approverNik || null,
      approverPosition: docData.approverPosition || null,
      notes: docData.notes || '',
      content: docData.content || `1. TUJUAN\nDokumen ${docData.title} dibuat untuk standardisasi operasional.\n\n2. RUANG LINGKUP\nBerlaku di lingkungan departemen ${docData.department}.\n\n3. PROSEDUR PELAKSANAAN\n3.1 Pelaksanaan standar operasional sesuai kaidah ISO 9001.`,
      fileName: docData.fileName || (docData.fileUrl ? `${docNumber}.pdf` : null),
      fileSize: docData.fileSize || (docData.fileUrl ? '520 KB' : null),
      fileType: docData.fileType || null,
      fileUrl: docData.fileUrl || null,
      rejectionReason: isResubmission ? null : (docData.rejectionReason || null),
      revisionNotes: isResubmission ? null : (docData.revisionNotes || null),
      revisionRequestedBy: isResubmission ? null : (docData.revisionRequestedBy || null),
      revisionRequestedDate: isResubmission ? null : (docData.revisionRequestedDate || null),
      revisionRequestedStage: isResubmission ? null : (docData.revisionRequestedStage || null),
      returnStage: isResubmission ? null : (docData.returnStage || null),
      previousStatus: isResubmission ? null : (docData.previousStatus || null),
      revisionHistory: [
        ...(docData.revisionHistory || []),
        {
          revision,
          date: createdDate,
          author: currentUser.name,
          note: isResubmission
            ? (docStatus === 'APPROVAL'
                ? `Pengajuan ulang berkas hasil revisi oleh ${currentUser.name}. Menunggu Pengesahan Akhir (${docData.targetApprover || 'Approver'}).`
                : docStatus === 'VERIFIKASI'
                ? `Pengajuan ulang berkas hasil perbaikan format oleh ${currentUser.name}. Menunggu Verifikasi Format Document Control.`
                : `Pengajuan ulang berkas hasil revisi oleh ${currentUser.name}. Menunggu Review Atasan Departemen (${docData.department}).`)
            : (docStatus === 'APPROVAL')
            ? `Pendaftaran oleh DCO & verifikasi format otomatis. Menunggu pengesahan ${docData.targetApprover || 'Approver'}`
            : (docStatus === 'VERIFIKASI')
            ? `Pendaftaran oleh Kepala Departemen. Menunggu verifikasi format DCO.`
            : 'Pengajuan verifikasi dokumen (Tahap 1 Review Atasan)'
        }
      ]
    };

    setDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);

    if (docStatus === 'APPROVAL') {
      addAuditLog('SUBMIT_APPROVAL', newDoc.docNumber, newDoc.title, `Didaftarkan oleh DCO, format lolos otomatis. Menunggu pengesahan ${newDoc.targetApprover || 'Approver'}`);
      addNotification('Pengajuan Pengesahan Dokumen', `${newDoc.docNumber} - ${newDoc.title} siap disahkan oleh ${newDoc.targetApprover || 'Approver'}.`, 'warning', newDoc.id);
      showToast(`Dokumen ${newDoc.docNumber} berhasil diajukan! Format lolos otomatis dan langsung diteruskan ke ${newDoc.targetApprover || 'Pejabat Penyetuju'}.`, 'success');
    } else if (docStatus === 'VERIFIKASI') {
      addAuditLog('SUBMIT_VERIFICATION', newDoc.docNumber, newDoc.title, `Disusun oleh Kepala Departemen / Reviewer. Menunggu verifikasi format DCO.`);
      addNotification('Pengajuan Verifikasi Format', `${newDoc.docNumber} - ${newDoc.title} menunggu verifikasi format oleh Document Control.`, 'warning', newDoc.id);
      showToast(`Dokumen ${newDoc.docNumber} berhasil diajukan! Menunggu verifikasi format Document Control.`, 'success');
    } else {
      const isRe = isResubmission;
      addAuditLog(isRe ? 'RESUBMIT_REVIEW' : 'SUBMIT_REVIEW', newDoc.docNumber, newDoc.title, isRe ? `Diajukan ulang setelah perbaikan ke Review Atasan Departemen ${newDoc.department}` : `Diajukan ke Review Atasan Departemen ${newDoc.department}`);
      addNotification(
        isRe ? 'Pengajuan Ulang Dokumen Revisi' : 'Pengajuan Verifikasi Baru',
        isRe
          ? `Dokumen ${newDoc.docNumber} - ${newDoc.title} telah diperbaiki dan diajukan ulang untuk Review Atasan Departemen ${newDoc.department}.`
          : `Dokumen ${newDoc.docNumber} - ${newDoc.title} diajukan untuk Review Atasan Departemen ${newDoc.department}.`,
        'warning',
        newDoc.id
      );
      showToast(
        isRe
          ? `Dokumen ${newDoc.docNumber} berhasil diajukan ulang! Menunggu review kembali oleh Atasan Departemen ${newDoc.department}.`
          : `Dokumen ${newDoc.docNumber} berhasil diajukan untuk Review Atasan Departemen ${newDoc.department}!`,
        'success'
      );
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

    const existingTarget = (rawDocuments || []).find(d => d.id === docId);
    if (!existingTarget) {
      showToast('Dokumen tidak ditemukan.', 'danger');
      return false;
    }

    // Strict multi-tenant isolation: Users cannot review documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (existingTarget.companyCode || existingTarget.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang menelaah dokumen perusahaan lain.', 'danger');
        return false;
      }
    }

    if (!canUserViewPendingDoc(existingTarget)) {
      showToast(`Akses ditolak! Dokumen ini hanya dapat direview oleh Atasan Departemen ${existingTarget.department}.`, 'danger');
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;
    let becameActive = false;

    setDocuments(prevDocs => {
      const target = prevDocs.find(d => d.id === docId);
      if (!target) return prevDocs;
      targetDoc = target;

      const docTypeObj = (documentTypes || []).find(t => t.code === target.type);
      const docLevel = docTypeObj?.level || 2;
      const isLevel1 = docLevel === 1;
      const isFastTrack = docLevel === 3 || docLevel === 4;
      // Jika dokumen didaftarkan DCO dan formatnya sudah diverifikasi, review Atasan ini menjadikannya langsung AKTIF
      const canActivateNow = isFastTrack && Boolean(target.verifiedBy);
      becameActive = canActivateNow;

      const noteText = reviewNotes || 'Isi teknis dan kesesuaian alur kerja operasional telah diperiksa dan disetujui oleh Atasan/Reviewer.';

      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: canActivateNow ? 'AKTIF' : (isLevel1 ? 'APPROVAL' : 'VERIFIKASI'),
            effectiveDate: canActivateNow ? (doc.effectiveDate || today) : doc.effectiveDate,
            reviewedBy: currentUser.name,
            reviewedDate: today,
            reviewNotes: noteText,
            approvedBy: canActivateNow ? (doc.targetApprover || currentUser.name) : doc.approvedBy,
            approvedDate: canActivateNow ? today : doc.approvedDate,
            approvalNotes: canActivateNow ? `Disahkan langsung oleh Kepala Departemen (${currentUser.name}) - Fast-Track ISO Level ${docLevel}.` : doc.approvalNotes,
            notes: doc.notes ? `${doc.notes} | [Review Atasan Lolos: ${currentUser.name}]` : `[Review Atasan Lolos: ${currentUser.name}]`,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: canActivateNow
                  ? `Review teknis disetujui oleh ${currentUser.name}. Dokumen Level ${docLevel} langsung diterbitkan AKTIF (Fast-Track).`
                  : isLevel1
                  ? `Telaah kesesuaian mutu ISO 9001 disetujui oleh MR (${currentUser.name}). Diteruskan ke Direktur Utama / GM (${doc.targetApprover || 'General Manager'}) untuk pengesahan akhir.`
                  : `Review teknis disetujui oleh ${currentUser.name} (${currentUser.position}). Diteruskan ke Document Control.`
              }
            ]
          };
        }

        // Auto-obsolete versi lama jika dokumen ini langsung aktif (Strict Per-Company Scope)
        const docComp = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        const targetComp = (target.companyCode || target.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        if (
          canActivateNow &&
          doc.id !== docId &&
          docComp === targetComp &&
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
            if (error) console.warn('Supabase reviewDocumentContent error:', error);
          });
        });
      }

      return updatedDocs;
    });

    if (targetDoc) {
      if (becameActive) {
        addAuditLog('APPROVE_DOCUMENT_FASTTRACK', targetDoc.docNumber, targetDoc.title, `Review teknis disetujui oleh ${currentUser.name}. Dokumen Fast-Track resmi diterbitkan AKTIF.`);
        addNotification('Dokumen Resmi Aktif', `${targetDoc.docNumber} telah resmi aktif setelah disetujui oleh Kepala Departemen (${currentUser.name}).`, 'success', targetDoc.id);
        showToast(`Dokumen ${targetDoc.docNumber} resmi disahkan & DITERBITKAN AKTIF! Jalur Cepat ISO Level 3/4 terpenuhi.`, 'success');
      } else {
        const isLevel1 = (documentTypes || []).find(t => t.code === targetDoc.type)?.level === 1;
        if (isLevel1) {
          addAuditLog('REVIEW_POLICY_MR', targetDoc.docNumber, targetDoc.title, `Telaah mutu ISO disetujui oleh MR (${currentUser.name}). Diteruskan ke Direktur Utama / GM (${targetDoc.targetApprover || 'General Manager'}) untuk pengesahan akhir.`);
          addNotification('Telaah Mutu Disetujui MR', `${targetDoc.docNumber} telah ditelaah dan disetujui oleh MR (${currentUser.name}). Siap disahkan oleh Direktur Utama / GM.`, 'info', targetDoc.id);
          showToast(`Dokumen Kebijakan Mutu (${targetDoc.docNumber}) disetujui oleh MR dan diteruskan ke Direktur Utama / GM!`, 'success');
        } else {
          addAuditLog('REVIEW_DOCUMENT', targetDoc.docNumber, targetDoc.title, `Review teknis disetujui oleh ${currentUser.name} (${currentUser.position}). Diteruskan ke Document Control.`);
          addNotification('Review Atasan Disetujui', `${targetDoc.docNumber} lolos review teknis oleh ${currentUser.name}. Menunggu verifikasi format Document Control.`, 'info', targetDoc.id);
          showToast(`Dokumen ${targetDoc.docNumber} lolos review Atasan dan diteruskan ke Document Control!`, 'success');
        }
      }
      return true;
    }
    return false;
  };

  /**
   * Tahap 2 (ISO 9001:2015): Verifikasi Format & Penomoran oleh DOCUMENT CONTROL (DCO)
   * - Level 1 (Policy) & Level 2 (SOP): Format diperiksa, diteruskan ke Tahap 3 (APPROVAL MR / GM).
   * - Level 3 (Instruksi Kerja) & Level 4 (Formulir): Format diperiksa dan LANGSUNG DITERBITKAN AKTIF (Jalur Cepat ISO 9001:2015 Klausul 7.5).
   */
  const verifyDocumentFormat = (docId, notes = '') => {
    if (!canVerifyFormat) {
      showToast('Akses ditolak! Hanya Document Control Officer (DCO) atau Administrator yang dapat memverifikasi format dokumen.', 'danger');
      return false;
    }

    const existingTarget = (rawDocuments || []).find(d => d.id === docId);
    if (!existingTarget) {
      showToast('Dokumen tidak ditemukan.', 'danger');
      return false;
    }

    // Strict multi-tenant isolation: DCO cannot verify documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (existingTarget.companyCode || existingTarget.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang memverifikasi dokumen perusahaan lain.', 'danger');
        return false;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    let targetDoc = null;
    let becameActive = false;
    let targetLevel = 2;

    setDocuments(prevDocs => {
      const target = prevDocs.find(d => d.id === docId);
      if (!target) return prevDocs;
      targetDoc = target;

      const docTypeObj = (documentTypes || []).find(t => t.code === target.type);
      targetLevel = docTypeObj?.level || 2;
      const isFastTrack = targetLevel === 3 || targetLevel === 4;
      becameActive = isFastTrack;

      const verifyNote = notes || 'Format dokumen, tata naskah, dan penomoran telah diverifikasi memenuhi standar ISO 9001.';

      const updatedDocs = prevDocs.map(doc => {
        if (doc.id === docId) {
          const isL1 = targetLevel === 1;
          return {
            ...doc,
            status: isFastTrack ? 'AKTIF' : (isL1 ? 'REVIEW' : 'APPROVAL'),
            effectiveDate: isFastTrack ? (doc.effectiveDate || today) : doc.effectiveDate,
            verifiedBy: currentUser.name,
            verifiedDate: today,
            verificationNotes: verifyNote,
            approvedBy: isFastTrack ? (doc.targetApprover || doc.reviewedBy || currentUser.name) : doc.approvedBy,
            approvedDate: isFastTrack ? today : doc.approvedDate,
            approvalNotes: isFastTrack ? `Diterbitkan langsung sebagai Dokumen Aktif (Jalur Cepat ISO 9001 Level ${targetLevel} - Verifikasi DCO & Review Atasan).` : doc.approvalNotes,
            notes: doc.notes ? `${doc.notes} | [Format Lolos DCO: ${currentUser.name}]` : `[Format Lolos DCO: ${currentUser.name}]`,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: isFastTrack
                  ? `Format diverifikasi oleh ${currentUser.name} (DCO) dan langsung diterbitkan AKTIF (Fast-Track ISO Level ${targetLevel}).`
                  : isL1
                  ? `Format tata naskah kebijakan mutu diverifikasi oleh ${currentUser.name} (DCO). Diteruskan ke MR (${doc.targetReviewer || 'Management Representative'}) untuk telaah mutu ISO.`
                  : `Format diverifikasi oleh ${currentUser.name} (DCO). Diteruskan ke ${doc.targetApprover || 'Pejabat Penyetuju'}.`
              }
            ]
          };
        }

        // Auto-obsolete versi lama jika dokumen ini langsung aktif (Strict Per-Company Scope)
        const docComp = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        const targetComp = (target.companyCode || target.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        if (
          isFastTrack &&
          doc.id !== docId &&
          docComp === targetComp &&
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
            if (error) console.warn('Supabase verifyDocumentFormat error:', error);
          });
        });
      }

      return updatedDocs;
    });

    if (targetDoc) {
      if (becameActive) {
        addAuditLog('VERIFY_AND_PUBLISH_FASTTRACK', targetDoc.docNumber, targetDoc.title, `Format diverifikasi oleh ${currentUser.name} (DCO). Dokumen Level ${targetLevel} langsung diterbitkan sebagai Dokumen Aktif (Fast-Track).`);
        addNotification('Dokumen Resmi Aktif', `${targetDoc.docNumber} telah diverifikasi oleh DCO dan resmi diterbitkan AKTIF (Jalur Cepat Level ${targetLevel}).`, 'success', targetDoc.id);
        showToast(`Dokumen Level ${targetLevel} (${targetDoc.docNumber}) berhasil diverifikasi & langsung DITERBITKAN AKTIF! Jalur cepat ISO terpenuhi.`, 'success');
      } else if (targetLevel === 1) {
        addAuditLog('VERIFY_FORMAT_POLICY', targetDoc.docNumber, targetDoc.title, `Format kebijakan mutu diverifikasi oleh ${currentUser.name} (DCO). Diteruskan ke MR (${targetDoc.targetReviewer || 'MR'}) untuk telaah mutu ISO.`);
        addNotification('Format Kebijakan Mutu Terverifikasi', `${targetDoc.docNumber} telah diverifikasi format oleh DCO dan diteruskan ke MR untuk telaah mutu ISO.`, 'info', targetDoc.id);
        showToast(`Format Dokumen Level 1 (${targetDoc.docNumber}) diverifikasi DCO! Diteruskan ke Management Representative (MR).`, 'success');
      } else {
        addAuditLog('VERIFY_FORMAT', targetDoc.docNumber, targetDoc.title, `Format diverifikasi oleh ${currentUser.name} (DCO). Menunggu pengesahan ${targetDoc.targetApprover || 'Approver'}.`);
        addNotification('Format Dokumen Terverifikasi', `${targetDoc.docNumber} telah diverifikasi oleh DCO dan menunggu pengesahan ${targetDoc.targetApprover || 'Approver'}.`, 'info', targetDoc.id);
        showToast(`Format dokumen ${targetDoc.docNumber} berhasil diverifikasi! Diteruskan ke ${targetDoc.targetApprover || 'Pejabat Penyetuju'}.`, 'success');
      }
      return true;
    }
    return false;
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

    const existingTarget = (rawDocuments || []).find(d => d.id === docId);
    if (!existingTarget) {
      showToast('Dokumen tidak ditemukan.', 'danger');
      return false;
    }

    // Strict multi-tenant isolation: Approvers cannot approve documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (existingTarget.companyCode || existingTarget.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang mengesahkan dokumen perusahaan lain.', 'danger');
        return false;
      }
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
        // ubah statusnya menjadi OBSOLETE! (Strict Per-Company Scope)
        const docComp = (doc.companyCode || doc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        const targetComp = (target.companyCode || target.docNumber?.split('-')[0] || 'DJI').toUpperCase();
        if (
          doc.id !== docId &&
          docComp === targetComp &&
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

    const existingTarget = (rawDocuments || []).find(d => d.id === docId);
    if (!existingTarget) {
      showToast('Dokumen tidak ditemukan.', 'danger');
      return false;
    }

    // Strict multi-tenant isolation: Users cannot reject documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (existingTarget.companyCode || existingTarget.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang menolak dokumen perusahaan lain.', 'danger');
        return false;
      }
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
   * Minta Revisi Dokumen (Return for Revision / Kembalikan ke Pembuat)
   * Berkas tidak dibatalkan permanen melainkan berstatus 'PERLU REVISI'
   * agar pembuat dapat memperbaiki draf/lampiran lalu mengajukan ulang.
   */
  const requestDocumentRevision = (docId, revisionNotes = '', stage = 'REVIEW') => {
    if (!canReviewContent && !canVerifyFormat && !canApproveDocument) {
      showToast('Akses ditolak! Anda tidak memiliki wewenang meminta revisi dokumen.', 'danger');
      return false;
    }

    const existingTarget = (rawDocuments || []).find(d => d.id === docId);
    if (!existingTarget) {
      showToast('Dokumen tidak ditemukan.', 'danger');
      return false;
    }

    // Strict multi-tenant isolation: Users cannot request revisions for documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (existingTarget.companyCode || existingTarget.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang meminta revisi dokumen perusahaan lain.', 'danger');
        return false;
      }
    }

    let targetDoc = null;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timestamp = `${today} ${now.toLocaleTimeString('id-ID')}`;

    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === docId) {
          targetDoc = doc;
          const noteText = revisionNotes || 'Perlu perbaikan isi materi / kelengkapan format sebelum diverifikasi ulang.';
          const returnStage = (stage === 'FORMAT' || stage === 'VERIFIKASI')
            ? 'VERIFIKASI'
            : (stage === 'APPROVAL' ? 'APPROVAL' : 'REVIEW');

          return {
            ...doc,
            status: 'PERLU REVISI',
            previousStatus: doc.status,
            returnStage,
            rejectionReason: noteText,
            revisionNotes: noteText,
            revisionRequestedBy: currentUser.name,
            revisionRequestedDate: timestamp,
            revisionRequestedStage: stage,
            notes: doc.notes ? `${doc.notes} | [Minta Revisi: ${noteText}]` : `[Minta Revisi: ${noteText}]`,
            revisionHistory: [
              ...(doc.revisionHistory || []),
              {
                revision: doc.revision,
                date: today,
                author: currentUser.name,
                note: `Diminta revisi (${stage}) oleh ${currentUser.name}: ${noteText}`
              }
            ]
          };
        }
        return doc;
      });
    });

    if (targetDoc) {
      addAuditLog('REQUEST_REVISION', targetDoc.docNumber, targetDoc.title, `Permintaan revisi oleh ${currentUser.name}: ${revisionNotes}`);
      addNotification(
        'Permintaan Revisi Dokumen',
        `Dokumen ${targetDoc.docNumber} (${targetDoc.title}) diminta untuk direvisi oleh ${currentUser.name}: "${revisionNotes}"`,
        'warning',
        targetDoc.id
      );

      if (isSupabaseConfigured && supabase) {
        supabase.from('documents').update({
          status: 'PERLU REVISI',
          rejection_reason: revisionNotes,
          updated_at: new Date().toISOString()
        }).eq('id', docId).then(({ error }) => {
          if (error) console.warn('Supabase request revision warning:', error);
        });
      }

      showToast(`Dokumen ${targetDoc.docNumber} dikembalikan ke ${targetDoc.creator} untuk direvisi.`, 'warning');
      return true;
    }
    return false;
  };

  /**
   * Buat Pengajuan Revisi Baru dari Dokumen Aktif
   */
  const createDocumentRevision = (originalDoc, revisionData) => {
    const nextRev = getNextRevisionCode(originalDoc.revision);
    const now = new Date();
    const createdDate = now.toISOString().slice(0, 10);
    const createdTime = now.toLocaleTimeString('id-ID');

    const targetComp = originalDoc.companyCode || (originalDoc.docNumber?.split('-')[0]) || systemSettings.companyCode || 'DJI';
    const newDocNumber = formatDocumentNumber({
      companyCode: targetComp,
      docType: originalDoc.type,
      department: originalDoc.department,
      seqNumber: originalDoc.seqNumber,
      revision: nextRev
    });

    const isDcoOrAdmin = currentUser?.role === 'doc_control' || currentUser?.role === 'admin' || currentUser?.role === 'approver';
    const docTypeObj = (documentTypes || []).find(t => t.code === originalDoc.type);
    const docLevel = docTypeObj?.level || 2;
    const isFastTrack = docLevel === 3 || docLevel === 4;

    // Best Practice ISO 9001:2015 Clause 7.5:
    // Pengajuan revisi oleh staff/pembuat dokumen masuk ke Tahap 1 (REVIEW Atasan Departemen).
    // Jika diajukan sendiri oleh Kepala Departemen (Reviewer), otomatis lanjut ke Tahap 2 (VERIFIKASI DCO).
    // Jika diajukan oleh DCO:
    // - Level 1/2: langsung masuk ke Tahap 3 (APPROVAL MR / GM).
    // - Level 3/4 (IK/Form): diarahkan ke Review teknis Atasan Dept (Tahap 1), begitu disetujui langsung Aktif.
    let docStatus = 'REVIEW';
    let reviewedBy = null;
    let reviewedDate = null;
    let reviewNotes = null;
    let verifiedBy = null;
    let verifiedDate = null;
    let verificationNotes = null;
    let effectiveDate = revisionData.effectiveDate || null;
    let approvedBy = null;
    let approvedDate = null;
    let approvalNotes = null;

    if (revisionData.isDraft) {
      docStatus = 'DRAFT';
    } else if (docLevel === 1) {
      // Kebijakan Mutu Level 1:
      // Jika DCO mendaftarkan revisi: format sudah oke, langsung ke MR (REVIEW)
      // Jika staf/pembuat lain: masuk ke DCO dulu untuk verifikasi format (VERIFIKASI)
      if (isDcoOrAdmin) {
        docStatus = 'REVIEW';
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format revisi kebijakan mutu diverifikasi langsung oleh Document Control saat pendaftaran.';
      } else {
        docStatus = 'VERIFIKASI';
      }
    } else if (currentUser?.role === 'reviewer' && currentUser.department === originalDoc.department) {
      // Diajukan langsung oleh Kepala Departemen terkait
      docStatus = 'VERIFIKASI';
      reviewedBy = currentUser.name;
      reviewedDate = createdDate;
      reviewNotes = 'Diajukan langsung oleh Kepala Departemen (Review substansi otomatis terpenuhi).';
    } else if (isDcoOrAdmin) {
      if (isFastTrack) {
        docStatus = 'REVIEW';
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format revisi diverifikasi langsung oleh Document Control saat pendaftaran.';
      } else {
        docStatus = 'APPROVAL';
        reviewedBy = revisionData.targetReviewer || currentUser?.name || 'Reviewer (DCO)';
        reviewedDate = createdDate;
        reviewNotes = 'Format dan tata naskah diverifikasi langsung oleh Document Control.';
        verifiedBy = currentUser?.name || 'Document Control';
        verifiedDate = createdDate;
        verificationNotes = 'Format revisi diverifikasi langsung oleh Document Control saat pendaftaran.';
      }
    }

    const newRevisedDoc = {
      id: `doc-${Date.now()}`,
      docNumber: newDocNumber,
      title: revisionData.title || originalDoc.title,
      type: originalDoc.type,
      typeName: originalDoc.typeName,
      department: originalDoc.department,
      creator: currentUser.name,
      creatorNip: currentUser.nip || currentUser.nik,
      creatorNik: currentUser.nip || currentUser.nik,
      creatorPosition: currentUser.position,
      seqNumber: originalDoc.seqNumber,
      revision: nextRev,
      status: docStatus,
      createdDate,
      createdTime,
      effectiveDate,
      targetReviewer: revisionData.targetReviewer || originalDoc.targetReviewer || null,
      reviewerNip: revisionData.reviewerNip || originalDoc.reviewerNip || revisionData.reviewerNik || originalDoc.reviewerNik || null,
      reviewerNik: revisionData.reviewerNip || originalDoc.reviewerNip || revisionData.reviewerNik || originalDoc.reviewerNik || null,
      reviewerName: revisionData.reviewerName || originalDoc.reviewerName || null,
      reviewerPosition: revisionData.reviewerPosition || originalDoc.reviewerPosition || null,
      reviewedBy,
      reviewedDate,
      reviewNotes,
      verifiedBy,
      verifiedDate,
      verificationNotes,
      approvedBy,
      approvedDate,
      approvalNotes,
      verifierTeam: revisionData.verifierTeam || originalDoc.verifierTeam || 'Document Control Team',
      targetApprover: revisionData.targetApprover || originalDoc.targetApprover || null,
      approverNip: revisionData.approverNip || originalDoc.approverNip || revisionData.approverNik || originalDoc.approverNik || null,
      approverNik: revisionData.approverNip || originalDoc.approverNip || revisionData.approverNik || originalDoc.approverNik || null,
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
          note: isDcoOrAdmin
            ? `Pengajuan Revisi ${nextRev} oleh DCO. Menunggu pengesahan ${newRevisedDoc?.targetApprover || 'Approver'}.`
            : `Pengajuan Revisi ${nextRev}: ${revisionData.changeReason || 'Penyempurnaan klausul'}`
        }
      ]
    };

    setDocuments(prev => [newRevisedDoc, ...prev]);

    if (isDcoOrAdmin && !revisionData.isDraft) {
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

    const targetDoc = (rawDocuments || []).find(d => d.id === docId);
    if (!targetDoc) return false;

    // Strict multi-tenant isolation: Users cannot cancel documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (targetDoc.companyCode || targetDoc.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang membatalkan dokumen perusahaan lain.', 'danger');
        return false;
      }
    }

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
    const docToDelete = (rawDocuments || []).find(d => d.id === docId);
    if (!docToDelete) return false;

    // Strict multi-tenant isolation: Users cannot delete documents of other companies
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      const userCompany = currentUser.companyCode.toUpperCase();
      const docCompany = (docToDelete.companyCode || docToDelete.docNumber?.split('-')[0] || 'DJI').toUpperCase();
      if (docCompany !== userCompany) {
        showToast('Akses ditolak! Anda tidak memiliki wewenang menghapus dokumen perusahaan lain.', 'danger');
        return false;
      }
    }

    const userNip = (currentUser?.nip || currentUser?.nik || '').trim().toUpperCase();
    const docCreatorNip = (docToDelete.creatorNip || docToDelete.creatorNik || '').trim().toUpperCase();
    const isCreator = currentUser && (
      (currentUser.name && docToDelete.creator && currentUser.name.trim().toLowerCase() === docToDelete.creator.trim().toLowerCase()) ||
      (userNip && docCreatorNip && userNip === docCreatorNip)
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

  // 4. Master Data CRUD Handlers with Database Sync & Audit Trail
  const addCompany = (comp) => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      showToast('Akses ditolak! Pengelolaan Master Perusahaan hanya diizinkan untuk Akun Holding Group (ALL).', 'danger');
      return false;
    }
    const newComp = {
      ...comp,
      id: comp.id || `comp-${Date.now()}`,
      color: comp.color || 'blue',
      badgeColor: comp.badgeColor || 'bg-blue-100 text-blue-800 border-blue-200'
    };
    setCompanies(prev => [...prev, newComp]);
    addAuditLog('CREATE_COMPANY', newComp.code, newComp.name, `Menambahkan perusahaan baru: ${newComp.name} (${newComp.code})`);
    showToast(`Perusahaan ${newComp.name} (${newComp.code}) berhasil ditambahkan!`, 'success');

    if (isSupabaseConfigured && supabase) {
      supabase.from('companies').upsert([{
        id: newComp.id,
        code: newComp.code,
        name: newComp.name,
        tagline: newComp.tagline || null,
        color: newComp.color || 'blue',
        badge_color: newComp.badgeColor || null,
        active: true
      }]).then(({ error }) => {
        if (error) console.warn('Database addCompany error:', error);
      });
    }
  };

  const updateCompany = (id, updatedData) => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      showToast('Akses ditolak! Pengelolaan Master Perusahaan hanya diizinkan untuk Akun Holding Group (ALL).', 'danger');
      return false;
    }
    const prevComp = companies.find(c => c.id === id);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    addAuditLog('UPDATE_COMPANY', updatedData.code || prevComp?.code || id, updatedData.name || prevComp?.name || 'Perusahaan', `Memperbarui data perusahaan: ${updatedData.name || prevComp?.name} (${updatedData.code || prevComp?.code})`);
    showToast('Data perusahaan berhasil diperbarui!', 'success');

    if (isSupabaseConfigured && supabase) {
      supabase.from('companies').upsert([{
        id,
        code: updatedData.code,
        name: updatedData.name,
        tagline: updatedData.tagline || null,
        color: updatedData.color,
        badge_color: updatedData.badgeColor
      }]).then(({ error }) => {
        if (error) console.warn('Database updateCompany error:', error);
      });
    }
  };

  const deleteCompany = (id) => {
    if (currentUser?.companyCode && currentUser.companyCode !== 'ALL') {
      showToast('Akses ditolak! Pengelolaan Master Perusahaan hanya diizinkan untuk Akun Holding Group (ALL).', 'danger');
      return false;
    }
    const comp = companies.find(c => c.id === id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE_COMPANY', comp?.code || id, comp?.name || 'Perusahaan', `Menghapus data perusahaan: ${comp?.name || id} (${comp?.code || '-'})`);
    showToast('Perusahaan berhasil dihapus!', 'info');

    if (isSupabaseConfigured && supabase) {
      supabase.from('companies').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Database deleteCompany error:', error);
      });
    }
  };

  const addDepartment = (dept) => {
    const newDept = { ...dept, id: `dept-${Date.now()}` };
    setDepartments(prev => [...prev, newDept]);
    addAuditLog('CREATE_DEPARTMENT', newDept.code, newDept.name, `Menambahkan departemen baru: ${newDept.name} (${newDept.code}), Kepala: ${newDept.head || '-'}`);

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
    const prevDept = departments.find(d => d.id === id);
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updatedData } : d));
    addAuditLog('UPDATE_DEPARTMENT', updatedData.code || prevDept?.code || id, updatedData.name || prevDept?.name || 'Departemen', `Memperbarui departemen: ${updatedData.name || prevDept?.name} (${updatedData.code || prevDept?.code}), Kepala: ${updatedData.head || '-'}`);

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
    const dept = departments.find(d => d.id === id);
    setDepartments(prev => prev.filter(d => d.id !== id));
    addAuditLog('DELETE_DEPARTMENT', dept?.code || id, dept?.name || 'Departemen', `Menghapus departemen: ${dept?.name || id} (${dept?.code || '-'})`);

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
    addAuditLog('CREATE_DOCUMENT_TYPE', newType.code, newType.name, `Menambahkan jenis dokumen baru: ${newType.name} (${newType.code}), Level: ${newType.level || 2}`);

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
    const prevType = documentTypes.find(t => t.id === id);
    setDocumentTypes(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    addAuditLog('UPDATE_DOCUMENT_TYPE', updatedData.code || prevType?.code || id, updatedData.name || prevType?.name || 'Jenis Dokumen', `Memperbarui jenis dokumen: ${updatedData.name || prevType?.name} (${updatedData.code || prevType?.code})`);

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
    const dt = documentTypes.find(t => t.id === id);
    setDocumentTypes(prev => prev.filter(t => t.id !== id));
    addAuditLog('DELETE_DOCUMENT_TYPE', dt?.code || id, dt?.name || 'Jenis Dokumen', `Menghapus jenis dokumen: ${dt?.name || id} (${dt?.code || '-'})`);

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
    addAuditLog('CREATE_EMPLOYEE', newEmp.nip || newEmp.nik, newEmp.name, `Menambahkan pegawai baru: ${newEmp.name} (NIP: ${newEmp.nip || newEmp.nik}, Dept: ${newEmp.department}, Jabatan: ${newEmp.position}, Role: ${newEmp.role})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').upsert([{
        id: newEmp.id,
        nip: newEmp.nip || newEmp.nik,
        company_code: newEmp.companyCode || 'DJI',
        company_name: newEmp.companyName || null,
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

    showToast(`Pegawai ${newEmp.name} berhasil ditambahkan!`, 'success');
  };

  const updateEmployee = (id, updatedData) => {
    const prevEmp = employees.find(e => e.id === id);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updatedData } : e));
    const effectiveNip = updatedData.nip || updatedData.nik || prevEmp?.nip || prevEmp?.nik;
    addAuditLog('UPDATE_EMPLOYEE', effectiveNip || id, updatedData.name || prevEmp?.name || 'Pegawai', `Memperbarui data pegawai: ${updatedData.name || prevEmp?.name} (NIP: ${effectiveNip}, Dept: ${updatedData.department || '-'}, Role: ${updatedData.role || '-'})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').update({
        nip: updatedData.nip || updatedData.nik,
        company_code: updatedData.companyCode || prevEmp?.companyCode || 'DJI',
        company_name: updatedData.companyName || prevEmp?.companyName || null,
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

    showToast('Data Pegawai berhasil diperbarui!', 'success');
  };

  const deleteEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    addAuditLog('DELETE_EMPLOYEE', emp?.nip || emp?.nik || id, emp?.name || 'Pegawai', `Menghapus pegawai: ${emp?.name || id} (NIP: ${emp?.nip || emp?.nik || '-'})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteEmployee warning:', error);
      });
    }

    showToast('Data Pegawai berhasil dihapus.', 'info');
  };

  const addVerifierTeam = (team) => {
    const newTeam = { ...team, id: `team-${Date.now()}` };
    setVerifierTeams(prev => [...prev, newTeam]);
    addAuditLog('CREATE_VERIFIER_TEAM', newTeam.name, newTeam.name, `Menambahkan tim verifikator baru: ${newTeam.name}, Ketua: ${newTeam.leader || '-'}`);

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
    const prevTeam = verifierTeams.find(t => t.id === id);
    setVerifierTeams(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    addAuditLog('UPDATE_VERIFIER_TEAM', updatedData.name || prevTeam?.name || id, updatedData.name || prevTeam?.name || 'Tim Verifikator', `Memperbarui tim verifikator: ${updatedData.name || prevTeam?.name}, Ketua: ${updatedData.leader || '-'}`);

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
    const team = verifierTeams.find(t => t.id === id);
    setVerifierTeams(prev => prev.filter(t => t.id !== id));
    addAuditLog('DELETE_VERIFIER_TEAM', team?.name || id, team?.name || 'Tim Verifikator', `Menghapus tim verifikator: ${team?.name || id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('verifier_teams').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase deleteVerifierTeam warning:', error);
      });
    }

    showToast('Tim Verifikator berhasil dihapus.', 'info');
  };

  const updateSystemSettings = (newSettings) => {
    setSystemSettings(newSettings);
    addAuditLog('UPDATE_SETTINGS', 'SYSTEM', newSettings.systemName || 'Settings', `Memperbarui konfigurasi sistem (${newSettings.isoStandard || 'ISO 9001:2015'})`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('system_settings').upsert([{
        id: 'default',
        company_name: newSettings.companyName,
        company_code: newSettings.companyCode,
        system_name: newSettings.systemName,
        iso_standard: newSettings.isoStandard,
        numbering_format: newSettings.numberingFormat,
        default_verifier_team: newSettings.defaultVerifierTeam,
        watermark_controlled_text: newSettings.watermarkControlledText,
        watermark_obsolete_text: newSettings.watermarkObsoleteText,
        watermark_draft_text: newSettings.watermarkDraftText,
        enable_qr_stamp: newSettings.enableQRStamp,
        enable_audit_auto_log: newSettings.enableAuditAutoLog,
        periodic_review_months: newSettings.periodicReviewMonths
      }]).then(({ error }) => {
        if (error) console.warn('Supabase update system_settings warning:', error);
      });
    }
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
        companies,
        setCompanies,
        selectedCompanyFilter,
        setSelectedCompanyFilter,
        isCompanyLocked: Boolean(currentUser?.companyCode && currentUser.companyCode !== 'ALL'),
        userCompanyCode: currentUser?.companyCode || null,
        isHoldingAdmin: Boolean(currentUser?.companyCode === 'ALL' && (currentUser?.role === 'admin' || currentUser?.role === 'approver')),
        addCompany,
        updateCompany,
        deleteCompany,
        documents,
        setDocuments,
        rawDocuments,
        allDocuments: rawDocuments,
        departments,
        documentTypes,
        employees,
        setEmployees,
        rawEmployees,
        allEmployees: rawEmployees,
        verifierTeams,
        auditLogs,
        setAuditLogs,
        rawAuditLogs,
        allAuditLogs: rawAuditLogs,
        systemSettings,
        setSystemSettings,
        currentUser,
        setCurrentUser,
        isAuthenticated: Boolean(currentUser),
        login,
        logout,
        role,
        isViewer,
        isAdmin,
        isReviewer,
        isApprover,
        isDocControl,
        isStaff,
        canRegisterDocument,
        canSubmitDocument,
        canManageDrafts,
        canViewPendingVerification,
        canRequestRevision,
        canReviewContent,
        canVerifyFormat,
        canApproveDocument,
        canFinalizeDocument,
        canDeleteDocument,
        canCancelDocument,
        canManageMasterData,
        canManageSettings,
        canAccessReports,
        canViewObsolete,
        canViewAllDocuments,
        canUserViewPendingDoc,
        canUserViewDraftDoc,
        canUserViewRejectedDoc,
        cancelDocument,
        confirmDocumentPeriodicReview,
        reviewDocumentContent,
        verifyDocumentFormat,
        approveDocument,
        rejectDocument,
        requestDocumentRevision,
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
        addCompany,
        updateCompany,
        deleteCompany,
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
        updateSystemSettings,
        attachFileToDocument,
        isCloudConnected: isSupabaseConfigured,
        isLoadingCloud,
        resetDemoData,
        exportDatabaseJSON,
        importDatabaseJSON,
        syncAuditLogsFromDocuments,
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
