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
 * Stempel Kop Surat PT DJI, Watermark Keamanan, dan Matriks Tanda Tangan
 * langsung ke atas berkas PDF asli yang diunggah pengguna (mempertahankan seluruh halaman dokumen asli).
 */
export async function stampOfficialLetterheadOnPDF(docData, systemSettings = {}, qrDataUrl = null) {
  const companyName = systemSettings.companyName || 'PT DJI';
  const cleanTitle = (docData.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
  const officialFileName = `${docData.docNumber}_${cleanTitle}_Resmi_${companyName.replace(/\s+/g, '_')}.pdf`;

  const fileNameLower = (docData.fileName || '').toLowerCase();
  const fileTypeLower = (docData.fileType || '').toLowerCase();
  const fileUrl = docData.fileUrl || '';

  // Deteksi apakah berkas adalah PDF asli
  const isPdf = Boolean(
    fileUrl && (
      fileUrl.startsWith('data:application/pdf') ||
      fileTypeLower === 'application/pdf' ||
      /\.pdf($|\?)/i.test(fileUrl) ||
      fileNameLower.endsWith('.pdf') ||
      fileUrl.startsWith('blob:')
    )
  );

  // Jika memang tidak ada berkas PDF yang diunggah, baru buat PDF naskah standar ISO dari nol
  if (!isPdf) {
    exportControlledDocumentPDF(docData, systemSettings, qrDataUrl);
    return officialFileName;
  }

  try {
    // 1. Muat dokumen PDF asli pengguna (seluruh halaman dipertahankan utuh)
    const originalPdfBytes = await getPdfBytes(fileUrl);
    const pdfDoc = await PDFDocument.load(originalPdfBytes);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 2. Muat Logo Resmi PT DJI untuk Kop Surat
    let logoImg = null;
    try {
      const logoRes = await fetch('/dji-logo.png');
      if (logoRes.ok) {
        const logoBytes = await logoRes.arrayBuffer();
        logoImg = await pdfDoc.embedPng(new Uint8Array(logoBytes));
      }
    } catch (err) {
      console.warn('Could not load logo for PDF stamping:', err);
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

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

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

    // Proses SETIAP HALAMAN dari dokumen PDF asli pengguna
    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // A. Watermark Diagonal Transparan (Proporsional & Presisi di Titik Tengah Halaman)
      const wmFontSize = Math.min(width, height) * 0.045;
      const wmTextWidth = helveticaBold.widthOfTextAtSize(watermarkText, wmFontSize);
      // Proyeksi diagonal 45 derajat (cos(45) = sin(45) = ~0.7071)
      const halfDiagonalProj = (wmTextWidth * 0.7071) / 2;
      const wmX = width / 2 - halfDiagonalProj;
      const wmY = height / 2 - halfDiagonalProj;

      page.drawText(watermarkText, {
        x: wmX,
        y: wmY,
        size: wmFontSize,
        font: helveticaBold,
        color: wmColor,
        opacity: 0.08, // Dibuat halus/transparan agar teks dokumen tetap terbaca jernih
        rotate: degrees(45),
      });

      // B. Footer Bar Kendali Mutu ISO (pada setiap halaman)
      page.drawRectangle({
        x: 18,
        y: 10,
        width: width - 36,
        height: 18,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.82, 0.88, 0.94),
        borderWidth: 0.5,
      });

      page.drawText(`Dokumen Terkendali ${companyName} | No: ${docData.docNumber} | Rev: ${docData.revision} | Standar Mutu ISO 9001:2015`, {
        x: 26,
        y: 15.5,
        size: 7,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.55),
      });

      page.drawText(`Hal ${i + 1} dari ${totalPages}`, {
        x: width - 82,
        y: 15.5,
        size: 7,
        font: helveticaBold,
        color: rgb(0.3, 0.35, 0.45),
      });

      // C. Kop Surat Terkendali Resmi PT DJI (Disematkan di Halaman 1)
      if (i === 0) {
        const headerH = 72;
        const headerY = height - headerH - 10;
        const headerW = width - 36;

        // Masking putih solid untuk menutup total header/teks lama bawaan dokumen asli di area atas
        page.drawRectangle({
          x: 12,
          y: headerY - 8,
          width: width - 24,
          height: height - (headerY - 8),
          color: rgb(1, 1, 1),
        });

        // Bingkai Kotak Kop Surat Resmi
        page.drawRectangle({
          x: 18,
          y: headerY,
          width: headerW,
          height: headerH,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.06, 0.16, 0.3),
          borderWidth: 1.2,
        });

        // Vertical dividers (Kolom 1: Logo, Kolom 2: Judul, Kolom 3: Metadata + QR)
        const col1W = 112;
        const col2W = 246;
        const col3W = headerW - col1W - col2W;

        // Divider Kolom 1 & 2
        page.drawLine({
          start: { x: 18 + col1W, y: headerY },
          end: { x: 18 + col1W, y: headerY + headerH },
          color: rgb(0.06, 0.16, 0.3),
          thickness: 1,
        });

        // Divider Kolom 2 & 3
        page.drawLine({
          start: { x: 18 + col1W + col2W, y: headerY },
          end: { x: 18 + col1W + col2W, y: headerY + headerH },
          color: rgb(0.06, 0.16, 0.3),
          thickness: 1,
        });

        // ================= KOLOM 1: LOGO RESMI (BERSIH & CENTERED) =================
        if (logoImg) {
          const logoAspect = logoImg.width / logoImg.height;
          const logoH = 34;
          const logoW = Math.min(col1W - 16, logoH * logoAspect);
          const logoX = 18 + (col1W - logoW) / 2;
          const logoY = headerY + (headerH - logoH) / 2;

          page.drawImage(logoImg, {
            x: logoX,
            y: logoY,
            width: logoW,
            height: logoH,
          });
        } else {
          const compW = helveticaBold.widthOfTextAtSize(companyName, 13);
          page.drawText(companyName, {
            x: 18 + (col1W - compW) / 2,
            y: headerY + (headerH - 13) / 2,
            size: 13,
            font: helveticaBold,
            color: rgb(0.06, 0.16, 0.3),
          });
        }

        // ================= KOLOM 2: JUDUL DOKUMEN & TIPE PROSEDUR (CENTERED & RAPI) =================
        const typeText = (docData.typeName || docData.type || 'PROSEDUR TERKENDALI').toUpperCase();
        const typeW = helveticaBold.widthOfTextAtSize(typeText, 7);
        page.drawText(typeText, {
          x: 18 + col1W + (col2W - typeW) / 2,
          y: headerY + headerH - 19,
          size: 7,
          font: helveticaBold,
          color: rgb(0.35, 0.42, 0.52),
        });

        const titleText = (docData.title || '').toUpperCase();
        const displayTitle = titleText.length > 46 ? titleText.substring(0, 44) + '...' : titleText;
        const titleW = helveticaBold.widthOfTextAtSize(displayTitle, 10);
        page.drawText(displayTitle, {
          x: 18 + col1W + (col2W - titleW) / 2,
          y: headerY + headerH - 36,
          size: 10,
          font: helveticaBold,
          color: rgb(0.05, 0.12, 0.25),
        });

        const statusText = `Status Dokumen: ${docData.status}  •  Salinan Terkendali Resmi`;
        const statusW = helvetica.widthOfTextAtSize(statusText, 6.8);
        page.drawText(statusText, {
          x: 18 + col1W + (col2W - statusW) / 2,
          y: headerY + headerH - 53,
          size: 6.8,
          font: helvetica,
          color: rgb(0.08, 0.45, 0.78),
        });

        // ================= KOLOM 3: METADATA & QR CODE VERIFIKASI =================
        const c3StartX = 18 + col1W + col2W;
        const qrDividerX = c3StartX + 138;

        // Garis Pembatas Vertikal antara Metadata dan QR Code
        page.drawLine({
          start: { x: qrDividerX, y: headerY },
          end: { x: qrDividerX, y: headerY + headerH },
          color: rgb(0.82, 0.88, 0.94),
          thickness: 0.8,
        });

        // Data Baris Metadata (Label, Titik Dua ':', dan Nilai yang Rapi Lurus)
        const c3X = c3StartX + 8;
        const colonX = c3X + 46;
        const valX = colonX + 6;

        const metaRows = [
          { label: 'No. Dokumen', val: docData.docNumber, y: headerY + headerH - 18 },
          { label: 'Revisi', val: docData.revision, y: headerY + headerH - 31 },
          { label: 'Departemen', val: docData.department, y: headerY + headerH - 44 },
          { label: 'Tgl. Terbit', val: docData.effectiveDate || docData.createdDate || '-', y: headerY + headerH - 57 },
        ];

        metaRows.forEach(row => {
          // Label Kiri
          page.drawText(row.label, {
            x: c3X,
            y: row.y,
            size: 6.8,
            font: helvetica,
            color: rgb(0.4, 0.45, 0.55),
          });
          // Titik Dua Lurus Presisi
          page.drawText(':', {
            x: colonX,
            y: row.y,
            size: 6.8,
            font: helveticaBold,
            color: rgb(0.4, 0.45, 0.55),
          });
          // Nilai Sejajar Sempurna
          page.drawText(String(row.val), {
            x: valX,
            y: row.y,
            size: 7,
            font: helveticaBold,
            color: rgb(0.06, 0.16, 0.3),
          });
        });

        // QR Code Seal (Terpusat Rapi di Sub-Kolom Kanan)
        if (qrImage) {
          const qrAreaW = (18 + headerW) - qrDividerX;
          const qrSize = 44;
          const qrX = qrDividerX + (qrAreaW - qrSize) / 2;
          const qrY = headerY + (headerH - qrSize) / 2;

          // Bingkai Kartu QR Code yang Halus
          page.drawRectangle({
            x: qrX - 2,
            y: qrY - 2,
            width: qrSize + 4,
            height: qrSize + 4,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5,
          });

          page.drawImage(qrImage, {
            x: qrX,
            y: qrY,
            width: qrSize,
            height: qrSize,
          });
        }
      }
    }

    // 4. Simpan hasil stempel PDF dan unduh ke perangkat pengguna
    const stampedPdfBytes = await pdfDoc.save();
    const stampedBlob = new Blob([stampedPdfBytes], { type: 'application/pdf' });
    downloadBlobAsFile(stampedBlob, officialFileName);

    return officialFileName;
  } catch (error) {
    console.error('Error stamping letterhead on PDF:', error);
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
    exportControlledDocumentPDF(docData, systemSettings, qrDataUrl);
    return officialFileName;
  }
}
