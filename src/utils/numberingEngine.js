/**
 * Engine penomoran dokumen otomatis standar ISO Document Control
 * Format standar: [KODE_PERUSAHAAN]-[JENIS_DOKUMEN]-[DEPARTEMEN]-[NO_URUT]-[REVISI]
 * Contoh: DJI-IK-HRGA-01-00
 */

export function getNextSequenceNumber(documents = [], docType = '', department = '') {
  if (!docType || !department) return '01';

  // Cari semua dokumen yang memiliki kombinasi Jenis Dokumen dan Departemen yang sama
  const matchingDocs = documents.filter(
    doc => doc.type?.toUpperCase() === docType.toUpperCase() && 
           doc.department?.toUpperCase() === department.toUpperCase()
  );

  if (matchingDocs.length === 0) {
    return '01';
  }

  // Ambil nomor urut tertinggi
  let maxSeq = 0;
  matchingDocs.forEach(doc => {
    const seq = parseInt(doc.seqNumber || '0', 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  });

  const nextSeq = maxSeq + 1;
  return nextSeq.toString().padStart(2, '0');
}

export function formatDocumentNumber({
  companyCode = 'DJI',
  docType = 'IK',
  department = 'HRGA',
  seqNumber = '01',
  revision = '00'
}) {
  const cleanComp = (companyCode || 'DJI').toUpperCase().trim();
  const cleanType = (docType || 'IK').toUpperCase().trim();
  const cleanDept = (department || 'HRGA').toUpperCase().trim();
  const cleanSeq = (seqNumber || '01').toString().padStart(2, '0');
  const cleanRev = (revision || '00').toString().padStart(2, '0');

  return `${cleanComp}-${cleanType}-${cleanDept}-${cleanSeq}-${cleanRev}`;
}

export function parseDocumentNumber(docNumber = '') {
  if (!docNumber) {
    return { company: 'DJI', type: 'IK', dept: 'HRGA', seq: '01', rev: '00' };
  }

  const parts = docNumber.split('-');
  return {
    company: parts[0] || 'DJI',
    type: parts[1] || '',
    dept: parts[2] || '',
    seq: parts[3] || '01',
    rev: parts[4] || '00',
  };
}

export function getNextRevisionCode(currentRevision = '00') {
  const revNum = parseInt(currentRevision, 10);
  if (isNaN(revNum)) return '01';
  return (revNum + 1).toString().padStart(2, '0');
}
