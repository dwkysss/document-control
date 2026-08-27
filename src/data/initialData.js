export const initialDepartments = [
  { id: 'dept-1', code: 'HRGA', name: 'Human Resource & General Affairs', head: 'Siti Nurhaliza', color: 'blue' },
  { id: 'dept-2', code: 'FAT', name: 'Finance, Accounting & Tax', head: 'Riska Amelia', color: 'emerald' },
  { id: 'dept-3', code: 'PRODUKSI', name: 'Production & Manufacturing', head: 'Agus Setiawan', color: 'amber' },
  { id: 'dept-4', code: 'MARKETING', name: 'Sales & Marketing', head: 'Dewi Lestari', color: 'purple' },
  { id: 'dept-5', code: 'QAQC', name: 'Quality Assurance & Quality Control', head: 'Hendra Wijaya', color: 'rose' },
  { id: 'dept-6', code: 'IT', name: 'Information Technology & Systems', head: 'Dwiky Sumarlin', color: 'cyan' },
  { id: 'dept-7', code: 'WAREHOUSE', name: 'Warehouse & Inventory Control', head: 'Budi Santoso', color: 'indigo' },
  { id: 'dept-8', code: 'ENGINEERING', name: 'Engineering & Maintenance', head: 'Eko Prasetyo', color: 'orange' },
];

export const initialDocumentTypes = [
  { id: 'type-1', code: 'IK', name: 'Instruksi Kerja (KIK)', description: 'Petunjuk teknis pengerjaan tugas spesifik secara mendetail', level: 3, prefix: 'IK' },
  { id: 'type-2', code: 'SOP', name: 'Standar Operasional Prosedur', description: 'Prosedur operasional lintas departemen berstandar ISO 9001', level: 2, prefix: 'SOP' },
  { id: 'type-3', code: 'MEM', name: 'Memo Internal', description: 'Surat edaran atau instruksi internal manajemen', level: 4, prefix: 'MEM' },
  { id: 'type-4', code: 'FORM', name: 'Formulir Kontrol', description: 'Formulir standar pencatatan data dan formulir isian', level: 4, prefix: 'FORM' },
  { id: 'type-5', code: 'POL', name: 'Kebijakan Perusahaan (Policy)', description: 'Pedoman kebijakan umum direksi dan tata kelola', level: 1, prefix: 'POL' },
  { id: 'type-6', code: 'WI', name: 'Work Instruction', description: 'Instruksi kerja mesin dan keselamatan operasional', level: 3, prefix: 'WI' },
];

export const initialEmployees = [
  { id: 'emp-1', nik: '123456', name: 'Baban Rachmat', department: 'HRGA', position: 'HRGA Staff', email: 'baban.rachmat@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-2', nik: '123457', name: 'Riska Amelia', department: 'FAT', position: 'FAT Supervisor', email: 'riska.amelia@dji-indonesia.com', role: 'approver', status: 'Aktif' },
  { id: 'emp-3', nik: '123458', name: 'Agus Setiawan', department: 'PRODUKSI', position: 'Production Manager', email: 'agus.setiawan@dji-indonesia.com', role: 'approver', status: 'Aktif' },
  { id: 'emp-4', nik: '123459', name: 'Dewi Lestari', department: 'MARKETING', position: 'Marketing Lead', email: 'dewi.lestari@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-5', nik: '123460', name: 'Siti Nurhaliza', department: 'HRGA', position: 'Document Control Officer', email: 'siti.nurhaliza@dji-indonesia.com', role: 'doc_control', status: 'Aktif' },
  { id: 'emp-6', nik: '123461', name: 'Hendra Wijaya', department: 'QAQC', position: 'QA/QC Manager', email: 'hendra.wijaya@dji-indonesia.com', role: 'admin', status: 'Aktif' },
  { id: 'emp-7', nik: '123462', name: 'Budi Santoso', department: 'WAREHOUSE', position: 'Logistics Supervisor', email: 'budi.santoso@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-8', nik: '123463', name: 'Dwiky Sumarlin', department: 'IT', position: 'Lead Systems Engineer', email: 'dwiky.sumarlin@dji-indonesia.com', role: 'admin', status: 'Aktif' },
];

export const initialVerifierTeams = [
  { id: 'team-1', name: 'Document Control Team', leader: 'Siti Nurhaliza', members: ['Siti Nurhaliza', 'Hendra Wijaya'], description: 'Tim verifikasi utama seluruh dokumen standar operasional dan administrasi ISO 9001' },
  { id: 'team-2', name: 'QA Review Board', leader: 'Hendra Wijaya', members: ['Hendra Wijaya', 'Agus Setiawan'], description: 'Tim verifikasi mutu khusus dokumen teknis, instruksi kerja mesin, dan standar kalibrasi' },
  { id: 'team-3', name: 'Finance & Tax Verifier', leader: 'Riska Amelia', members: ['Riska Amelia', 'Dewi Lestari'], description: 'Verifikasi dokumen keuangan, pengadaan, dan prosedur perbankan/pajak' },
  { id: 'team-4', name: 'Management Representative (MR)', leader: 'Hendra Wijaya', members: ['Hendra Wijaya', 'Siti Nurhaliza', 'Riska Amelia'], description: 'Otoritas tertinggi peninjau kebijakan perusahaan dan kepatuhan audit eksternal' },
];

export const initialDocuments = [
  {
    id: 'doc-001',
    docNumber: 'DJI-IK-HRGA-01-00',
    title: 'Prosedur Pengajuan Cuti Karyawan',
    type: 'IK',
    typeName: 'Instruksi Kerja (KIK)',
    department: 'HRGA',
    creator: 'Baban Rachmat',
    creatorNik: '123456',
    creatorPosition: 'HRGA Staff',
    seqNumber: '01',
    revision: '00',
    status: 'DRAFT', // DRAFT, VERIFIKASI, AKTIF, OBSOLETE, DITOLAK
    createdDate: '2026-08-26',
    createdTime: '10:30:45',
    effectiveDate: null,
    verifierTeam: 'Document Control Team',
    notes: 'Draft instruksi kerja pembaharuan alur cuti tahunan dan cuti khusus.',
    content: `1. TUJUAN
Prosedur ini disusun untuk memberikan petunjuk teknis pengajuan cuti bagi seluruh karyawan PT DJI agar tertib administrasi dan tidak mengganggu kelancaran operasional.

2. RUANG LINGKUP
Meliputi pengajuan cuti tahunan, cuti melahirkan, cuti sakit, dan izin khusus bagi seluruh karyawan tetap dan kontrak.

3. TANGGUNG JAWAB
- Karyawan: Mengajukan permohonan cuti minimal 3 hari kerja sebelum tanggal pelaksanaan.
- Atasan Langsung: Melakukan peninjauan beban kerja dan memberikan persetujuan/penolakan.
- HRGA: Melakukan verifikasi saldo cuti dan pencatatan dalam HRIS.

4. ALUR PROSEDUR
4.1 Karyawan mengisi form cuti melalui sistem intranet perusahaan.
4.2 Atasan langsung menerima notifikasi dan melakukan review paling lambat 1x24 jam.
4.3 HRGA memvalidasi sisa hak cuti dan menerbitkan slip persetujuan cuti resmi.`,
    fileUrl: '/mock/prosedur_cuti_karyawan.pdf',
    fileName: 'IK-HRGA-01-00-Cuti-Karyawan.pdf',
    fileSize: '420 KB',
    revisionHistory: [
      { revision: '00', date: '2026-08-26', author: 'Baban Rachmat', note: 'Inisiasi dokumen draft baru' }
    ]
  },
  {
    id: 'doc-002',
    docNumber: 'DJI-SOP-FAT-02-01',
    title: 'Prosedur Pembayaran Vendor & Supplier',
    type: 'SOP',
    typeName: 'Standar Operasional Prosedur',
    department: 'FAT',
    creator: 'Riska Amelia',
    creatorNik: '123457',
    creatorPosition: 'FAT Supervisor',
    seqNumber: '02',
    revision: '01',
    status: 'VERIFIKASI',
    createdDate: '2026-08-25',
    createdTime: '14:15:20',
    effectiveDate: null,
    verifierTeam: 'Finance & Tax Verifier',
    notes: 'Penambahan klausul verifikasi e-Faktur pajak masukan dan validasi rekening koran.',
    content: `1. TUJUAN
Memastikan seluruh proses pembayaran kepada pihak ketiga (vendor/supplier) terlaksana secara akuntabel, tepat waktu, dan sesuai regulasi perpajakan Republik Indonesia.

2. RUANG LINGKUP
Berlaku untuk semua transaksi pengeluaran kas/bank yang timbul dari pengadaan barang dan jasa.

3. DOKUMEN PENDUKUNG WAJIB
- Purchase Order (PO) yang disetujui.
- Berita Acara Serah Terima (BAST) / Good Receipt Note (GRN).
- Faktur Pajak elektronik (e-Faktur) valid DJP.
- Invoice bermaterai cukup.`,
    fileUrl: '/mock/sop_pembayaran_vendor.pdf',
    fileName: 'SOP-FAT-02-01-Pembayaran-Vendor.pdf',
    fileSize: '780 KB',
    revisionHistory: [
      { revision: '00', date: '2025-01-10', author: 'Riska Amelia', note: 'Rilis pertama prosedur vendor' },
      { revision: '01', date: '2026-08-25', author: 'Riska Amelia', note: 'Penambahan klausul e-Faktur dan three-way matching invoice' }
    ]
  },
  {
    id: 'doc-003',
    docNumber: 'DJI-IK-PRODUKSI-03-02',
    title: 'Instruksi Kerja Setting Mesin SMT & Robotika',
    type: 'IK',
    typeName: 'Instruksi Kerja (KIK)',
    department: 'PRODUKSI',
    creator: 'Agus Setiawan',
    creatorNik: '123458',
    creatorPosition: 'Production Manager',
    seqNumber: '03',
    revision: '02',
    status: 'AKTIF',
    createdDate: '2026-08-24',
    createdTime: '09:00:00',
    effectiveDate: '2026-08-24',
    verifierTeam: 'QA Review Board',
    notes: 'Revisi parameter kecepatan nozzle feeder dan kalibrasi sensor suhu solder paste.',
    content: `1. TUJUAN
Sebagai panduan teknisi line produksi dalam melakukan setup dan penggantian program mesin SMT (Surface Mount Technology) guna mencapai target presisi toleransi 0.01mm.

2. KESELAMATAN KERJA (K3)
- Gunakan ESD Wrist Strap yang terhubung ke grounding point sebelum menyentuh feeder.
- Gunakan kacamata safety dan sepatu safety ESD.

3. LANGKAH PENGERJAAN
3.1 Nyalakan main breaker dan pastikan tekanan angin kompresor berada pada 0.5 - 0.6 MPa.
3.2 Load program job order sesuai part number PCB yang akan dirakit.
3.3 Lakukan dummy PCB placement test dan verifikasi fiducial mark menggunakan optical vision sensor.
3.4 Laporkan lembar checklist setting mesin kepada QC Inspector untuk First Piece Inspection (FPI).`,
    fileUrl: '/mock/ik_setting_mesin.pdf',
    fileName: 'IK-PRODUKSI-03-02-Setting-Mesin-SMT.pdf',
    fileSize: '1.2 MB',
    revisionHistory: [
      { revision: '00', date: '2024-03-15', author: 'Agus Setiawan', note: 'Rilis inisial mesin generasi 1' },
      { revision: '01', date: '2025-06-20', author: 'Agus Setiawan', note: 'Update parameter modul feeder 12mm' },
      { revision: '02', date: '2026-08-24', author: 'Agus Setiawan', note: 'Optimalisasi kecepatan nozzle dan sensor suhu pasta solder' }
    ]
  },
  {
    id: 'doc-004',
    docNumber: 'DJI-MEM-MARKETING-01-00',
    title: 'Memo Internal Alur Pelaporan Hasil Meeting Klien',
    type: 'MEM',
    typeName: 'Memo Internal',
    department: 'MARKETING',
    creator: 'Dewi Lestari',
    creatorNik: '123459',
    creatorPosition: 'Marketing Lead',
    seqNumber: '01',
    revision: '00',
    status: 'VERIFIKASI',
    createdDate: '2026-08-23',
    createdTime: '16:45:00',
    effectiveDate: null,
    verifierTeam: 'Document Control Team',
    notes: 'Standarisasi notulensi meeting klien korporat dan tindak lanjut penawaran harga.',
    content: `Kepada: Seluruh Tim Sales & Account Executive
Dari: Marketing Lead
Hal: Alur Pelaporan Hasil Meeting Klien (Minutes of Meeting)

Dengan diterbitkannya memo ini, seluruh staf yang melakukan pertemuan dengan mitra/klien wajib mengunggah notulensi resmi paling lambat 4 jam pasca meeting berakhir pada CRM internal.`,
    fileUrl: '/mock/memo_meeting_klien.pdf',
    fileName: 'MEM-MARKETING-01-00-Meeting-Klien.pdf',
    fileSize: '250 KB',
    revisionHistory: [
      { revision: '00', date: '2026-08-23', author: 'Dewi Lestari', note: 'Inisiasi memo notulensi meeting' }
    ]
  },
  {
    id: 'doc-005',
    docNumber: 'DJI-SOP-HRGA-04-03',
    title: 'Prosedur Recruitment & Onboarding Karyawan',
    type: 'SOP',
    typeName: 'Standar Operasional Prosedur',
    department: 'HRGA',
    creator: 'Siti Nurhaliza',
    creatorNik: '123460',
    creatorPosition: 'Document Control Officer',
    seqNumber: '04',
    revision: '03',
    status: 'AKTIF',
    createdDate: '2026-08-22',
    createdTime: '11:20:00',
    effectiveDate: '2026-08-22',
    verifierTeam: 'Document Control Team',
    notes: 'Integrasi tes teknis daring dan pelatihan pengenalan sistem keselamatan kerja ISO 45001.',
    content: `1. TUJUAN
Menjamin proses penerimaan tenaga kerja baru berjalan secara transparan, kompetitif, serta sesuai kualifikasi standar keahlian yang dibutuhkan perusahaan.

2. TAHAPAN REKRUTMEN
2.1 Penerimaan Form Permintaan Tenaga Kerja (FPTK) dari User Departemen.
2.2 Publikasi lowongan kerja dan screening CV.
2.3 Psikotes dan technical interview bersama user.
2.4 Offering letter dan penandatanganan PKWT/PKWTT.
2.5 Onboarding 3 hari meliputi pengenalan ISO 9001, Safety Induction, dan IT Access Setup.`,
    fileUrl: '/mock/sop_recruitment.pdf',
    fileName: 'SOP-HRGA-04-03-Recruitment.pdf',
    fileSize: '950 KB',
    revisionHistory: [
      { revision: '00', date: '2023-01-10', author: 'Siti Nurhaliza', note: 'Rilis pertama SOP Rekrutmen' },
      { revision: '01', date: '2024-02-15', author: 'Siti Nurhaliza', note: 'Penambahan tes psikologi online' },
      { revision: '02', date: '2025-05-18', author: 'Siti Nurhaliza', note: 'Penyempurnaan masa percobaan (probation) 3 bulan' },
      { revision: '03', date: '2026-08-22', author: 'Siti Nurhaliza', note: 'Integrasi modul safety induction ISO 45001 & onboarding digital' }
    ]
  },
  {
    id: 'doc-006',
    docNumber: 'DJI-SOP-HRGA-04-02',
    title: 'Prosedur Recruitment & Onboarding Karyawan (Revisi 02)',
    type: 'SOP',
    typeName: 'Standar Operasional Prosedur',
    department: 'HRGA',
    creator: 'Siti Nurhaliza',
    creatorNik: '123460',
    creatorPosition: 'Document Control Officer',
    seqNumber: '04',
    revision: '02',
    status: 'OBSOLETE',
    createdDate: '2025-05-18',
    createdTime: '08:30:00',
    effectiveDate: '2025-05-18',
    supersededBy: 'DJI-SOP-HRGA-04-03',
    verifierTeam: 'Document Control Team',
    notes: 'Versi usang - digantikan oleh revisi 03 per 22 Agustus 2026.',
    content: `[DOKUMEN INI TELAH USANG / OBSOLETE - LIHAT REVISI TERBARU: DJI-SOP-HRGA-04-03]`,
    fileUrl: '/mock/sop_recruitment_v2.pdf',
    fileName: 'SOP-HRGA-04-02-Recruitment-Obsolete.pdf',
    fileSize: '820 KB',
    revisionHistory: [
      { revision: '02', date: '2025-05-18', author: 'Siti Nurhaliza', note: 'Penyempurnaan masa percobaan' }
    ]
  },
  {
    id: 'doc-007',
    docNumber: 'DJI-IK-QAQC-01-00',
    title: 'Prosedur Kalibrasi Alat Ukur Digital & Caliper',
    type: 'IK',
    typeName: 'Instruksi Kerja (KIK)',
    department: 'QAQC',
    creator: 'Hendra Wijaya',
    creatorNik: '123461',
    creatorPosition: 'QA/QC Manager',
    seqNumber: '01',
    revision: '00',
    status: 'AKTIF',
    createdDate: '2026-08-20',
    createdTime: '13:00:00',
    effectiveDate: '2026-08-20',
    verifierTeam: 'Management Representative (MR)',
    notes: 'Standar verifikasi berkala alat ukur mikrometer dan jangka sorong lab QC.',
    content: `1. TUJUAN
Menjamin ketertelusuran (traceability) hasil pengukuran dimensi produk ke standar nasional/internasional (KAN / ISO/IEC 17025).

2. PERALATAN
- Gauge block grade 0 terkalibrasi eksternal.
- Kain mikrofiber dan cairan pembersih non-korosif.
- Ruang kalibrasi suhu stabil 20°C ± 2°C.`,
    fileUrl: '/mock/ik_kalibrasi.pdf',
    fileName: 'IK-QAQC-01-00-Kalibrasi.pdf',
    fileSize: '610 KB',
    revisionHistory: [
      { revision: '00', date: '2026-08-20', author: 'Hendra Wijaya', note: 'Penerbitan perdana instruksi kalibrasi' }
    ]
  },
  {
    id: 'doc-008',
    docNumber: 'DJI-FORM-HRGA-01-00',
    title: 'Formulir Pengajuan Surat Perintah Lembur (SPL)',
    type: 'FORM',
    typeName: 'Formulir Kontrol',
    department: 'HRGA',
    creator: 'Baban Rachmat',
    creatorNik: '123456',
    creatorPosition: 'HRGA Staff',
    seqNumber: '01',
    revision: '00',
    status: 'AKTIF',
    createdDate: '2026-08-18',
    createdTime: '09:15:00',
    effectiveDate: '2026-08-18',
    verifierTeam: 'Document Control Team',
    notes: 'Formulir resmi persetujuan lembur staf operasional.',
    content: `FORMULIR SURAT PERINTAH LEMBUR (SPL)
Nomor Form: DJI-FORM-HRGA-01-00
Departemen: HRGA / Seluruh Divisi

Bagian isian:
1. Data Karyawan (Nama, NIK, Bagian)
2. Tanggal & Jam Lembur (Mulai - Selesai, Total Jam)
3. Alasan / Pekerjaan yang Diselesaikan
4. Tanda Tangan: Karyawan, Supervisor, Head of Dept, HRGA`,
    fileUrl: '/mock/form_spl.pdf',
    fileName: 'FORM-HRGA-01-00-SPL.pdf',
    fileSize: '190 KB',
    revisionHistory: [
      { revision: '00', date: '2026-08-18', author: 'Baban Rachmat', note: 'Rilis master form lembur' }
    ]
  },
  {
    id: 'doc-009',
    docNumber: 'DJI-POL-IT-01-00',
    title: 'Kebijakan Keamanan Informasi & Akses Password',
    type: 'POL',
    typeName: 'Kebijakan Perusahaan (Policy)',
    department: 'IT',
    creator: 'Baban Rachmat',
    creatorNik: '123456',
    creatorPosition: 'HRGA Staff',
    seqNumber: '01',
    revision: '00',
    status: 'DITOLAK',
    createdDate: '2026-08-15',
    createdTime: '15:30:00',
    rejectionReason: 'Format klausul enkripsi belum memenuhi standar ISO 27001 dan belum menyertakan matriks hak akses multi-factor authentication (MFA). Harap koordinasi dengan Tim IT.',
    rejectedBy: 'Hendra Wijaya',
    rejectedDate: '2026-08-16 10:20:00',
    effectiveDate: null,
    verifierTeam: 'QA Review Board',
    notes: 'Pengajuan kebijakan perlindungan data server dan kata sandi.',
    content: `DOKUMEN DITOLAK OLEH VERIFIKATOR.
Catatan Penolakan: Format klausul enkripsi belum memenuhi standar ISO 27001 dan belum menyertakan matriks hak akses multi-factor authentication (MFA). Harap koordinasi dengan Tim IT.`,
    fileUrl: '/mock/pol_keamanan_it.pdf',
    fileName: 'POL-IT-01-00-Security-Policy.pdf',
    fileSize: '340 KB',
    revisionHistory: [
      { revision: '00', date: '2026-08-15', author: 'Baban Rachmat', note: 'Pengajuan draft ditolak pada tahap review' }
    ]
  }
];

export const initialAuditLogs = [
  {
    id: 'log-1',
    timestamp: '2026-08-26 10:30:45',
    user: 'Baban Rachmat',
    nik: '123456',
    action: 'SAVE_DRAFT',
    docNumber: 'DJI-IK-HRGA-01-00',
    docTitle: 'Prosedur Pengajuan Cuti Karyawan',
    details: 'Menyimpan dokumen sebagai draft baru'
  },
  {
    id: 'log-2',
    timestamp: '2026-08-25 14:15:20',
    user: 'Riska Amelia',
    nik: '123457',
    action: 'SUBMIT_VERIFICATION',
    docNumber: 'DJI-SOP-FAT-02-01',
    docTitle: 'Prosedur Pembayaran Vendor & Supplier',
    details: 'Mengajukan dokumen ke tim Finance & Tax Verifier'
  },
  {
    id: 'log-3',
    timestamp: '2026-08-24 09:45:10',
    user: 'Hendra Wijaya',
    nik: '123461',
    action: 'APPROVE_DOCUMENT',
    docNumber: 'DJI-IK-PRODUKSI-03-02',
    docTitle: 'Instruksi Kerja Setting Mesin SMT & Robotika',
    details: 'Menyetujui revisi dokumen 02 dan menetapkan status AKTIF'
  },
  {
    id: 'log-4',
    timestamp: '2026-08-23 16:45:00',
    user: 'Dewi Lestari',
    nik: '123459',
    action: 'SUBMIT_VERIFICATION',
    docNumber: 'DJI-MEM-MARKETING-01-00',
    docTitle: 'Memo Internal Alur Pelaporan Hasil Meeting Klien',
    details: 'Mengajukan memo internal ke Document Control Team'
  },
  {
    id: 'log-5',
    timestamp: '2026-08-22 11:30:00',
    user: 'Siti Nurhaliza',
    nik: '123460',
    action: 'APPROVE_REVISION',
    docNumber: 'DJI-SOP-HRGA-04-03',
    docTitle: 'Prosedur Recruitment & Onboarding Karyawan',
    details: 'Menyetujui revisi 03, otomatis mengubah DJI-SOP-HRGA-04-02 menjadi OBSOLETE'
  },
  {
    id: 'log-6',
    timestamp: '2026-08-16 10:20:00',
    user: 'Hendra Wijaya',
    nik: '123461',
    action: 'REJECT_DOCUMENT',
    docNumber: 'DJI-POL-IT-01-00',
    docTitle: 'Kebijakan Keamanan Informasi & Akses Password',
    details: 'Menolak dokumen dengan catatan klausul enkripsi belum memenuhi standar'
  }
];

export const initialSystemSettings = {
  companyName: 'PT DJI',
  companyCode: 'DJI',
  systemName: 'DOCUMENT CONTROL SYSTEM',
  isoStandard: 'ISO 9001:2015 / ISO 27001 / ISO 14001',
  numberingFormat: '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
  defaultVerifierTeam: 'Document Control Team',
  watermarkControlledText: 'CONTROLLED COPY - PT DJI',
  watermarkObsoleteText: 'OBSOLETE - DO NOT USE',
  watermarkDraftText: 'DRAFT - NOT FOR OPERATIONAL USE',
  enableQRStamp: true,
  enableAuditAutoLog: true,
  periodicReviewMonths: 12,
};
