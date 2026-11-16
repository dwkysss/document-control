import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  History,
  QrCode,
  Copy,
  Printer,
  Check,
  Building
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { generateDocumentQRCode } from '../../utils/qrGenerator';

/**
 * ISO 9001:2015 4-Tier Color Mapping per DESIGN.md
 */
function getDocumentTierBadge(type) {
  const t = (type || '').toUpperCase();
  if (t === 'KEBIJAKAN' || t === 'POLICY') {
    return {
      label: 'Level 1 — Kebijakan Mutu',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    };
  }
  if (t === 'SOP') {
    return {
      label: 'Level 2 — Prosedur Operasional (SOP)',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    };
  }
  if (t === 'IK' || t === 'WI') {
    return {
      label: 'Level 3 — Instruksi Kerja (IK)',
      className: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
  }
  return {
    label: 'Level 4 — Formulir & Rekaman Mutu',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };
}

export default function PublicDocumentVerifyView({ docNumber, onBackToApp }) {
  const { documents, systemSettings: contextSettings } = useDocumentControl();

  const [serverDoc, setServerDoc] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [serverSettings, setServerSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState(null);

  // Fetch real-time verification from backend
  useEffect(() => {
    let isMounted = true;
    const cleanQuery = decodeURIComponent(docNumber || '').trim();

    if (!cleanQuery) {
      setIsLoading(false);
      setErrorMessage('Nomor dokumen tidak valid.');
      return;
    }

    setIsLoading(true);
    fetch(`/api/public/verify/${encodeURIComponent(cleanQuery)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;

        if (res.ok && data.success && data.document) {
          setServerDoc(data.document);
          setRevisions(data.revisions || []);
          setServerSettings(data.systemSettings || null);
          setVerifiedAt(data.verifiedAt || new Date().toISOString());
          setErrorMessage(null);
        } else {
          // Fallback to local context
          const localMatch = (documents || []).find(
            (d) => (d.docNumber || '').toUpperCase() === cleanQuery.toUpperCase()
          );
          if (localMatch) {
            setServerDoc(localMatch);
            setRevisions([localMatch]);
            setErrorMessage(null);
            setVerifiedAt(new Date().toISOString());
          } else {
            setServerDoc(null);
            setErrorMessage(data.message || `Nomor dokumen "${cleanQuery}" tidak terdaftar dalam pangkalan data resmi.`);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const localMatch = (documents || []).find(
          (d) => (d.docNumber || '').toUpperCase() === cleanQuery.toUpperCase()
        );
        if (localMatch) {
          setServerDoc(localMatch);
          setRevisions([localMatch]);
          setVerifiedAt(new Date().toISOString());
        } else {
          setErrorMessage('Gagal menghubungi server verifikasi. Pastikan perangkat Anda terhubung ke jaringan.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [docNumber, documents]);

  // QR Code generator
  useEffect(() => {
    if (serverDoc) {
      generateDocumentQRCode(serverDoc).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [serverDoc]);

  const doc = serverDoc;
  const activeSettings = serverSettings || contextSettings || {};

  // Lifecycle & Due Date evaluation
  const evaluation = useMemo(() => {
    if (!doc) return null;

    const reviewIntervalMonths = activeSettings?.periodicReviewMonths || 12;
    const baseDateStr = doc.lastReviewedDate || doc.effectiveDate || doc.approvedDate || doc.createdDate;

    let isOverdue = false;
    let daysDiff = 0;
    let dueDateFormatted = '-';

    if (baseDateStr) {
      const baseDate = new Date(baseDateStr);
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + reviewIntervalMonths);
      dueDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      isOverdue = daysDiff < 0;
      dueDateFormatted = dueDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    const isObsolete = doc.status === 'OBSOLETE';
    const isActive = doc.status === 'AKTIF' || doc.status === 'APPROVED';
    const isNeedsReview = isActive && isOverdue;

    const scannedRevNum = parseInt(doc.revision, 10) || 0;
    const latestRev = (revisions || []).reduce((prev, curr) => {
      const currNum = parseInt(curr.revision, 10) || 0;
      return currNum > (parseInt(prev?.revision, 10) || 0) ? curr : prev;
    }, null);

    const isSupersededByNewerRev =
      latestRev &&
      (parseInt(latestRev.revision, 10) || 0) > scannedRevNum &&
      latestRev.status === 'AKTIF';

    return {
      isObsolete: isObsolete || isSupersededByNewerRev,
      isActive,
      isNeedsReview,
      daysDiff,
      dueDateFormatted,
      isSupersededByNewerRev,
      latestRev
    };
  }, [doc, activeSettings, revisions]);

  const docComp = (
    doc?.companyCode ||
    (doc?.docNumber?.startsWith('UMI') ? 'UMI' : doc?.docNumber?.startsWith('IMK') ? 'IMK' : 'DJI')
  ).toUpperCase();

  const companyName =
    doc?.companyName ||
    (docComp === 'UMI'
      ? 'PT Ultimo Moda Indotex'
      : docComp === 'IMK'
      ? 'PT IMK'
      : activeSettings?.companyName || 'PT Dentelle Jaya Infinitex');

  const tierBadge = getDocumentTierBadge(doc?.type);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col justify-between py-6 sm:py-10 px-3 sm:px-6 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Background Soft Ambient Light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-100/60 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[250px] bg-slate-200/50 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-xl w-full mx-auto space-y-4 relative z-10">

        {/* LOADING STATE */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center shadow-lg space-y-4">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Memverifikasi Dokumen...</h3>
              <p className="text-xs text-slate-500 mt-1">
                Menghubungkan ke pangkalan data Document Control
              </p>
            </div>
          </div>
        )}

        {/* ERROR / NOT FOUND STATE */}
        {!isLoading && !doc && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dokumen Tidak Ditemukan</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                {errorMessage || `Dokumen dengan nomor "${docNumber}" tidak terdaftar dalam pangkalan data resmi.`}
              </p>
            </div>
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                <span>Masuk ke Portal Dokumen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS DOCUMENT CARD - Crisp Enterprise White Certificate Style */}
        {!isLoading && doc && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.1),0_4px_16px_rgba(15,23,42,0.04)] overflow-hidden">
            
            {/* Top Brand Header: Corporate Deep Navy Strip */}
            <div className="bg-[#0a1628] px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                  {docComp === 'DJI' ? (
                    <img src="/dji-logo.png" alt="PT DJI Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-800" />
                  )}
                </div>
                <div>
                  <h1 className="font-brand font-black text-sm sm:text-base text-white tracking-wide leading-tight">
                    {companyName}
                  </h1>
                  <span className="font-tech text-[10px] text-sky-400 font-bold tracking-wider uppercase block mt-0.5">
                    PORTAL VALIDASI DOKUMEN TERKENDALI
                  </span>
                </div>
              </div>
            </div>

            {/* Status Validation Banner */}
            {evaluation?.isObsolete ? (
              <div className="px-5 sm:px-6 py-4 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-rose-800">
                    STATUS: DOKUMEN OBSOLETE (TIDAK BERLAKU)
                  </div>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    Dokumen fisik cetak yang Anda periksa ini sudah <strong>TIDAK BERLAKU</strong> dan telah ditarik dari peredaran resmi.
                    {evaluation.isSupersededByNewerRev && (
                      <span className="block mt-1 font-semibold text-rose-900">
                        Sistem mencatat revisi resmi terkini adalah <u>Rev {evaluation.latestRev?.revision}</u> (Aktif).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : evaluation?.isNeedsReview ? (
              <div className="px-5 sm:px-6 py-4 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-800">
                    STATUS: PERLU TINJAUAN BERKALA
                  </div>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Dokumen ini telah melampaui batas siklus tinjauan berkala ({evaluation.dueDateFormatted}) dan sedang dijadwalkan untuk peninjauan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-5 sm:px-6 py-3.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span>STATUS: SALINAN RESMI TERKENDALI AKTIF</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Dokumen fisik cetak ini <strong>SAH & RESMI</strong> berlaku untuk seluruh operasional {companyName}.
                  </p>
                </div>
              </div>
            )}

            {/* Document Content Details Body */}
            <div className="p-5 sm:p-6 space-y-4">
              
              {/* Type Badge & Title & QR Thumbnail */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierBadge.className}`}>
                    {doc.typeName || doc.type || tierBadge.label}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 uppercase leading-snug">
                    {doc.title}
                  </h2>
                </div>
                {qrCodeDataUrl && (
                  <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 flex flex-col items-center">
                    <img src={qrCodeDataUrl} alt="QR Code Verifikasi" className="w-16 h-16 object-contain" />
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                      QR Resmi
                    </span>
                  </div>
                )}
              </div>

              {/* 4 Key Metadata Cards Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                    Nomor Registrasi:
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate">
                    {doc.docNumber}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                    Nomor Revisi:
                  </span>
                  <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm mt-0.5 block">
                    Rev {doc.revision}
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                    Departemen Pemilik:
                  </span>
                  <span className="font-bold text-slate-800 mt-0.5 block flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.department}</span>
                  </span>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">
                    Tanggal Efektif:
                  </span>
                  <span className="font-mono font-semibold text-slate-800 mt-0.5 block flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {doc.effectiveDate
                        ? new Date(doc.effectiveDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '-'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Periodic Review Due Date Box */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-600 font-medium">Jatuh Tempo Tinjauan Berkala:</span>
                </div>
                <span className={`font-mono font-bold ${evaluation?.isNeedsReview ? 'text-amber-700' : 'text-slate-900'}`}>
                  {evaluation?.dueDateFormatted}
                </span>
              </div>

              {/* Lifecycle Revision History if multiple revisions exist */}
              {revisions && revisions.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Riwayat Revisi Dokumen:
                  </span>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs overflow-hidden">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">Rev {rev.revision}</span>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                              rev.status === 'AKTIF'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-200 text-slate-600 border-slate-300'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {rev.effectiveDate ? new Date(rev.effectiveDate).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Server Digital Validation Seal */}
              <div className="pt-2 text-[10.5px] text-slate-500 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <span>
                  Divalidasi oleh: <strong className="text-slate-700">Document Control System</strong>
                </span>
                <span className="font-mono text-slate-500">
                  {verifiedAt ? new Date(verifiedAt).toLocaleString('id-ID') : '-'}
                </span>
              </div>

              {/* Action Buttons: Copy Link & Print */}
              <div className="flex items-center gap-2 pt-1 no-print">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Bukti</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Back to Portal Action Button */}
        <div className="text-center pt-2 no-print">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/25 transition cursor-pointer"
          >
            <span>Buka Sistem Utama Document Control</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Copyright Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-6 no-print">
        &copy; {new Date().getFullYear()} {companyName}. Seluruh Hak Cipta Dilindungi.
      </div>
    </div>
  );
}