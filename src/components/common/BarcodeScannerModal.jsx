import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ScanBarcode,
  Camera,
  Upload,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Eye,
  FileText,
  Building2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { formatDocumentDate } from '../../utils/exportUtils';

export default function BarcodeScannerModal({ isOpen, onClose }) {
  const { documents, setViewingDocument, showToast } = useDocumentControl();

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Manual input state (for hardware barcode gun or typing)
  const [manualCode, setManualCode] = useState('');

  // Scanned document result state
  const [scannedDoc, setScannedDoc] = useState(null);
  const [scannedDocRevisions, setScannedDocRevisions] = useState([]);
  const [scannedNotFoundText, setScannedNotFoundText] = useState(null);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean and extract document number from scanned text
  const extractDocNumber = (text) => {
    if (!text) return '';
    const clean = text.trim();
    // Check if it's a URL like http://.../?verify=DJI-SOP-FAT-01-00 or doc=...
    try {
      if (clean.includes('verify=') || clean.includes('doc=')) {
        const url = new URL(clean, window.location.origin);
        const v = url.searchParams.get('verify') || url.searchParams.get('doc');
        if (v) return decodeURIComponent(v).trim();
      }
    } catch {}
    return clean;
  };

  // Lookup document by number
  const handleDocCodeDetected = async (rawCode) => {
    const docNum = extractDocNumber(rawCode);
    if (!docNum) return;

    setIsSearchingDoc(true);
    setScannedNotFoundText(null);
    setScannedDoc(null);

    // 1. Try local context first
    const localMatch = (documents || []).find(
      (d) => (d.docNumber || '').toUpperCase() === docNum.toUpperCase()
    );

    try {
      // 2. Fetch latest verified status from backend
      const res = await fetch(`/api/public/verify/${encodeURIComponent(docNum)}`);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.document) {
        setScannedDoc(data.document);
        setScannedDocRevisions(data.revisions || []);
      } else if (localMatch) {
        setScannedDoc(localMatch);
        setScannedDocRevisions([localMatch]);
      } else {
        setScannedNotFoundText(docNum);
      }
    } catch {
      if (localMatch) {
        setScannedDoc(localMatch);
        setScannedDocRevisions([localMatch]);
      } else {
        setScannedNotFoundText(docNum);
      }
    } finally {
      setIsSearchingDoc(false);
    }
  };

  // Start Camera Scanning
  const startCamera = async (cameraIdToUse) => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('interactive-qr-reader');
      }

      const qrScanner = html5QrCodeRef.current;
      if (qrScanner.isScanning) {
        await qrScanner.stop();
      }

      // Query available cameras if not already loaded
      if (cameras.length === 0) {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
          const chosen = cameraIdToUse || (backCam ? backCam.id : devices[0].id);
          setSelectedCameraId(chosen);
          cameraIdToUse = chosen;
        } else {
          setCameraError('Tidak ada kamera yang terdeteksi pada perangkat ini.');
          return;
        }
      }

      const config = {
        fps: 15,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0
      };

      await qrScanner.start(
        cameraIdToUse || { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDocCodeDetected(decodedText);
        },
        () => {
          // Frame scan failure ignored
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Gagal mengakses kamera. Pastikan izin kamera telah diberikan di peramban (browser) Anda.'
      );
      setIsScanning(false);
    }
  };

  // Stop Camera Scanning
  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
    setIsScanning(false);
  };

  // Camera Tab Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera(selectedCameraId);
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab, selectedCameraId]);

  // Clean up on unmount or modal close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleModalClose = () => {
    stopCamera();
    setScannedDoc(null);
    setScannedNotFoundText(null);
    onClose();
  };

  // Handle Image File Upload for Scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempScanner = new Html5Qrcode('hidden-file-qr-reader');
      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleDocCodeDetected(result);
    } catch (err) {
      showToast('Tidak ada QR Code atau barcode yang terdeteksi pada gambar tersebut.', 'danger');
    }
  };

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle Manual Input Submit
  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;
    handleDocCodeDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleModalClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pindai Barcode / QR Dokumen</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Verifikasi fisik dan pencarian cepat arsip resmi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup pemindai"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 min-h-[38px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Kamera Live</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-h-[38px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Unggah Foto</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 min-h-[38px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer text-center ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Manual / USB</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-square max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                <div id="interactive-qr-reader" className="w-full h-full" />

                {/* Laser scan animation overlay */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center">
                    <div className="w-48 h-48 border-2 border-dashed border-sky-400/80 rounded-xl relative">
                      <div className="absolute left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8] animate-pulse" />
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 p-4 bg-slate-900/90 flex flex-col items-center justify-center text-center text-xs text-rose-300">
                    <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                    <p className="font-semibold">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId)}
                      className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Switcher if multiple cameras */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-slate-500">Kamera:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="p-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Kamera ${c.id.substring(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-3 py-4 text-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 transition cursor-pointer bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Klik untuk memilih foto barcode / QR Code
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Mendukung format JPG, PNG, WEBP</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div id="hidden-file-qr-reader" className="hidden" />
            </div>
          )}

          {/* TAB 3: MANUAL INPUT / USB HARDWARE SCANNER */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3 py-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ketik atau Tembak Barcode dengan Scanner USB:
                </label>
                <div className="relative flex items-center border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: DJI-SOP-FAT-01-00"
                    className="w-full ml-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none uppercase"
                    autoFocus
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Tips: Jika menggunakan Barcode Scanner Gun USB, posisikan kursor pada kotak input di atas lalu tekan pelatuk scanner.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim() || isSearchingDoc}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari & Verifikasi Dokumen</span>
              </button>
            </form>
          )}

          {/* SEARCHING SPINNER */}
          {isSearchingDoc && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2 animate-fade-in">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Memeriksa keaslian dokumen di pangkalan data...
              </p>
            </div>
          )}

          {/* SCAN RESULT: DOCUMENT FOUND */}
          {scannedDoc && !isSearchingDoc && (
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {scannedDoc.docNumber}
                    </span>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                        scannedDoc.status === 'AKTIF'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : scannedDoc.status === 'OBSOLETE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {scannedDoc.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mt-1 leading-snug">
                    {scannedDoc.title}
                  </h4>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <span>Departemen:</span> <strong className="text-slate-800 dark:text-slate-200">{scannedDoc.department}</strong>
                </div>
                <div>
                  <span>Revisi:</span> <strong className="text-slate-800 dark:text-slate-200">Rev {scannedDoc.revision}</strong>
                </div>
                <div>
                  <span>Perusahaan:</span> <strong className="text-slate-800 dark:text-slate-200">{scannedDoc.companyCode || 'DJI'}</strong>
                </div>
                <div>
                  <span>Tgl Efektif:</span> <strong className="text-slate-800 dark:text-slate-200">{formatDocumentDate(scannedDoc.effectiveDate || scannedDoc.createdDate)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleModalClose();
                    setViewingDocument(scannedDoc);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka Dokumen Lengkap</span>
                </button>
                <a
                  href={`/?verify=${encodeURIComponent(scannedDoc.docNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition text-center"
                >
                  Portal Publik
                </a>
              </div>
            </div>
          )}

          {/* SCAN RESULT: NOT FOUND */}
          {scannedNotFoundText && !isSearchingDoc && (
            <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-center space-y-2 animate-fade-in">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Nomor Dokumen Tidak Terdaftar
                </h4>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
                  "{scannedNotFoundText}"
                </p>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Nomor dokumen ini tidak ditemukan dalam arsip resmi Document Control. Pastikan stiker barcode asli dan belum rusak.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Mendukung QR Code ISO & Barcode Fisik
          </span>
          <button
            type="button"
            onClick={handleModalClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
