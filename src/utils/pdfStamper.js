import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { exportControlledDocumentPDF } from './exportUtils';

/**
 * Helper to convert base64 data URL to Uint8Array
 */
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper pemformat tanggal resmi ISO (hanya tanggal, bulan, tahun - tanpa detail jam)
 */
function formatDocumentDate(value) {
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
 * Universal loader: fetch PDF bytes from any URL (data:, blob:, http:, or relative)
 */
async function getPdfBytes(fileUrl) {
  if (!fileUrl) throw new Error('File URL is empty');
  if (fileUrl.startsWith('data:')) {
    return dataUrlToUint8Array(fileUrl);
  }
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Gagal mengambil berkas PDF (HTTP ${res.status})`);
  const arrayBuf = await res.arrayBuffer();
  return new Uint8Array(arrayBuf);
}

/**
 * Triggers safe browser download with a verified filename
 */
export function downloadBlobAsFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Mengubah kode tipe dokumen singkatan menjadi kepanjangan nama resmi standar ISO 9001
 * Contoh: 'IK' -> 'INSTRUKSI KERJA (IK)', 'SOP' -> 'STANDAR OPERASIONAL PROSEDUR (SOP)'
 */
export function getDocumentTypeFullName(docData = {}) {
  const typeCode = (docData.type || '').toUpperCase().trim();
  const rawTypeName = (docData.typeName || '').trim();

  // Mapping singkatan resmi ISO ke kepanjangan lengkapnya
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

  // 1. Cek dari mapping kode utama
  if (typeCode && standardTypeMap[typeCode]) {
    return standardTypeMap[typeCode];
  }

  // 2. Jika ada typeName yang sudah panjang (misal 'Instruksi Kerja (Work Instruction)')
  if (rawTypeName && rawTypeName.length > 3) {
    const upperName = rawTypeName.toUpperCase();
    if (typeCode && !upperName.includes(`(${typeCode})`)) {
      return `${upperName} (${typeCode})`;
    }
    return upperName;
  }

  // 3. Fallback deteksi dari format nomor dokumen ISO (contoh: DJI-IK-IT-02-00)
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
 * Stempel Kop Surat PT DJI, Watermark Keamanan, dan Matriks Tanda Tangan
 * langsung ke atas berkas PDF asli yang diunggah pengguna (mempertahankan seluruh halaman dokumen asli).
 */
export async function stampOfficialLetterheadOnPDF(docData, systemSettings = {}, qrDataUrl = null, options = {}) {
  const compCode = (docData.companyCode || (docData.docNumber?.startsWith('UMI') ? 'UMI' : docData.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
  const companyName = docData.companyName || (
    compCode === 'UMI' ? 'PT ULTIMO MODA INDOTEX' :
    compCode === 'IMK' ? 'PT IMK' :
    (systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX')
  );
  const cleanTitle = (docData.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  const officialFileName = `${docData.docNumber}_${cleanTitle}_Resmi_${compCode}.pdf`;

  const fileNameLower = (docData.fileName || '').toLowerCase();
  const fileTypeLower = (docData.fileType || '').toLowerCase();
  const fileUrl = docData.fileUrl || '';

  // Deteksi jenis berkas secara akurat (jangan anggap semua blob: adalah PDF)
  const isExcel = Boolean(
    fileTypeLower.includes('spreadsheet') ||
    fileTypeLower.includes('excel') ||
    fileTypeLower.includes('csv') ||
    fileNameLower.endsWith('.xlsx') ||
    fileNameLower.endsWith('.xls') ||
    fileNameLower.endsWith('.csv')
  );
  const isWord = Boolean(
    fileTypeLower.includes('word') ||
    fileTypeLower.includes('document') ||
    fileNameLower.endsWith('.docx') ||
    fileNameLower.endsWith('.doc')
  );
  const isPdf = Boolean(
    !isExcel && !isWord && fileUrl && (
      fileUrl.startsWith('data:application/pdf') ||
      fileTypeLower === 'application/pdf' ||
      /\.pdf($|\?)/i.test(fileUrl) ||
      fileNameLower.endsWith('.pdf')
    )
  );

  // Jika memang tidak ada berkas PDF yang diunggah (misal Excel/Word/Text), buat PDF naskah standar ISO dari nol
  if (!isPdf) {
    const targetLogo = options?.logoUrl || docData.logoUrl || (compCode === 'DJI' ? '/dji-logo.png' : null);
    const result = await exportControlledDocumentPDF(docData, systemSettings, qrDataUrl, {
      ...options,
      excelRows: options?.excelRows || docData.excelRows,
      excelSheetName: options?.excelSheetName || docData.excelSheetName,
      logoUrl: targetLogo,
    });
    if (options && options.returnBlob) {
      return result;
    }
    return officialFileName;
  }

  try {
    // 1. Muat dokumen PDF asli pengguna
    const originalPdfBytes = await getPdfBytes(fileUrl);
    const srcDoc = await PDFDocument.load(originalPdfBytes);
    const pdfDoc = await PDFDocument.create();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 2. Muat Logo Resmi Perusahaan untuk Kop Surat
    let logoImg = null;
    const targetLogo = options?.logoUrl || docData.logoUrl || (compCode === 'DJI' ? '/dji-logo.png' : null);
    if (targetLogo) {
      try {
        if (targetLogo.startsWith('data:image/png')) {
          const logoBytes = dataUrlToUint8Array(targetLogo);
          logoImg = await pdfDoc.embedPng(logoBytes);
        } else if (targetLogo.startsWith('data:image/jpeg') || targetLogo.startsWith('data:image/jpg')) {
          const logoBytes = dataUrlToUint8Array(targetLogo);
          logoImg = await pdfDoc.embedJpg(logoBytes);
        } else if (targetLogo.startsWith('http') || targetLogo.startsWith('/')) {
          const logoRes = await fetch(targetLogo);
          if (logoRes.ok) {
            const logoBytes = await logoRes.arrayBuffer();
            logoImg = await pdfDoc.embedPng(new Uint8Array(logoBytes));
          }
        }
      } catch (err) {
        console.warn('Could not load logo for PDF stamping:', err);
      }
    }

    // 3. Muat QR Code jika ada
    let qrImage = null;
    if (qrDataUrl) {
      try {
        const qrBytes = dataUrlToUint8Array(qrDataUrl);
        qrImage = await pdfDoc.embedPng(qrBytes);
      } catch (e) {
        console.warn('Failed to embed QR code in PDF stamp:', e);
      }
    }

    // Tentukan warna dan teks Watermark Terkendali
    let watermarkText = `CONTROLLED COPY - ${companyName}`;
    let wmColor = rgb(0.1, 0.4, 0.85); // Blue
    if (docData.status === 'OBSOLETE') {
      watermarkText = 'OBSOLETE - DO NOT USE';
      wmColor = rgb(0.9, 0.2, 0.2); // Red
    } else if (docData.status === 'DRAFT' || docData.status === 'REVIEW' || docData.status === 'VERIFIKASI' || docData.status === 'APPROVAL' || docData.status === 'PERLU REVISI') {
      watermarkText = docData.status === 'REVIEW'
        ? 'MENUNGGU REVIEW ATASAN / UNDER REVIEW'
        : docData.status === 'VERIFIKASI'
        ? 'MENUNGGU VERIFIKASI DCO / UNVERIFIED'
        : docData.status === 'APPROVAL'
        ? 'MENUNGGU PENGESAHAN MR / PENDING APPROVAL'
        : 'DRAFT - NOT FOR OPERATIONAL USE';
      wmColor = rgb(0.85, 0.5, 0.1); // Amber
    }

    // =========================================================================
    // =========================================================================
    // DUA PILIHAN TATA LETAK RESMI ISO 9001:
    // 1. Mode 'cover'  : 1 Lembar Cover Depan ISO formal di Halaman 1, naskah asli di Hal 2+
    // 2. Mode 'header' : Kop Surat resmi langsung disematkan di atas lembar naskah asli
    // =========================================================================
    const isCoverMode = options?.layoutMode === 'cover';
    const shouldAddLetterhead = docData.includeLetterhead !== false;
    const totalPages = srcDoc.getPageCount();
    const finalTotalPages = isCoverMode ? totalPages + 1 : totalPages;
    const embeddedPages = await pdfDoc.embedPages(srcDoc.getPages());

    // JIKA MODE COVER: Tambahkan 1 Lembar Halaman Cover Depan Formal ISO di Halaman 1
    // Sesuai template grafis modern resmi: logo di kiri ujung atas, ornamen geometris sudut,
    // plakat judul mengambang, nomor dokumen berbingkai, dan identitas perusahaan di kanan bawah.
    if (isCoverMode) {
      const firstSrcPage = srcDoc.getPage(0);
      const { width: covW, height: covH } = firstSrcPage.getSize();
      const coverPage = pdfDoc.addPage([covW, covH]);

      // 1. Logo Perusahaan di Kiri Ujung Atas Cover
      if (logoImg) {
        const logoAspect = logoImg.width / logoImg.height;
        const maxLogoW = 120;
        const maxLogoH = 52;
        let lW = maxLogoW;
        let lH = lW / logoAspect;
        if (lH > maxLogoH) {
          lH = maxLogoH;
          lW = lH * logoAspect;
        }
        coverPage.drawImage(logoImg, {
          x: 36,
          y: covH - 28 - lH,
          width: lW,
          height: lH,
        });
      } else if (compCode === 'UMI') {
        coverPage.drawRectangle({
          x: 36,
          y: covH - 28 - 22,
          width: 88,
          height: 22,
          color: rgb(79 / 255, 70 / 255, 229 / 255),
        });
        coverPage.drawText('ULTIMO MODA', {
          x: 36 + 12,
          y: covH - 28 - 15,
          size: 8.5,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });
      } else if (compCode === 'IMK') {
        coverPage.drawRectangle({
          x: 36,
          y: covH - 28 - 22,
          width: 88,
          height: 22,
          color: rgb(5 / 255, 150 / 255, 105 / 255),
        });
        coverPage.drawText('PT IMK', {
          x: 36 + 24,
          y: covH - 28 - 15,
          size: 8.5,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        });
      } else {
        coverPage.drawText(companyName, {
          x: 36,
          y: covH - 42,
          size: 13,
          font: helveticaBold,
          color: rgb(16 / 255, 42 / 255, 78 / 255),
        });
      }

      // 2. Ornamen Geometris Sudut Kanan Atas & Kiri Bawah (Exact Vector Shapes via SVG Path)
      const cCyan = rgb(7 / 255, 167 / 255, 229 / 255);
      const cAmber = rgb(252 / 255, 183 / 255, 80 / 255);
      const cNavy = rgb(9 / 255, 16 / 255, 77 / 255);
      const cWhite = rgb(1, 1, 1);

      // Ornamen Sudut Kanan Atas (Top-Right Geometric Accents)
      coverPage.drawSvgPath('M 289.9 3.3 L 320.5 -27.5 L 553.6 207.2 L 523.0 238.0 Z', { x: 0, y: covH, color: cCyan }); // Cyan Main
      coverPage.drawSvgPath('M 353.2 3.7 L 371.9 -15.2 L 532.4 146.3 L 513.6 165.3 Z', { x: 0, y: covH, color: cAmber }); // Amber Lower
      coverPage.drawSvgPath('M 371.9 -15.2 L 374.0 -17.3 L 534.4 144.3 L 532.4 146.3 Z', { x: 0, y: covH, color: cWhite }); // White Hairline
      coverPage.drawSvgPath('M 394.8 2.9 L 411.6 -14.0 L 551.6 127.0 L 534.9 143.9 Z', { x: 0, y: covH, color: cAmber }); // Amber Upper
      coverPage.drawSvgPath('M 459.7 49.3 L 497.3 11.5 L 630.8 145.9 L 593.2 183.8 Z', { x: 0, y: covH, color: cNavy }); // Navy Main Block
      coverPage.drawSvgPath('M 437.7 99.5 L 452.0 85.1 L 607.9 242.1 L 593.6 256.5 Z', { x: 0, y: covH, color: cNavy }); // Navy Lower Bar
      coverPage.drawSvgPath('M 517.7 3.3 L 545.9 -25.1 L 622.2 51.8 L 594.1 80.2 Z', { x: 0, y: covH, color: cAmber }); // Amber Corner
      coverPage.drawSvgPath('M 576.5 3.3 L 585.5 -5.8 L 603.4 12.3 L 594.5 21.4 Z', { x: 0, y: covH, color: cCyan }); // Cyan Tip
      coverPage.drawLine({ start: { x: 467.1, y: covH - 154.6 }, end: { x: 536.9, y: covH - 224.9 }, color: cNavy, thickness: 2.0 }); // Navy Hairline

      // Ornamen Sudut Kiri Bawah (Bottom-Left Geometric Accents)
      coverPage.drawSvgPath('M 0.8 744.1 L 75.9 668.4 L 216.4 809.8 L 141.3 885.5 Z', { x: 0, y: covH, color: cNavy }); // Navy Main Block
      coverPage.drawSvgPath('M -53.1 569.8 L 0.4 515.9 L 198.8 715.7 L 145.3 769.5 Z', { x: 0, y: covH, color: cAmber }); // Amber Main
      coverPage.drawSvgPath('M -14.3 758.4 L 0.0 744.1 L 95.9 840.7 L 81.7 855.0 Z', { x: 0, y: covH, color: cCyan }); // Cyan Corner Stripe
      coverPage.drawSvgPath('M -13.9 701.3 L 2.4 684.9 L 30.2 712.8 L 13.9 729.3 Z', { x: 0, y: covH, color: cCyan }); // Cyan Tab 1
      coverPage.drawSvgPath('M 149.4 804.1 L 180.1 773.2 L 246.6 840.2 L 216.0 871.1 Z', { x: 0, y: covH, color: cCyan }); // Cyan Tab 2
      coverPage.drawLine({ start: { x: 36.3, y: covH - 645.8 }, end: { x: 113.9, y: covH - 723.9 }, color: cWhite, thickness: 2.5 }); // White Hairline
      coverPage.drawLine({ start: { x: 193.5, y: covH - 752.3 }, end: { x: 282.1, y: covH - 841.5 }, color: cNavy, thickness: 2.0 }); // Navy Hairline

      // 3. Plakat Judul Mengambang di Tengah Halaman (Central Title Plaque)
      const cardW = 430;
      const cardH = 76;
      const cardX = (covW - cardW) / 2;
      const cardY = covH - 372 - cardH;

      // Drop shadow halus di bawah plakat
      coverPage.drawRectangle({
        x: cardX + 2,
        y: cardY - 2,
        width: cardW,
        height: cardH,
        color: rgb(241 / 255, 245 / 255, 249 / 255),
      });

      // Plakat Putih Utama
      coverPage.drawRectangle({
        x: cardX,
        y: cardY,
        width: cardW,
        height: cardH,
        color: rgb(1, 1, 1),
        borderColor: rgb(203 / 255, 213 / 255, 225 / 255),
        borderWidth: 1.0,
      });

      // Bevel garis dalam halus
      coverPage.drawRectangle({
        x: cardX + 2.5,
        y: cardY + 2.5,
        width: cardW - 5,
        height: cardH - 5,
        borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
        borderWidth: 0.6,
      });

      // Tipe Dokumen (Bold, Underlined)
      const typeFullName = getDocumentTypeFullName(docData).toUpperCase();
      const typeW = helveticaBold.widthOfTextAtSize(typeFullName, 14);
      coverPage.drawText(typeFullName, {
        x: (covW - typeW) / 2,
        y: cardY + cardH - 26,
        size: 14,
        font: helveticaBold,
        color: rgb(15 / 255, 23 / 255, 42 / 255),
      });

      coverPage.drawLine({
        start: { x: (covW - typeW) / 2, y: cardY + cardH - 29 },
        end: { x: (covW + typeW) / 2, y: cardY + cardH - 29 },
        color: rgb(15 / 255, 23 / 255, 42 / 255),
        thickness: 1.2,
      });

      // Judul Dokumen (Bold)
      const titleStr = (docData.title || 'DOKUMEN TERKENDALI').toUpperCase();
      const titleW = helveticaBold.widthOfTextAtSize(titleStr, 16);
      coverPage.drawText(titleStr, {
        x: Math.max(cardX + 12, (covW - titleW) / 2),
        y: cardY + cardH - 54,
        size: 16,
        font: helveticaBold,
        color: rgb(30 / 255, 41 / 255, 59 / 255),
      });

      // 4. Kotak Nomor Dokumen Berbingkai (Framed Pill Box)
      const pillW = 190;
      const pillH = 36;
      const pillX = (covW - pillW) / 2;
      const pillY = cardY - 16 - pillH;

      coverPage.drawRectangle({
        x: pillX + 2,
        y: pillY - 2,
        width: pillW,
        height: pillH,
        color: rgb(241 / 255, 245 / 255, 249 / 255),
      });

      coverPage.drawRectangle({
        x: pillX,
        y: pillY,
        width: pillW,
        height: pillH,
        color: rgb(1, 1, 1),
        borderColor: rgb(203 / 255, 213 / 255, 225 / 255),
        borderWidth: 1.0,
      });

      coverPage.drawRectangle({
        x: pillX + 2,
        y: pillY + 2,
        width: pillW - 4,
        height: pillH - 4,
        borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
        borderWidth: 0.6,
      });

      const docNumStr = String(docData.docNumber || '-');
      const docNumW = helveticaBold.widthOfTextAtSize(docNumStr, 14);
      coverPage.drawText(docNumStr, {
        x: (covW - docNumW) / 2,
        y: pillY + 11,
        size: 14,
        font: helveticaBold,
        color: rgb(15 / 255, 23 / 255, 42 / 255),
      });

      // 5. Nama Perusahaan di Kanan Bawah Cover
      const compText = companyName.toUpperCase();
      const compW = helvetica.widthOfTextAtSize(compText, 11);
      coverPage.drawText(compText, {
        x: covW - 36 - compW,
        y: 38,
        size: 11,
        font: helvetica,
        color: rgb(51 / 255, 65 / 255, 85 / 255),
      });
    }

    for (let i = 0; i < totalPages; i++) {
      const srcPage = srcDoc.getPage(i);
      const { width, height } = srcPage.getSize();
      const embeddedPage = embeddedPages[i];

      const newPage = pdfDoc.addPage([width, height]);

      const headerH = 62;
      const footerH = 18;
      const marginT = 12;
      const marginB = 10;
      const gap = 8;

      let scale = 1.0;
      let offsetX = 0;
      let offsetY = 0;

      if (isCoverMode) {
        // Mode Cover: Naskah asli di halaman 2+ diberi running header tipis & footer rapi
        const topLimit = height - 26;
        const bottomLimit = marginB + footerH + gap;
        const availH = topLimit - bottomLimit;
        const availW = width - 24;

        scale = Math.min(availW / width, availH / height);
        const scaledW = width * scale;
        const scaledH = height * scale;
        offsetX = (width - scaledW) / 2;
        offsetY = bottomLimit + (availH - scaledH) / 2;
      } else if (shouldAddLetterhead) {
        // Mode Header: Geser naskah asli ke bawah area Kop Surat
        const topLimit = height - marginT - headerH - gap;
        const bottomLimit = marginB + footerH + gap;
        const availH = topLimit - bottomLimit;
        const availW = width - 36;

        scale = Math.min(availW / width, availH / height);
        const scaledW = width * scale;
        const scaledH = height * scale;
        offsetX = (width - scaledW) / 2;
        offsetY = bottomLimit + (availH - scaledH) / 2;
      } else {
        // Hanya beri sedikit margin bawah untuk footer
        scale = (height - marginB - footerH - gap) / height;
        const scaledW = width * scale;
        const scaledH = height * scale;
        offsetX = (width - scaledW) / 2;
        offsetY = marginB + footerH + gap;
      }

      // 1. Gambar Naskah Asli yang telah diskalakan dan digeser secara proporsional
      newPage.drawPage(embeddedPage, {
        x: offsetX,
        y: offsetY,
        xScale: scale,
        yScale: scale,
      });

      // 2. Watermark Pengendalian Mutu (Diagonal Transparan)
      const wmFontSize = Math.min(width, height) * 0.045;
      const wmTextWidth = helveticaBold.widthOfTextAtSize(watermarkText, wmFontSize);
      const halfDiagonalProj = (wmTextWidth * 0.7071) / 2;
      const wmX = width / 2 - halfDiagonalProj;
      const wmY = height / 2 - halfDiagonalProj;

      newPage.drawText(watermarkText, {
        x: wmX,
        y: wmY,
        size: wmFontSize,
        font: helveticaBold,
        color: wmColor,
        opacity: 0.07,
        rotate: degrees(45),
      });

      // 3. JIKA MODE COVER: Running Header Tipis di Halaman 2+
      if (isCoverMode) {
        const runHeaderX = 18;
        const runHeaderW = width - 36;
        newPage.drawLine({
          start: { x: runHeaderX, y: height - 20 },
          end: { x: runHeaderX + runHeaderW, y: height - 20 },
          color: rgb(0.88, 0.91, 0.96),
          thickness: 0.6,
        });
        newPage.drawText(`${companyName} | ${docData.docNumber} (Rev: ${docData.revision || '00'})`, {
          x: runHeaderX,
          y: height - 16,
          size: 7,
          font: helveticaBold,
          color: rgb(0.39, 0.45, 0.55),
        });
        const titleSnippet = String(docData.title || '').toUpperCase().substring(0, 45);
        const titleSnippetW = helvetica.widthOfTextAtSize(titleSnippet, 7);
        newPage.drawText(titleSnippet, {
          x: runHeaderX + runHeaderW - titleSnippetW,
          y: height - 16,
          size: 7,
          font: helvetica,
          color: rgb(0.39, 0.45, 0.55),
        });
      } else if (shouldAddLetterhead) {
        // JIKA MODE HEADER: KOP SURAT RESMI DI ATAS DOKUMEN
        const boxX = 18;
        const boxY = height - marginT - headerH;
        const boxW = width - 36;

        // Kop Surat Bersih & Modern (Borderless — tanpa kurungan kotak dan tanpa garis-garis vertikal)
        newPage.drawRectangle({
          x: boxX,
          y: boxY,
          width: boxW,
          height: headerH,
          color: rgb(1, 1, 1),
        });

        // Satu garis pemisah horizontal tipis dan bersih di bawah Kop Surat
        newPage.drawLine({
          start: { x: boxX, y: boxY - 2 },
          end: { x: boxX + boxW, y: boxY - 2 },
          color: rgb(0.88, 0.91, 0.96),
          thickness: 0.8,
        });

        const logoColW = 115;
        const qrColW = 56;
        const metaColW = 155;
        const titleColW = boxW - logoColW - qrColW - metaColW;

        // --- KOLOM 1: LOGO PERUSAHAAN ---
        if (logoImg) {
          const logoAspect = logoImg.width / logoImg.height;
          const maxLogoH = headerH - 16;
          const maxLogoW = logoColW - 16;
          let lW = maxLogoW;
          let lH = lW / logoAspect;
          if (lH > maxLogoH) {
            lH = maxLogoH;
            lW = lH * logoAspect;
          }
          newPage.drawImage(logoImg, {
            x: boxX + (logoColW - lW) / 2,
            y: boxY + (headerH - lH) / 2,
            width: lW,
            height: lH,
          });
        } else if (compCode === "UMI") {
          newPage.drawRectangle({
            x: boxX + 16,
            y: boxY + headerH - 28,
            width: 82,
            height: 18,
            color: rgb(0.31, 0.27, 0.90),
          });
          newPage.drawText("ULTIMO MODA", {
            x: boxX + 22,
            y: boxY + headerH - 22,
            size: 8,
            font: helveticaBold,
            color: rgb(1, 1, 1),
          });
          newPage.drawText("PT Ultimo Moda Indotex", {
            x: boxX + 16,
            y: boxY + 12,
            size: 6.5,
            font: helvetica,
            color: rgb(0.35, 0.42, 0.52),
          });
        } else if (compCode === "IMK") {
          newPage.drawRectangle({
            x: boxX + 16,
            y: boxY + headerH - 28,
            width: 82,
            height: 18,
            color: rgb(0.02, 0.58, 0.41),
          });
          newPage.drawText("PT IMK", {
            x: boxX + 34,
            y: boxY + headerH - 22,
            size: 8.5,
            font: helveticaBold,
            color: rgb(1, 1, 1),
          });
          newPage.drawText("PT Inti Mulia Knitting", {
            x: boxX + 16,
            y: boxY + 12,
            size: 6.5,
            font: helvetica,
            color: rgb(0.35, 0.42, 0.52),
          });
        } else {
          newPage.drawText(compCode || "DMS", {
            x: boxX + 24,
            y: boxY + headerH / 2 - 4,
            size: 14,
            font: helveticaBold,
            color: rgb(0.12, 0.25, 0.45),
          });
        }

        // --- KOLOM 2: KLASIFIKASI DOKUMEN & JUDUL (TENGAH) ---
        const titleAreaX = boxX + logoColW;
        const typeStr = getDocumentTypeFullName(docData);
        let typeFontSize = 7.5;
        let typeTextW = helveticaBold.widthOfTextAtSize(typeStr, typeFontSize);
        if (typeTextW > titleColW - 16) {
          typeFontSize = 6.5;
          typeTextW = helveticaBold.widthOfTextAtSize(typeStr, typeFontSize);
        }
        newPage.drawText(typeStr, {
          x: titleAreaX + Math.max(8, (titleColW - typeTextW) / 2),
          y: boxY + headerH - 22,
          size: typeFontSize,
          font: helveticaBold,
          color: rgb(0.35, 0.42, 0.52),
        });

        // Judul Dokumen Utama
        let rawTitle = String(docData.title || "-");
        if (rawTitle.length > 40) rawTitle = rawTitle.substring(0, 38) + "...";
        const titleW = helveticaBold.widthOfTextAtSize(rawTitle, 9);
        newPage.drawText(rawTitle, {
          x: titleAreaX + Math.max(8, (titleColW - titleW) / 2),
          y: boxY + headerH - 38,
          size: 9,
          font: helveticaBold,
          color: rgb(0.06, 0.12, 0.25),
        });

        // --- KOLOM 3: TABEL METADATA RESMI (KANAN) ---
        const metaX = boxX + logoColW + titleColW;
        const metaRows = [
          { label: "No. Dokumen", val: String(docData.docNumber || "-"), y: boxY + headerH - 16 },
          { label: "Revisi", val: String(docData.revision || "00"), y: boxY + headerH - 28 },
          { label: "Departemen", val: String(docData.department || "-"), y: boxY + headerH - 40 },
          { label: "Tgl. Terbit", val: formatDocumentDate(docData.effectiveDate || docData.createdDate), y: boxY + headerH - 52 },
        ];

        metaRows.forEach(row => {
          newPage.drawText(row.label, {
            x: metaX + 8,
            y: row.y,
            size: 6.8,
            font: helvetica,
            color: rgb(0.40, 0.46, 0.56),
          });
          newPage.drawText(":", {
            x: metaX + 54,
            y: row.y,
            size: 6.8,
            font: helveticaBold,
            color: rgb(0.40, 0.46, 0.56),
          });
          const valStr = row.val.length > 18 ? row.val.substring(0, 16) + "..." : row.val;
          newPage.drawText(valStr, {
            x: metaX + 62,
            y: row.y,
            size: 7,
            font: helveticaBold,
            color: rgb(0.06, 0.15, 0.28),
          });
        });

        // --- KOLOM 4: QR CODE VALIDASI DIGITAL (FAR RIGHT) ---
        const qrColX = boxX + boxW - qrColW;
        if (qrImage) {
          const qrSize = 44;
          newPage.drawImage(qrImage, {
            x: qrColX + (qrColW - qrSize) / 2,
            y: boxY + (headerH - qrSize) / 2,
            width: qrSize,
            height: qrSize,
          });
        }
      }

      // 4. FOOTER RESMI ISO & PENOMORAN HALAMAN (Bersih tanpa kotak kurungan)
      const footerBoxX = 18;
      const footerBoxW = width - 36;

      // Garis pemisah horizontal tipis di atas footer
      newPage.drawLine({
        start: { x: footerBoxX, y: marginB + footerH + 4 },
        end: { x: footerBoxX + footerBoxW, y: marginB + footerH + 4 },
        color: rgb(0.88, 0.91, 0.96),
        thickness: 0.6,
      });

      const footerLeft = "DOKUMEN RESMI TERKENDALI — " + companyName + " | NO: " + docData.docNumber + " | REV: " + (docData.revision || "00");
      newPage.drawText(footerLeft, {
        x: footerBoxX + 10,
        y: marginB + 5.5,
        size: 6.8,
        font: helvetica,
        color: rgb(0.35, 0.42, 0.52),
      });

      // Penomoran Halaman Otomatis Presisi di Kanan Bawah
      const pageNumStr = "Halaman " + (i + 1) + " dari " + totalPages;
      const pageNumW = helveticaBold.widthOfTextAtSize(pageNumStr, 7.2);
      newPage.drawText(pageNumStr, {
        x: footerBoxX + footerBoxW - pageNumW - 10,
        y: marginB + 5.5,
        size: 7.2,
        font: helveticaBold,
        color: rgb(0.08, 0.18, 0.35),
      });
    }

    // 5. Simpan hasil stempel PDF dan unduh ke perangkat pengguna
    const stampedPdfBytes = await pdfDoc.save();
    const stampedBlob = new Blob([stampedPdfBytes], { type: "application/pdf" });

    if (options && options.returnBlob) {
      return stampedBlob;
    }

    downloadBlobAsFile(stampedBlob, officialFileName);

    return officialFileName;
  } catch (error) {
    console.error('Error stamping letterhead on PDF:', error);
    if (options && options.returnBlob) {
      return null;
    }
    // Jika format PDF terenkripsi atau error, fallback unduh berkas asli secara langsung
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = officialFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 300);
      return officialFileName;
    }
    await exportControlledDocumentPDF(docData, systemSettings, qrDataUrl, {
      ...options,
      excelRows: options?.excelRows || docData.excelRows,
      excelSheetName: options?.excelSheetName || docData.excelSheetName,
      logoUrl: options?.logoUrl || docData.logoUrl || (compCode === 'DJI' ? '/dji-logo.png' : null),
    });
    return officialFileName;
  }
}
