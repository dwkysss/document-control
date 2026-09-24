import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Ekspor Data Dokumen ke file Excel (.xlsx)
 */
export function exportToExcel(data, fileName = 'Master_Document_Register') {
  const exportData = data.map((doc, index) => ({
    'No.': index + 1,
    'Nomor Dokumen': doc.docNumber,
    'Judul Dokumen': doc.title,
    'Jenis Dokumen': doc.typeName || doc.type,
    'Departemen': doc.department,
    'Pembuat': `${doc.creator} (${doc.creatorNik || '-'})`,
    'Revisi': doc.revision,
    'Status': doc.status,
    'Tanggal Registrasi': doc.createdDate || '-',
    'Tanggal Efektif': doc.effectiveDate || '-',
    'Tim Verifikator': doc.verifierTeam || '-',
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
export function exportMasterRegisterPDF(documents, systemSettings = {}) {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  const company = systemSettings.companyName || 'PT DJI';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Header Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 26, 48); // Navy
  doc.text(company.startsWith('PT') ? company : `PT ${company}`, 40, 45);

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
    effectiveDate: d.effectiveDate || d.createdDate || '-',
  }));

  doc.autoTable({
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
        `Halaman ${data.pageNumber} dari ${pageCount} | DJI Document Control System - Confidential`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 20,
        { align: 'center' }
      );
    }
  });

  doc.save(`Master_Document_Register_DJI_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generate PDF Dokumen Terkendali Resmi dengan Kop Surat Standar ISO 9001
 */
export function exportControlledDocumentPDF(docData, systemSettings = {}, qrDataUrl = null) {
  const doc = new jsPDF('portrait', 'pt', 'a4');
  const company = systemSettings.companyName || 'PT DJI';
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;

  // Diagonal Watermark
  doc.saveGraphicsState();
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  if (docData.status === 'AKTIF') {
    doc.setTextColor(219, 234, 254); // Light blue
  } else if (docData.status === 'OBSOLETE') {
    doc.setTextColor(254, 226, 226); // Light red
  } else {
    doc.setTextColor(241, 245, 249); // Light gray
  }
  const watermarkText = docData.status === 'AKTIF'
    ? `CONTROLLED COPY - ${company}`
    : (docData.status === 'OBSOLETE' ? 'OBSOLETE - SUPERSEDED' : 'DRAFT - UNCONTROLLED');
  
  // Rotate for diagonal watermark
  doc.text(watermarkText, width / 2, height / 2, {
    align: 'center',
    angle: 45
  });
  doc.restoreGraphicsState();

  // Draw Kop Surat Box (ISO Header Table)
  const startX = 40;
  const startY = 40;
  const boxWidth = width - 80;
  const boxHeight = 75;

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1.5);
  doc.rect(startX, startY, boxWidth, boxHeight);

  // Vertical dividers
  const col1W = 120;
  const col2W = boxWidth - col1W - 140;
  const col3W = 140;

  doc.line(startX + col1W, startY, startX + col1W, startY + boxHeight);
  doc.line(startX + col1W + col2W, startY, startX + col1W + col2W, startY + boxHeight);

  // Column 1: Logo & Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 42, 78);
  doc.text(company, startX + col1W / 2, startY + 42, { align: 'center' });

  // Column 2: Document Title
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text((docData.typeName || docData.type || 'PROSEDUR').toUpperCase(), startX + col1W + col2W / 2, startY + 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const splitTitle = doc.splitTextToSize((docData.title || '').toUpperCase(), col2W - 20);
  doc.text(splitTitle, startX + col1W + col2W / 2, startY + 38, { align: 'center' });

  // Column 3: Metadata Details
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  const metaY = startY + 16;
  doc.text(`No. Dokumen:`, startX + col1W + col2W + 8, metaY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docData.docNumber}`, startX + col1W + col2W + 62, metaY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Revisi:`, startX + col1W + col2W + 8, metaY + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docData.revision}`, startX + col1W + col2W + 62, metaY + 14);

  doc.setFont('helvetica', 'normal');
  doc.text(`Departemen:`, startX + col1W + col2W + 8, metaY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docData.department}`, startX + col1W + col2W + 62, metaY + 28);

  doc.setFont('helvetica', 'normal');
  doc.text(`Tgl. Terbit:`, startX + col1W + col2W + 8, metaY + 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docData.effectiveDate || docData.createdDate}`, startX + col1W + col2W + 62, metaY + 42);

  // Document Content Section
  let contentY = startY + boxHeight + 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 42, 78);
  doc.text('1. TUJUAN & RUANG LINGKUP', startX, contentY);

  contentY += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const scopeText = `Dokumen ${docData.docNumber} (${docData.title}) ini diterbitkan secara resmi sebagai pedoman baku operasional pada departemen ${docData.department} PT DJI Indonesia guna menjamin kualitas dan standardisasi sistem manajemen mutu ISO 9001:2015.`;
  const splitScope = doc.splitTextToSize(scopeText, boxWidth);
  doc.text(splitScope, startX, contentY);

  contentY += splitScope.length * 13 + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 42, 78);
  doc.text('2. URAIAN PROSEDUR & KETENTUAN TEKNIS', startX, contentY);

  contentY += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const mainContent = docData.content || `2.1 Seluruh personel terkait pada departemen ${docData.department} wajib memahami dan mengimplementasikan seluruh ketentuan pada dokumen ini.\n2.2 Pemantauan dan evaluasi kepatuhan operasional dilaksanakan secara berkala oleh Tim Verifikator (${docData.verifierTeam}).\n2.3 Dokumen ini berstatus resmi terkendali (${docData.status}) dan diawasi di bawah naungan Document Control System.`;
  const splitMain = doc.splitTextToSize(mainContent, boxWidth);
  doc.text(splitMain, startX, contentY);

  // Approval Sign-off Box at the Bottom
  const matrixY = height - 160;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(1);
  doc.rect(startX, matrixY, boxWidth, 80);

  const matColW = boxWidth / 3;
  doc.line(startX + matColW, matrixY, startX + matColW, matrixY + 80);
  doc.line(startX + matColW * 2, matrixY, startX + matColW * 2, matrixY + 80);

  // Top sub-header in matrix
  doc.line(startX, matrixY + 20, startX + boxWidth, matrixY + 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DIBUAT OLEH (PREPARED)', startX + matColW / 2, matrixY + 14, { align: 'center' });
  doc.text('DITINJAU OLEH (REVIEWED)', startX + matColW + matColW / 2, matrixY + 14, { align: 'center' });
  doc.text('DISETUJUI OLEH (APPROVED)', startX + matColW * 2 + matColW / 2, matrixY + 14, { align: 'center' });

  // Signature & Names
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  const approverStatusText = docData.approvedBy ? `[VERIFIED] ${docData.approvedBy}` : (docData.targetApprover ? `[PENDING] ${docData.targetApprover}` : (docData.status === 'AKTIF' ? 'Management Rep.' : '-'));
  const approverNameText = docData.approvedBy || docData.targetApprover || 'MR / Dept Head';
  const approverPosText = docData.approvedDate ? `Tgl: ${docData.approvedDate}` : (docData.approverPosition || 'Pejabat Penyetuju');

  doc.text(docData.creator || 'Staff', startX + matColW / 2, matrixY + 45, { align: 'center' });
  doc.text(docData.verifierTeam || 'Verifier Team', startX + matColW + matColW / 2, matrixY + 45, { align: 'center' });
  doc.text(approverStatusText, startX + matColW * 2 + matColW / 2, matrixY + 45, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(docData.creator, startX + matColW / 2, matrixY + 65, { align: 'center' });
  doc.text('Tim Verifikator', startX + matColW + matColW / 2, matrixY + 65, { align: 'center' });
  doc.text(approverNameText, startX + matColW * 2 + matColW / 2, matrixY + 65, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(docData.creatorPosition || 'Pembuat Dokumen', startX + matColW / 2, matrixY + 74, { align: 'center' });
  doc.text(docData.verifierTeam, startX + matColW + matColW / 2, matrixY + 74, { align: 'center' });
  doc.text(approverPosText, startX + matColW * 2 + matColW / 2, matrixY + 74, { align: 'center' });

  // QR Code on bottom left
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', startX, height - 70, 45, 45);
    } catch (e) {}
  }

  // Footer text
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Dokumen Resmi ${company} - Terdaftar pada Document Control System | ISO 9001:2015`, startX + (qrDataUrl ? 55 : 0), height - 40);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} | Halaman 1 dari 1`, startX + (qrDataUrl ? 55 : 0), height - 28);

  doc.save(`${docData.docNumber}_Resmi_${company}.pdf`);
}
