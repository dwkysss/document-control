import React, { useEffect, useState, useRef } from 'react';
import {
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Paperclip,
  UploadCloud,
  RefreshCw,
  Stamp,
  Layers,
  ChevronDown,
  ChevronUp,
  UserCheck,
  RotateCcw,
  Clock
} from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import { generateDocumentQRCode } from '../../utils/qrGenerator';
import { exportControlledDocumentPDF } from '../../utils/exportUtils';
import { stampOfficialLetterheadOnPDF, downloadBlobAsFile } from '../../utils/pdfStamper';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

export default function DocumentViewerModal({ doc, isOpen, onClose }) {
  const { systemSettings, showToast, attachFileToDocument } = useDocumentControl();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [showQrVerifyInfo, setShowQrVerifyInfo] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [showSignOffMatrix, setShowSignOffMatrix] = useState(true);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const fileInputRef = useRef(null);

  // Word (.docx) Rendering State
  const docxContainerRef = useRef(null);
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);
  const [docxError, setDocxError] = useState(false);

  // Excel (.xlsx/.csv) Rendering State
  const [excelData, setExcelData] = useState(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelError, setExcelError] = useState(false);

  // File type detection
  const fileNameLower = (doc?.fileName || '').toLowerCase();
  const fileTypeLower = (doc?.fileType || '').toLowerCase();

  const isImageFile = Boolean(
    doc?.fileUrl && (
      fileTypeLower.startsWith('image/') ||
      doc.fileUrl.startsWith('data:image/') ||
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileNameLower)
    )
  );

  const isWordFile = Boolean(
    doc?.fileUrl && (
      fileTypeLower.includes('word') ||
      fileTypeLower.includes('officedocument.wordprocessingml') ||
      /\.(docx?|doc)$/i.test(fileNameLower)
    )
  );

  const isExcelFile = Boolean(
    doc?.fileUrl && (
      fileTypeLower.includes('sheet') ||
      fileTypeLower.includes('excel') ||
      /\.(xlsx?|csv)$/i.test(fileNameLower)
    )
  );

  const isPdfFile = Boolean(
    doc?.fileUrl && (
      fileTypeLower === 'application/pdf' ||
      /\.pdf$/i.test(fileNameLower) ||
      doc.fileUrl.startsWith('data:application/pdf') ||
      (!isWordFile && !isExcelFile && !isImageFile)
    )
  );

  // Siapkan QR Code dan Blob URL
  useEffect(() => {
    let isMounted = true;
    let createdUrl = null;

    if (doc) {
      generateDocumentQRCode(doc).then(url => {
        if (isMounted) setQrCodeUrl(url);
      });

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
            setBlobUrl(doc.fileUrl);
          }
        } else if (doc.fileUrl.startsWith('blob:')) {
          setBlobUrl(doc.fileUrl);
        } else if (doc.fileUrl.startsWith('http')) {
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
              if (isMounted) setBlobUrl(doc.fileUrl);
            });
        } else {
          setBlobUrl(doc.fileUrl);
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

  // Render Word document (.docx) secara langsung
  useEffect(() => {
    if (isWordFile && (blobUrl || doc?.fileUrl) && docxContainerRef.current) {
      setIsRenderingDocx(true);
      setDocxError(false);

      const targetUrl = blobUrl || doc.fileUrl;
      fetch(targetUrl)
        .then(res => {
          if (!res.ok) throw new Error('Gagal mengambil berkas Word');
          return res.blob();
        })
        .then(blob => {
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            return renderAsync(blob, docxContainerRef.current, null, {
              className: 'docx-preview-content',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false
            });
          }
        })
        .catch(err => {
          console.warn('docx-preview error:', err);
          setDocxError(true);
        })
        .finally(() => {
          setIsRenderingDocx(false);
        });
    }
  }, [isWordFile, blobUrl, doc?.fileUrl]);

  // Render Excel document (.xlsx / .csv) secara langsung
  useEffect(() => {
    if (isExcelFile && (blobUrl || doc?.fileUrl)) {
      setIsParsingExcel(true);
      setExcelError(false);

      const targetUrl = blobUrl || doc.fileUrl;
      fetch(targetUrl)
        .then(res => {
          if (!res.ok) throw new Error('Gagal mengambil berkas Excel');
          return res.arrayBuffer();
        })
        .then(buffer => {
          const workbook = XLSX.read(buffer, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Spreadsheet kosong');
          }
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const html = XLSX.utils.sheet_to_html(sheet, { id: 'excel-preview-table' });
          setExcelData({
            workbook,
            sheetNames: workbook.SheetNames,
            activeSheet: firstSheet,
            html
          });
        })
        .catch(err => {
          console.warn('xlsx parse error:', err);
          setExcelError(true);
        })
        .finally(() => {
          setIsParsingExcel(false);
        });
    }
  }, [isExcelFile, blobUrl, doc?.fileUrl]);

  if (!doc) return null;

  const handlePrint = () => {
    window.print();
  };

  // Unduh PDF resmi dengan Kop Surat & Watermark ISO
  const handleDownloadOfficialPDF = async () => {
    if (isProcessingDownload) return;
    setIsProcessingDownload(true);
    showToast('Menyematkan Kop Surat PT DJI dan Watermark ke dalam berkas PDF...', 'info');

    try {
      const fileName = await stampOfficialLetterheadOnPDF({
        ...doc,
        fileUrl: blobUrl || doc.fileUrl
      }, systemSettings, qrCodeUrl);
      showToast(`Dokumen resmi (${fileName}) berhasil diunduh!`, 'success');
    } catch (e) {
      console.error('Error in PDF download:', e);
      exportControlledDocumentPDF(doc, systemSettings, qrCodeUrl);
      showToast(`Dokumen resmi ${doc.docNumber} berhasil diunduh!`, 'success');
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // Unduh berkas asli yang diunggah
  const handleDownloadRawFile = () => {
    if (doc.fileUrl) {
      const cleanTitle = (doc.title || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const ext = isWordFile ? '.docx' : isExcelFile ? '.xlsx' : isPdfFile ? '.pdf' : '';
      const defaultName = `${doc.docNumber}_${cleanTitle}${ext}`;
      const fileName = doc.fileName || defaultName;

      if (doc.fileUrl.startsWith('data:')) {
        try {
          const parts = doc.fileUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
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
      showToast(`Berkas ${file.name} berhasil dilampirkan ke dokumen.`, 'success');
    }
  };

  const handleSelectExcelSheet = (name) => {
    if (!excelData?.workbook) return;
    const sheet = excelData.workbook.Sheets[name];
    const html = XLSX.utils.sheet_to_html(sheet, { id: 'excel-preview-table' });
    setExcelData(prev => ({
      ...prev,
      activeSheet: name,
      html
    }));
  };

  const isObsolete = doc.status === 'OBSOLETE';
  const isActive = doc.status === 'AKTIF';
  const isNeedsRevision = doc.status === 'PERLU REVISI' || doc.status === 'REVISI';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Dokumen Terkendali (Controlled Document Viewer)"
      subtitle={`No. Dokumen: ${doc.docNumber} | Standar Mutu ISO 9001:2015 Klausul 7.5`}
      maxWidth="max-w-6xl"
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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800 no-print">
        {/* Identitas Ringkas & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge status={doc.status} size="lg" />
          {isActive && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Salinan Terkendali Resmi
            </span>
          )}
          {isObsolete && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" /> Telah Digantikan oleh Revisi Baru
            </span>
          )}
          {doc.fileName && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 max-w-[280px] truncate">
              <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{doc.fileName}</span>
              {doc.fileSize && <span className="text-[10px] text-slate-400 shrink-0">({doc.fileSize})</span>}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowQrVerifyInfo(!showQrVerifyInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title="Scan QR Code untuk verifikasi keaslian dokumen"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            {showQrVerifyInfo ? 'Tutup QR' : 'Validasi QR'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Cetak
          </button>

          {doc.fileUrl && (
            <button
              type="button"
              onClick={handleDownloadRawFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
              title="Unduh berkas asli yang diunggah"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Berkas Asli
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadOfficialPDF}
            disabled={isProcessingDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer"
            title="Unduh PDF Resmi dengan Kop Surat PT DJI dan Tanda Tangan"
          >
            <Stamp className="w-3.5 h-3.5 text-amber-300" />
            {isProcessingDownload ? 'Memproses...' : 'Unduh PDF + Kop Surat'}
          </button>
        </div>
      </div>

      {/* QR Code Verification Banner Dropdown */}
      {showQrVerifyInfo && qrCodeUrl && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 flex items-center justify-between gap-4 animate-fade-in no-print">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 shrink-0">
              <img src={qrCodeUrl} alt="QR Code Verifikasi" className="w-20 h-20" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sistem Verifikasi Digital Terdaftar (ISO 9001:2015)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
                QR Code ini membuktikan integritas dokumen resmi {systemSettings.companyName || 'PT DJI'}. Scan menggunakan kamera ponsel untuk memvalidasi nomor registrasi <strong>{doc.docNumber}</strong> dan status saat ini.
              </p>
              <div className="flex gap-3 text-[11px] text-slate-500 mt-2">
                <span>Status: <strong className="text-slate-800 dark:text-slate-200">{doc.status}</strong></span>
                <span>•</span>
                <span>Departemen: <strong className="text-slate-800 dark:text-slate-200">{doc.department}</strong></span>
                <span>•</span>
                <span>Revisi: <strong className="text-slate-800 dark:text-slate-200">{doc.revision}</strong></span>
              </div>
              <div className="pt-2">
                <a
                  href={`/?verify=${encodeURIComponent(doc.docNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Uji Coba Buka Halaman Verifikasi Publik (Simulasi Scan HP)
                </a>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQrVerifyInfo(false)}
            className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Catatan Permintaan Revisi dari Verifikator (jika status PERLU REVISI) */}
      {isNeedsRevision && doc.revisionNotes && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Catatan Permintaan Revisi:</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-semibold">
              {doc.revisionRequestedBy || 'Verifikator'}
            </span>
          </div>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium italic pl-5">
            "{doc.revisionNotes}"
          </p>
        </div>
      )}

      {/* Utility Bar di atas Dokumen: Saklar Kop Surat & Buka Tab Baru */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs">
        <div className="flex items-center gap-2">
          {doc.fileUrl && (
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none">
              <input
                type="checkbox"
                checked={includeLetterhead}
                onChange={(e) => setIncludeLetterhead(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Stamp className="w-3.5 h-3.5 text-blue-600" />
                Sematkan Kop Surat Resmi PT DJI
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          {blobUrl && isPdfFile && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Layar Penuh di Tab Baru
            </a>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition font-medium cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {doc.fileUrl ? 'Ganti File' : 'Unggah File (PDF/Word/Excel)'}
          </button>
        </div>
      </div>

      {/* ================= AREA UTAMA PRATINJAU DOKUMEN ================= */}
      <div className="space-y-4">
        {/* Kop Surat Terkendali Resmi PT DJI (Otomatis & Terintegrasi) */}
        {includeLetterhead && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-300 rounded-lg overflow-hidden shadow-xs animate-fade-in">
            <div className="grid grid-cols-12 divide-x-2 divide-slate-800 dark:divide-slate-300">
              {/* Logo Box: Bersih hanya Logo Resmi PT DJI (Centered Vertikal & Horizontal) */}
              <div className="col-span-3 p-3 flex items-center justify-center bg-white dark:bg-slate-800/80">
                <img
                  src="/dji-logo.png"
                  alt="PT DJI Logo"
                  className="h-11 max-w-[145px] object-contain drop-shadow-2xs"
                />
              </div>

              {/* Document Title Header (Tengah, Rapi, Simetris & Berbobot) */}
              <div className="col-span-5 p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  {doc.typeName || doc.type || 'PROSEDUR TERKENDALI'}
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase leading-snug my-1 px-1" title={doc.title}>
                  {doc.title}
                </h3>
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                  Status Dokumen: {doc.status} &bull; Salinan Terkendali Resmi
                </span>
              </div>

              {/* Document Metadata Box + QR Code (col-span-4) */}
              <div className="col-span-4 p-2.5 flex items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex-1 space-y-1 text-[10px]">
                  <div className="flex items-center">
                    <span className="text-slate-500 w-20 shrink-0">No. Dokumen</span>
                    <span className="text-slate-400 mr-1.5 font-bold">:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white truncate">{doc.docNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-500 w-20 shrink-0">Revisi</span>
                    <span className="text-slate-400 mr-1.5 font-bold">:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.revision}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-500 w-20 shrink-0">Departemen</span>
                    <span className="text-slate-400 mr-1.5 font-bold">:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{doc.department}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-slate-500 w-20 shrink-0">Tgl. Terbit</span>
                    <span className="text-slate-400 mr-1.5 font-bold">:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{doc.effectiveDate || doc.createdDate}</span>
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="shrink-0 p-1 bg-white rounded border border-slate-200 shadow-2xs">
                    <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Viewport Konten Berkas Dokumen */}
        {doc.fileUrl ? (
          <div className="space-y-3">
            {/* 1. PDF Viewer: Native Embedded Frame */}
            {isPdfFile && (
              <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 min-h-[620px]">
                <iframe
                  src={`${blobUrl || doc.fileUrl}#toolbar=1&navpanes=0`}
                  title={doc.fileName || 'Pratinjau PDF Dokumen'}
                  className="w-full h-[720px] border-0 bg-white"
                />
              </div>
            )}

            {/* 2. Microsoft Word Viewer: Rendered directly with docx-preview */}
            {isWordFile && (
              <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-300 dark:border-slate-700 min-h-[500px]">
                {isRenderingDocx && (
                  <div className="py-20 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Merender naskah dokumen Word...</p>
                    <p className="text-[11px] text-slate-400 mt-1">Menyiapkan format naskah asli dari berkas .docx</p>
                  </div>
                )}
                {docxError && (
                  <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                      Format Word ini tidak dapat dirender langsung di browser. Anda dapat mengunduh berkas aslinya untuk membuka di Microsoft Word.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadRawFile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Unduh Berkas Word (.docx)
                    </button>
                  </div>
                )}
                <div
                  ref={docxContainerRef}
                  className={`docx-preview-container bg-white shadow-lg mx-auto rounded-lg overflow-auto max-w-4xl p-6 sm:p-12 ${
                    isRenderingDocx || docxError ? 'hidden' : 'block'
                  }`}
                />
              </div>
            )}

            {/* 3. Excel Spreadsheet Viewer: Rendered directly with XLSX */}
            {isExcelFile && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
                {/* Excel Sheet Switcher */}
                {excelData?.sheetNames && excelData.sheetNames.length > 1 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-500 mr-2 flex items-center gap-1 shrink-0">
                      <Layers className="w-3.5 h-3.5" /> Lembar Kerja:
                    </span>
                    {excelData.sheetNames.map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => handleSelectExcelSheet(sName)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer whitespace-nowrap ${
                          excelData.activeSheet === sName
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                  </div>
                )}

                {isParsingExcel && (
                  <div className="py-20 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Membaca lembar kerja spreadsheet...</p>
                  </div>
                )}

                {excelError && (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-rose-600 font-semibold">Gagal memuat pratinjau tabel spreadsheet.</p>
                    <button
                      type="button"
                      onClick={handleDownloadRawFile}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Unduh Berkas Excel (.xlsx)
                    </button>
                  </div>
                )}

                {excelData?.html && !isParsingExcel && !excelError && (
                  <div
                    className="max-h-[600px] overflow-auto p-4"
                    dangerouslySetInnerHTML={{ __html: excelData.html }}
                  />
                )}
              </div>
            )}

            {/* 4. Image Viewer */}
            {isImageFile && (
              <div className="p-4 flex flex-col items-center justify-center bg-slate-950 min-h-[500px] rounded-xl border border-slate-800">
                <img
                  src={blobUrl || doc.fileUrl}
                  alt={doc.fileName || 'Pratinjau Dokumen'}
                  className="max-h-[650px] object-contain rounded-lg shadow-lg border border-slate-800 bg-white"
                />
                <p className="text-xs text-slate-400 mt-3 font-mono">Lampiran Gambar: {doc.fileName}</p>
              </div>
            )}
          </div>
        ) : (
          /* Empty State: Belum ada file yang diunggah */
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Berkas Dokumen Belum Dilampirkan
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Dokumen <strong>{doc.docNumber}</strong> ({doc.title}) saat ini belum memiliki file lampiran fisik. Unggah berkas PDF, Word, atau Excel Anda untuk melihat pratinjaunya secara langsung.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Unggah Berkas PDF / Word Sekarang
              </button>
            </div>
          </div>
        )}

        {/* ================= ISO 9001 SIGN-OFF MATRIX FOOTER ================= */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
            {/* Header Strip Matriks */}
            <div
              onClick={() => setShowSignOffMatrix(!showSignOffMatrix)}
              className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition select-none"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Matriks Otorisasi & Rekam Jejak Pengesahan (ISO 9001:2015 Klausul 7.5.2)
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  • 4 Tahap Pengendalian
                </span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 font-semibold"
              >
                <span>{showSignOffMatrix ? 'Sembunyikan' : 'Tampilkan'}</span>
                {showSignOffMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Konten Matriks 4 Tahap */}
            {showSignOffMatrix && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 01. Dibuat Oleh (Staff) */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      01. Pembuat
                    </span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      Disubmit
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate" title={doc.creator}>
                    {doc.creator}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {doc.creatorPosition || 'Staff Pembuat'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {doc.createdDate}
                  </p>
                </div>

                {/* 02. Diperiksa (Reviewer / Atasan) */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      02. Reviewer
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                      doc.reviewedBy
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : isNeedsRevision
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {doc.reviewedBy ? 'Disetujui' : isNeedsRevision ? 'Perlu Revisi' : 'Menunggu'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate" title={doc.reviewedBy || doc.targetReviewer || 'Atasan Departemen'}>
                    {doc.reviewedBy || doc.targetReviewer || 'Atasan Departemen'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Pemeriksa Alur Kerja
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {doc.reviewedDate || 'Belum ditinjau'}
                  </p>
                </div>

                {/* 03. Verifikasi (DCO / Document Control) */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      03. Verifikasi DCO
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                      doc.verifiedBy
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {doc.verifiedBy ? 'Terverifikasi' : 'Menunggu'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate" title={doc.verifiedBy || doc.verifierTeam || 'Document Control'}>
                    {doc.verifiedBy || doc.verifierTeam || 'Document Control'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Format & Penomoran ISO
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {doc.verifiedDate || 'Belum diverifikasi'}
                  </p>
                </div>

                {/* 04. Pengesahan (MR / Top Management) */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      04. Pengesah (MR)
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                      doc.approvedBy || doc.status === 'AKTIF'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {doc.approvedBy || doc.status === 'AKTIF' ? 'Disahkan' : 'Menunggu'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white truncate" title={doc.approvedBy || doc.targetApprover || (doc.status === 'AKTIF' ? 'Management Rep.' : '-')}>
                    {doc.approvedBy || doc.targetApprover || (doc.status === 'AKTIF' ? 'BABAN RACHMAT SUBAGJA' : 'MR / Direksi')}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {doc.approverPosition || 'Management Representative'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    {doc.approvedDate || 'Menunggu otoritas'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-2 flex items-center justify-between text-[10.5px] text-slate-400">
          <span>Sistem Manajemen Dokumen Terkendali • {systemSettings.companyName || 'PT DJI'}</span>
          <span>Standar Mutu ISO 9001:2015 Klausul 7.5</span>
        </div>
      </div>
    </Modal>
  );
}
