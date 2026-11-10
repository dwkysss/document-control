import * as XLSX from 'xlsx';
import { downloadBlobAsFile } from './pdfStamper';

/**
 * Membangun lembar kerja (Workbook) Spreadsheet Excel Standar ISO 9001
 * secara dinamis berdasarkan data formulir dokumen terkendali.
 */
export function buildIsoSpreadsheetWorkbook(doc, systemSettings = {}) {
  const wb = XLSX.utils.book_new();
  const companyCode = (doc?.companyCode || (doc?.docNumber?.startsWith('UMI') ? 'UMI' : doc?.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
  const companyName = doc?.companyName || (
    companyCode === 'UMI' ? 'PT ULTIMO MODA INDOTEX' :
    companyCode === 'IMK' ? 'PT IMK' :
    (systemSettings?.companyName || 'PT DENTELLE JAYA INFINITEX')
  );

  const titleUpper = (doc?.title || 'FORMULIR REKAMAN MUTU').toUpperCase();
  const isChecklist = /CHECKLIST|CHECKLIS|MESIN|PRODUKSI|MAINTENANCE|PERAWATAN|KONDISI/i.test(titleUpper);
  const isSPB = /SPB|PERMINTAAN|BARANG|PENGADAAN|ALAT|CLEANING/i.test(titleUpper);
  const isLemburOrHR = /LEMBUR|ABSENSI|HR|KARYAWAN|CUTI/i.test(titleUpper);

  // ================= SHEET 1: FORMULIR KERJA =================
  const sheet1Data = [
    [companyName],
    [(doc?.typeName || doc?.type || 'FORMULIR / REKAMAN MUTU').toUpperCase()],
    [titleUpper],
    [],
    [
      'No. Dokumen:', doc?.docNumber || '-',
      '',
      'Departemen:', doc?.department || '-',
      '',
      'Revisi:', doc?.revision || '00',
      'Tgl. Terbit:', doc?.effectiveDate || doc?.createdDate || '-'
    ],
    []
  ];

  if (isChecklist) {
    sheet1Data.push(
      ['NO', 'KOMPONEN / SISTEM', 'ITEM PEMERIKSAAN', 'STANDAR PARAMETER', 'METODE CEK', 'SHIFT 1', 'SHIFT 2', 'SHIFT 3', 'KONDISI', 'CATATAN / TINDAKAN'],
      [1, 'Motor Utama & Transmisi', 'Ketegangan V-Belt & kebersihan puli', 'Tegang normal, bebas minyak/debu', 'Visual & Tekan', 'OK', 'OK', 'OK', 'NORMAL', 'Kondisi belt prima & kencang'],
      [2, 'Gearbox & Pelumasan', 'Level pelumas & nipple grease bearing', 'Garis indikator pada batas aman', 'Dipstick / Sight Glass', 'OK', 'OK', 'OK', 'NORMAL', 'Level oli 85% normal'],
      [3, 'Sistem Pneumatik Mesin', 'Tekanan regulator udara bertekanan', '5.5 - 6.5 Bar stabil', 'Manometer Tekanan', 'OK', 'OK', 'OK', 'NORMAL', 'Tekanan 6.0 Bar stabil'],
      [4, 'Suhu Bearing & Poros', 'Temperatur bearing saat beban kerja penuh', 'Max 65°C, getaran stabil halus', 'Infrared Thermogun', 'OK', 'OK', 'OK', 'NORMAL', 'Suhu 48.5°C aman'],
      [5, 'Safety & Emergency Stop', 'Respon saklar darurat & safety cover', 'Mesin mati seketika saat ditekan', 'Uji Fungsi Rutin', 'OK', 'OK', 'OK', 'NORMAL', 'Sensor pengaman aktif'],
      [6, 'Panel Kelistrikan & MCB', 'Kerapian kabel dan suhu relay kontaktor', 'Tidak panas, kabel rapi dalam duct', 'Visual & Thermo Check', 'OK', 'OK', 'OK', 'NORMAL', 'MCB & relay normal'],
      [7, 'Area Kerja & 5R Mesin', 'Kebersihan ceceran pelumas & sisa bahan', 'Lantai bersih, material tertata rapi', 'Inspeksi 5R', 'OK', 'OK', 'OK', 'NORMAL', 'Area kerja bersih & steril']
    );
  } else if (isSPB) {
    sheet1Data.push(
      ['NO', 'KODE BARANG', 'NAMA ITEM / DESKRIPSI', 'SPESIFIKASI / MERK', 'JUMLAH', 'SATUAN', 'KEPERLUAN / PENGGUNAAN', 'TGL DIBUTUHKAN', 'STATUS APPROVAL'],
      [1, 'BRG-HR-001', 'Cairan Pembersih Lantai Industri', 'Jerigen 5 Liter - SOS Floor Cleaner', 4, 'Jerigen', 'Kebutuhan Operasional Kebersihan GA Pabrik', '2026-09-25', 'DISETUJUI'],
      [2, 'BRG-HR-002', 'Sarung Tangan Nitrile Heavy Duty', 'Ukuran L - Kimtech Nitrile Chemical Gloves', 12, 'Pasang', 'APD Petugas Kebersihan & Maintenance', '2026-09-25', 'DISETUJUI'],
      [3, 'BRG-GA-003', 'Kain Majun Katun Putih Bersih', 'Bal 25 Kg - Bahan Katun Halus Tanpa Kancing', 2, 'Bal', 'Pembersihan Oli & Area Mesin Tenun', '2026-09-26', 'DISETUJUI']
    );
  } else if (isLemburOrHR) {
    sheet1Data.push(
      ['NO', 'NIP KARYAWAN', 'NAMA KARYAWAN', 'BAGIAN / DEPARTEMEN', 'HARI / TANGGAL', 'JAM MULAI', 'JAM SELESAI', 'TOTAL JAM', 'URAIAN TUGAS / TARGET', 'STATUS APPROVAL'],
      [1, 'DJI012203', 'Dede Suhenda', 'PRODUKSI', '2026-09-22', '16:30', '19:30', '3.0 Jam', 'Penyelesaian batch produksi kain tenun', 'DISETUJUI'],
      [2, 'DJI012207', 'Siti Nurdianti', 'PRODUKSI', '2026-09-22', '16:30', '19:30', '3.0 Jam', 'Perhitungan stock opname gudang benang', 'DISETUJUI'],
      [3, 'DJI012202', 'Asiva Siti Faujiah', 'PRODUKSI', '2026-09-22', '16:30', '19:30', '3.0 Jam', 'Rekapitulasi output shift 2 & input mesin', 'DISETUJUI']
    );
  } else {
    sheet1Data.push(
      ['NO', 'KODE PARAMETER', 'URAIAN STANDAR OPERASIONAL', 'TARGET MUTU', 'REALISASI', 'METODE EVALUASI', 'HASIL (OK/NG)', 'VERIFIKASI'],
      [1, 'PAR-01', 'Kepatuhan Alur Kerja Standar Prosedur Operasional', '100% Sesuai SOP', '100%', 'Audit Sampling', 'OK', 'TERVERIFIKASI'],
      [2, 'PAR-02', 'Kelengkapan Format Rekaman Mutu & Logbook', 'Arsip Lengkap', 'Lengkap', 'Verifikasi DCO', 'OK', 'TERVERIFIKASI'],
      [3, 'PAR-03', 'Evaluasi Kelaikan Parameter Berkala', 'Tepat Waktu', 'On Schedule', 'Review Bulanan', 'OK', 'TERVERIFIKASI']
    );
  }

  // Tanda Tangan Pengesahan di bawah formulir
  sheet1Data.push(
    [],
    ['', 'DIBUAT OLEH (STAFF)', '', '', 'DIPERIKSA (REVIEWER)', '', '', 'DISETUJUI (MR / HEAD)'],
    ['Nama:', doc?.creator || 'Staff Pembuat', '', '', doc?.reviewedBy || 'Reviewer Atasan', '', '', doc?.approvedBy || (companyCode === 'UMI' ? 'RATNA SARI' : companyCode === 'IMK' ? 'BAMBANG WIJAYA' : 'BABAN RACHMAT SUBAGJA')],
    ['Tanggal:', doc?.effectiveDate || doc?.createdDate || '-', '', '', doc?.effectiveDate || doc?.createdDate || '-', '', '', doc?.effectiveDate || doc?.createdDate || '-'],
    ['Status:', 'Verified Digital Signature', '', '', 'Verified Digital Signature', '', '', 'Authorized Approval']
  );

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Atur lebar kolom
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 38 },
    { wch: 32 },
    { wch: 22 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 28 }
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Formulir Kerja');

  // ================= SHEET 2: RIWAYAT REVISI =================
  const sheet2Data = [
    [companyName],
    ['LEMBAR REKAMAN RIWAYAT REVISI DOKUMEN'],
    ['No. Dokumen: ' + (doc?.docNumber || '-')],
    [],
    ['NO', 'REVISI', 'TANGGAL BERLAKU', 'URAIAN PERUBAHAN / KETERANGAN', 'PEMOHON / PENULIS', 'PENGESAH (MR)']
  ];

  if (doc?.revisionHistory && Array.isArray(doc.revisionHistory) && doc.revisionHistory.length > 0) {
    doc.revisionHistory.forEach((rev, idx) => {
      sheet2Data.push([
        idx + 1,
        rev.revision || doc.revision || '00',
        rev.date || doc.effectiveDate || doc.createdDate || '-',
        rev.note || 'Penerbitan dokumen terkendali',
        rev.author || doc.creator || '-',
        doc.approvedBy || 'MR'
      ]);
    });
  } else {
    sheet2Data.push([
      1,
      doc?.revision || '00',
      doc?.effectiveDate || doc?.createdDate || '-',
      'Penerbitan dokumen perdana / terdaftar aktif',
      doc?.creator || '-',
      doc?.approvedBy || (companyCode === 'UMI' ? 'RATNA SARI' : companyCode === 'IMK' ? 'BAMBANG WIJAYA' : 'BABAN RACHMAT SUBAGJA')
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 18 },
    { wch: 45 },
    { wch: 25 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Riwayat Revisi');

  return wb;
}

/**
 * Mengekspor workbook XLSX menjadi Blob file
 */
export function exportWorkbookToBlob(workbook) {
  const wbOut = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

/**
 * Mengunduh workbook secara langsung ke komputer pengguna
 */
export function downloadWorkbookFile(workbook, fileName = 'Formulir_Terkendali.xlsx') {
  const blob = exportWorkbookToBlob(workbook);
  downloadBlobAsFile(blob, fileName);
}

