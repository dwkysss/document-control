export const initialCompanies = [
  { 
    id: 'comp-dji', 
    code: 'DJI', 
    name: 'PT Dentelle Jaya Infinitex', 
    tagline: 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga', 
    color: 'blue',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
  },
  { 
    id: 'comp-umi', 
    code: 'UMI', 
    name: 'PT Ultimo Moda Indotex', 
    tagline: 'Excellence in Fashion & Textile Manufacturing', 
    color: 'indigo',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
  },
  { 
    id: 'comp-imk', 
    code: 'IMK', 
    name: 'PT IMK', 
    tagline: 'High Quality Industrial Textile & Knitting', 
    color: 'emerald',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
  },
];

export const initialDepartments = [
  { id: 'dept-mgmt', code: 'MGMT', name: 'Top Management & Direksi', head: 'DENI RAMDAN', color: 'violet' },
  { id: 'dept-1', code: 'HRGA', name: 'Human Resources & General Affairs', head: 'BABAN RACHMAT SUBAGJA', color: 'blue' },
  { id: 'dept-7', code: 'IT', name: 'Information Technology', head: 'Dwiky Sumarlin', color: 'cyan' },
  { id: 'dept-2', code: 'FAT', name: 'Finance, Accounting & Tax', head: '------------', color: 'emerald' },
  { id: 'dept-4', code: 'MARKETING', name: 'Sales & Marketing', head: '------------', color: 'purple' },
  { id: 'dept-5', code: 'QAQC', name: 'Quality Assurance & Quality Control', head: '------------', color: 'rose' },
  { id: 'dept-6', code: 'WAREHOUSE', name: 'Warehouse & Supply Chain', head: '------------', color: 'indigo' },
  { id: 'dept-3', code: 'PRODUKSI', name: 'Production & Manufacturing', head: 'DEDE SUHENDA', color: 'amber' },
];

export const initialDocumentTypes = [
  { id: 'type-1', code: 'IK', name: 'Instruksi Kerja (KIK)', description: 'Petunjuk teknis pengerjaan tugas spesifik secara mendetail', level: 3, prefix: 'IK' },
  { id: 'type-2', code: 'SOP', name: 'Standar Operasional Prosedur', description: 'Prosedur operasional lintas departemen berstandar ISO 9001', level: 2, prefix: 'SOP' },
  { id: 'type-3', code: 'MEM', name: 'Memo Internal', description: 'Surat edaran atau instruksi internal manajemen', level: 4, prefix: 'MEM' },
  { id: 'type-4', code: 'FORM', name: 'Formulir Kontrol', description: 'Formulir standar pencatatan data dan formulir isian', level: 4, prefix: 'FORM' },
  { id: 'type-5', code: 'POL', name: 'Kebijakan Perusahaan (Policy)', description: 'Pedoman kebijakan umum direksi dan tata kelola', level: 1, prefix: 'POL' },
  { id: 'type-6', code: 'WI', name: 'Work Instruction', description: 'Instruksi kerja mesin dan keselamatan operasional', level: 3, prefix: 'WI' },
  { id: 'type-7', code: 'EXT', name: 'Dokumen Eksternal (External Document)', description: 'Peraturan perundangan (UU/Permenaker), standar pelanggan, sertifikasi eksternal', level: 5, prefix: 'EXT' },
];

export const initialEmployees = [
  { id: 'emp-4', nik: '123463', name: 'Dwiky Sumarlin', companyCode: 'ALL', companyName: 'Holding (Multi-Company)', department: 'IT', position: 'Lead Systems Engineer', email: 'dwiky.sumarlin@dji-indonesia.com', role: 'admin', status: 'Aktif' },
  { id: 'emp-1', nik: 'DJI092115', name: 'DENI RAMDAN', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'MGMT', position: 'GENERAL MANAGER', email: 'deni.ramdan@dji-indonesia.com', role: 'reviewer', status: 'Aktif' },
  { id: 'emp-2', nik: 'DJI022203', name: 'DEDE SUHENDA', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'PRODUKSI', position: 'KEPALA BAGIAN PRODUKSI', email: 'dede.suhenda@dji-indonesia.com', role: 'reviewer', status: 'Aktif' },
  { id: 'emp-3', nik: 'DJI012548', name: 'BABAN RACHMAT SUBAGJA', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'HRGA', position: 'MANAGER HRGA & MR', email: 'baban.rachmat.subagja@dji-indonesia.com', role: 'approver', status: 'Aktif' },
  { id: 'emp-5', nik: 'DJI022550', name: 'SYAHLA NOVIYANA', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'FAT', position: 'DOCUMENT CONTROL OFFICER', email: 'syahla.noviyana@dji-indonesia.com', role: 'doc_control', status: 'Aktif' },
  { id: 'emp-6', nik: 'DJI102216', name: 'ZARRAH ALI MARIFAH', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'FAT', position: 'STAFF ACCOUNTING FINANCE', email: 'zarrah.ali.marifah@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-7', nik: 'DJI032207', name: 'SITI NURDIANTI', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'PRODUKSI', position: 'STAFF PPIC', email: 'siti.nurdianti@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-8', nik: 'DJI012202', name: 'ASIVA SITI FAUJIAH', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'PRODUKSI', position: 'STAFF ADM PRODUKSI', email: 'asiva.siti.faujiah@dji-indonesia.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-9', nik: 'DJI042211', name: 'AHMAD FAUZI', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'PRODUKSI', position: 'OPERATOR PRODUKSI', email: 'ahmad.fauzi@dji-indonesia.com', role: 'viewer', status: 'Aktif' },
  { id: 'emp-10', nik: 'DJI052219', name: 'NURUL HIDAYAH', companyCode: 'DJI', companyName: 'PT Dentelle Jaya Infinitex', department: 'FAT', position: 'OPERATOR ADM KEUANGAN', email: 'nurul.hidayah@dji-indonesia.com', role: 'viewer', status: 'Aktif' },
  // PT Ultimo Moda Indotex (UMI)
  { id: 'emp-umi-0', nik: 'UMI00001', name: 'DIMAS SETIAWAN', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'IT', position: 'IT & SYSTEM ADMIN (UMI)', email: 'dimas.setiawan@ultimo-moda.com', role: 'admin', status: 'Aktif' },
  { id: 'emp-umi-1', nik: 'UMI01001', name: 'RATNA SARI', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'HRGA', position: 'MANAGER HRGA & MR (UMI)', email: 'ratna.sari@ultimo-moda.com', role: 'approver', status: 'Aktif' },
  { id: 'emp-umi-4', nik: 'UMI04004', name: 'SITI LESTARI', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'PRODUKSI', position: 'KEPALA BAGIAN DYEING & FINISHING', email: 'siti.lestari@ultimo-moda.com', role: 'reviewer', status: 'Aktif' },
  { id: 'emp-umi-2', nik: 'UMI02002', name: 'HENDRA PRASETYA', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'FAT', position: 'DOCUMENT CONTROL OFFICER (UMI)', email: 'hendra.prasetya@ultimo-moda.com', role: 'doc_control', status: 'Aktif' },
  { id: 'emp-umi-3', nik: 'UMI03003', name: 'MAYA ANGGRAENI', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'PRODUKSI', position: 'STAFF PRODUKSI & QC (UMI)', email: 'maya.anggraeni@ultimo-moda.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-umi-5', nik: 'UMI05005', name: 'BAGUS KURNIAWAN', companyCode: 'UMI', companyName: 'PT Ultimo Moda Indotex', department: 'PRODUKSI', position: 'OPERATOR DYEING & LAB', email: 'bagus.kurniawan@ultimo-moda.com', role: 'viewer', status: 'Aktif' },
  // PT IMK (IMK)
  { id: 'emp-imk-0', nik: 'IMK00001', name: 'ARIF BUDIMAN', companyCode: 'IMK', companyName: 'PT IMK', department: 'IT', position: 'IT & SYSTEM ADMIN (IMK)', email: 'arif.budiman@imk-textile.com', role: 'admin', status: 'Aktif' },
  { id: 'emp-imk-1', nik: 'IMK01001', name: 'BAMBANG WIJAYA', companyCode: 'IMK', companyName: 'PT IMK', department: 'HRGA', position: 'MANAGER HRGA & MR (IMK)', email: 'bambang.wijaya@imk-textile.com', role: 'approver', status: 'Aktif' },
  { id: 'emp-imk-4', nik: 'IMK04004', name: 'FAJAR NUGRAHA', companyCode: 'IMK', companyName: 'PT IMK', department: 'PRODUKSI', position: 'KEPALA BAGIAN KNITTING', email: 'fajar.nugraha@imk-textile.com', role: 'reviewer', status: 'Aktif' },
  { id: 'emp-imk-2', nik: 'IMK02002', name: 'TIARA KUSUMA', companyCode: 'IMK', companyName: 'PT IMK', department: 'FAT', position: 'DOCUMENT CONTROL OFFICER (IMK)', email: 'tiara.kusuma@imk-textile.com', role: 'doc_control', status: 'Aktif' },
  { id: 'emp-imk-3', nik: 'IMK03003', name: 'RIZKY PRATAMA', companyCode: 'IMK', companyName: 'PT IMK', department: 'PRODUKSI', position: 'STAFF PRODUKSI & KNITTING (IMK)', email: 'rizky.pratama@imk-textile.com', role: 'staff', status: 'Aktif' },
  { id: 'emp-imk-5', nik: 'IMK05005', name: 'ANISA FITRIANI', companyCode: 'IMK', companyName: 'PT IMK', department: 'PRODUKSI', position: 'OPERATOR KNITTING & QC', email: 'anisa.fitriani@imk-textile.com', role: 'viewer', status: 'Aktif' }
];

export const initialVerifierTeams = [
  { id: 'team-1', name: 'Document Control Team', leader: 'SYAHLA NOVIYANA', members: ['SYAHLA NOVIYANA', 'Dwiky Sumarlin'], description: 'Tim verifikasi utama seluruh dokumen standar operasional dan administrasi ISO 9001' },
  { id: 'team-2', name: 'QA Review Board', leader: 'DENI RAMDAN', members: ['DENI RAMDAN', 'DEDE SUHENDA'], description: 'Tim verifikasi mutu khusus dokumen teknis, instruksi kerja mesin, dan standar kalibrasi' },
  { id: 'team-3', name: 'Finance & Tax Verifier', leader: 'SYAHLA NOVIYANA', members: ['SYAHLA NOVIYANA', 'ZARRAH ALI MARIFAH'], description: 'Verifikasi dokumen keuangan, pengadaan, dan prosedur perbankan/pajak' },
  { id: 'team-4', name: 'Management Representative (MR)', leader: 'BABAN RACHMAT SUBAGJA', members: ['BABAN RACHMAT SUBAGJA', 'DENI RAMDAN', 'Dwiky Sumarlin'], description: 'Otoritas tertinggi peninjau kebijakan perusahaan dan kepatuhan audit eksternal' },
];

// Clean start: 0 documents (ready for user to register their own documents)
export const initialDocuments = [];

// Clean start: 0 audit logs
export const initialAuditLogs = [];

export const initialSystemSettings = {
  companyName: 'PT DENTELLE JAYA INFINITEX',
  companyCode: 'DJI',
  systemName: 'DOCUMENT CONTROL SYSTEM',
  companyTagline: 'Dokumen Terkendali, Proses Lebih Pasti, Mutu Lebih Terjaga',
  isoStandard: 'ISO 9001:2015 / ISO 27001 / ISO 14001',
  numberingFormat: '{COMPANY}-{TYPE}-{DEPT}-{SEQ:2}-{REV:2}',
  defaultVerifierTeam: 'Document Control Team',
  watermarkControlledText: 'CONTROLLED COPY - PT DENTELLE JAYA INFINITEX',
  watermarkObsoleteText: 'OBSOLETE - DO NOT USE',
  watermarkDraftText: 'DRAFT - NOT FOR OPERATIONAL USE',
  enableQRStamp: true,
  enableAuditAutoLog: true,
  periodicReviewMonths: 12,
};
