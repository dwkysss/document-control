import QRCode from 'qrcode';

/**
 * Generate QR Code data URL for document verification
 */
export async function generateDocumentQRCode(doc) {
  try {
    // Best Practice ISO 9001 EDMS: Barcode memuat tautan verifikasi dinamis real-time
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://dc.dji-indonesia.com';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(doc.docNumber)}`;

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 480,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return qrDataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return null;
  }
}
