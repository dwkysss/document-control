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

// Clean start: 0 documents (ready for user to register their own documents)
export const initialDocuments = [];

// Clean start: 0 audit logs
export const initialAuditLogs = [];

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
