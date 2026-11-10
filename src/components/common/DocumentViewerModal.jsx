import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Clock,
  FileSpreadsheet,
  FileText,
  Table,
  Search,
  Copy
} from 'lucide-react';
import Modal from './Modal';
import Badge, { CompanyBadge } from './Badge';
import { generateDocumentQRCode } from '../../utils/qrGenerator';
import { exportControlledDocumentPDF } from '../../utils/exportUtils';
import { stampOfficialLetterheadOnPDF, downloadBlobAsFile, getDocumentTypeFullName } from '../../utils/pdfStamper';
import { buildIsoSpreadsheetWorkbook, downloadWorkbookFile } from '../../utils/spreadsheetGenerator';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';

/**
 * Konversi indeks kolom numerik ke format huruf kolom Excel (0 -> A, 1 -> B, ..., 26 -> AA)
 */
function getColumnLetter(colIndex) {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export default function DocumentViewerModal({ doc, isOpen, onClose }) {
  const { systemSettings, showToast, attachFileToDocument, companies } = useDocumentControl();
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [showQrVerifyInfo, setShowQrVerifyInfo] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [stampedPdfUrl, setStampedPdfUrl] = useState(null);
  const [isStampingPreview, setIsStampingPreview] = useState(false);
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [documentLayoutMode, setDocumentLayoutMode] = useState('header'); // 'header' (Kop Surat) | 'cover' (1 Lembar Cover)
  const [showSignOffMatrix, setShowSignOffMatrix] = useState(true);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const [isPdfFallback, setIsPdfFallback] = useState(false);
  const fileInputRef = useRef(null);

  // Word (.docx) Rendering State
  const [docxContainer, setDocxContainer] = useState(null);
  const [isRenderingDocx, setIsRenderingDocx] = useState(false);
  const [docxError, setDocxError] = useState(null);

  // Excel (.xlsx/.csv) Rendering State
  const [excelData, setExcelData] = useState(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelError, setExcelError] = useState(false);
  const [activeExcelCell, setActiveExcelCell] = useState({ row: 0, col: 0 });
  const [excelSearchQuery, setExcelSearchQuery] = useState('');

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

  const docCompanyCode = (doc?.companyCode || (doc?.docNumber?.startsWith('UMI') ? 'UMI' : doc?.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')).toUpperCase();
  const docCompanyName = doc?.companyName || (
    docCompanyCode === 'UMI' ? 'PT Ultimo Moda Indotex' :
    docCompanyCode === 'IMK' ? 'PT IMK' :
    (systemSettings?.companyName || 'PT Dentelle Jaya Infinitex')
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
            .then(res => {
              if (!res.ok) throw new Error('Network error');
              return res.blob();
            })
            .then(blob => {
              if (!isMounted) return;
              setIsPdfFallback(false);
              const cleanBlob = new Blob([blob], { type: doc.fileType || 'application/pdf' });
              createdUrl = URL.createObjectURL(cleanBlob);
              setBlobUrl(createdUrl);
            })
            .catch(err => {
              console.warn('Could not fetch remote file for blob preview:', err);
              if (isMounted) {
                // Jika berkas PDF dan host remote tidak dapat diakses, siapkan pratinjau PDF client-side
                if (isPdfFile) {
                  try {
                    const fallbackBlob = exportControlledDocumentPDF(doc, systemSettings, null, { returnBlob: true });
                    if (fallbackBlob) {
                      setIsPdfFallback(true);
                      createdUrl = URL.createObjectURL(fallbackBlob);
                      setBlobUrl(createdUrl);
                      return;
                    }
                  } catch (e) {
                    console.warn('Failed to generate fallback PDF blob:', e);
                  }
                }
                setBlobUrl(doc.fileUrl);
              }
            });
        } else {
          setIsPdfFallback(false);
          setBlobUrl(doc.fileUrl);
        }
      } else {
        setIsPdfFallback(false);
        setBlobUrl(null);
      }
    }

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [doc, doc?.fileUrl]);

  // Render Word document (.docx) secara langsung & tangguh
  useEffect(() => {
    let isMounted = true;

    if (!isWordFile || !docxContainer || (!blobUrl && !doc?.fileUrl)) {
      return;
    }

    const isLegacyDoc = /\.doc$/i.test(fileNameLower) && !/\.docx$/i.test(fileNameLower);
    if (isLegacyDoc) {
      setDocxError('legacy_doc');
      setIsRenderingDocx(false);
      return;
    }

    setIsRenderingDocx(true);
    setDocxError(null);

    (async () => {
      try {
        const targetUrl = blobUrl || doc.fileUrl;
        let dataToRender;

        if (targetUrl.startsWith('data:')) {
          const parts = targetUrl.split(',');
          const bstr = atob(parts[1]);
          const len = bstr.length;
          const u8arr = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            u8arr[i] = bstr.charCodeAt(i);
          }
          dataToRender = u8arr.buffer;
        } else {
          const res = await fetch(targetUrl);
          if (!res.ok) throw new Error(`Gagal mengambil berkas Word (HTTP ${res.status})`);
          dataToRender = await res.arrayBuffer();
        }

        if (!isMounted || !docxContainer) return;

        docxContainer.innerHTML = '';
        await renderAsync(dataToRender, docxContainer, null, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          experimental: true,
        });

        if (isMounted) {
          setDocxError(null);
        }
      } catch (err) {
        console.warn('Gagal merender berkas Word dengan docx-preview:', err);
        if (isMounted) {
          setDocxError('render_failed');
        }
      } finally {
        if (isMounted) {
          setIsRenderingDocx(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isWordFile, docxContainer, blobUrl, doc?.fileUrl, fileNameLower]);

  // Render Excel document (.xlsx / .csv) secara langsung & tangguh
  useEffect(() => {
    if (isExcelFile) {
      setIsParsingExcel(true);
      setExcelError(false);

      const loadFallbackWorkbook = () => {
        try {
          const wb = buildIsoSpreadsheetWorkbook(doc, systemSettings);
          const firstSheet = wb.SheetNames[0];
          const sheet = wb.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          setExcelData({
            workbook: wb,
            sheetNames: wb.SheetNames,
            activeSheet: firstSheet,
            rows,
            isFallback: true
          });
          setExcelError(false);
          setActiveExcelCell({ row: 0, col: 0 });
        } catch (e) {
          console.warn('Gagal membuat fallback spreadsheet:', e);
          setExcelError(true);
        } finally {
          setIsParsingExcel(false);
        }
      };

      const targetUrl = blobUrl || doc?.fileUrl;
      if (!targetUrl) {
        loadFallbackWorkbook();
        return;
      }

      (async () => {
        try {
          let buffer;
          if (targetUrl.startsWith('data:')) {
            const parts = targetUrl.split(',');
            const bstr = atob(parts[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            buffer = u8arr.buffer;
          } else {
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`Gagal mengambil berkas Excel (HTTP ${res.status})`);
            buffer = await res.arrayBuffer();
          }

          const workbook = XLSX.read(buffer, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Spreadsheet kosong');
          }
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          setExcelData({
            workbook,
            sheetNames: workbook.SheetNames,
            activeSheet: firstSheet,
            rows,
            isFallback: false
          });
          setExcelError(false);
          setActiveExcelCell({ row: 0, col: 0 });
        } catch (err) {
          console.warn('Excel parse error, generating ISO standard sheet:', err);
          loadFallbackWorkbook();
        } finally {
          setIsParsingExcel(false);
        }
      })();
    }
  }, [isExcelFile, blobUrl, doc?.fileUrl, doc?.docNumber]);

  // Live Stamped PDF Preview: Menyematkan Kop Surat Resmi & QR Code secara langsung ke atas berkas PDF
  useEffect(() => {
    let isMounted = true;
    let newObjectUrl = null;

    if (isOpen && isPdfFile && (blobUrl || doc?.fileUrl) && includeLetterhead) {
      setIsStampingPreview(true);

      (async () => {
        try {
          const targetComp = (companies || []).find(c => c.code === docCompanyCode);
          const targetLogoUrl = targetComp?.logoUrl || (docCompanyCode === 'DJI' ? '/dji-logo.png' : null);
          const finalQr = qrCodeUrl || (doc ? await generateDocumentQRCode(doc) : null);

          const blob = await stampOfficialLetterheadOnPDF(
            {
              ...doc,
              fileUrl: blobUrl || doc.fileUrl,
              logoUrl: targetLogoUrl,
              includeLetterhead: true,
            },
            systemSettings,
            finalQr,
            { returnBlob: true, layoutMode: documentLayoutMode }
          );

          if (!isMounted) return;
          if (blob) {
            newObjectUrl = URL.createObjectURL(blob);
            setStampedPdfUrl(newObjectUrl);
          }
        } catch (err) {
          console.warn('Gagal menyiapkan pratinjau PDF ber-kop:', err);
        } finally {
          if (isMounted) setIsStampingPreview(false);
        }
      })();
    } else {
      setStampedPdfUrl(null);
      setIsStampingPreview(false);
    }

    return () => {
      isMounted = false;
      if (newObjectUrl) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(newObjectUrl);
          } catch (e) {
            // ignore
          }
        }, 1000);
      }
    };
  }, [
    isOpen,
    isPdfFile,
    blobUrl,
    doc?.fileUrl,
    doc?.docNumber,
    doc?.revision,
    doc?.title,
    doc?.status,
    doc?.department,
    includeLetterhead,
    documentLayoutMode,
    qrCodeUrl,
    docCompanyCode,
    systemSettings?.companyName,
  ]);

  const totalExcelCols = useMemo(() => {
    const dataRows = excelData?.rows || [];
    const maxDataCols = dataRows.reduce((max, r) => Math.max(max, r?.length || 0), 0);
    return Math.max(maxDataCols, 6);
  }, [excelData?.rows]);

  const totalExcelRows = useMemo(() => {
    const dataRows = excelData?.rows || [];
    return Math.max(dataRows.length, 14);
  }, [excelData?.rows]);

  const colNumbers = useMemo(() => {
    if (!excelData?.rows || excelData.rows.length <= 1) return null;
    const colIdx = activeExcelCell.col;
    const vals = [];
    for (let i = 1; i < excelData.rows.length; i++) {
      const v = excelData.rows[i]?.[colIdx];
      if (typeof v === 'number' && !isNaN(v)) {
        vals.push(v);
      } else if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
        vals.push(Number(v));
      }
    }
    if (vals.length === 0) return null;
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    return {
      count: vals.length,
      sum,
      avg: Number.isInteger(avg) ? avg : avg.toFixed(2)
    };
  }, [excelData?.rows, activeExcelCell.col]);

  if (!doc) return null;

  const activePdfUrl = (includeLetterhead && stampedPdfUrl)
    ? stampedPdfUrl
    : (blobUrl || doc?.fileUrl);

  const handlePrint = () => {
    window.print();
  };

  // Unduh PDF resmi dengan Kop Surat & Watermark ISO
  // Unduh PDF resmi dengan Kop Surat & Watermark ISO
  const handleDownloadOfficialPDF = async () => {
    if (isProcessingDownload) return;
    setIsProcessingDownload(true);
    showToast(`Menyiapkan berkas PDF resmi ${docCompanyName}...`, 'info');

    try {
      const cleanTitle = (doc.title || 'DOKUMEN').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35);
      const officialFileName = `${doc.docNumber}_${cleanTitle}_Resmi_${docCompanyCode}.pdf`;

      const targetComp = (companies || []).find(c => c.code === docCompanyCode);
      const targetLogoUrl = targetComp?.logoUrl || (docCompanyCode === 'DJI' ? '/dji-logo.png' : null);

      // 1. Jika dokumen adalah Spreadsheet Excel atau Dokumen Word (bukan PDF mentah)
      if (isExcelFile || isWordFile) {
        const fileName = await exportControlledDocumentPDF({
          ...doc,
          excelRows: excelData?.rows,
          excelSheetName: excelData?.activeSheet,
          companyName: docCompanyName,
        }, systemSettings, qrCodeUrl, {
          excelRows: excelData?.rows,
          excelSheetName: excelData?.activeSheet,
          logoUrl: targetLogoUrl,
          layoutMode: documentLayoutMode,
        });
        showToast(`Dokumen resmi (${fileName}) berhasil diunduh!`, 'success');
        return;
      }

      // 2. Jika berkas PDF asli dan opsi Kop Surat aktif serta pratinjau ber-kop sudah siap, unduh instan
      if (isPdfFile && includeLetterhead && stampedPdfUrl) {
        const res = await fetch(stampedPdfUrl);
        const blob = await res.blob();
        downloadBlobAsFile(blob, officialFileName);
        showToast(`Dokumen resmi (${officialFileName}) berhasil diunduh!`, 'success');
        return;
      }

      // 3. Stempel Kop Surat pada PDF asli
      const fileName = await stampOfficialLetterheadOnPDF({
        ...doc,
        fileUrl: blobUrl || doc.fileUrl,
        logoUrl: targetLogoUrl,
        includeLetterhead: includeLetterhead,
        companyName: docCompanyName,
      }, systemSettings, qrCodeUrl, {
        logoUrl: targetLogoUrl,
        layoutMode: documentLayoutMode,
      });
      showToast(`Dokumen resmi (${fileName}) berhasil diunduh!`, 'success');
    } catch (e) {
      console.error('Error in PDF download:', e);
      try {
        const fallbackName = await exportControlledDocumentPDF({
          ...doc,
          excelRows: excelData?.rows,
          excelSheetName: excelData?.activeSheet,
          companyName: docCompanyName,
        }, systemSettings, qrCodeUrl, {
          excelRows: excelData?.rows,
          excelSheetName: excelData?.activeSheet,
          layoutMode: documentLayoutMode,
        });
        showToast(`Dokumen resmi (${fallbackName}) berhasil diunduh!`, 'success');
      } catch (fallbackErr) {
        console.error('Fatal PDF export error:', fallbackErr);
        showToast(`Gagal menyiapkan PDF: ${fallbackErr.message || 'Terjadi kesalahan sistem'}`, 'danger');
      }
    } finally {
      setIsProcessingDownload(false);
    }
  };

  // Unduh berkas asli yang diunggah
  const handleDownloadRawFile = () => {
    const cleanTitle = (doc.title || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const ext = isWordFile ? '.docx' : isExcelFile ? '.xlsx' : isPdfFile ? '.pdf' : '';
    const defaultName = `${doc.docNumber}_${cleanTitle}${ext}`;
    const fileName = doc.fileName || defaultName;

    // 1. Jika ini berkas Excel dan kita memiliki data workbook SheetJS yang siap
    if (isExcelFile && excelData?.workbook) {
      try {
        downloadWorkbookFile(excelData.workbook, fileName);
        showToast(`Mengunduh berkas spreadsheet ${fileName}...`, 'success');
        return;
      } catch (e) {
        console.warn('Error downloading workbook directly:', e);
      }
    }

    // 2. Jika ada fileUrl asli yang diunggah (data URL, blob URL, atau link)
    if (doc.fileUrl) {
      if (doc.fileUrl.startsWith('data:')) {
        try {
          const parts = doc.fileUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || (
            isExcelFile ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            isWordFile ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
            'application/octet-stream'
          );
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
        } catch (e) {
          console.warn('Error downloading data URL as file:', e);
        }
      }

      if (blobUrl && blobUrl.startsWith('blob:')) {
        try {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 300);
          showToast(`Mengunduh berkas asli ${fileName}...`, 'success');
          return;
        } catch (e) {
          console.warn('Error downloading blobUrl:', e);
        }
      }

      try {
        const link = document.createElement('a');
        link.href = doc.fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 300);
        showToast(`Mengunduh berkas asli ${fileName}...`, 'success');
        return;
      } catch (e) {
        console.warn('Error downloading fileUrl link:', e);
      }
    }

    handleDownloadOfficialPDF();
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
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    setExcelData(prev => ({
      ...prev,
      activeSheet: name,
      rows
    }));
    setActiveExcelCell({ row: 0, col: 0 });
  };

  const isObsolete = doc.status === 'OBSOLETE';
  const isActive = doc.status === 'AKTIF';
  const isNeedsRevision = doc.status === 'PERLU REVISI' || doc.status === 'REVISI';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-6xl"
      title={(
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <CompanyBadge companyCode={doc.companyCode || doc.docNumber?.split('-')[0]} size="sm" />
          <Badge status={doc.status} size="sm" />
          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
            {doc.docNumber}
          </span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">—</span>
          <span className="text-slate-700 dark:text-slate-200 text-sm font-semibold truncate max-w-xs md:max-w-md" title={doc.title}>
            {doc.title}
          </span>
        </div>
      )}
      subtitle={(
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
          <span>{docCompanyName}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>Dept: <strong className="text-slate-700 dark:text-slate-300">{doc.department || '-'}</strong></span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>Rev: <strong className="text-slate-700 dark:text-slate-300">{doc.revision || '00'}</strong></span>
          {doc.fileSize && (
            <>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                <Paperclip className="w-3 h-3 text-slate-400" />
                {doc.fileSize}
              </span>
            </>
          )}
        </div>
      )}
      headerRight={(
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Segmented Control Mode Tata Letak Dokumen: Kop Surat vs 1 Lembar Cover */}
          {doc.fileUrl && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIncludeLetterhead(true);
                  setDocumentLayoutMode('header');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  documentLayoutMode === 'header'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Mode Kop Surat: Kop resmi langsung disematkan di bagian atas lembar dokumen"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kop Surat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIncludeLetterhead(true);
                  setDocumentLayoutMode('cover');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  documentLayoutMode === 'cover'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Mode 1 Lembar Cover: Sisipkan 1 Halaman Sampul Depan ISO 9001 resmi terpisah di Halaman 1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1 Lembar Cover</span>
              </button>
            </div>
          )}

          {/* Buka Layar Penuh di Tab Baru */}
          {activePdfUrl && isPdfFile && (
            <a
              href={activePdfUrl}
              target="_blank"
              rel="noreferrer"
              title="Buka Layar Penuh di Tab Baru"
              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Validasi QR Code ISO */}
          <button
            type="button"
            onClick={() => setShowQrVerifyInfo(!showQrVerifyInfo)}
            title="Validasi QR Code Integritas Dokumen"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showQrVerifyInfo
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Ganti File */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={doc.fileUrl ? 'Ganti Berkas Fisik Dokumen' : 'Unggah Berkas Fisik Dokumen'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">{doc.fileUrl ? 'Ganti File' : 'Unggah'}</span>
          </button>

          {/* Tombol Aksi Download Cerdas Berdasarkan Tipe Dokumen */}
          {isExcelFile ? (
            <>
              {/* Tombol Sekunder: Ekspor PDF Terkendali */}
              <button
                type="button"
                onClick={handleDownloadOfficialPDF}
                disabled={isProcessingDownload}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer shrink-0"
                title={documentLayoutMode === 'cover'
                  ? 'Ekspor PDF Terkendali Resmi dengan 1 Halaman Cover ISO & Matriks Otorisasi'
                  : 'Ekspor PDF Terkendali Resmi dengan Kop Surat ISO & Matriks Otorisasi'}
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">
                  {isProcessingDownload ? 'Memproses...' : (documentLayoutMode === 'cover' ? 'Ekspor PDF (+ Cover)' : 'Ekspor PDF (+ Kop)')}
                </span>
              </button>

              {/* Tombol Utama: Unduh Excel Asli */}
              <button
                type="button"
                onClick={handleDownloadRawFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition cursor-pointer shrink-0"
                title="Unduh berkas spreadsheet Excel asli (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel (.xlsx)</span>
              </button>
            </>
          ) : isWordFile ? (
            <>
              {/* Tombol Sekunder: Ekspor PDF Terkendali */}
              <button
                type="button"
                onClick={handleDownloadOfficialPDF}
                disabled={isProcessingDownload}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer shrink-0"
                title={documentLayoutMode === 'cover'
                  ? 'Ekspor PDF Terkendali Resmi dengan 1 Halaman Cover ISO & Matriks Otorisasi'
                  : 'Ekspor PDF Terkendali Resmi dengan Kop Surat ISO & Matriks Otorisasi'}
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">
                  {isProcessingDownload ? 'Memproses...' : (documentLayoutMode === 'cover' ? 'Ekspor PDF (+ Cover)' : 'Ekspor PDF (+ Kop)')}
                </span>
              </button>

              {/* Tombol Utama: Unduh Word Asli */}
              <button
                type="button"
                onClick={handleDownloadRawFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer shrink-0"
                title="Unduh berkas dokumen Microsoft Word asli (.docx)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh Word (.docx)</span>
              </button>
            </>
          ) : (
            <>
              {/* Jika PDF: Tombol Sekunder Berkas Asli jika ada */}
              {doc.fileUrl && (
                <button
                  type="button"
                  onClick={handleDownloadRawFile}
                  title="Unduh Berkas PDF Asli Mentah (Tanpa Stempel Kop)"
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">PDF Asli</span>
                </button>
              )}

              {/* Tombol Utama: Unduh PDF Resmi */}
              <button
                type="button"
                onClick={handleDownloadOfficialPDF}
                disabled={isProcessingDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition cursor-pointer shrink-0"
                title={documentLayoutMode === 'cover'
                  ? 'Unduh PDF Resmi ISO dengan 1 Lembar Cover Depan Terpisah & Penomoran Halaman'
                  : 'Unduh PDF Resmi ISO dengan Kop Surat Langsung & Penomoran Halaman'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isProcessingDownload 
                    ? 'Memproses...' 
                    : (documentLayoutMode === 'cover' ? 'Unduh PDF + Cover' : (includeLetterhead ? 'Unduh PDF + Kop' : 'Unduh PDF'))}
                </span>
              </button>
            </>
          )}
        </div>
      )}
    >
      {/* Hidden File Input for quick attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
        className="hidden"
      />

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
                QR Code ini membuktikan integritas dokumen resmi {docCompanyName}. Scan menggunakan kamera ponsel untuk memvalidasi nomor registrasi <strong>{doc.docNumber}</strong> dan status saat ini.
              </p>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-2">
                <span>Status: <strong className="text-slate-800 dark:text-slate-200">{doc.status}</strong></span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>Departemen: <strong className="text-slate-800 dark:text-slate-200">{doc.department}</strong></span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
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

      {/* ================= AREA UTAMA PRATINJAU DOKUMEN ================= */}
      <div className="space-y-4">
        {/* MODE 1: HALAMAN COVER DEPAN RESMI ISO 9001 (Template Grafis Geometris Modern) */}
        {(!doc.fileUrl || isWordFile || isExcelFile) && documentLayoutMode === 'cover' && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl mb-4 shadow-sm animate-fade-in relative overflow-hidden min-h-[580px] p-6 sm:p-10 flex flex-col justify-between">
            {/* 1. Ornamen Geometris Vektor Sudut Kanan Atas & Kiri Bawah (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox="0 0 595 842"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Ornamen Sudut Kanan Atas (Top-Right Geometric Accents) */}
              <polygon points="463,-71 646,112 607,151 424,-32" fill="#00A4E4" />
              <polygon points="398,-21 596,177 582,191 384,-7" fill="#F5A623" />
              <polygon points="408,34 606,232 552,286 354,88" fill="#0B2545" />
              <polygon points="369,131 524,286 511,299 356,144" fill="#00A4E4" />
              <polygon points="496,159 581,244 564,261 479,176" fill="#00529B" />

              {/* Ornamen Sudut Kiri Bawah (Bottom-Left Geometric Accents) */}
              <polygon points="-14,713 127,854 84,897 -57,756" fill="#00529B" />
              <polygon points="4,662 188,846 166,868 -18,684" fill="#00A4E4" />
              <polygon points="10,567 208,765 150,823 -48,625" fill="#0B2545" />
              <polygon points="-8,498 212,718 198,732 -22,512" fill="#F5A623" />
              <polygon points="-31,488 132,651 121,662 -42,499" fill="#00A4E4" />
            </svg>

            {/* 1. Logo Perusahaan di Kiri Ujung Atas */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center">
                {(() => {
                  const targetComp = (companies || []).find(c => c.code === docCompanyCode);
                  const logoSrc = targetComp?.logoUrl || (docCompanyCode === 'DJI' ? '/dji-logo.png' : null);

                  if (logoSrc) {
                    return (
                      <img
                        src={logoSrc}
                        alt={docCompanyCode}
                        className="h-10 sm:h-12 max-w-[150px] object-contain drop-shadow-2xs"
                      />
                    );
                  }
                  if (docCompanyCode === 'UMI') {
                    return (
                      <div className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-md shadow-xs">
                        ULTIMO MODA
                      </div>
                    );
                  }
                  if (docCompanyCode === 'IMK') {
                    return (
                      <div className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-md shadow-xs">
                        PT IMK
                      </div>
                    );
                  }
                  return (
                    <span className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono font-black text-xs rounded-lg shadow-sm">
                      {docCompanyCode}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 2. Plakat Judul Mengambang di Tengah Halaman (Central Title Plaque) */}
            <div className="my-auto py-8 text-center relative z-10 space-y-4">
              <div className="max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-300 dark:border-slate-700 rounded-xl p-5 sm:p-7 shadow-md relative overflow-hidden">
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg p-4 sm:p-5 space-y-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider underline decoration-2 underline-offset-4">
                    {getDocumentTypeFullName(doc)}
                  </h4>
                  <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-snug">
                    {doc.title || 'DOKUMEN TERKENDALI'}
                  </h1>
                </div>
              </div>

              {/* Kotak Nomor Dokumen Berbingkai (Framed Pill Box) */}
              <div className="inline-block mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-300 dark:border-slate-700 rounded-lg px-6 py-2.5 shadow-sm">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-wide">
                  {doc.docNumber}
                </span>
              </div>
            </div>

            {/* 3. Identitas Perusahaan di Dasar Cover */}
            <div className="relative z-10 pt-4 text-right">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                {docCompanyName}
              </span>
            </div>

            {/* Divider Antar Halaman */}
            <div className="flex items-center gap-3 my-4 pt-2 -mb-2 relative z-10">
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
              <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-3.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Halaman 2+: Isi Naskah & Lembar Kerja Dokumen
              </span>
              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
            </div>
          </div>
        )}

        {/* MODE 2: KOP SURAT LANGSUNG DI ATAS DOKUMEN (Tampil saat layoutMode === 'header' dan includeLetterhead aktif) */}
        {(!doc.fileUrl || isWordFile || isExcelFile) && documentLayoutMode === 'header' && includeLetterhead && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-3 shadow-2xs animate-fade-in">
            <div className="grid grid-cols-12 items-center">
              {/* Logo Box: Dinamis sesuai PT */}
              <div className="col-span-3 p-2 flex items-center justify-center bg-white dark:bg-slate-900">
                {(() => {
                  const targetComp = (companies || []).find(c => c.code === docCompanyCode);
                  const logoSrc = targetComp?.logoUrl || (docCompanyCode === 'DJI' ? '/dji-logo.png' : null);

                  if (logoSrc) {
                    return (
                      <img
                        src={logoSrc}
                        alt={`${docCompanyCode} Logo`}
                        className="h-11 max-w-[145px] object-contain drop-shadow-2xs"
                      />
                    );
                  }

                  if (docCompanyCode === 'UMI') {
                    return (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="px-3 py-1 bg-indigo-600 text-white font-mono font-black text-xs tracking-wider rounded shadow-2xs">
                          UMI TEXTILE
                        </div>
                        <span className="text-[9px] font-bold text-indigo-950 dark:text-indigo-300 mt-1 uppercase tracking-tight">
                          PT Ultimo Moda Indotex
                        </span>
                      </div>
                    );
                  }

                  if (docCompanyCode === 'IMK') {
                    return (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-xs tracking-wider rounded shadow-2xs">
                          IMK KNITTING
                        </div>
                        <span className="text-[9px] font-bold text-emerald-950 dark:text-emerald-300 mt-1 uppercase tracking-tight">
                          PT IMK
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="px-3 py-1 bg-slate-800 text-white font-mono font-black text-xs tracking-wider rounded shadow-2xs">
                        DOCUMENT CONTROL CENTER
                      </div>
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-tight">
                        Document Control
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Document Title Header (Tengah, Rapi, Simetris & Berbobot) */}
              <div className="col-span-5 p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] sm:text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  {getDocumentTypeFullName(doc)}
                </span>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white uppercase leading-snug my-1 px-1" title={doc.title}>
                  {doc.title}
                </h3>
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-medium text-slate-600 dark:text-slate-300">
                  <span>Status:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{doc.status}</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Salinan Terkendali Resmi</span>
                </div>
              </div>

              {/* Document Metadata Box + QR Code (col-span-4) */}
              <div className="col-span-4 p-2 flex items-center justify-between gap-2.5">
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
                  <div className="shrink-0 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-2xs">
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
              <div className="space-y-3">
                {isPdfFallback && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Berkas demo pada server storage lama offline.</strong> Pratinjau saat ini menampilkan naskah kendali mutu standar ISO dari basis data. Anda dapat mengunggah berkas aslinya kapan saja.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      Unggah Berkas Fisik Asli
                    </button>
                  </div>
                )}
                <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700 min-h-[620px]">
                  {isStampingPreview && !stampedPdfUrl && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xs text-white">
                      <RefreshCw className="w-7 h-7 animate-spin text-blue-500 mb-2.5" />
                      <p className="text-xs font-semibold text-slate-200">Menyematkan Kop Surat Resmi...</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Menyelaraskan dokumen dengan QR Code ISO</p>
                    </div>
                  )}
                  {activePdfUrl && (
                    <iframe
                      key={activePdfUrl}
                      src={`${activePdfUrl}#toolbar=1&navpanes=0`}
                      title={doc.fileName || 'Pratinjau PDF Dokumen'}
                      className="w-full h-[720px] border-0 bg-white"
                    />
                  )}
                </div>
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
                {docxError === 'legacy_doc' && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-6 sm:p-8 rounded-xl border border-amber-200 dark:border-amber-800 text-center max-w-2xl mx-auto space-y-3.5 shadow-xs">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                        Format Berkas: Microsoft Word 97-2003 (.doc)
                      </h4>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300 leading-relaxed mt-1 max-w-lg mx-auto">
                        Peramban web modern hanya dapat merender pratinjau interaktif langsung untuk format Word Modern (<strong>.docx</strong>) atau <strong>PDF</strong>. Berkas .doc asli Anda tersimpan utuh dan aman.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDownloadRawFile}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Berkas Asli ({doc.fileName || '.doc'})
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Ganti dengan .docx atau PDF
                      </button>
                    </div>
                  </div>
                )}

                {docxError && docxError !== 'legacy_doc' && (
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Naskah Prosedur Standar ISO ({doc.docNumber})
                        </h4>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                        Teks Terkendali
                      </span>
                    </div>

                    <div className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line space-y-4 font-sans">
                      {doc.content || `1. TUJUAN & SASARAN MUTU\nDokumen ${doc.docNumber} (${doc.title}) diterbitkan untuk standardisasi operasional pada departemen ${doc.department}.\n\n2. RUANG LINGKUP\nBerlaku di lingkungan ${docCompanyName}.\n\n3. PROSEDUR PELAKSANAAN\n3.1 Seluruh personel terkait wajib menjalankan instruksi kerja ini sesuai kaidah standar ISO 9001:2015.\n3.2 Pemantauan kepatuhan dilakukan secara periodik oleh Verifikator.`}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <p className="text-[11px] text-slate-400">
                        Naskah resmi tersimpan dalam basis data terkendali.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadRawFile}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Berkas Asli Word
                      </button>
                    </div>
                  </div>
                )}
                <div
                  ref={setDocxContainer}
                  className={`docx-preview-container bg-white shadow-lg mx-auto rounded-lg overflow-auto max-w-4xl p-6 sm:p-12 ${
                    isRenderingDocx || docxError ? 'hidden' : 'block'
                  }`}
                />
              </div>
            )}

            {/* 3. Excel Spreadsheet Viewer: Authentic Interactive Excel Experience */}
            {isExcelFile && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs flex flex-col">
                {/* 1. Excel Top Ribbon / Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 bg-emerald-600 text-white rounded-md flex items-center justify-center font-bold shadow-2xs text-xs">
                      X
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {doc.fileName || `${doc.docNumber}_Spreadsheet.xlsx`}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Spreadsheet Aktif
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {excelData?.sheetNames?.length || 1} Lembar Kerja &bull; {excelData?.rows?.length || 0} Baris Data Terisi
                      </p>
                    </div>
                  </div>

                  {/* Spreadsheet Search & Copy Tools */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={excelSearchQuery}
                        onChange={(e) => setExcelSearchQuery(e.target.value)}
                        placeholder="Cari data di tabel..."
                        className="pl-7 pr-6 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                      {excelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setExcelSearchQuery('')}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const val = excelData?.rows?.[activeExcelCell.row]?.[activeExcelCell.col];
                        if (val !== undefined && val !== null && val !== '') {
                          navigator.clipboard?.writeText(String(val));
                          showToast(`Nilai sel ${getColumnLetter(activeExcelCell.col)}${activeExcelCell.row + 1} ("${val}") disalin!`, 'success');
                        } else {
                          showToast('Sel yang dipilih kosong.', 'info');
                        }
                      }}
                      title="Salin Nilai Sel Aktif"
                      className="p-1.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Salin Sel</span>
                    </button>
                  </div>
                </div>

                {/* 2. Authentic Formula Bar (Bilah Rumus Excel) */}
                <div className="flex items-center px-3 py-1 bg-slate-100/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 gap-2 font-mono text-xs">
                  {/* Name Box */}
                  <div className="w-14 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-bold text-slate-800 dark:text-slate-200 shadow-2xs select-none">
                    {getColumnLetter(activeExcelCell.col)}{activeExcelCell.row + 1}
                  </div>

                  {/* Formula fx symbol */}
                  <span className="text-slate-400 font-serif italic text-xs font-bold px-1 select-none">
                    fx
                  </span>

                  {/* Cell Value / Formula Display */}
                  <div className="flex-1 px-2.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-sans text-xs text-slate-900 dark:text-slate-100 truncate shadow-2xs">
                    {excelData?.rows?.[activeExcelCell.row]?.[activeExcelCell.col] !== undefined && excelData?.rows?.[activeExcelCell.row]?.[activeExcelCell.col] !== null
                      ? String(excelData.rows[activeExcelCell.row][activeExcelCell.col])
                      : <span className="text-slate-300 dark:text-slate-600 italic font-sans text-[11px]">(Sel Kosong)</span>
                    }
                  </div>
                </div>

                {/* 3. The Authentic Excel Grid Viewport */}
                {isParsingExcel ? (
                  <div className="py-24 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2.5" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Menyiapkan lembar kerja Excel...</p>
                  </div>
                ) : excelError ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center mx-auto text-amber-600 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold max-w-md mx-auto">
                      Format berkas spreadsheet ini tidak dapat diproses otomatis oleh pratinjau browser.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadRawFile}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Unduh Berkas Excel (.xlsx)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[500px] bg-slate-50 dark:bg-slate-950 select-none border-b border-slate-200 dark:border-slate-700">
                    <table className="border-collapse table-fixed w-full text-xs">
                      <thead>
                        <tr>
                          {/* Top-left corner cell */}
                          <th className="w-10 min-w-[40px] max-w-[40px] sticky top-0 left-0 z-30 bg-slate-200 dark:bg-slate-800 border-b border-r border-slate-300 dark:border-slate-700 p-0" />

                          {/* Column Letter Headers (A, B, C, D...) */}
                          {Array.from({ length: totalExcelCols }).map((_, cIdx) => {
                            const colLetter = getColumnLetter(cIdx);
                            const isColActive = activeExcelCell.col === cIdx;
                            return (
                              <th
                                key={cIdx}
                                className={`sticky top-0 z-20 min-w-[130px] border-b border-r border-slate-300 dark:border-slate-700 py-1.5 px-2 text-center text-[11px] font-semibold transition ${
                                  isColActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold border-b-2 border-b-emerald-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {colLetter}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: totalExcelRows }).map((_, rIdx) => {
                          const isRowActive = activeExcelCell.row === rIdx;
                          const rowData = excelData?.rows?.[rIdx];
                          const isHeaderRow = rIdx === 0 && (excelData?.rows?.length || 0) > 0;

                          return (
                            <tr key={rIdx} className={isHeaderRow ? 'bg-slate-50/80 dark:bg-slate-900/60 font-bold' : ''}>
                              {/* Row Number Header (1, 2, 3...) */}
                              <td
                                className={`sticky left-0 z-10 w-10 min-w-[40px] max-w-[40px] text-center font-mono text-[10.5px] border-b border-r border-slate-300 dark:border-slate-700 py-1.5 px-1 transition select-none ${
                                  isRowActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold border-r-2 border-r-emerald-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {rIdx + 1}
                              </td>

                              {/* Grid Cells */}
                              {Array.from({ length: totalExcelCols }).map((_, cIdx) => {
                                const rawVal = rowData?.[cIdx];
                                const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
                                const isSelected = activeExcelCell.row === rIdx && activeExcelCell.col === cIdx;
                                const isNumber = rawVal !== '' && rawVal !== undefined && !isNaN(Number(rawVal)) && typeof rawVal !== 'boolean';
                                const isMatch = excelSearchQuery.trim() !== '' && val.toLowerCase().includes(excelSearchQuery.toLowerCase().trim());

                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => setActiveExcelCell({ row: rIdx, col: cIdx })}
                                    className={`relative border-b border-r border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs transition cursor-cell whitespace-nowrap overflow-hidden text-ellipsis ${
                                      isSelected
                                        ? 'outline outline-2 outline-emerald-600 -outline-offset-1 bg-emerald-50/40 dark:bg-emerald-950/40 z-10'
                                        : isMatch
                                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-semibold'
                                        : rIdx % 2 === 1
                                        ? 'bg-slate-50/40 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200'
                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                                    } ${isNumber && !isHeaderRow ? 'text-right font-mono' : 'text-left'}`}
                                  >
                                    {val}
                                    {/* The classic Excel fill handle square on the active cell */}
                                    {isSelected && (
                                      <span className="absolute bottom-[-2px] right-[-2px] w-2 h-2 bg-emerald-600 border border-white dark:border-slate-900 cursor-crosshair" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. Authentic Excel Bottom Sheet Tabs */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 select-none overflow-x-auto gap-3">
                  <div className="flex items-center gap-1">
                    {(excelData?.sheetNames || ['Sheet1']).map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => handleSelectExcelSheet(sName)}
                        className={`px-3 py-1 text-xs font-semibold rounded-t-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          excelData?.activeSheet === sName
                            ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{sName}</span>
                      </button>
                    ))}
                  </div>

                  {/* 5. Authentic Excel Status Bar (Calculations, Count, Zoom) */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pl-4 shrink-0 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Siap</span>
                    </span>

                    {colNumbers && (
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs font-mono text-[10.5px]">
                        <span>Rata-rata: <strong className="text-slate-800 dark:text-slate-200">{colNumbers.avg}</strong></span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>Jumlah: <strong className="text-slate-800 dark:text-slate-200">{colNumbers.count}</strong></span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{colNumbers.sum.toLocaleString('id-ID')}</strong></span>
                      </div>
                    )}

                    <span>{excelData?.rows?.length || 0} Baris Terisi</span>
                  </div>
                </div>
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
                  Matriks Otorisasi & Rekam Jejak Pengesahan
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  (4 Tahap Pengendalian)
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
                    {doc.approvedBy || doc.targetApprover || (doc.status === 'AKTIF' ? (docCompanyCode === 'UMI' ? 'RATNA SARI' : docCompanyCode === 'IMK' ? 'BAMBANG WIJAYA' : 'BABAN RACHMAT SUBAGJA') : 'MR / Direksi')}
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
          <span>Sistem Manajemen Dokumen Terkendali — {docCompanyName}</span>
          <span>Standar Sistem Manajemen Mutu</span>
        </div>
      </div>
    </Modal>
  );
}
