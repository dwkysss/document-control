import { describe, it, expect } from 'vitest';
import {
  formatDocumentNumber,
  getNextSequenceNumber,
  parseDocumentNumber,
  getNextRevisionCode
} from '../src/utils/numberingEngine';

describe('1. Engine Penomoran Dokumen ISO 9001:2015', () => {
  it('harus memformat nomor dokumen sesuai standar [KODE]-[JENIS]-[DEPT]-[SEQ]-[REV]', () => {
    const formatted = formatDocumentNumber({
      companyCode: 'DJI',
      docType: 'SOP',
      department: 'HRGA',
      seqNumber: '1',
      revision: '0'
    });
    expect(formatted).toBe('DJI-SOP-HRGA-01-00');
  });

  it('harus otomatis memberikan zero-padding 2 digit pada sequence dan revisi', () => {
    const docNum = formatDocumentNumber({
      companyCode: 'umi',
      docType: 'ik',
      department: 'produksi',
      seqNumber: 4,
      revision: 2
    });
    expect(docNum).toBe('UMI-IK-PRODUKSI-04-02');
  });

  it('harus menghitung nomor urut berikutnya secara otomatis dari daftar dokumen', () => {
    const existingDocs = [
      { docNumber: 'DJI-SOP-HRGA-01-00', type: 'SOP', department: 'HRGA', companyCode: 'DJI', seqNumber: '01' },
      { docNumber: 'DJI-SOP-HRGA-02-00', type: 'SOP', department: 'HRGA', companyCode: 'DJI', seqNumber: '02' }
    ];

    const nextSeq = getNextSequenceNumber(existingDocs, 'SOP', 'HRGA', 'DJI');
    expect(nextSeq).toBe('03');
  });

  it('harus mengisolasi nomor urut per entitas perusahaan (tidak saling tabrak)', () => {
    const existingDocs = [
      { docNumber: 'DJI-SOP-HRGA-01-00', type: 'SOP', department: 'HRGA', companyCode: 'DJI', seqNumber: '01' },
      { docNumber: 'DJI-SOP-HRGA-02-00', type: 'SOP', department: 'HRGA', companyCode: 'DJI', seqNumber: '02' }
    ];

    // Perusahaan PT UMI harus tetap mulai dari nomor 01 untuk kombinasi tipe & divisi yang sama
    const nextSeqUmi = getNextSequenceNumber(existingDocs, 'SOP', 'HRGA', 'UMI');
    expect(nextSeqUmi).toBe('01');
  });

  it('harus menghasilkan kode revisi berikutnya secara presisi (00 -> 01, 09 -> 10)', () => {
    expect(getNextRevisionCode('00')).toBe('01');
    expect(getNextRevisionCode('01')).toBe('02');
    expect(getNextRevisionCode('09')).toBe('10');
  });

  it('harus mem-parse nomor dokumen menjadi komponen terstruktur', () => {
    const parsed = parseDocumentNumber('IMK-FORM-FAT-05-01');
    expect(parsed).toEqual({
      company: 'IMK',
      type: 'FORM',
      dept: 'FAT',
      seq: '05',
      rev: '01'
    });
  });
});

describe('2. Aturan Alur Workflow & Pengendalian Status Dokumen ISO', () => {
  it('dokumen versi revisi baru yang disahkan harus mengubah dokumen lama menjadi OBSOLETE', () => {
    const currentDocuments = [
      {
        id: 'doc-001',
        docNumber: 'DJI-SOP-HRGA-01-00',
        title: 'Prosedur Rekrutmen Karyawan',
        status: 'AKTIF',
        revision: '00'
      }
    ];

    const newRevisionDoc = {
      id: 'doc-002',
      docNumber: 'DJI-SOP-HRGA-01-01',
      title: 'Prosedur Rekrutmen Karyawan (Revisi)',
      status: 'AKTIF',
      revision: '01',
      supersededFrom: 'doc-001'
    };

    // Simulasi transisi status workflow ISO
    const updatedDocuments = currentDocuments.map(doc => {
      if (doc.docNumber.startsWith('DJI-SOP-HRGA-01') && doc.revision !== newRevisionDoc.revision) {
        return { ...doc, status: 'OBSOLETE', obsoleteDate: '2026-11-16' };
      }
      return doc;
    }).concat(newRevisionDoc);

    const oldDoc = updatedDocuments.find(d => d.id === 'doc-001');
    const activeDoc = updatedDocuments.find(d => d.id === 'doc-002');

    expect(oldDoc.status).toBe('OBSOLETE');
    expect(oldDoc.obsoleteDate).toBeDefined();
    expect(activeDoc.status).toBe('AKTIF');
  });

  it('penolakan dokumen harus memiliki alasan penolakan resmi', () => {
    const rejectAction = (doc, reason, rejectedBy) => {
      if (!reason || reason.trim() === '') {
        throw new Error('Alasan penolakan wajib diisi untuk rekam jejak audit.');
      }
      return {
        ...doc,
        status: 'DITOLAK',
        rejectionReason: reason.trim(),
        rejectedBy,
        rejectedDate: new Date().toISOString()
      };
    };

    const draftDoc = { id: 'd-1', status: 'MENUNGGU_VERIFIKASI', title: 'IK Jahit' };

    // Validasi penolakan gagal jika alasan kosong
    expect(() => rejectAction(draftDoc, '', 'MR Deni')).toThrow('Alasan penolakan wajib diisi');

    // Validasi penolakan berhasil dengan catatan
    const rejected = rejectAction(draftDoc, 'Lampiran format lembar periksa belum lengkap', 'MR Deni');
    expect(rejected.status).toBe('DITOLAK');
    expect(rejected.rejectionReason).toContain('Lampiran format lembar periksa');
  });
});

describe('3. Isolasi Multi-Company (Holding & Subsidiaries Guard)', () => {
  const documents = [
    { id: '1', docNumber: 'DJI-SOP-IT-01-00', companyCode: 'DJI', title: 'SOP Backup DJI' },
    { id: '2', docNumber: 'UMI-SOP-FAT-01-00', companyCode: 'UMI', title: 'SOP Kasbon UMI' },
    { id: '3', docNumber: 'IMK-IK-PROD-01-00', companyCode: 'IMK', title: 'IK Rajut IMK' }
  ];

  const filterDocsByUser = (docs, user) => {
    if (!user || !user.companyCode) return [];
    if (user.companyCode === 'ALL') return docs;
    return docs.filter(d => (d.companyCode || 'DJI').toUpperCase() === user.companyCode.toUpperCase());
  };

  it('karyawan PT DJI hanya boleh mengakses dokumen PT DJI', () => {
    const userDji = { name: 'Asiva', companyCode: 'DJI' };
    const visibleDocs = filterDocsByUser(documents, userDji);
    expect(visibleDocs.length).toBe(1);
    expect(visibleDocs[0].docNumber).toBe('DJI-SOP-IT-01-00');
  });

  it('karyawan PT UMI tidak boleh melihat dokumen PT DJI atau IMK', () => {
    const userUmi = { name: 'Staff UMI', companyCode: 'UMI' };
    const visibleDocs = filterDocsByUser(documents, userUmi);
    expect(visibleDocs.length).toBe(1);
    expect(visibleDocs[0].companyCode).toBe('UMI');
  });

  it('admin Holding (ALL) dapat mengakses seluruh dokumen lintas entitas', () => {
    const adminHolding = { name: 'Dwiky Sumarlin', companyCode: 'ALL' };
    const visibleDocs = filterDocsByUser(documents, adminHolding);
    expect(visibleDocs.length).toBe(3);
  });
});

describe('4. Otorisasi Peran ISO 9001 (Role-Based Access Control)', () => {
  const canApprove = (role) => role === 'admin' || role === 'approver';
  const canDeleteEmployee = (role) => role === 'admin' || role === 'approver';
  const canEditDocument = (role) => ['admin', 'approver', 'doc_control', 'reviewer', 'staff'].includes(role);

  it('hanya Admin dan MR (Approver) yang berhak mengesahkan akun atau menghapus personil', () => {
    expect(canApprove('admin')).toBe(true);
    expect(canApprove('approver')).toBe(true);
    expect(canApprove('staff')).toBe(false);
    expect(canApprove('viewer')).toBe(false);

    expect(canDeleteEmployee('admin')).toBe(true);
    expect(canDeleteEmployee('approver')).toBe(true);
    expect(canDeleteEmployee('staff')).toBe(false);
  });

  it('role Viewer bersifat read-only dan tidak berhak mengedit dokumen', () => {
    expect(canEditDocument('staff')).toBe(true);
    expect(canEditDocument('doc_control')).toBe(true);
    expect(canEditDocument('viewer')).toBe(false);
  });
});
