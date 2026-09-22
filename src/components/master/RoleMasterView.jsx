import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  UserCheck,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  ExternalLink,
  Lock,
  Layers,
  FileText,
  Building2,
  Sparkles,
  Info,
  Eye
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import Modal from '../common/Modal';

export default function RoleMasterView() {
  const { employees, setActiveMenu, departments } = useDocumentControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'matrix' | 'workflow'
  const [selectedRoleDetail, setSelectedRoleDetail] = useState(null);

  // 5 Standard Roles ISO 9001:2015 in PT DJI Document Control System
  const roleDefinitions = [
    {
      id: 'admin',
      code: 'ADM',
      name: 'System Administrator',
      alias: 'Super Admin / IT Systems',
      level: 'Otoritas Sistem Tertinggi',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      tagColor: 'bg-purple-600 text-white',
      accentBorder: 'border-purple-200 dark:border-purple-800/80 hover:border-purple-400',
      icon: ShieldAlert,
      iconBg: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
      description:
        'Pemegang otoritas administratif penuh. Bertanggung jawab atas pengelolaan master data, pemeliharaan user, konfigurasi sistem ISO 9001, audit log, serta backup dan restore basis data.',
      responsibilities: [
        'Manajemen penuh Master Data (Karyawan, Departemen, Jenis Dokumen, Tim Verifikator)',
        'Konfigurasi parameter sistem, identitas perusahaan, dan format watermark',
        'Pengelolaan hak akses akun karyawan dan reset password',
        'Audit trail sistem, log aktivitas, serta backup & restore database JSON/Cloud',
        'Otorisasi khusus pembatalan atau override status dokumen jika terjadi anomali'
      ],
      keyPermissions: [
        'Akses Penuh Semua Menu',
        'Kelola Master Data & Role',
        'Konfigurasi Parameter Sistem',
        'Audit Trail & Backup Data',
        'Override & Hapus Dokumen'
      ]
    },
    {
      id: 'doc_control',
      code: 'DCO',
      name: 'Document Control Officer',
      alias: 'DCO / Pengendali Dokumen',
      level: 'Pengendali Mutu & Format (Gatekeeper)',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
      tagColor: 'bg-sky-600 text-white',
      accentBorder: 'border-sky-200 dark:border-sky-800/80 hover:border-sky-400',
      icon: FileCheck,
      iconBg: 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400',
      description:
        'Penjaga tata kelola format dokumen sesuai standar ISO 9001:2015 Clause 7.5. Bertanggung jawab atas verifikasi tata letak, penomoran resmi, kontrol watermark copy, distribusi, dan arsip dokumen obsolete.',
      responsibilities: [
        'Verifikasi kepatuhan format, margin, header-footer, dan kelengkapan dokumen',
        'Penerbitan kode dan nomor register dokumen resmi perusahaan',
        'Pemberian stempel digital "CONTROLLED COPY" pada dokumen terbit',
        'Pengelolaan status dokumen kadaluarsa (Obsolete) dan distribusi salinan terkendali',
        'Penyusunan dan pencetakan Laporan Master Register Dokumen resmi'
      ],
      keyPermissions: [
        'Verifikasi Format Dokumen',
        'Penomoran Dokumen Otomatis',
        'Watermark Controlled Copy',
        'Kelola Dokumen Obsolete',
        'Laporan Master Register ISO'
      ]
    },
    {
      id: 'approver',
      code: 'APP',
      name: 'Approver (MR)',
      alias: 'Management Representative',
      level: 'Pengesahan Akhir & Hak Akses Administratif (Setara Admin)',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      tagColor: 'bg-emerald-600 text-white',
      accentBorder: 'border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400',
      icon: Award,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
      description:
        'Penyetuju tingkat eksekutif / Management Representative (MR). Memiliki wewenang tertinggi dalam pengesahan dokumen ISO 9001, serta hak akses administratif penuh yang disetarakan dengan System Administrator (Kelola Master Data, Pengaturan Sistem, Otorisasi, dan Hapus/Batal Dokumen).',
      responsibilities: [
        'Evaluasi keselarasan dokumen terhadap kebijakan mutu dan strategi PT DJI',
        'Pemberian persetujuan final (Approve / Reject) untuk penerbitan dokumen resmi',
        'Manajemen penuh Master Data (Karyawan, Departemen, Jenis Dokumen, Tim Verifikator)',
        'Konfigurasi parameter sistem, format penomoran, dan watermark ISO 9001',
        'Otorisasi pengajuan revisi berkala, pembatalan dokumen, dan backup database'
      ],
      keyPermissions: [
        'Pengesahan Final Dokumen (MR)',
        'Kelola Master Data & Role',
        'Konfigurasi Parameter Sistem',
        'Audit Trail & Backup Data',
        'Override & Hapus Dokumen'
      ]
    },
    {
      id: 'reviewer',
      code: 'REV',
      name: 'Reviewer (Kepala Bagian)',
      alias: 'Department Head / Atasan Langsung',
      level: 'Pemeriksaan Substansi & Teknis Operasional',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      tagColor: 'bg-amber-600 text-white',
      accentBorder: 'border-amber-200 dark:border-amber-800/80 hover:border-amber-400',
      icon: UserCheck,
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
      description:
        'Pemeriksa substansi teknis dan alur operasional dokumen. Memastikan prosedur yang diajukan akurat, aplikatif, aman, serta tidak bertentangan dengan proses operasional di lapangan.',
      responsibilities: [
        'Pemeriksaan detail substansi proses kerja, instruksi kerja, atau formulir',
        'Pemberian masukan, catatan revisi, atau koreksi teknis kepada pemohon',
        'Rekomendasi persetujuan awal sebelum dokumen diteruskan ke Document Control',
        'Review berkala masa berlaku dokumen departemen terkait'
      ],
      keyPermissions: [
        'Review Konten Teknis Dokumen',
        'Berikan Catatan / Feedback Revisi',
        'Akses Dokumen Aktif Departemen',
        'Review Berkala (Periodic Review)',
        'Akses Laporan Departemen'
      ]
    },
    {
      id: 'staff',
      code: 'USR',
      name: 'Staff / Pemohon Dokumen',
      alias: 'User / Originator Dokumen',
      level: 'Inisiator Dokumen Baru & Revisi',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      tagColor: 'bg-blue-600 text-white',
      accentBorder: 'border-blue-200 dark:border-blue-800/80 hover:border-blue-400',
      icon: Users,
      iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
      description:
        'Personil pelaksana / originator. Memiliki hak untuk mengidentifikasi kebutuhan dokumen baru, menyusun naskah draft, mengunggah lampiran berkas, dan memantau status persetujuan dokumen.',
      responsibilities: [
        'Penyusunan naskah draft dokumen baru atau usulan revisi dokumen lama',
        'Pengisian metadata dokumen (judul, departemen, jenis, masa simpan)',
        'Pengunggahan file berkas kerja (PDF, Word, Excel)',
        'Perbaikan draft dokumen sesuai feedback yang diberikan Reviewer / DCO',
        'Pelaksanaan kerja sesuai dokumen terkendali yang aktif'
      ],
      keyPermissions: [
        'Buat Registrasi Dokumen Baru',
        'Simpan & Edit Draft Dokumen',
        'Ajukan ke Alur Verifikasi',
        'Akses Dokumen Terkendali Aktif',
        'Ajukan Usulan Revisi Dokumen'
      ]
    },
    {
      id: 'viewer',
      code: 'VWR',
      name: 'Karyawan Umum (Viewer / Read-Only)',
      alias: 'Operator / Karyawan Pelaksana',
      level: 'Akses Baca Terbatas (Controlled Copy Only)',
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800',
      tagColor: 'bg-teal-600 text-white',
      accentBorder: 'border-teal-200 dark:border-teal-800/80 hover:border-teal-400',
      icon: Eye,
      iconBg: 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400',
      description:
        'Personil operasional lapangan. Memiliki wewenang mencari, membaca, dan mengunduh dokumen resmi berstatus AKTIF (SOP, IK, Formulir) sebagai acuan kerja harian. Tidak memiliki akses pembuatan draf, verifikasi, maupun revisi dokumen.',
      responsibilities: [
        'Pelaksanaan operasional kerja harian sesuai SOP dan IK yang berstatus AKTIF',
        'Pencarian dan pembacaan salinan resmi dokumen terkendali (Controlled Copy)',
        'Pengunduhan format formulir standar operasional resmi perusahaan',
        'Pencegahan penggunaan dokumen kadaluarsa atau tidak sah di lingkungan kerja'
      ],
      keyPermissions: [
        'Akses Dokumen Terkendali Aktif',
        'Pencarian & Unduh Controlled Copy',
        'Preview Berkas Resmi ISO 9001',
        'Dashboard Ringkasan Operasional'
      ]
    }
  ];

  // Map employees to each role
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const getEmployeesForRole = (roleId) => {
    return safeEmployees.filter(
      emp => String(emp.role || 'staff').toLowerCase() === roleId.toLowerCase() && emp.status !== 'Nonaktif'
    );
  };

  // Filter roles by search
  const filteredRoles = roleDefinitions.filter(role => {
    const term = searchTerm.toLowerCase();
    const matchesRole =
      role.name.toLowerCase().includes(term) ||
      role.alias.toLowerCase().includes(term) ||
      role.description.toLowerCase().includes(term) ||
      role.level.toLowerCase().includes(term);

    const members = getEmployeesForRole(role.id);
    const matchesMember = members.some(m =>
      String(m.name || '').toLowerCase().includes(term) ||
      String(m.nik || '').toLowerCase().includes(term) ||
      String(m.department || '').toLowerCase().includes(term)
    );

    return matchesRole || matchesMember;
  });

  // Permission Matrix Feature Definitions (6 Roles ISO 9001:2015)
  const permissionFeatures = [
    {
      category: 'Registrasi & Pengajuan Dokumen',
      features: [
        { name: 'Buat Registrasi Dokumen Baru', viewer: false, staff: true, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Simpan & Kelola Draft Pribadi', viewer: false, staff: true, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Ajukan Draft ke Verifikasi (Submit)', viewer: false, staff: true, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Unggah Lampiran Berkas (Cloud Storage)', viewer: false, staff: true, reviewer: true, doc_control: true, approver: true, admin: true }
      ]
    },
    {
      category: 'Alur Verifikasi ISO 9001',
      features: [
        { name: 'Pemeriksaan Konten Teknis (Review Step)', viewer: false, staff: false, reviewer: true, doc_control: false, approver: true, admin: true },
        { name: 'Verifikasi Format Dokumen & Penomoran Resmi (DCO Step)', viewer: false, staff: false, reviewer: false, doc_control: true, approver: true, admin: true },
        { name: 'Pengesahan Akhir Terbit Dokumen (Approval Step)', viewer: false, staff: false, reviewer: false, doc_control: false, approver: true, admin: true },
        { name: 'Penolakan / Catatan Perbaikan Dokumen', viewer: false, staff: false, reviewer: true, doc_control: true, approver: true, admin: true }
      ]
    },
    {
      category: 'Pengendalian & Siklus Dokumen',
      features: [
        { name: 'Lihat & Unduh Dokumen Terkendali (Controlled Copy)', viewer: true, staff: true, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Tandai Dokumen Kadaluarsa (Obsolete)', viewer: false, staff: false, reviewer: false, doc_control: true, approver: true, admin: true },
        { name: 'Ajukan Permohonan Revisi Dokumen', viewer: false, staff: true, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Konfirmasi Peninjauan Berkala (Periodic Review)', viewer: false, staff: false, reviewer: true, doc_control: true, approver: true, admin: true }
      ]
    },
    {
      category: 'Master Data & Tata Kelola Sistem',
      features: [
        { name: 'Kelola Master Karyawan & Akun', viewer: false, staff: false, reviewer: false, doc_control: false, approver: true, admin: true },
        { name: 'Kelola Master Departemen & Tim Verifikator', viewer: false, staff: false, reviewer: false, doc_control: false, approver: true, admin: true },
        { name: 'Kelola Master Jenis & Template Dokumen', viewer: false, staff: false, reviewer: false, doc_control: false, approver: true, admin: true },
        { name: 'Akses Laporan Master Register & Audit Log', viewer: false, staff: false, reviewer: true, doc_control: true, approver: true, admin: true },
        { name: 'Konfigurasi Sistem & Backup/Restore JSON Database', viewer: false, staff: false, reviewer: false, doc_control: false, approver: true, admin: true }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Master Data Role & Hak Akses
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Struktur Role-Based Access Control (RBAC) & Wewenang Dokumen ISO 9001:2015 Clause 7.5
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu('master-emp')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Kelola Karyawan & Role</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Role Sistem</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">5</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Standar Matriks Wewenang</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pengguna Terpetakan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-slate-700 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {safeEmployees.filter(e => e.status !== 'Nonaktif').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Karyawan Aktif Terdaftar</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Alur Verifikasi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-slate-700 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">4 Tahap</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Staff ➔ Rev ➔ DCO ➔ App</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Kepatuhan ISO 9001</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-slate-700 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">100%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Controlled Copy Guaranteed</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-card border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-lg">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${activeTab === 'cards'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Daftar Role ({roleDefinitions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${activeTab === 'matrix'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriks Hak Akses (Matrix RACI)</span>
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${activeTab === 'workflow'
              ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Alur Otorisasi ISO 9001</span>
          </button>
        </div>

        {activeTab === 'cards' && (
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari role atau personil..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: CARDS VIEW */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRoles.map(role => {
            const Icon = role.icon;
            const assignedMembers = getEmployeesForRole(role.id);

            return (
              <div
                key={role.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border transition-all duration-200 flex flex-col justify-between ${role.accentBorder}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${role.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {role.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${role.badgeColor}`}>
                            {role.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {role.level}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRoleDetail(role)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline shrink-0"
                    >
                      <span>Detail</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {role.description}
                  </p>

                  {/* Key Responsibilities */}
                  <div className="mb-5 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Tanggung Jawab Utama
                    </h4>
                    <ul className="space-y-1.5">
                      {role.responsibilities.slice(0, 3).map((resp, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Permission Pills */}
                  <div className="mb-5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Hak Akses Spesifik
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {role.keyPermissions.map((perm, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium rounded-lg"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Assigned Members Section Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Personil Aktif ({assignedMembers.length}):
                    </span>
                    <div className="flex -space-x-2 overflow-hidden">
                      {assignedMembers.slice(0, 4).map((m, idx) => (
                        <div
                          key={idx}
                          title={`${m.name} (${m.position || m.department})`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-800"
                        >
                          {String(m.name || 'U')
                            .split(' ')
                            .filter(Boolean)
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                      ))}
                      {assignedMembers.length > 4 && (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold ring-2 ring-white dark:ring-slate-800">
                          +{assignedMembers.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRoleDetail(role)}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium"
                  >
                    Lihat Anggota ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PERMISSION MATRIX RACI TABLE */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Matriks Hak Akses & Kewenangan (Permission Matrix)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan komparatif hak akses 6 role pengguna pada setiap kapabilitas operasional sistem ISO 9001:2015.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Diizinkan
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 bg-slate-300 rounded" /> Tidak Memiliki Akses
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 min-w-[280px]">Fitur & Kapabilitas Sistem</th>
                  <th className="p-4 text-center min-w-[100px]">
                    <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black">
                      Viewer
                    </span>
                  </th>
                  <th className="p-4 text-center min-w-[110px]">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                      Staff / User
                    </span>
                  </th>
                  <th className="p-4 text-center min-w-[110px]">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black">
                      Reviewer
                    </span>
                  </th>
                  <th className="p-4 text-center min-w-[120px]">
                    <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black">
                      Doc Control
                    </span>
                  </th>
                  <th className="p-4 text-center min-w-[110px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black">
                      Approver
                    </span>
                  </th>
                  <th className="p-4 text-center min-w-[110px]">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black">
                      Admin
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {permissionFeatures.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-slate-100/70 dark:bg-slate-900/40">
                      <td colSpan={7} className="p-2.5 pl-4 font-bold text-slate-900 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.features.map((feat, fIdx) => (
                      <tr key={fIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                        <td className="p-3 pl-6 font-medium text-slate-800 dark:text-slate-200">
                          {feat.name}
                        </td>
                        <td className="p-3 text-center">
                          {feat.viewer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feat.staff ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feat.reviewer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feat.doc_control ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feat.approver ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {feat.admin ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <span className="w-3 h-0.5 bg-slate-200 dark:bg-slate-700 inline-block" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKFLOW ISO 9001 */}
      {activeTab === 'workflow' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-700 space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Alur Otorisasi & Perjalanan Dokumen Terkendali ISO 9001:2015
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Setiap role memiliki peranan krusial dan berurutan untuk menjamin integritas mutu dokumen dari pembuatan hingga terbit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-black text-[11px]">
                    Tahap 01
                  </span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Inisiasi & Draft (Staff / User)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Pemohon mengidentifikasi kebutuhan dokumen baru atau revisi, menginput formulir registrasi, mengunggah naskah awal, dan memilih Reviewer yang berwenang.
                </p>
              </div>
              <div className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-950 p-2 rounded-lg">
                Status: DRAFT
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-amber-600 text-white font-black text-[11px]">
                    Tahap 02
                  </span>
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Review Substansi (Reviewer / Kadep)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Atasan langsung / Kepala Departemen menelaah isi teknis, instruksi operasional, dan parameter keselamatan. Memberikan persetujuan teknis atau revisi.
                </p>
              </div>
              <div className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 p-2 rounded-lg">
                Status: IN REVIEW
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-sky-600 text-white font-black text-[11px]">
                    Tahap 03
                  </span>
                  <FileCheck className="w-5 h-5 text-sky-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Verifikasi Format (Doc Control / DCO)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Petugas Pengendali Dokumen memverifikasi kepatuhan format tata letak ISO 9001, memberikan Nomor Registrasi resmi, dan menyematkan stempel terkendali.
                </p>
              </div>
              <div className="text-[10px] font-bold text-sky-600 bg-sky-100 dark:bg-sky-950 p-2 rounded-lg">
                Status: VERIFIKASI FORMAT
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-slate-900 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-black text-[11px]">
                    Tahap 04
                  </span>
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Pengesahan Final (Approver / MR)
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Management Representative atau Top Management menandatangani persetujuan resmi. Dokumen terbit secara otomatis dan berstatus aktif terkendali.
                </p>
              </div>
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 p-2 rounded-lg">
                Status: AKTIF (TERKENDALI)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL ROLE & DAFTAR ANGGOTA */}
      {selectedRoleDetail && (
        <Modal
          isOpen={Boolean(selectedRoleDetail)}
          onClose={() => setSelectedRoleDetail(null)}
          title={`Detail Role: ${selectedRoleDetail.name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className={`p-3 rounded-xl ${selectedRoleDetail.iconBg}`}>
                <selectedRoleDetail.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedRoleDetail.name} ({selectedRoleDetail.code})
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedRoleDetail.badgeColor}`}>
                    {selectedRoleDetail.alias}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedRoleDetail.level}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Deskripsi Tanggung Jawab
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedRoleDetail.description}
              </p>
            </div>

            {/* Responsibilities list */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Daftar Tanggung Jawab ISO 9001
              </h4>
              <ul className="space-y-2">
                {selectedRoleDetail.responsibilities.map((resp, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Member List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Personil Terdaftar ({getEmployeesForRole(selectedRoleDetail.id).length})
                </h4>
                <button
                  onClick={() => {
                    setSelectedRoleDetail(null);
                    setActiveMenu('master-emp');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <span>Ubah di Master Karyawan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl">
                {getEmployeesForRole(selectedRoleDetail.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Belum ada personil yang ditugaskan ke role ini.
                  </div>
                ) : (
                  getEmployeesForRole(selectedRoleDetail.id).map(emp => (
                    <div key={emp.id || emp.nik} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          {String(emp.name || 'U')
                            .split(' ')
                            .filter(Boolean)
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            NIK: <span className="font-mono">{emp.nik}</span> • {emp.position}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
                        {emp.department}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
