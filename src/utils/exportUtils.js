import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper pemformat tanggal resmi ISO (hanya tanggal, bulan, tahun - tanpa detail jam)
 */
export function formatDocumentDate(value) {
  if (!value || value === '-') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' && value.length >= 10 ? value.slice(0, 10) : String(value);
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

/**
 * Helper pemanggil autoTable yang kompatibel lintas bundler / ES modules
 */
export function applyAutoTable(doc, options) {
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  if (typeof autoTable === 'function') {
    return autoTable(doc, options);
  }
  if (autoTable && typeof autoTable.default === 'function') {
    return autoTable.default(doc, options);
  }
  throw new Error('Plugin jspdf-autotable tidak terdeteksi.');
}

/**
 * Mengubah kode tipe dokumen singkatan menjadi kepanjangan nama resmi standar ISO 9001
 * Contoh: 'IK' -> 'INSTRUKSI KERJA (IK)', 'SOP' -> 'STANDAR OPERASIONAL PROSEDUR (SOP)'
 */
export function getDocumentTypeFullName(docData = {}) {
  const typeCode = (docData.type || '').toUpperCase().trim();
  const rawTypeName = (docData.typeName || '').trim();

  const standardTypeMap = {
    'IK': 'INSTRUKSI KERJA (IK)',
    'SOP': 'STANDAR OPERASIONAL PROSEDUR (SOP)',
    'FORM': 'FORMULIR KONTROL MUTU (FORM)',
    'FRM': 'FORMULIR KONTROL MUTU (FRM)',
    'FM': 'FORMULIR KONTROL MUTU (FM)',
    'MEM': 'MEMO INTERNAL (MEM)',
    'POL': 'KEBIJAKAN MUTU (POLICY)',
    'WI': 'WORK INSTRUCTION (WI)',
    'EXT': 'DOKUMEN EKSTERNAL (EXT)',
    'JD': 'JOB DESCRIPTION (JD)',
    'MM': 'MANUAL MUTU (MM)',
    'PED': 'PEDOMAN MUTU (PED)',
    'CP': 'CONTROL PLAN (CP)',
    'KIK': 'INSTRUKSI KERJA KONTROL (KIK)',
  };

  if (typeCode && standardTypeMap[typeCode]) {
    return standardTypeMap[typeCode];
  }

  if (rawTypeName && rawTypeName.length > 3) {
    const upperName = rawTypeName.toUpperCase();
    if (typeCode && !upperName.includes(`(${typeCode})`)) {
      return `${upperName} (${typeCode})`;
    }
    return upperName;
  }

  if (docData.docNumber) {
    const parts = docData.docNumber.split('-');
    if (parts.length >= 2) {
      const segmentCode = parts[1].toUpperCase().trim();
      if (standardTypeMap[segmentCode]) {
        return standardTypeMap[segmentCode];
      }
    }
  }

  return typeCode ? `${typeCode} — DOKUMEN TERKENDALI` : 'STANDAR OPERASIONAL PROSEDUR (SOP)';
}

/**
 * Ekspor Data Dokumen ke file Excel (.xlsx)
 */
export function exportToExcel(data, fileName = 'Master_Document_Register') {
  const exportData = data.map((doc, index) => ({
    'No.': index + 1,
    'Nomor Dokumen': doc.docNumber,
    'Judul Dokumen': doc.title,
    'Jenis Dokumen': getDocumentTypeFullName(doc),
    'Departemen': doc.department,
    'Pembuat': `${doc.creator} (NIP: ${doc.creatorNip || doc.creatorNik || '-'})`,
    'Revisi': doc.revision,
    'Status': doc.status,
    'Tanggal Registrasi': formatDocumentDate(doc.createdDate),
    'Tanggal Efektif': formatDocumentDate(doc.effectiveDate),
    'Verifikasi (DCO)': doc.verifiedBy || 'Document Control (DCO)',
    'Catatan': doc.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  const colWidths = [
    { wch: 6 },
    { wch: 25 },
    { wch: 40 },
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 40 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Dokumen');
  
  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
}

/**
 * Ekspor Data ke file CSV
 */
export function exportToCSV(data, fileName = 'Master_Document_Register') {
  const exportData = data.map((doc, index) => ({
    'No': index + 1,
    'Nomor Dokumen': doc.docNumber,
    'Judul Dokumen': doc.title,
    'Jenis': doc.type,
    'Departemen': doc.department,
    'Pembuat': doc.creator,
    'Revisi': doc.revision,
    'Status': doc.status,
    'Tanggal Registrasi': doc.createdDate,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Ekspor Master Register Dokumen ke format PDF Standar ISO 9001
 */
export function exportMasterRegisterPDF(documents = [], systemSettings = {}, targetCompanyFilter = 'ALL') {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const compCode = (
    targetCompanyFilter && targetCompanyFilter !== 'ALL'
      ? targetCompanyFilter
      : (documents?.[0]?.companyCode || (documents?.[0]?.docNumber?.startsWith('UMI') ? 'UMI' : documents?.[0]?.docNumber?.startsWith('IMK') ? 'IMK' : 'ALL'))
  ).toUpperCase();

  const company = compCode === 'UMI'
    ? 'PT ULTIMO MODA INDOTEX'
    : compCode === 'IMK'
    ? 'PT IMK'
    : compCode === 'DJI'
    ? (systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX')
    : 'DOCUMENT CONTROL CENTER';

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 26, 48); // Navy
  doc.text(company.startsWith('PT') || company.startsWith('HOLDING') ? company : `PT ${company}`, 40, 45);

  doc.setFontSize(12);
  doc.text('DAFTAR INDUK DOKUMEN TERKENDALI (MASTER DOCUMENT REGISTER)', 40, 65);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Standar Mutu: ISO 9001:2015 / ISO 27001 | Dicetak pada: ${currentDate}`, 40, 80);

  // Table Data
  const tableColumns = [
    { header: 'No', dataKey: 'no' },
    { header: 'Nomor Dokumen', dataKey: 'docNumber' },
    { header: 'Judul Dokumen', dataKey: 'title' },
    { header: 'Jenis', dataKey: 'type' },
    { header: 'Dept', dataKey: 'dept' },
    { header: 'Pembuat', dataKey: 'creator' },
    { header: 'Rev', dataKey: 'rev' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Tgl Berlaku', dataKey: 'effectiveDate' },
  ];

  const tableRows = documents.map((d, i) => ({
    no: i + 1,
    docNumber: d.docNumber,
    title: d.title,
    type: d.type,
    dept: d.department,
    creator: d.creator,
    rev: d.revision,
    status: d.status,
    effectiveDate: formatDocumentDate(d.effectiveDate || d.createdDate),
  }));

  applyAutoTable(doc, {
    startY: 95,
    columns: tableColumns,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 26, 48],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      no: { cellWidth: 25, halign: 'center' },
      docNumber: { cellWidth: 130, fontStyle: 'bold' },
      title: { cellWidth: 230 },
      type: { cellWidth: 45, halign: 'center' },
      dept: { cellWidth: 55, halign: 'center' },
      creator: { cellWidth: 90 },
      rev: { cellWidth: 35, halign: 'center' },
      status: { cellWidth: 70, halign: 'center' },
      effectiveDate: { cellWidth: 75, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount} | ${company} Document Control System - Confidential`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    }
  });

  doc.save(`Master_Document_Register_${compCode}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Helper untuk memuat gambar dari URL menjadi base64 Data URL (agar kompatibel dengan jsPDF)
 */
async function loadBase64Image(url) {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Generate PDF Dokumen Terkendali Resmi dengan Kop Surat Standar ISO 9001
 * Mendukung 2 mode tata letak:
 * 1. 'header' : Kop Surat resmi langsung di atas lembar naskah/tabel
 * 2. 'cover'  : 1 lembar Halaman Cover Depan resmi terpisah di Halaman 1, naskah/tabel di Halaman 2+
 */
export async function exportControlledDocumentPDF(docData, systemSettings = {}, qrDataUrl = null, options = {}) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const isCoverMode = options?.layoutMode === 'cover';

  const compCode = (docData.companyCode || (docData.docNumber?.startsWith('UMI') ? 'UMI' : docData.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
  const company = docData.companyName || (
    compCode === 'UMI' ? 'PT ULTIMO MODA INDOTEX' :
    compCode === 'IMK' ? 'PT IMK' :
    (systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX')
  );
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;

  const targetLogoUrl = options?.logoUrl || docData.logoUrl || (compCode === 'DJI' ? '/dji-logo.png' : null);
  let logoDataUrl = null;
  if (targetLogoUrl) {
    logoDataUrl = await loadBase64Image(targetLogoUrl);
  }

  const startX = 40;
  const startY = 32;
  const boxWidth = width - 80;
  const headerH = 65;

  // Helper watermark diagonal
  const drawWatermark = () => {
    doc.saveGraphicsState();
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    if (docData.status === 'AKTIF') {
      doc.setTextColor(224, 242, 254);
    } else if (docData.status === 'OBSOLETE') {
      doc.setTextColor(254, 226, 226);
    } else {
      doc.setTextColor(241, 245, 249);
    }
    const watermarkText = docData.status === 'AKTIF'
      ? `CONTROLLED COPY - ${company}`
      : (docData.status === 'OBSOLETE' ? 'OBSOLETE - SUPERSEDED' : 'DRAFT - UNCONTROLLED');
    
    doc.text(watermarkText, width / 2, height / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  };

  // Helper running header halaman 2+ (desain resmi berornamen sudut sesuai cover)
  const drawRunningHeader = () => {
    // a. Garis Pita Cyan di tepi atas kanan (mulai dari ~29.5% lebar halaman hingga tepi kanan)
    const cyanBarH = width * (21 / 698); // ~18pt pada A4
    const cyanBarX = width * 0.295;
    const cyanBarW = width - cyanBarX;
    doc.setFillColor(0, 175, 239);
    doc.rect(cyanBarX, 0, cyanBarW, cyanBarH, 'F');

    // b. Pita Diagonal Amber/Kuning di sudut kanan atas (memotong pita cyan)
    doc.setFillColor(255, 192, 0);
    const amberX1 = width * 0.827;
    const amberX2 = width * 0.898;
    const amberY1 = width * (34 / 698);
    const amberY2 = width * (59 / 698);
    const pts = [
      [amberX1, 0],
      [amberX2, 0],
      [width, amberY1],
      [width, amberY2]
    ];
    doc.triangle(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], 'F');
    doc.triangle(pts[0][0], pts[0][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1], 'F');

    // c. Logo Perusahaan di Kiri Atas
    const logoMarginL = width * 0.095;
    if (logoDataUrl) {
      try {
        const imgProps = doc.getImageProperties(logoDataUrl);
        const imgAspect = (imgProps.width || 1) / (imgProps.height || 1);
        const maxLW = 85;
        const maxLH = 28;
        let lW = maxLW;
        let lH = lW / imgAspect;
        if (lH > maxLH) {
          lH = maxLH;
          lW = lH * imgAspect;
        }
        doc.addImage(logoDataUrl, imgProps.fileType || 'PNG', logoMarginL, 18, lW, lH);
      } catch (e) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 42, 78);
        doc.text(company, logoMarginL, 28);
      }
    } else if (compCode === 'UMI') {
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(logoMarginL, 18, 82, 20, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('ULTIMO MODA', logoMarginL + 41, 18 + 13, { align: 'center' });
    } else if (compCode === 'IMK') {
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(logoMarginL, 18, 82, 20, 3, 3, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PT IMK', logoMarginL + 41, 18 + 13, { align: 'center' });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 42, 78);
      doc.text(company, logoMarginL, 28);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Infinite Creativity & Productivity', logoMarginL, 38);
    }

    // d. Judul Dokumen & Nomor Dokumen (Rata kanan ke batas 0.868*w)
    const textRightX = width * 0.868;
    const maxTextW = textRightX - (logoMarginL + 95);
    const rawTitle = String(docData.title || '').toUpperCase();

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 58, 114);
    const splitTitle = doc.splitTextToSize(rawTitle, maxTextW);
    const titleY = width * (48 / 698); // ~41pt pada A4
    doc.text(splitTitle[0] || rawTitle, textRightX, titleY, { align: 'right' });

    const docNumText = docData.revision && !String(docData.docNumber || '').endsWith(docData.revision)
      ? `${docData.docNumber || '-'} (Rev: ${docData.revision})`
      : (docData.docNumber || '-');
    doc.setFontSize(9.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 58, 114);
    const numY = width * (64 / 698); // ~55pt pada A4
    doc.text(docNumText, textRightX, numY, { align: 'right' });
  };

  // =========================================================================
  // PILIHAN MODE 1: 1 LEMBAR COVER DEPAN RESMI ISO 9001
  // Sesuai template grafis modern resmi: logo di kiri ujung atas, ornamen geometris sudut,
  // plakat judul mengambang, nomor dokumen berbingkai, dan identitas perusahaan di kanan bawah.
  // =========================================================================
  if (isCoverMode) {
    // 1. Logo Perusahaan di Kiri Ujung Atas Cover (Proporsional sesuai aspect ratio asli)
    if (logoDataUrl) {
      try {
        const imgProps = doc.getImageProperties(logoDataUrl);
        const imgAspect = (imgProps.width || 1) / (imgProps.height || 1);
        const maxLogoW = 120;
        const maxLogoH = 52;
        let drawW = maxLogoW;
        let drawH = drawW / imgAspect;
        if (drawH > maxLogoH) {
          drawH = maxLogoH;
          drawW = drawH * imgAspect;
        }
        doc.addImage(logoDataUrl, imgProps.fileType || 'PNG', 36, 28, drawW, drawH);
      } catch (e) {
        console.warn('Gagal memuat logo di cover:', e);
      }
    } else if (compCode === 'UMI') {
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(36, 28, 88, 22, 3, 3, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('ULTIMO MODA', 36 + 44, 28 + 14, { align: 'center' });
    } else if (compCode === 'IMK') {
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(36, 28, 88, 22, 3, 3, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PT IMK', 36 + 44, 28 + 14, { align: 'center' });
    } else {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 42, 78);
      doc.text(company, 36, 44);
    }

    // 2. Helper Gambar Poligon dan Garis Vektor Ornamen Sudut Cover ISO
    const drawCoverPoly = (pts, color) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.triangle(pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], 'F');
      doc.triangle(pts[0][0], pts[0][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1], 'F');
    };

    const drawCoverLine = (x1, y1, x2, y2, color, lineWidth = 2) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(lineWidth);
      doc.line(x1, y1, x2, y2);
    };

    const cCyan = [7, 167, 229];
    const cAmber = [252, 183, 80];
    const cNavy = [9, 16, 77];
    const cWhite = [255, 255, 255];

    // Ornamen Sudut Kanan Atas (Top-Right Geometric Accents)
    drawCoverPoly([[289.9, 3.3], [320.5, -27.5], [553.6, 207.2], [523.0, 238.0]], cCyan);
    drawCoverPoly([[353.2, 3.7], [371.9, -15.2], [532.4, 146.3], [513.6, 165.3]], cAmber);
    drawCoverPoly([[371.9, -15.2], [374.0, -17.3], [534.4, 144.3], [532.4, 146.3]], cWhite);
    drawCoverPoly([[394.8, 2.9], [411.6, -14.0], [551.6, 127.0], [534.9, 143.9]], cAmber);
    drawCoverPoly([[459.7, 49.3], [497.3, 11.5], [630.8, 145.9], [593.2, 183.8]], cNavy);
    drawCoverPoly([[437.7, 99.5], [452.0, 85.1], [607.9, 242.1], [593.6, 256.5]], cNavy);
    drawCoverPoly([[517.7, 3.3], [545.9, -25.1], [622.2, 51.8], [594.1, 80.2]], cAmber);
    drawCoverPoly([[576.5, 3.3], [585.5, -5.8], [603.4, 12.3], [594.5, 21.4]], cCyan);
    drawCoverLine(467.1, 154.6, 536.9, 224.9, cNavy, 2.0);

    // Ornamen Sudut Kiri Bawah (Bottom-Left Geometric Accents)
    drawCoverPoly([[0.8, 744.1], [75.9, 668.4], [216.4, 809.8], [141.3, 885.5]], cNavy);
    drawCoverPoly([[-53.1, 569.8], [0.4, 515.9], [198.8, 715.7], [145.3, 769.5]], cAmber);
    drawCoverPoly([[-14.3, 758.4], [0.0, 744.1], [95.9, 840.7], [81.7, 855.0]], cCyan);
    drawCoverPoly([[-13.9, 701.3], [2.4, 684.9], [30.2, 712.8], [13.9, 729.3]], cCyan);
    drawCoverPoly([[149.4, 804.1], [180.1, 773.2], [246.6, 840.2], [216.0, 871.1]], cCyan);
    drawCoverLine(36.3, 645.8, 113.9, 723.9, cWhite, 2.5);
    drawCoverLine(193.5, 752.3, 282.1, 841.5, cNavy, 2.0);

    // 3. Plakat Judul Mengambang di Tengah Halaman (Central Title Plaque)
    const cardW = 430;
    const cardH = 76;
    const cardX = (width - cardW) / 2;
    const cardY = 372;

    // Drop shadow halus di bawah plakat
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cardX + 2, cardY + 2, cardW, cardH, 4, 4, 'F');

    // Plakat Putih Utama
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1.0);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD');

    // Bevel garis dalam halus
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.roundedRect(cardX + 2.5, cardY + 2.5, cardW - 5, cardH - 5, 2.5, 2.5, 'D');

    // Tipe Dokumen (Bold, Underlined)
    const typeFullName = getDocumentTypeFullName(docData);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(typeFullName.toUpperCase(), width / 2, cardY + 30, { align: 'center' });

    const typeTextW = doc.getTextWidth(typeFullName.toUpperCase());
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.2);
    doc.line(width / 2 - typeTextW / 2, cardY + 33, width / 2 + typeTextW / 2, cardY + 33);

    // Judul Dokumen (Bold)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const rawTitleStr = (docData.title || 'DOKUMEN TERKENDALI').toUpperCase();
    const splitTitleStr = doc.splitTextToSize(rawTitleStr, cardW - 30);
    doc.text(splitTitleStr[0] || rawTitleStr, width / 2, cardY + 56, { align: 'center' });

    // 4. Kotak Nomor Dokumen Berbingkai (Framed Pill Box)
    const pillW = 190;
    const pillH = 36;
    const pillX = (width - pillW) / 2;
    const pillY = cardY + cardH + 16;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pillX + 2, pillY + 2, pillW, pillH, 4, 4, 'F');

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(1.0);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pillX, pillY, pillW, pillH, 4, 4, 'FD');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.6);
    doc.roundedRect(pillX + 2, pillY + 2, pillW - 4, pillH - 4, 2.5, 2.5, 'D');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(docData.docNumber || '-', width / 2, pillY + 23, { align: 'center' });

    // 5. Nama Perusahaan di Kanan Bawah Cover
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(company.toUpperCase(), width - 36, height - 38, { align: 'right' });

    // Pindah ke Halaman 2 untuk Isi Dokumen Asli
    doc.addPage();
    drawWatermark();
    drawRunningHeader();
  } else {
    // =========================================================================
    // PILIHAN MODE 2: KOP SURAT LANGSUNG DI ATAS DOKUMEN (Header Mode)
    // =========================================================================
    drawWatermark();

    // --- KOLOM 1 (KIRI): LOGO PERUSAHAAN (Proporsional sesuai aspect ratio asli) ---
    if (logoDataUrl) {
      try {
        const imgProps = doc.getImageProperties(logoDataUrl);
        const imgAspect = (imgProps.width || 1) / (imgProps.height || 1);
        const maxLogoW = 95;
        const maxLogoH = 36;
        let drawW = maxLogoW;
        let drawH = drawW / imgAspect;
        if (drawH > maxLogoH) {
          drawH = maxLogoH;
          drawW = drawH * imgAspect;
        }
        const logoY = startY + 4 + (36 - drawH) / 2;
        doc.addImage(logoDataUrl, imgProps.fileType || 'PNG', startX, logoY, drawW, drawH);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(company, startX, startY + 48);
      } catch (err) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 42, 78);
        doc.text(company, startX, startY + 28);
      }
    } else if (compCode === 'UMI') {
      doc.setFillColor(79, 70, 229);
      doc.roundedRect(startX, startY + 12, 85, 20, 3, 3, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('ULTIMO MODA', startX + 42.5, startY + 25, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('PT Ultimo Moda Indotex', startX, startY + 44);
    } else if (compCode === 'IMK') {
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(startX, startY + 12, 85, 20, 3, 3, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PT IMK', startX + 42.5, startY + 25, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('PT Inti Mulia Knitting', startX, startY + 44);
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 42, 78);
      doc.text(company, startX, startY + 28);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('Infinite Creativity & Productivity', startX, startY + 42);
    }

    // --- KOLOM 3 (KANAN): QR CODE & METADATA ISO ---
    const qrSize = 44;
    const qrX = startX + boxWidth - qrSize;
    const qrY = startY + (headerH - qrSize) / 2;

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (e) {}
    }

    const metaRightX = qrDataUrl ? (qrX - 12) : (startX + boxWidth);
    const metaWidth = 125;
    const metaStartX = metaRightX - metaWidth;
    const metaValX = metaStartX + 54;

    doc.setFontSize(7.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('No. Dokumen :', metaStartX, startY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(docData.docNumber || '-', metaValX, startY + 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Revisi :', metaStartX, startY + 26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(docData.revision || '00'), metaValX, startY + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Departemen :', metaStartX, startY + 37);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(docData.department || '-', metaValX, startY + 37);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Tgl. Terbit :', metaStartX, startY + 48);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatDocumentDate(docData.effectiveDate || docData.createdDate), metaValX, startY + 48);

    // --- KOLOM 2 (TENGAH): KLASIFIKASI DOKUMEN & JUDUL ---
    const centerLeftX = startX + 115;
    const centerRightX = metaStartX - 10;
    const centerX = centerLeftX + (centerRightX - centerLeftX) / 2;
    const maxTitleW = centerRightX - centerLeftX - 12;

    const typeStr = getDocumentTypeFullName(docData);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(typeStr, centerX, startY + 22, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize((docData.title || '').toUpperCase(), maxTitleW);
    doc.text(splitTitle, centerX, startY + 38, { align: 'center' });

    // Garis Pemisah Hairline Bersih di Bawah Kop Surat (Tanpa Kotak Sangkar)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.line(startX, startY + headerH, startX + boxWidth, startY + headerH);
  }

  // =========================================================================
  // ISI DOKUMEN: TABEL SPREADSHEET ATAU NASKAH TEKS
  // =========================================================================
  const excelRows = options?.excelRows || docData?.excelRows;
  const hasExcelRows = Boolean(excelRows && Array.isArray(excelRows) && excelRows.length > 0);

  if (hasExcelRows) {
    const validRows = excelRows.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''));
    
    if (validRows.length > 0) {
      const rawHeaders = validRows[0] || [];
      const maxCols = validRows.reduce((max, r) => Math.max(max, r?.length || 0), rawHeaders.length || 1);
      
      const headers = Array.from({ length: maxCols }, (_, idx) => {
        const val = rawHeaders[idx];
        return (val !== null && val !== undefined && String(val).trim() !== '') 
          ? String(val) 
          : `Kolom ${String.fromCharCode(65 + (idx % 26))}`;
      });

      const bodyData = validRows.slice(1).map(row => {
        return Array.from({ length: maxCols }, (_, idx) => {
          const val = row[idx];
          return (val !== null && val !== undefined) ? String(val) : '';
        });
      });

      const sheetTitle = options?.excelSheetName || docData?.excelSheetName || 'Sheet1';
      const startTableY = isCoverMode ? 62 : (startY + headerH + 26);

      // Label Header Excel Emerald (Kiri: Nama Sheet, Kanan: Jumlah Baris Terverifikasi)
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 124, 65);
      doc.text(`LEMBAR SPREADSHEET TERKENDALI: ${sheetTitle.toUpperCase()}`, startX, startTableY - 8);
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`(${bodyData.length} Baris Data Terverifikasi ISO 9001)`, startX + boxWidth, startTableY - 8, { align: 'right' });

      // Format alignment kolom secara cerdas (ID ke tengah, angka ke kanan, teks ke kiri)
      const columnStyles = {};
      headers.forEach((h, colIdx) => {
        const colVals = bodyData.map(r => r[colIdx]).filter(v => v !== '');
        const isAllNumber = colVals.length > 0 && colVals.every(v => !isNaN(Number(v)) && typeof v !== 'boolean');
        const isId = /^(id|kode|no|nip|nik|code)/i.test(h.trim());
        if (isAllNumber) {
          columnStyles[colIdx] = { halign: 'right' };
        } else if (isId) {
          columnStyles[colIdx] = { halign: 'center' };
        } else {
          columnStyles[colIdx] = { halign: 'left' };
        }
      });

      applyAutoTable(doc, {
        startY: startTableY,
        head: [headers.map(h => h.toUpperCase())],
        body: bodyData,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 6,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [16, 124, 65], // Excel Green #107c41
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles,
        margin: { left: startX, right: startX },
        didDrawPage: (data) => {
          if (isCoverMode && data.pageNumber > 1) {
            drawRunningHeader();
          }
        }
      });
    }
  } else {
    // Naskah Dokumen Teks Standar
    let contentY = isCoverMode ? 62 : (startY + headerH + 28);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 42, 78);
    doc.text('1. TUJUAN & RUANG LINGKUP', startX, contentY);

    contentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const scopeText = `Dokumen ${docData.docNumber} (${docData.title}) ini diterbitkan secara resmi sebagai pedoman baku operasional pada departemen ${docData.department} ${company} guna menjamin kualitas dan standardisasi sistem manajemen mutu ISO 9001:2015.`;
    const splitScope = doc.splitTextToSize(scopeText, boxWidth);
    doc.text(splitScope, startX, contentY);

    contentY += splitScope.length * 12 + 15;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 42, 78);
    doc.text('2. URAIAN PROSEDUR & KETENTUAN TEKNIS', startX, contentY);

    contentY += 14;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const mainContent = docData.content || `2.1 Seluruh personel terkait pada departemen ${docData.department} wajib memahami dan mengimplementasikan seluruh ketentuan pada dokumen ini.\n2.2 Pemantauan dan evaluasi kepatuhan operasional dilaksanakan secara berkala oleh Document Control Officer (DCO).\n2.3 Dokumen ini berstatus resmi terkendali (${docData.status}) dan diawasi di bawah naungan Document Control System.`;
    const splitMain = doc.splitTextToSize(mainContent, boxWidth);
    doc.text(splitMain, startX, contentY);
  }

  // 4. Matriks Otorisasi & Rekam Jejak Pengesahan ISO (Prepared, Reviewed, Approved)
  // Mode Cover sudah memiliki matriks otorisasi formal di Halaman 1; Mode Header menampilkannya di dasar naskah
  if (!isCoverMode) {
    const matH = 75;
    const bottomMatrixY = height - 130;
    let matrixY;

    if (doc.lastAutoTable) {
      const afterTableY = doc.lastAutoTable.finalY + 25;
      if (afterTableY <= bottomMatrixY) {
        // Jika tabel ringkas (seperti 1-10 baris), jangkar matriks ke bagian bawah halaman agar tata letak seimbang
        matrixY = bottomMatrixY;
      } else if (afterTableY + matH <= height - 30) {
        // Jika tabel agak panjang tapi masih muat di halaman yang sama sebelum footer
        matrixY = afterTableY;
      } else {
        // Jika tabel panjang dan melebihi halaman, tambahkan halaman baru khusus pengesahan
        doc.addPage();
        drawWatermark();
        matrixY = 45;
      }
    } else {
      matrixY = bottomMatrixY;
    }

    const matColW = boxWidth / 3;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.8);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(startX, matrixY, boxWidth, matH, 3, 3, 'FD');

    doc.line(startX + matColW, matrixY, startX + matColW, matrixY + matH);
    doc.line(startX + matColW * 2, matrixY, startX + matColW * 2, matrixY + matH);
    doc.line(startX, matrixY + 18, startX + boxWidth, matrixY + 18);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DIBUAT OLEH (PREPARED)', startX + matColW / 2, matrixY + 12, { align: 'center' });
    doc.text('DITINJAU OLEH (REVIEWED)', startX + matColW + matColW / 2, matrixY + 12, { align: 'center' });
    doc.text('DISETUJUI OLEH (APPROVED)', startX + matColW * 2 + matColW / 2, matrixY + 12, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(docData.creator || 'Pembuat Dokumen', startX + matColW / 2, matrixY + 50, { align: 'center' });
    doc.text(docData.verifiedBy || 'Document Control (DCO)', startX + matColW + matColW / 2, matrixY + 50, { align: 'center' });
    doc.text(docData.approvedBy || docData.targetApprover || 'MR / Dept Head', startX + matColW * 2 + matColW / 2, matrixY + 50, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(docData.creatorPosition || 'Pembuat Dokumen', startX + matColW / 2, matrixY + 63, { align: 'center' });
    doc.text('Verifikator Mutu DCO', startX + matColW + matColW / 2, matrixY + 63, { align: 'center' });
    doc.text(docData.approverPosition || (docData.approvedDate ? `Tgl: ${docData.approvedDate}` : 'Pejabat Penyetuju'), startX + matColW * 2 + matColW / 2, matrixY + 63, { align: 'center' });
  }

  // 5. Footer & Penomoran Halaman pada Semua Halaman
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = (isCoverMode ? 2 : 1); i <= totalPages; i++) {
    doc.setPage(i);
    if (isCoverMode) {
      const footerX = startX;
      const footerW = width - startX * 2;
      // Garis Pita Biru Horizontal
      doc.setFillColor(68, 113, 196); // #4471C4
      doc.rect(footerX, height - 38, footerW, 2.6, 'F');

      // Teks Disclaimer Dua Baris di Kiri
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text('DILARANG MENGGANDAKAN DOKUMEN INI TANPA SEIZIN', footerX, height - 25);
      doc.text(company.toUpperCase(), footerX, height - 15);

      // Nomor Halaman Rata Kanan
      doc.setFontSize(8.5);
      doc.setTextColor(165, 165, 165); // #A5A5A5
      doc.text(String(i), footerX + footerW, height - 19, { align: 'right' });
    } else {
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dokumen Resmi ${company} - Terdaftar pada Document Control System | ISO 9001:2015`, startX, height - 18);
      doc.text(`Halaman ${i} dari ${totalPages}`, width - startX, height - 18, { align: 'right' });
    }
  }

  if (options && options.returnBlob) {
    return doc.output('blob');
  }

  const cleanTitle = (docData.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  const outFileName = `${docData.docNumber}_${cleanTitle}_Resmi_${compCode}.pdf`;
  doc.save(outFileName);
  return outFileName;
}
