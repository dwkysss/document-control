import React, { useMemo } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function PublicDocumentVerifyView({ docNumber, onBackToApp }) {
  const { documents, systemSettings } = useDocumentControl();

  // Cari dokumen berdasarkan nomor dokumen dari query string
  const doc = useMemo(() => {
    if (!docNumber || !documents) return null;
    const cleanQuery = decodeURIComponent(docNumber).trim().toUpperCase();
    return documents.find(d => (d.docNumber || '').toUpperCase() === cleanQuery) || null;
  }, [docNumber, documents]);

  // Evaluasi Siklus Tinjauan Berkala 12 Bulan (ISO 9001:2015 Clause 7.5.3)
  const evaluation = useMemo(() => {
    if (!doc) return null;

    const reviewIntervalMonths = systemSettings?.periodicReviewMonths || 12;
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
    const isActive = doc.status === 'AKTIF';
    const isNeedsReview = isActive && isOverdue;

    return {
      isObsolete,
      isActive,
      isNeedsReview,
      daysDiff,
      dueDateFormatted,
      statusLabel: isObsolete
        ? 'OBSOLETE (TIDAK BERLAKU)'
        : (isNeedsReview ? 'PERLU TINJAUAN BERKALA' : (isActive ? 'AKTIF & VALID' : doc.status))
    };
  }, [doc, systemSettings]);

  const companyName = systemSettings?.companyName || 'PT DJI';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
            <img src="/dji-logo.png" alt="PT DJI Logo" className="h-10 object-contain" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            {companyName} Document Control System
          </h1>
          <p className="text-xs text-slate-400">
            Portal Verifikasi Keaslian & Status Naskah Resmi (ISO 9001:2015 Klausul 7.5)
          </p>
        </div>

        {/* Card Status Verifikasi Real-time */}
        {doc ? (
          <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Banner Status Dinamis */}
            {evaluation?.isObsolete ? (
              <div className="p-5 bg-gradient-to-r from-rose-950 to-red-900 border-b border-rose-700/80 text-rose-200 flex items-start gap-3.5">
                <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="text-sm font-black uppercase tracking-wider text-rose-300">
                    STATUS: DOKUMEN OBSOLETE (KADALUWARSA)
                  </div>
                  <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                    <strong>PERINGATAN:</strong> Dokumen fisik cetak yang Anda scan ini sudah <strong>TIDAK BERLAKU</strong> dan telah ditarik dari peredaran. Silakan musnahkan salinan ini atau mintalah revisi resmi terkini ke Document Control.
                  </p>
                </div>
              </div>
            ) : evaluation?.isNeedsReview ? (
              <div className="p-5 bg-gradient-to-r from-amber-950 to-yellow-950 border-b border-amber-700/80 text-amber-200 flex items-start gap-3.5">
                <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black uppercase tracking-wider text-amber-300">
                    STATUS: MELEBIHI SIKLUS TINJAUAN 12 BULAN
                  </div>
                  <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                    Dokumen ini telah melampaui batas siklus tinjauan berkala 12 bulan sejak tanggal terbit ({evaluation.dueDateFormatted}). Dokumen sedang dalam penjadwalan evaluasi mutu ISO 9001:2015.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-700/80 text-emerald-200 flex items-start gap-3.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <span>STATUS: SALINAN RESMI TERKENDALI AKTIF</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    Dokumen fisik cetak ini <strong>SAH & RESMI</strong> berlaku untuk seluruh operasional PT DJI. Nomor registrasi dan revisi terdaftar aktif di pangkalan data Document Control.
                  </p>
                </div>
              </div>
            )}

            {/* Rincian Spesifikasi Dokumen */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {doc.typeName || doc.type || 'PROSEDUR TERKENDALI'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 uppercase leading-snug">
                  {doc.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/80 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Nomor Registrasi:</span>
                  <span className="font-mono font-bold text-white text-sm mt-0.5 block">
                    {doc.docNumber}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Nomor Revisi:</span>
                  <span className="font-mono font-bold text-sky-400 text-sm mt-0.5 block">
                    Rev {doc.revision}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Departemen Pemilik:</span>
                  <span className="font-bold text-white mt-0.5 block flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {doc.department}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Tanggal Berlaku Resmi:</span>
                  <span className="font-mono text-white mt-0.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {doc.effectiveDate || doc.createdDate || '-'}
                  </span>
                </div>
              </div>

              {/* Status Tinjauan Berkala */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span className="text-slate-300">Jatuh Tempo Tinjauan 12 Bulan:</span>
                </div>
                <span className={`font-mono font-bold ${evaluation?.isNeedsReview ? 'text-amber-400' : 'text-slate-200'}`}>
                  {evaluation?.dueDateFormatted}
                </span>
              </div>

              {/* Footer Otoritas */}
              <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between">
                <span>Divalidasi: <strong>Document Control System</strong></span>
                <span>Standar: <strong>ISO 9001:2015 Clause 7.5</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Nomor Dokumen Tidak Terdaftar</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Dokumen dengan nomor <strong>"{docNumber}"</strong> tidak ditemukan di pangkalan data resmi Document Control {companyName}.
            </p>
          </div>
        )}

        {/* Action Button: Kembali / Masuk ke Sistem Utama */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            <span>Buka Sistem Utama Document Control</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-6">
        &copy; {new Date().getFullYear()} {companyName}. Seluruh Hak Cipta Dilindungi Undang-Undang.
      </div>
    </div>
  );
}
