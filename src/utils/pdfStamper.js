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
 * Stempel Kop Surat PT DJI, Watermark Keamanan, dan Matriks Tanda Tangan
 * langsung ke atas berkas PDF asli yang diunggah pengguna.
 */
export async function stampOfficialLetterheadOnPDF(docData, systemSettings = {}, qrDataUrl = null) {
  const companyName = systemSettings.companyName || 'PT DJI';
  const cleanTitle = (docData.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  const officialFileName = `${docData.docNumber}_${cleanTitle}_Resmi_${companyName.replace(/\s+/g, '_')}.pdf`;

  // If there's no uploaded PDF file or it's not a PDF, generate the full ISO template PDF
  if (!docData.fileUrl || !docData.fileUrl.includes('application/pdf')) {
    exportControlledDocumentPDF(docData, systemSettings, qrDataUrl);
    return officialFileName;
  }

  try {
    const originalPdfBytes = dataUrlToUint8Array(docData.fileUrl);
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    let qrImage = null;
    if (qrDataUrl) {
      try {
        const qrBytes = dataUrlToUint8Array(qrDataUrl);
        qrImage = await pdfDoc.embedPng(qrBytes);
      } catch (e) {
        console.warn('Failed to embed QR code in PDF stamp:', e);
      }
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine watermark color and text
    let watermarkText = `CONTROLLED COPY - ${companyName}`;
    let wmColor = rgb(0.1, 0.4, 0.85); // Blue
    if (docData.status === 'OBSOLETE') {
      watermarkText = 'OBSOLETE - DO NOT USE';
      wmColor = rgb(0.9, 0.2, 0.2); // Red
    } else if (docData.status === 'DRAFT' || docData.status === 'REVIEW' || docData.status === 'VERIFIKASI' || docData.status === 'APPROVAL') {
      watermarkText = docData.status === 'REVIEW'
        ? 'MENUNGGU REVIEW ATASAN / UNDER REVIEW'
        : docData.status === 'VERIFIKASI'
        ? 'MENUNGGU VERIFIKASI DCO / UNVERIFIED'
        : docData.status === 'APPROVAL'
        ? 'MENUNGGU PENGESAHAN MR / PENDING APPROVAL'
        : 'DRAFT - NOT FOR OPERATIONAL USE';
      wmColor = rgb(0.85, 0.5, 0.1); // Amber
    }

    // Process each page
    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // 1. Diagonal Watermark (on every page)
      page.drawText(watermarkText, {
        x: width * 0.15,
        y: height * 0.35,
        size: Math.min(width, height) * 0.055,
        font: helveticaBold,
        color: wmColor,
        opacity: 0.18,
        rotate: degrees(45),
      });

      // 2. Footer Bar (on every page)
      page.drawRectangle({
        x: 20,
        y: 12,
        width: width - 40,
        height: 18,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.85, 0.9, 0.95),
        borderWidth: 0.5,
      });

      page.drawText(`Dokumen Terkendali ${companyName} | No: ${docData.docNumber} | Rev: ${docData.revision} | Standar ISO 9001:2015`, {
        x: 28,
        y: 18,
        size: 7.5,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.55),
      });

      page.drawText(`Hal ${i + 1} dari ${totalPages}`, {
        x: width - 85,
        y: 18,
        size: 7.5,
        font: helveticaBold,
        color: rgb(0.3, 0.35, 0.45),
      });

      // 3. Stamp Kop Surat Header (on Page 1)
      if (i === 0) {
        const headerH = 60;
        const headerY = height - headerH - 15;
        const headerW = width - 40;

        // Header Background & Border
        page.drawRectangle({
          x: 20,
          y: headerY,
          width: headerW,
          height: headerH,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.06, 0.16, 0.3),
          borderWidth: 1.5,
        });

        // Vertical dividers
        const col1W = 110;
        const col3W = 140;
        const col2W = headerW - col1W - col3W;

        page.drawLine({
          start: { x: 20 + col1W, y: headerY },
          end: { x: 20 + col1W, y: headerY + headerH },
          color: rgb(0.06, 0.16, 0.3),
          thickness: 1,
        });

        page.drawLine({
          start: { x: 20 + col1W + col2W, y: headerY },
          end: { x: 20 + col1W + col2W, y: headerY + headerH },
          color: rgb(0.06, 0.16, 0.3),
          thickness: 1,
        });

        // Column 1: Company Logo & ISO Tag
        page.drawText(companyName, {
          x: 28,
          y: headerY + headerH - 22,
          size: 13,
          font: helveticaBold,
          color: rgb(0.06, 0.16, 0.3),
        });

        page.drawText('DOCUMENT CONTROL', {
          x: 28,
          y: headerY + headerH - 36,
          size: 7,
          font: helveticaBold,
          color: rgb(0.1, 0.4, 0.8),
        });

        page.drawText('ISO 9001:2015 CERTIFIED', {
          x: 28,
          y: headerY + headerH - 48,
          size: 6.5,
          font: helvetica,
          color: rgb(0.4, 0.5, 0.6),
        });

        // Column 2: Document Title & Type
        const typeText = (docData.typeName || docData.type || 'PROSEDUR TERKENDALI').toUpperCase();
        page.drawText(typeText, {
          x: 20 + col1W + 12,
          y: headerY + headerH - 18,
          size: 7.5,
          font: helveticaBold,
          color: rgb(0.3, 0.4, 0.5),
        });

        const titleText = (docData.title || '').toUpperCase();
        const displayTitle = titleText.length > 55 ? titleText.substring(0, 52) + '...' : titleText;
        page.drawText(displayTitle, {
          x: 20 + col1W + 12,
          y: headerY + headerH - 34,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.06, 0.16, 0.3),
        });

        page.drawText(`Status Dokumen: ${docData.status}`, {
          x: 20 + col1W + 12,
          y: headerY + headerH - 48,
          size: 7.5,
          font: helvetica,
          color: wmColor,
        });

        // Column 3: Metadata Box
        const c3X = 20 + col1W + col2W + 8;
        page.drawText(`No. Dokumen:`, { x: c3X, y: headerY + headerH - 16, size: 7, font: helvetica, color: rgb(0.4, 0.45, 0.55) });
        page.drawText(docData.docNumber, { x: c3X + 55, y: headerY + headerH - 16, size: 7.5, font: helveticaBold, color: rgb(0.06, 0.16, 0.3) });

        page.drawText(`Revisi:`, { x: c3X, y: headerY + headerH - 28, size: 7, font: helvetica, color: rgb(0.4, 0.45, 0.55) });
        page.drawText(docData.revision, { x: c3X + 55, y: headerY + headerH - 28, size: 7.5, font: helveticaBold, color: rgb(0.06, 0.16, 0.3) });

        page.drawText(`Departemen:`, { x: c3X, y: headerY + headerH - 40, size: 7, font: helvetica, color: rgb(0.4, 0.45, 0.55) });
        page.drawText(docData.department, { x: c3X + 55, y: headerY + headerH - 40, size: 7.5, font: helveticaBold, color: rgb(0.06, 0.16, 0.3) });

        page.drawText(`Tgl. Terbit:`, { x: c3X, y: headerY + headerH - 52, size: 7, font: helvetica, color: rgb(0.4, 0.45, 0.55) });
        page.drawText(docData.effectiveDate || docData.createdDate, { x: c3X + 55, y: headerY + headerH - 52, size: 7, font: helvetica, color: rgb(0.06, 0.16, 0.3) });
      }
    }

    // Save modified stamped PDF
    const stampedPdfBytes = await pdfDoc.save();
    const stampedBlob = new Blob([stampedPdfBytes], { type: 'application/pdf' });
    downloadBlobAsFile(stampedBlob, officialFileName);

    return officialFileName;
  } catch (error) {
    console.error('Error stamping letterhead on PDF:', error);
    // Fallback to jsPDF generation if pdf-lib modification encountered unexpected format
    exportControlledDocumentPDF(docData, systemSettings, qrDataUrl);
    return officialFileName;
  }
}
