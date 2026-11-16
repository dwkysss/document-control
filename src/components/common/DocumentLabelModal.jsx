import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, QrCode, Tag, Check, Building2, Calendar, FileText } from 'lucide-react';
import { generateDocumentQRCode } from '../../utils/qrGenerator';
import { formatDocumentDate } from '../../utils/exportUtils';

export default function DocumentLabelModal({ isOpen, onClose, doc, systemSettings }) {
  const [labelSize, setLabelSize] = useState('ordner'); // 'ordner' (90x45mm) | 'medium' (70x35mm) | 'compact' (50x25mm)
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const labelRef = useRef(null);

  useEffect(() => {
    if (doc) {
      generateDocumentQRCode(doc).then(url => setQrDataUrl(url));
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const docComp = (doc.companyCode || (doc.docNumber?.startsWith('UMI') ? 'UMI' : doc.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
  const companyName = doc.companyName || (
    docComp === 'UMI' ? 'PT Ultimo Moda Indotex' :
    docComp === 'IMK' ? 'PT IMK' :
    systemSettings?.companyName || 'PT Dentelle Jaya Infinitex'
  );

  const handlePrint = () => {
    const printContent = labelRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=700,height=500');
    if (!printWindow) {
      alert('Izinkan pop-up browser untuk mencetak stiker label.');
      return;
    }

    const sizeStyles = {
      ordner: 'width: 90mm; min-height: 45mm;',
      medium: 'width: 70mm; min-height: 35mm;',
      compact: 'width: 50mm; min-height: 28mm;'
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stiker Label - ${doc.docNumber}</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 4mm;
              font-family: Arial, Helvetica, sans-serif;
              color: #000;
              background: #fff;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .label-box {
              ${sizeStyles[labelSize]}
              border: 1.5px solid #000;
              border-radius: 4px;
              padding: 3mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
            }
            .header-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1px solid #333;
              padding-bottom: 1.5mm;
              margin-bottom: 1.5mm;
            }
            .comp-name {
              font-size: 8pt;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .type-badge {
              font-size: 7pt;
              font-weight: 700;
              background: #000;
              color: #fff;
              padding: 1px 4px;
              border-radius: 2px;
            }
            .body-row {
              display: flex;
              align-items: center;
              gap: 2.5mm;
              flex: 1;
            }
            .info-col {
              flex: 1;
            }
            .doc-num {
              font-family: monospace;
              font-size: 10pt;
              font-weight: 900;
              margin: 0;
              line-height: 1.1;
            }
            .doc-title {
              font-size: 7.5pt;
              font-weight: 700;
              margin-top: 1mm;
              text-transform: uppercase;
              line-height: 1.2;
              max-height: 2.4em;
              overflow: hidden;
            }
            .meta-row {
              display: flex;
              gap: 2mm;
              font-size: 6.5pt;
              margin-top: 1.5mm;
              color: #222;
            }
            .qr-col {
              width: ${labelSize === 'compact' ? '20mm' : labelSize === 'medium' ? '24mm' : '28mm'};
              text-align: center;
              flex-shrink: 0;
            }
            .qr-col img {
              width: 100%;
              height: auto;
              display: block;
            }
            .scan-text {
              font-size: 5pt;
              font-weight: 700;
              text-transform: uppercase;
              margin-top: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div class="label-box">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Header dividing line
    ctx.beginPath();
    ctx.moveTo(10, 80);
    ctx.lineTo(width - 10, 80);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Company Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText(companyName.toUpperCase(), 30, 52);

    // Type Badge
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(width - 180, 24, 150, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(doc.type || 'SOP', width - 105, 48);
    ctx.textAlign = 'left';

    // Body: Doc Number
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText(doc.docNumber, 30, 140);

    // Doc Title
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 20px Arial, sans-serif';
    const truncatedTitle = doc.title.length > 38 ? doc.title.substring(0, 38) + '...' : doc.title;
    ctx.fillText(truncatedTitle.toUpperCase(), 30, 185);

    // Metadata
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`Departemen: ${doc.department}   |   Revisi: Rev ${doc.revision}`, 30, 240);
    ctx.fillText(`Status: ${doc.status}   |   Tgl Efektif: ${formatDocumentDate(doc.effectiveDate || doc.createdDate)}`, 30, 275);
    ctx.fillText(`Sistem: Document Control Resmi`, 30, 310);

    // Load QR Image onto canvas
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, width - 230, 105, 200, 200);

      // Scan to verify caption
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN UNTUK VERIFIKASI', width - 130, 325);

      const link = document.createElement('a');
      link.download = `STIKER_LABEL_${doc.docNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsDownloading(false);
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Cetak Label Arsip Fisik Dokumen</h3>
              <p className="text-[11px] text-slate-500">Stiker identifikasi map / ordner dengan QR Code validasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Size Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Ukuran Stiker Label:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLabelSize('ordner')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  labelSize === 'ordner'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Ordner / Binder</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">90 x 45 mm (Standar)</span>
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('medium')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  labelSize === 'medium'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Map Folio / Cover</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">70 x 35 mm (Sedang)</span>
              </button>

              <button
                type="button"
                onClick={() => setLabelSize('compact')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  labelSize === 'compact'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Form / Kompak</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">50 x 28 mm (Kecil)</span>
              </button>
            </div>
          </div>

          {/* Label Preview Container */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Pratinjau Hasil Label Stiker:</span>
              <span className="text-[10px] text-slate-400 font-mono">Skala 1:1 Pratinjau Cetak</span>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center min-h-[170px]">
              {/* Actual Printable Label Box */}
              <div
                ref={labelRef}
                className={`bg-white border-2 border-slate-900 rounded-lg p-3.5 shadow-md flex flex-col justify-between transition-all select-none ${
                  labelSize === 'ordner'
                    ? 'w-[420px] min-h-[160px]'
                    : labelSize === 'medium'
                    ? 'w-[360px] min-h-[140px]'
                    : 'w-[300px] min-h-[120px]'
                }`}
              >
                {/* Header Row */}
                <div className="header-row flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="comp-name font-black text-[11px] text-slate-900 uppercase tracking-wider">
                      {companyName}
                    </span>
                  </div>
                  <span className="type-badge text-[9.5px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">
                    {doc.type || 'SOP'}
                  </span>
                </div>

                {/* Body Row */}
                <div className="body-row flex items-center justify-between gap-3 flex-1">
                  <div className="info-col flex-1 min-w-0">
                    <p className="doc-num font-mono font-black text-sm text-slate-900 leading-tight">
                      {doc.docNumber}
                    </p>
                    <p className="doc-title font-bold text-[11px] text-slate-800 uppercase mt-1 line-clamp-2 leading-snug">
                      {doc.title}
                    </p>
                    <div className="meta-row flex flex-wrap items-center gap-2 text-[9.5px] text-slate-600 mt-2 font-medium">
                      <span>Dept: <strong>{doc.department}</strong></span>
                      <span>•</span>
                      <span>Rev: <strong>{doc.revision}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{doc.status}</span>
                    </div>
                  </div>

                  {/* QR Code Column */}
                  <div className="qr-col flex flex-col items-center shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className={`object-contain ${
                          labelSize === 'compact' ? 'w-16 h-16' : labelSize === 'medium' ? 'w-20 h-20' : 'w-22 h-22'
                        }`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <span className="scan-text text-[8px] font-extrabold text-slate-600 uppercase tracking-tighter mt-0.5 text-center">
                      Scan Keabsahan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={isDownloading || !qrDataUrl}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isDownloading ? 'Menyimpan...' : 'Unduh Gambar (PNG)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/25 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Stiker Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
