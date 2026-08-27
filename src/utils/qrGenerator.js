import QRCode from 'qrcode';

/**
 * Generate QR Code data URL for document verification
 */
export async function generateDocumentQRCode(doc) {
  try {
    const payload = JSON.stringify({
      docNo: doc.docNumber,
      title: doc.title,
      rev: doc.revision,
      status: doc.status,
      dept: doc.department,
      effective: doc.effectiveDate || doc.createdDate,
      verifiedBy: 'DJI Document Control System',
      verifyUrl: `https://dc.dji-indonesia.com/verify?doc=${encodeURIComponent(doc.docNumber)}`
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 160,
      color: {
        dark: '#0b1a30',
        light: '#ffffff'
      }
    });

    return qrDataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return null;
  }
}
