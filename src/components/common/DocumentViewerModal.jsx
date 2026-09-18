import React, { useEffect, useState, useRef } from 'react';
import { Download, Printer, QrCode, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Calendar, User, Building2, History, X, ExternalLink, Paperclip, Eye, UploadCloud, RefreshCw, FileCheck2, Stamp } from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import { generateDocumentQRCode } from '../../utils/qrGenerator';
import { exportControlledDocumentPDF } from '../../utils/exportUtils';
import { stampOfficialLetterheadOnPDF, downloadBlobAsFile } from '../../utils/pdfStamper';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function DocumentViewerModal({ doc, isOpen, onClose }) {
  const { systemSettings, showToast, attachFileToDocument } = useDocumentControl();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [showQrVerifyInfo, setShowQrVerifyInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('iso'); // 'iso' by default so official preview shows immediately without auto-download
  const [blobUrl, setBlobUrl] = useState(null);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    if (doc) {
      generateDocumentQRCode(doc).then(url => {
        if (isMounted) setQrCodeUrl(url);
      });

      // Default to official ISO 9001 standard document sheet for reliable instant preview
      setActiveTab('iso');

      if (doc.fileUrl) {
        if (doc.fileUrl.startsWith('data:')) {
          try {
            const parts = doc.fileUrl.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
          } catch (e) {
            setBlobUrl(null);
          }
        } else if (doc.fileUrl.startsWith('http')) {
          // Fetch as in-memory blob to strip server Content-Disposition attachment headers
          fetch(doc.fileUrl)
            .then(res => res.blob())
            .then(blob => {
              if (!isMounted) return;
              const cleanBlob = new Blob([blob], { type: doc.fileType || 'application/pdf' });
              createdUrl = URL.createObjectURL(cleanBlob);
              setBlobUrl(createdUrl);
            })
            .catch(err => {
              console.warn('Could not fetch file as blob for preview:', err);
              if (isMounted) setBlobUrl(null);
            });
        }
      } else {
        setBlobUrl(null);
      }
    }

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [doc, doc?.fileUrl]);

  if (!doc) return null;

  const handlePrint = () => {
    window.print();
  };

  // Download official PDF with ISO letterhead & watermark stamped onto original PDF
  const handleDownloadOfficialPDF = async () => {
    if (isProcessingDownload) return;
    setIsProcessingDownload(true);
    showToast('Menyematkan Kop Surat PT DJI dan Watermark ke dalam berkas PDF...', 'info');

    try {
      const fileName = await stampOfficialLetterheadOnPDF(doc, systemSettings, qrCodeUrl);
      showToast(`Dokumen resmi (${fileName}) berhasil diunduh!`, 'success');
    } catch (e) {
      console.error('Error in PDF download:', e);
      exportControlledDocumentPDF(doc, systemSettings, qrCodeUrl);
      showToast(`Dokumen resmi ${doc.docNumber} berhasil diunduh!`, 'success');
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // Download raw uploaded file with safe verified filename
  const handleDownloadRawFile = () => {
    if (doc.fileUrl) {
      const cleanTitle = (doc.title || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const fileName = doc.fileName || `${doc.docNumber}_${cleanTitle}.pdf`;

      if (doc.fileUrl.startsWith('data:')) {
        try {
          const parts = doc.fileUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          downloadBlobAsFile(blob, fileName);
          showToast(`Mengunduh berkas asli ${fileName}...`, 'success');
          return;
        } catch (e) {}
      }

      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 300);
      showToast(`Mengunduh berkas asli ${fileName}...`, 'success');
    } else {
      handleDownloadOfficialPDF();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      attachFileToDocument(doc.id, file);
    }
  };

  // Watermark class determination
  const getWatermarkText = () => {
    switch (doc.status) {
      case 'AKTIF':
        return systemSettings.watermarkControlledText || 'CONTROLLED COPY - PT DJI';
      case 'OBSOLETE':
        return systemSettings.watermarkObsoleteText || 'OBSOLETE - SUPERSEDED';
      case 'DRAFT':
        return systemSettings.watermarkDraftText || 'DRAFT - NOT FOR OPERATIONAL USE';
      case 'REVIEW':
        return 'MENUNGGU REVIEW ATASAN / UNDER REVIEW';
      case 'VERIFIKASI':
        return 'MENUNGGU VERIFIKASI DCO / UNVERIFIED';
      case 'APPROVAL':
        return 'MENUNGGU PENGESAHAN MR / PENDING APPROVAL';
      case 'DITOLAK':
        return 'DOKUMEN DITOLAK / VOID';
      default:
        return 'UNCONTROLLED COPY';
    }
  };

  const isObsolete = doc.status === 'OBSOLETE';
  const isActive = doc.status === 'AKTIF';

  const fileNameLower = (doc.fileName || '').toLowerCase();
  const fileTypeLower = (doc.fileType || '').toLowerCase();

  const isImageFile = Boolean(
    doc.fileUrl && (
      fileTypeLower.startsWith('image/') ||
      doc.fileUrl.startsWith('data:image/') ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileNameLower)
    )
  );

  const isWordFile = Boolean(
    doc.fileUrl && (
      fileTypeLower.includes('word') ||
      fileTypeLower.includes('officedocument.wordprocessingml') ||
      /\.(docx?|doc)$/i.test(fileNameLower)
    )
  );

  const isExcelFile = Boolean(
    doc.fileUrl && (
      fileTypeLower.includes('sheet') ||
      fileTypeLower.includes('excel') ||
      /\.(xlsx?|csv)$/i.test(fileNameLower)
    )
  );

  const isPdfFile = Boolean(
    doc.fileUrl && (
      fileTypeLower === 'application/pdf' ||
      /\.pdf$/i.test(fileNameLower)
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Dokumen Terkendali (Controlled Document Viewer)"
      subtitle={`No. Dokumen: ${doc.docNumber} | Standar Mutu ISO 9001:2015`}
      maxWidth="max-w-5xl"
    >
      {/* Hidden File Input for quick attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
        className="hidden"
      />

      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="flex items-center gap-2">
          <Badge status={doc.status} size="lg" />
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Salinan Terkendali Resmi
            </span>
          )}
          {isObsolete && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Telah Digantikan oleh Revisi Baru
            </span>
          )}
          {doc.fileName && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200">
              <Paperclip className="w-3 h-3 text-blue-500" />
              {doc.fileName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrVerifyInfo(!showQrVerifyInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
            title="Scan QR Code untuk verifikasi keaslian dokumen"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            {showQrVerifyInfo ? 'Sembunyikan QR' : 'Validasi QR'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Cetak
          </button>
          <button
            onClick={handleDownloadOfficialPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
            title="Unduh PDF Resmi dengan Kop Surat PT DJI dan Tanda Tangan"
          >
            <Stamp className="w-3.5 h-3.5 text-amber-300" />
            Unduh PDF + Kop Surat
          </button>
        </div>
      </div>

      {/* Tab Switcher & Stamping Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('iso')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'iso'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Lembar Standarisasi ISO 9001 (Resmi)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'file'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Berkas Lampiran {doc.fileUrl ? (isWordFile ? '(.DOCX)' : isPdfFile ? '(PDF)' : isExcelFile ? '(.XLSX)' : isImageFile ? '(Gambar)' : '(Berkas)') : ''}
          </button>
        </div>

        {/* Kop Surat Header Overlay Toggle and Upload Button */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition select-none">
            <input
              type="checkbox"
              checked={includeLetterhead}
              onChange={(e) => setIncludeLetterhead(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1">
              <Stamp className="w-3.5 h-3.5 text-blue-600" />
              Sematkan Kop Surat Otomatis
            </span>
          </label>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-200 transition font-medium cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {doc.fileUrl ? (isPdfFile ? 'Ganti File PDF' : 'Unggah Versi PDF') : 'Unggah File'}
          </button>
        </div>
      </div>

      {/* QR Code Verification Banner Dropdown */}
      {showQrVerifyInfo && qrCodeUrl && (
        <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between gap-4 animate-fade-in no-print">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <img src={qrCodeUrl} alt="QR Code Verifikasi" className="w-20 h-20" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sistem Verifikasi Digital Terdaftar
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
                QR Code ini membuktikan integritas dokumen resmi {systemSettings.companyName || 'PT DJI'}. Scan menggunakan kamera ponsel untuk memvalidasi nomor registrasi <strong>{doc.docNumber}</strong> dan status saat ini.
              </p>
              <div className="flex gap-3 text-[11px] text-slate-500 mt-2">
                <span>Status: <strong className="text-slate-800">{doc.status}</strong></span>
                <span>•</span>
                <span>Departemen: <strong className="text-slate-800">{doc.department}</strong></span>
                <span>•</span>
                <span>Revisi: <strong className="text-slate-800">{doc.revision}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowQrVerifyInfo(false)}
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Berkas Dokumen dengan Kop Surat Otomatis */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          {/* Automatic ISO 9001 Letterhead Box (Kop Surat Terkendali) */}
          {includeLetterhead && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-300 rounded-lg overflow-hidden shadow-sm animate-fade-in">
              <div className="grid grid-cols-12 divide-x-2 divide-slate-800 dark:divide-slate-300">
                {/* Logo Box */}
                <div className="col-span-3 p-3 flex flex-col items-center justify-center text-center bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    {systemSettings.companyName || 'PT DJI'}
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    DOCUMENT CONTROL
                  </span>
                  <span className="text-[8px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">
                    ISO 9001:2015 CERTIFIED
                  </span>
                </div>

                {/* Document Title Header */}
                <div className="col-span-6 p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {doc.typeName || doc.type || 'PROSEDUR TERKENDALI'}
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase leading-snug mt-0.5" title={doc.title}>
                    {doc.title}
                  </h3>
                </div>

                {/* Document Metadata Box */}
                <div className="col-span-3 p-2.5 text-[10px] space-y-1 bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Dokumen:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.docNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Revisi:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.revision}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Departemen:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{doc.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tgl. Terbit:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{doc.effectiveDate || doc.createdDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {blobUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-lg text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">{doc.fileName || `${doc.docNumber}.pdf`}</span>
                  {doc.fileSize && <span className="text-slate-400">({doc.fileSize})</span>}
                  {isWordFile && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200">
                      DOCX
                    </span>
                  )}
                  {isExcelFile && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-200">
                      XLSX
                    </span>
                  )}
                  {isPdfFile && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded border border-rose-200">
                      PDF
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadRawFile}
                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Berkas Asli
                  </button>
                  {isPdfFile && (
                    <a
                      href={blobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Penuh
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900 shadow-inner">
                {isImageFile ? (
                  <div className="p-4 flex flex-col items-center justify-center bg-slate-950 min-h-[500px]">
                    <img
                      src={blobUrl}
                      alt={doc.fileName || 'Pratinjau Dokumen'}
                      className="max-h-[600px] object-contain rounded shadow-lg border border-slate-800"
                    />
                    <p className="text-xs text-slate-400 mt-3">Lampiran Gambar: {doc.fileName}</p>
                  </div>
                ) : isPdfFile ? (
                  <div className="relative w-full bg-white rounded-lg overflow-hidden min-h-[500px]">
                    <iframe
                      src={`${blobUrl}#toolbar=0&navpanes=0`}
                      title={doc.fileName || 'Pratinjau PDF'}
                      className="w-full h-[650px] border-0 bg-white"
                    />
                  </div>
                ) : (
                  /* Tampilan Berkas Non-PDF (Microsoft Word / Excel) - Bebas dari Blank Iframe & Auto Download */
                  <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 space-y-6">
                    {/* Notice Card */}
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start gap-4 ${
                      isWordFile
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                        : isExcelFile
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 text-white shadow-sm ${
                        isWordFile ? 'bg-blue-600' : isExcelFile ? 'bg-emerald-600' : 'bg-slate-600'
                      }`}>
                        {isWordFile ? 'DOCX' : isExcelFile ? 'XLSX' : 'FILE'}
                      </div>
                      <div className="space-y-1.5 flex-1 text-xs">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {isWordFile ? 'Berkas Lampiran Microsoft Word (.docx)' : isExcelFile ? 'Berkas Lampiran Spreadsheet (.xlsx)' : 'Berkas Lampiran Dokumen'}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Browser web secara bawaan tidak dapat menampilkan dokumen Word/Office secara langsung di dalam frame interaktif (browser hanya mendukung penayangan langsung format <strong>PDF</strong> dan <strong>Gambar</strong>).
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          Berkas asli tersimpan dengan aman di sistem dan dapat Anda unduh untuk diedit, atau Anda dapat melihat lembar naskah resmi berstandar ISO 9001 pada tab <strong>Lembar Standarisasi ISO 9001 (Resmi)</strong>.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleDownloadRawFile}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh Berkas {isWordFile ? 'Word (.docx)' : isExcelFile ? 'Excel (.xlsx)' : 'Asli'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('iso')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Lihat Lembar Standarisasi ISO
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs border border-slate-300 dark:border-slate-600 transition cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                            Ganti dengan Berkas PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Pratinjau Naskah Dokumen Terdaftar */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileCheck2 className="w-4 h-4 text-blue-600" />
                          Ringkasan Naskah Dokumen Terdaftar
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">Status: {doc.status}</span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 block mb-1">Judul Dokumen:</span>
                          <div className="text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                            {doc.title}
                          </div>
                        </div>

                        {doc.content && (
                          <div>
                            <span className="font-bold text-slate-500 block mb-1">Uraian / Isi Dokumen:</span>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                              {doc.content}
                            </div>
                          </div>
                        )}

                        {doc.notes && (
                          <div>
                            <span className="font-bold text-slate-500 block mb-1">Catatan Dokumen:</span>
                            <div className="text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/50">
                              {doc.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto text-blue-600">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  Berkas Dokumen ({doc.fileName || 'PDF Dokumen'})
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Dokumen ini terdaftar dengan nama berkas <strong>{doc.fileName || `${doc.docNumber}.pdf`}</strong>. Silakan pilih atau seret file PDF Anda untuk melihatnya di dalam pratinjau lengkap dengan Kop Surat resmi.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  Pilih / Unggah Berkas PDF Sekarang
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOfficialPDF}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
                >
                  <Stamp className="w-4 h-4 text-amber-300" />
                  Generate PDF Ber-Kop Surat
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ISO Standard Paper Document Preview */}
      {activeTab === 'iso' && (
        <div className="relative bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 shadow-sm p-6 sm:p-8 min-h-[500px] overflow-hidden">
          {/* Dynamic Watermark */}
          <div className={isObsolete ? 'watermark-obsolete' : (isActive ? 'watermark-controlled' : 'watermark-draft')}>
            {getWatermarkText()}
          </div>

          {/* ISO Standard Controlled Header Table */}
          <div className="border-2 border-slate-800 dark:border-slate-300 mb-6 bg-white dark:bg-slate-900 relative z-10">
            <div className="grid grid-cols-12 divide-x-2 divide-slate-800 dark:divide-slate-300">
              {/* Logo Box */}
              <div className="col-span-3 p-3 flex flex-col items-center justify-center text-center">
                <div className="font-extrabold text-lg text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {systemSettings.companyName || 'PT DJI'}
                </div>
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                  Document Control
                </span>
              </div>

              {/* Document Title Header */}
              <div className="col-span-6 p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {doc.typeName || doc.type}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase leading-snug mt-1">
                  {doc.title}
                </h3>
              </div>

              {/* Document Metadata Box */}
              <div className="col-span-3 p-2.5 text-[10px] space-y-1 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Dokumen:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Revisi:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.revision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Departemen:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{doc.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl. Terbit:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{doc.effectiveDate || doc.createdDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content Body */}
          <div className="relative z-10 space-y-6 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans min-h-[220px]">
            {doc.content ? (
              <div className="whitespace-pre-line font-sans text-xs bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                {doc.content}
              </div>
            ) : (
              <>
                <section>
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 border-b pb-1 text-xs">
                    1. TUJUAN & RUANG LINGKUP
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Prosedur ini disusun sebagai standarisasi operasional pada departemen <strong>{doc.department}</strong> guna menjamin kepatuhan terhadap pedoman mutu ISO 9001:2015.
                  </p>
                </section>

                <section>
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 border-b pb-1 text-xs">
                    2. KETENTUAN OPERASIONAL
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Seluruh personel pada departemen {doc.department} wajib mematuhi ketentuan teknis yang tercantum pada berkas {doc.docNumber}.</li>
                    <li>Dokumen ini diajukan oleh {doc.creator} ({doc.creatorPosition}) dan diawasi oleh {doc.verifierTeam}.</li>
                    {doc.notes && <li>Catatan registrasi: <em>"{doc.notes}"</em></li>}
                  </ul>
                </section>
              </>
            )}

            {doc.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                <span className="font-bold">Catatan Penolakan Verifikator:</span>
                <p className="mt-0.5">{doc.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* ISO Sign-off Matrix Table: 4 Core Roles */}
          <div className="mt-8 border-t-2 border-slate-800 dark:border-slate-300 pt-4 grid grid-cols-2 sm:grid-cols-4 text-center text-xs relative z-10 gap-y-4 sm:gap-y-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 dark:divide-slate-700">
            {/* 01. User / Staff */}
            <div className="px-2 pt-2 sm:pt-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">01. Dibuat Oleh (User):</span>
              <div className="h-12 flex items-center justify-center font-serif text-slate-700 dark:text-slate-300 italic text-sm">
                {doc.creator}
              </div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1 text-xs">
                {doc.creator}
              </div>
              <div className="text-[9.5px] text-slate-500">{doc.creatorPosition || 'Staff'}</div>
            </div>

            {/* 02. Reviewer / Atasan */}
            <div className="px-2 pt-2 sm:pt-0">
              <span className="text-[10px] text-purple-600 uppercase font-bold tracking-wider">02. Diperiksa (Reviewer):</span>
              <div className="h-12 flex items-center justify-center font-serif text-purple-700 dark:text-purple-300 italic text-xs font-semibold">
                {doc.reviewedBy ? `[REVIEWED] ${doc.reviewedBy}` : (doc.targetReviewer ? `[PENDING] ${doc.targetReviewer}` : 'Atasan Departemen')}
              </div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1 text-xs">
                {doc.reviewedBy || doc.targetReviewer || 'Atasan Departemen'}
              </div>
              <div className="text-[9.5px] text-slate-500">
                {doc.reviewedDate ? `Tgl: ${doc.reviewedDate}` : 'Pemeriksa Isi & Alur Kerja'}
              </div>
            </div>

            {/* 03. Document Control / DCO */}
            <div className="px-2 pt-2 sm:pt-0">
              <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">03. Verifikasi (DCO):</span>
              <div className="h-12 flex items-center justify-center font-serif text-blue-700 dark:text-blue-300 italic text-xs font-semibold">
                {doc.verifiedBy ? `[VERIFIED] ${doc.verifiedBy}` : (doc.status === 'REVIEW' || doc.status === 'DRAFT' ? 'Menunggu Review' : 'Document Control')}
              </div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1 text-xs">
                {doc.verifiedBy || doc.verifierTeam || 'Document Control Officer'}
              </div>
              <div className="text-[9.5px] text-slate-500">
                {doc.verifiedDate ? `Tgl: ${doc.verifiedDate}` : 'Pengendali Format & Nomor'}
              </div>
            </div>

            {/* 04. Approver / MR */}
            <div className="px-2 pt-2 sm:pt-0">
              <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">04. Disahkan (MR):</span>
              <div className="h-12 flex items-center justify-center font-serif text-emerald-700 dark:text-emerald-400 italic text-xs font-bold">
                {doc.approvedBy ? `[APPROVED] ${doc.approvedBy}` : (doc.targetApprover ? `[PENDING] ${doc.targetApprover}` : (doc.status === 'AKTIF' ? 'Management Rep.' : '-'))}
              </div>
              <div className="font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-1 text-xs">
                {doc.approvedBy || doc.targetApprover || (doc.status === 'AKTIF' ? 'BABAN RACHMAT SUBAGJA' : 'MR / Top Management')}
              </div>
              <div className="text-[9.5px] text-slate-500">
                {doc.approvedDate ? `Tgl: ${doc.approvedDate}` : (doc.approverPosition || 'Management Representative')}
              </div>
            </div>
          </div>

          {/* Footer Security Stamp */}
          <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
            <span>Sistem Manajemen Dokumen Terkendali - {systemSettings.companyName || 'PT DJI'}</span>
            <span>Dicetak: {new Date().toLocaleDateString('id-ID')} | Standar ISO 9001</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
