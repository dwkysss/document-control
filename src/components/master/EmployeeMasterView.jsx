import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  UserCheck,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Briefcase,
  KeyRound,
  Filter,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import Modal from '../common/Modal';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function EmployeeMasterView() {
  const {
    employees,
    departments,
    companies,
    selectedCompanyFilter,
    currentUser,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    isAdmin,
    showToast,
    canApproveUser,
    pendingEmployees,
    pendingEmployeesCount,
    approveUserRegistration,
    rejectUserRegistration,
    pendingPasswordResets,
    pendingPasswordResetsCount,
    totalPendingUserActionsCount,
    approvePasswordReset,
    rejectPasswordReset
  } = useDocumentControl();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'resets' | 'inactive'
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Approval Modal State
  const [approvalModalEmployee, setApprovalModalEmployee] = useState(null);
  const [approvalRole, setApprovalRole] = useState('staff');
  const [approvalDepartment, setApprovalDepartment] = useState('HRGA');
  const [approvalPosition, setApprovalPosition] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  // Rejection Modal State
  const [rejectModalEmployee, setRejectModalEmployee] = useState(null);
  const [rejectReason, setRejectReason] = useState('Data tidak sesuai atau bukan personil resmi perusahaan.');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Form State for Add / Edit
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState(() => (
    currentUser?.companyCode && currentUser.companyCode !== 'ALL'
      ? currentUser.companyCode
      : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'DJI')
  ));
  const [department, setDepartment] = useState('HRGA');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState('Aktif');

  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeDepartments = Array.isArray(departments) ? departments : [];

  // Filtered dataset by company and status tab
  const companyEmployees = safeEmployees.filter(e => {
    if (!e) return false;
    const empId = String(e.nip || e.nik || '').trim().toUpperCase();
    const employeeCompany = String(
      empId.startsWith('UMI') ? 'UMI' : empId.startsWith('IMK') ? 'IMK' : empId === '123463' ? 'ALL' : (e.companyCode || e.company_code || 'DJI')
    ).toUpperCase();
    const selectedCompany = String(selectedCompanyFilter || 'ALL').toUpperCase();
    return selectedCompany === 'ALL' || employeeCompany === selectedCompany || employeeCompany === 'ALL';
  });

  const totalCompanyCount = companyEmployees.length;
  const activeCount = companyEmployees.filter(e => e.status === 'Aktif').length;
  const pendingCount = companyEmployees.filter(e => e.status === 'Menunggu Persetujuan').length;
  const pendingResetsCount = companyEmployees.filter(e => Boolean(e.has_pending_reset || e.hasPendingReset)).length;
  const inactiveCount = companyEmployees.filter(e => e.status === 'Nonaktif' || e.status === 'Ditolak').length;

  const toggleSortOrder = () => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));

  const isAnyFilterActive =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    filterDepartment !== 'ALL' ||
    filterRole !== 'ALL' ||
    filterCompany !== 'ALL' ||
    sortOrder !== 'asc';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFilterDepartment('ALL');
    setFilterRole('ALL');
    setFilterCompany('ALL');
    setSortOrder('asc');
  };

  const filteredEmployees = companyEmployees.filter(e => {
    // 1. Status Filter Tab
    if (statusFilter === 'active' && e.status !== 'Aktif') return false;
    if (statusFilter === 'pending' && e.status !== 'Menunggu Persetujuan') return false;
    if (statusFilter === 'resets' && !Boolean(e.has_pending_reset || e.hasPendingReset)) return false;
    if (statusFilter === 'inactive' && (e.status === 'Aktif' || e.status === 'Menunggu Persetujuan')) return false;

    // 2. PT / Perusahaan Filter
    if (filterCompany !== 'ALL') {
      const empId = String(e.nip || e.nik || '').trim().toUpperCase();
      const empComp = String(
        empId.startsWith('UMI') ? 'UMI' : empId.startsWith('IMK') ? 'IMK' : empId === '123463' ? 'ALL' : (e.companyCode || e.company_code || 'DJI')
      ).toUpperCase();
      if (filterCompany === 'HOLDING') {
        if (empComp !== 'ALL') return false;
      } else {
        if (empComp !== filterCompany) return false;
      }
    }

    // 3. Departemen Filter
    if (filterDepartment !== 'ALL') {
      if (String(e.department || '').toUpperCase() !== filterDepartment.toUpperCase()) {
        return false;
      }
    }

    // 4. Role Akses Filter
    if (filterRole !== 'ALL') {
      if (filterRole === 'mgmt') {
        const isMgmt = e.department === 'MGMT' || String(e.position || '').toUpperCase().includes('GENERAL MANAGER') || String(e.position || '').toUpperCase().includes('DIREKTUR');
        if (!isMgmt) return false;
      } else if (e.role !== filterRole) {
        return false;
      }
    }

    // 5. Search query
    const term = String(searchTerm || '').toLowerCase().trim();
    if (!term) return true;
    const nameStr = String(e.name || '').toLowerCase();
    const nipStr = String(e.nip || e.nik || '').toLowerCase();
    const deptStr = String(e.department || '').toLowerCase();
    const posStr = String(e.position || '').toLowerCase();
    const emailStr = String(e.email || '').toLowerCase();
    return nameStr.includes(term) || nipStr.includes(term) || deptStr.includes(term) || posStr.includes(term) || emailStr.includes(term);
  });

  // Sorting berurutan A ke Z atau Z ke A berdasarkan Nama Pegawai
  const sortedEmployees = React.useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      const nameA = String(a.name || '').trim();
      const nameB = String(b.name || '').trim();
      const cmp = nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredEmployees, sortOrder]);

  // Ref & State untuk deteksi scroll horizontal tabel (Dynamic Scroll Indicators)
  const tableContainerRef = useRef(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const updateScrollIndicators = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setScrollState({
      canScrollLeft: scrollLeft > 6,
      canScrollRight: maxScroll > 6 && scrollLeft < maxScroll - 6,
    });
  }, []);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);

    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators, sortedEmployees]);

  const handleScrollRight = () => {
    const el = tableContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: 280, behavior: 'smooth' });
  };

  const handleScrollLeft = () => {
    const el = tableContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: -280, behavior: 'smooth' });
  };

  // Accordion state untuk tampilan Mobile
  const [expandedMobileEmpIds, setExpandedMobileEmpIds] = useState(new Set());

  const toggleExpandMobileEmp = (id) => {
    setExpandedMobileEmpIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApproveResetPassword = async (emp) => {
    if (confirm(`Setujui perubahan kata sandi untuk ${emp.name} (${emp.nip})? Pegawai akan dapat langsung masuk dengan kata sandi barunya.`)) {
      await approvePasswordReset(emp.id);
    }
  };

  const handleRejectResetPassword = async (emp) => {
    if (confirm(`Tolak dan batalkan permintaan perubahan kata sandi untuk ${emp.name} (${emp.nip})?`)) {
      await rejectPasswordReset(emp.id);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setNip('');
    setName('');
    setCompanyCode(currentUser?.companyCode && currentUser.companyCode !== 'ALL' ? currentUser.companyCode : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'DJI'));
    setDepartment('HRGA');
    setPosition('');
    setEmail('');
    setRole('staff');
    setStatus('Aktif');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setNip(emp.nip || emp.nik || '');
    setName(emp.name);
    setCompanyCode(emp.companyCode || ((emp.nip || emp.nik)?.startsWith('UMI') ? 'UMI' : (emp.nip || emp.nik)?.startsWith('IMK') ? 'IMK' : ((emp.nip || emp.nik) === '123463' ? 'ALL' : 'DJI')));
    setDepartment(emp.department);
    setPosition(emp.position);
    setEmail(emp.email || '');
    setRole(emp.role || 'staff');
    setStatus(emp.status || 'Aktif');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNip = nip.trim();
    const cleanName = name.trim();
    const cleanPosition = position.trim();

    if (!cleanName || !cleanNip || !cleanPosition) {
      showToast('Harap lengkapi semua kolom wajib (Nama, NIP, Jabatan)!', 'danger');
      return;
    }

    // Check duplicate NIP
    const isDuplicateNip = employees.some(
      emp => (emp.nip || emp.nik || '').toLowerCase() === cleanNip.toLowerCase() && emp.id !== editingEmployee?.id
    );

    if (isDuplicateNip) {
      showToast(`NIP ${cleanNip} sudah terdaftar pada pegawai lain!`, 'danger');
      return;
    }

    const matchedCompany = (companies || []).find(c => c.code === companyCode);
    const companyName = matchedCompany?.name || (companyCode === 'ALL' ? 'Holding (Multi-Company)' : companyCode === 'UMI' ? 'PT Ultimo Moda Indotex' : companyCode === 'IMK' ? 'PT IMK' : 'PT Dentelle Jaya Infinitex');

    const payload = {
      nip: cleanNip,
      nik: cleanNip,
      name: cleanName,
      companyCode,
      companyName,
      department,
      position: cleanPosition,
      email: email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      role,
      status
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, payload);
    } else {
      addEmployee(payload);
    }
    setIsModalOpen(false);
  };

  // Open Approval Dialog
  const handleOpenApproveModal = (emp) => {
    setApprovalModalEmployee(emp);
    setApprovalRole(emp.role && emp.role !== 'viewer' ? emp.role : 'staff');
    setApprovalDepartment(emp.department || 'HRGA');
    setApprovalPosition(emp.position || '');
  };

  const handleConfirmApprove = async () => {
    if (!approvalModalEmployee) return;
    setApprovalSubmitting(true);
    await approveUserRegistration(approvalModalEmployee.id, {
      role: approvalRole,
      department: approvalDepartment,
      position: approvalPosition,
      companyCode: approvalModalEmployee.companyCode || (approvalModalEmployee.nip?.startsWith('UMI') ? 'UMI' : approvalModalEmployee.nip?.startsWith('IMK') ? 'IMK' : 'DJI'),
      companyName: approvalModalEmployee.companyName
    });
    setApprovalSubmitting(false);
    setApprovalModalEmployee(null);
  };

  // Open Rejection Dialog
  const handleOpenRejectModal = (emp) => {
    setRejectModalEmployee(emp);
    setRejectReason('Data identitas tidak sesuai atau belum diverifikasi oleh HRGA/MR.');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalEmployee) return;
    setRejectSubmitting(true);
    await rejectUserRegistration(rejectModalEmployee.id, rejectReason);
    setRejectSubmitting(false);
    setRejectModalEmployee(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              Master Data Karyawan
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">Kelola personil, hak akses, dan otorisasi pengguna.</p>
          </div>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer shadow-sm shrink-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah <span className="hidden sm:inline">Pegawai Manual</span><span className="sm:hidden">Pegawai</span></span>
          </button>
        ) : (
          <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Mode Pratinjau (Admin / MR Only)</span>
            <span className="sm:hidden">Pratinjau</span>
          </span>
        )}
      </div>

      {/* Amber Alert Banner for Pending Registrations & Password Resets (Admin & MR) */}
      {canApproveUser && (pendingCount > 0 || pendingResetsCount > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                Otorisasi Personil Menunggu Tindakan ({pendingCount + pendingResetsCount})
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {pendingCount > 0 && pendingResetsCount > 0
                  ? `Terdapat ${pendingCount} pendaftaran akun baru dan ${pendingResetsCount} pengajuan reset kata sandi yang menunggu pengesahan Anda (System Admin / MR).`
                  : pendingCount > 0
                    ? `Terdapat ${pendingCount} calon pegawai baru yang mendaftar mandiri dan memerlukan otorisasi peran (Role) dari Anda (System Admin / MR).`
                    : `Terdapat ${pendingResetsCount} pengajuan perubahan kata sandi pegawai yang memerlukan pengesahan dari Anda (System Admin / MR).`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className="self-start sm:self-center px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 dark:text-white rounded-md transition cursor-pointer flex-shrink-0"
              >
                Tinjau Akun Baru ({pendingCount})
              </button>
            )}
            {pendingResetsCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('resets')}
                className="self-start sm:self-center px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 dark:text-white rounded-md transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Sandi ({pendingResetsCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Tab & Search Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-3.5 sm:px-4 py-3 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs (Clean Single-Row Navigation) */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] shrink-0 py-0.5 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              title="Semua Pegawai"
            >
              <span>Semua <span className="hidden xl:inline">Pegawai</span></span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {totalCompanyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              title="Pegawai Aktif"
            >
              <span>Aktif</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'active' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              title="Persetujuan Akun Pegawai Baru"
            >
              <span>Persetujuan <span className="hidden xl:inline">Akun</span></span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${pendingCount > 0
                ? statusFilter === 'pending'
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('resets')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${statusFilter === 'resets'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              title="Permintaan Reset Sandi Pegawai"
            >
              <KeyRound className="w-3 h-3" />
              <span>{isMobile ? 'Reset' : 'Reset Sandi'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${pendingResetsCount > 0
                ? statusFilter === 'resets'
                  ? 'bg-amber-700 text-amber-100'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {pendingResetsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${statusFilter === 'inactive'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              title="Pegawai Nonaktif atau Ditolak"
            >
              <span>Nonaktif<span className="hidden xl:inline"> / Ditolak</span></span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'inactive' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <label className="relative w-full sm:w-64 lg:w-72 shrink-0">
            <span className="sr-only">Cari pegawai berdasarkan nama, NIP, atau departemen</span>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Cari nama, NIP, dept, jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>

        {/* Secondary Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 bg-slate-50/70 px-3.5 sm:px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <div className="grid grid-cols-3 gap-1.5 w-full sm:flex sm:items-center sm:w-auto sm:gap-2">
            {/* Filter PT */}
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              aria-label="Filter Perusahaan (PT)"
              className={`rounded-lg border px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate ${
                filterCompany !== 'ALL'
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <option value="ALL">{isMobile ? 'PT' : 'Semua PT'}</option>
              <option value="DJI">PT DJI</option>
              <option value="IMK">PT IMK</option>
              <option value="UMI">PT UMI</option>
              <option value="HOLDING">{isMobile ? 'Holding' : 'Holding (ALL)'}</option>
            </select>

            {/* Filter Departemen */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              aria-label="Filter Departemen"
              className={`rounded-lg border px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate ${
                filterDepartment !== 'ALL'
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <option value="ALL">{isMobile ? 'Dept' : `Semua Departemen (${safeDepartments.length})`}</option>
              {safeDepartments.map((d) => (
                <option key={d.id || d.code} value={d.code}>
                  {isMobile ? d.code : `${d.code} - ${d.name}`}
                </option>
              ))}
            </select>

            {/* Filter Role Akses */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              aria-label="Filter Role Akses"
              className={`rounded-lg border px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold shadow-2xs transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate ${
                filterRole !== 'ALL'
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <option value="ALL">{isMobile ? 'Role' : 'Semua Role Akses'}</option>
              <option value="mgmt">{isMobile ? 'MR' : 'Top Management / MR'}</option>
              <option value="admin">{isMobile ? 'Admin' : 'System Admin'}</option>
              <option value="approver">{isMobile ? 'Approver' : 'Approver (MR)'}</option>
              <option value="reviewer">{isMobile ? 'Reviewer' : 'Reviewer (Atasan)'}</option>
              <option value="doc_control">{isMobile ? 'DCO' : 'Doc Control'}</option>
              <option value="staff">{isMobile ? 'Staff' : 'User (Staff)'}</option>
              <option value="viewer">{isMobile ? 'Viewer' : 'Karyawan (Viewer)'}</option>
            </select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Reset Button (hanya muncul jika ada filter atau pencarian aktif) */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] sm:text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                title="Reset semua filter dan pencarian"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span>Reset</span>
              </button>
            )}

            {/* Result Count Info */}
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="font-bold text-slate-800 dark:text-white">{sortedEmployees.length}</strong> dari {totalCompanyCount} pegawai
            </div>
          </div>
        </div>

        {/* Mobile Accordion List View (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {sortedEmployees.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <p className="font-bold">Tidak ada data pegawai yang sesuai filter</p>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            sortedEmployees.map((emp, idx) => {
              const empNik = String(emp.nip || emp.nik || '').trim().toUpperCase();
              const empComp = String(
                empNik.startsWith('UMI') ? 'UMI' : empNik.startsWith('IMK') ? 'IMK' : empNik === '123463' ? 'ALL' : (emp.companyCode || emp.company_code || 'DJI')
              ).toUpperCase();
              const isPending = emp.status === 'Menunggu Persetujuan';
              const hasReset = emp.has_pending_reset || emp.hasPendingReset;
              const isExpanded = expandedMobileEmpIds.has(emp.id || emp.nip || idx);

              return (
                <div
                  key={emp?.id || emp?.nip || emp?.nik || idx}
                  className={`transition-colors duration-150 ${
                    isExpanded
                      ? isPending ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-slate-50/80 dark:bg-slate-800/40'
                      : isPending ? 'bg-amber-50/30 dark:bg-amber-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Row Header (Clickable Accordion Trigger) */}
                  <div
                    onClick={() => toggleExpandMobileEmp(emp.id || emp.nip || idx)}
                    className="p-3.5 flex items-center gap-3 cursor-pointer select-none active:bg-slate-100/60 dark:active:bg-slate-800/60"
                    role="button"
                    aria-expanded={isExpanded}
                  >
                    {/* Circular Indicator Button: Amber/Orange */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all duration-200 ${
                        isExpanded
                          ? 'bg-amber-500 text-white shadow-amber-500/30 scale-105'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Summary Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                          empComp === 'UMI'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                            : empComp === 'IMK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : empComp === 'ALL'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {empComp}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {emp.name}
                        </span>
                        {isPending && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                            BARU
                          </span>
                        )}
                        {hasReset && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 animate-pulse shrink-0">
                            RESET
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        NIP: {empNik} • {emp.department}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Menunggu
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {emp.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Accordion Content Details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800">
                      <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-3 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Jabatan:</span>
                          <span className="text-slate-900 dark:text-white font-semibold">
                            {emp.position || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Departemen:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {emp.department || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 break-words">
                            {emp.email || '-'}
                          </span>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Role Akses:</span>
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                              {emp.role}
                            </span>
                          </div>
                        </div>

                        {hasReset && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 p-2 rounded-lg border border-amber-300">
                            <KeyRound className="w-3.5 h-3.5 shrink-0" />
                            <span>Pengajuan Reset Kata Sandi Menunggu Tindakan</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          {isPending ? (
                            canApproveUser ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenApproveModal(emp);
                                  }}
                                  className="flex-1 min-h-[36px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-xs"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRejectModal(emp);
                                  }}
                                  className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center border border-rose-200 dark:border-rose-800 transition active:scale-98 cursor-pointer"
                                  title="Tolak Pendaftaran"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Yakin ingin menghapus permanen data pengajuan ${emp.name}?`)) {
                                        deleteEmployee(emp.id || emp.nip);
                                      }
                                    }}
                                    className="min-h-[36px] px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center border border-slate-200 dark:border-slate-700 transition active:scale-98 cursor-pointer"
                                    title="Hapus Permanen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="flex-1 text-center py-1.5 text-xs text-amber-600 italic">Perlu Admin/MR</span>
                            )
                          ) : hasReset ? (
                            canApproveUser ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveResetPassword(emp);
                                  }}
                                  className="flex-1 min-h-[36px] px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-xs"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Setujui Sandi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectResetPassword(emp);
                                  }}
                                  className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center border border-rose-200 transition active:scale-98 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="flex-1 text-center py-1.5 text-xs text-amber-600 italic">Reset Menunggu MR</span>
                            )
                          ) : isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(emp);
                                }}
                                className="flex-1 min-h-[36px] px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200/80 dark:border-blue-800/80 transition active:scale-98 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Data</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Yakin ingin menghapus data ${emp.name}?`)) {
                                    deleteEmployee(emp.id || emp.nip);
                                  }
                                }}
                                className="min-h-[36px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center justify-center border border-rose-200 dark:border-rose-800 transition active:scale-98 cursor-pointer"
                                title="Hapus Pegawai"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="flex-1 text-center py-1.5 text-xs text-slate-400 italic">Mode Pratinjau (Read-Only)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Table Content (hidden md:block) */}
        <div className="hidden md:block relative">
          {/* Indikator Gradien Kiri (Muncul saat user scroll ke kanan melewati kolom Pegawai) */}
          <div
            className={`pointer-events-none absolute left-[210px] top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/10 dark:from-black/40 to-transparent z-15 transition-opacity duration-200 ${
              scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />

          {/* Tombol Panah Kiri di Header Tabel (Muncul saat user geser ke kanan) */}
          {scrollState.canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              className="absolute left-[196px] top-2.5 w-7 h-7 rounded-full bg-slate-800/90 hover:bg-slate-900 text-white shadow-md border-2 border-white dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer z-35 hover:scale-110 active:scale-95 group"
              title="Geser kembali ke kolom sebelumnya"
              aria-label="Geser kembali ke kolom sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}

          <div
            ref={tableContainerRef}
            className="overflow-x-auto min-h-[380px] table-scrollbar"
          >
            <table className="w-full min-w-[1020px] table-fixed text-left border-collapse text-sm">
              <colgroup>
                <col className="w-[210px]" />
                <col className="w-[60px]" />
                <col className="w-[85px]" />
                <col className="w-[140px]" />
                <col className="w-[170px]" />
                <col className="w-[135px]" />
                <col className="w-[100px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-2xs">
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 py-3 px-4 border-r border-slate-200/70 dark:border-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] select-none">
                    <button
                      type="button"
                      onClick={toggleSortOrder}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group"
                      title={sortOrder === 'asc' ? 'Urutan saat ini menaik (▲). Klik untuk membalikkan' : 'Urutan saat ini menurun (▼). Klik untuk membalikkan'}
                    >
                      <span>Pegawai (Nama & NIP)</span>
                      <span className="p-0.5 rounded transition">
                        {sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        )}
                      </span>
                    </button>
                  </th>
                  <th className="py-3 px-3">PT</th>
                  <th className="py-3 px-3">Dept.</th>
                  <th className="py-3 px-3">Jabatan</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role akses</th>
                  <th className="py-3 px-3">Status</th>
                  <th
                    className={`py-3 px-3 text-right sticky right-0 bg-slate-50 dark:bg-slate-800 z-20 border-l transition-shadow duration-200 ${
                      scrollState.canScrollRight
                        ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.55)] border-slate-200/90 dark:border-slate-700/90'
                        : 'shadow-none border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    {/* Ikon Tombol Panah Pemisah: Terletak persis di antara kolom yang terpotong dengan kolom Aksi */}
                    {scrollState.canScrollRight && (
                      <button
                        type="button"
                        onClick={handleScrollRight}
                        className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md border-2 border-white dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer z-30 hover:scale-110 active:scale-95 group animate-pulse"
                        title="Ada kolom tersembunyi. Klik untuk geser tabel ke kanan"
                        aria-label="Geser melihat kolom tersembunyi"
                      >
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                    <span>Aksi</span>
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-600 dark:text-slate-300">
                    <p className="font-medium">
                      {statusFilter === 'pending'
                        ? 'Tidak ada pengajuan akun baru yang sedang menunggu persetujuan.'
                        : statusFilter === 'resets'
                          ? 'Tidak ada permintaan reset sandi yang sedang menunggu tindakan.'
                          : statusFilter === 'inactive'
                            ? 'Tidak ada pegawai dengan status nonaktif atau ditolak.'
                            : 'Tidak ada data pegawai yang sesuai dengan kriteria filter / pencarian.'}
                    </p>
                    {isAnyFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bersihkan Filter</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((emp, idx) => {
                  const empNik = String(emp.nip || emp.nik || '').trim().toUpperCase();
                  const empComp = String(
                    empNik.startsWith('UMI') ? 'UMI' : empNik.startsWith('IMK') ? 'IMK' : empNik === '123463' ? 'ALL' : (emp.companyCode || emp.company_code || 'DJI')
                  ).toUpperCase();
                  const isPending = emp.status === 'Menunggu Persetujuan';

                  return (
                    <tr
                      key={emp?.id || emp?.nip || emp?.nik || idx}
                      className={`group transition ${isPending
                        ? 'bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <td className={`sticky left-0 z-10 py-3.5 px-4 border-r border-slate-200/70 dark:border-slate-800 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] transition ${isPending
                        ? 'bg-[#fffbeb] group-hover:bg-[#fef3c7] dark:bg-[#2e2008]'
                        : 'bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800'
                        }`}>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                          <span>{String(emp?.name || '')}</span>
                          {isPending && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                              BARU
                            </span>
                          )}
                          {(emp.has_pending_reset || emp.hasPendingReset) && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 animate-pulse">
                              <KeyRound className="w-2.5 h-2.5" />
                              RESET SANDI
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                          NIP: {String(emp?.nip || emp?.nik || '')}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${empComp === 'UMI'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                          : empComp === 'IMK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : empComp === 'ALL'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                          {empComp}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {String(emp?.department || '')}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-700 dark:text-slate-300">
                        <span className="block line-clamp-2" title={emp?.position}>
                          {String(emp?.position || '')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        <span className="block break-words" title={emp?.email}>
                          {String(emp?.email || '')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${emp.department === 'MGMT' || emp.position?.toUpperCase().includes('GENERAL MANAGER') || emp.position?.toUpperCase().includes('DIREKTUR')
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                          : emp.role === 'admin'
                            ? 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                            : emp.role === 'approver'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                              : emp.role === 'doc_control'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : emp.role === 'reviewer'
                                  ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                                  : emp.role === 'viewer'
                                    ? 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                                    : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                          {emp.department === 'MGMT' || emp.position?.toUpperCase().includes('GENERAL MANAGER') || emp.position?.toUpperCase().includes('DIREKTUR')
                            ? 'Top Management / MR'
                            : emp.role === 'admin'
                              ? 'System Admin'
                              : emp.role === 'approver'
                                ? 'Approver (MR)'
                                : emp.role === 'doc_control'
                                  ? 'Doc Control'
                                  : emp.role === 'reviewer'
                                    ? 'Reviewer (Atasan)'
                                    : emp.role === 'viewer'
                                      ? 'Karyawan (Viewer)'
                                      : 'User (Staff)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Menunggu</span>
                          </span>
                        ) : emp.status === 'Aktif' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Aktif
                          </span>
                        ) : emp.status === 'Ditolak' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Ditolak
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            {emp.status}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-3 text-right whitespace-nowrap sticky right-0 transition-colors border-l z-10 ${
                          isPending
                            ? 'bg-[#fffbeb] group-hover:bg-[#fef3c7] dark:bg-[#2e2008]'
                            : 'bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800'
                        } ${
                          scrollState.canScrollRight
                            ? 'shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.10)] dark:shadow-[-10px_0_16px_-4px_rgba(0,0,0,0.5)] border-slate-200/90 dark:border-slate-800'
                            : 'border-slate-200/50 dark:border-slate-800/60 shadow-none'
                        }`}
                      >
                        {isPending ? (
                          canApproveUser ? (
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 shrink-0"
                                title="Setujui dan Beri Otorisasi Role"
                              >
                                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                <span>Setujui</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(emp)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 shrink-0"
                                title="Tolak Pengajuan Pendaftaran"
                              >
                                <XCircle className="w-4 h-4 shrink-0" />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Yakin ingin menghapus permanen data pengajuan ${emp.name}?`)) {
                                      deleteEmployee(emp.id || emp.nip);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer shrink-0"
                                  title="Hapus Permanen Data Pengajuan"
                                >
                                  <Trash2 className="w-4 h-4 shrink-0" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic">
                              Perlu Admin/MR
                            </span>
                          )
                        ) : (emp.has_pending_reset || emp.hasPendingReset) ? (
                          canApproveUser ? (
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleApproveResetPassword(emp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition shadow-xs cursor-pointer shrink-0"
                                title="Setujui dan Aktifkan Kata Sandi Baru"
                              >
                                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                                <span>Setujui Sandi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectResetPassword(emp)}
                                className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer shrink-0"
                                title="Tolak / Batalkan Permintaan Reset Sandi"
                              >
                                <XCircle className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold italic">
                              Reset Menunggu MR
                            </span>
                          )
                        ) : isAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(emp)}
                              className="p-1.5 text-slate-700 hover:text-blue-800 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                              title="Edit Data Pegawai"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus data ${emp.name}?`)) {
                                  deleteEmployee(emp.id || emp.nip);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                              title="Hapus Data Pegawai"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Read-Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Approval Modal (Otorisasi Role oleh Admin / MR) */}
      {approvalModalEmployee && (
        <Modal
          isOpen={Boolean(approvalModalEmployee)}
          onClose={() => setApprovalModalEmployee(null)}
          title="Verifikasi & Otorisasi Akun Pegawai (ISO 9001:2015)"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            {/* Applicant Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {approvalModalEmployee.name}
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  NIP: {approvalModalEmployee.nip}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Perusahaan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {approvalModalEmployee.companyName || approvalModalEmployee.companyCode || 'PT Dentelle Jaya Infinitex'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-semibold">Email:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">
                    {approvalModalEmployee.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Department & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Departemen *
                </label>
                <select
                  value={approvalDepartment}
                  onChange={(e) => setApprovalDepartment(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs"
                >
                  {safeDepartments.map(d => (
                    <option key={d?.id || d?.code} value={d?.code}>
                      {d?.code} - {d?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan *
                </label>
                <input
                  type="text"
                  required
                  value={approvalPosition}
                  onChange={(e) => setApprovalPosition(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs"
                  placeholder="Contoh: HRGA Staff"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tetapkan Role Akses Sistem *
              </label>
              <select
                value={approvalRole}
                onChange={(e) => setApprovalRole(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs font-bold text-blue-700 dark:text-blue-300"
              >
                <option value="viewer">Karyawan (Viewer - Hanya Membaca Dokumen Aktif)</option>
                <option value="staff">User (Staff Pemohon - Inisiator Dokumen)</option>
                <option value="reviewer">Reviewer (Atasan / Kepala Departemen)</option>
                <option value="doc_control">Document Control (DCO - Penomoran & Format)</option>
                <option value="approver">Approver (Management Representative / MR)</option>
                <option value="admin">System Administrator (Otoritas Sistem & Pengaturan)</option>
              </select>
            </div>

            {/* Role Helper Info */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-[11px] text-blue-900 dark:text-blue-200">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Otoritas Role yang Dipilih ({approvalRole.toUpperCase()}):</span>
              </div>
              {approvalRole === 'viewer' && 'Hanya memiliki wewenang membaca dokumen aktif (Controlled Copy). Tidak dapat meregistrasi atau menyetujui dokumen.'}
              {approvalRole === 'staff' && 'Dapat meregistrasi draft dokumen baru dan mengajukan usulan revisi untuk departemen terkait.'}
              {approvalRole === 'reviewer' && 'Berwenang memeriksa dan memberikan persetujuan teknis (Review Tahap 1) untuk dokumen departemen.'}
              {approvalRole === 'doc_control' && 'Memeriksa format, penomoran, kelengkapan naskah, dan otorisasi distribusi (Verifikasi Tahap 2).'}
              {approvalRole === 'approver' && 'Memiliki wewenang tertinggi pengesahan dokumen terkendali (Approval Tahap 3) dan persetujuan user.'}
              {approvalRole === 'admin' && 'Akses penuh administrasi master data, audit trail, serta konfigurasi sistem.'}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setApprovalModalEmployee(null)}
                disabled={approvalSubmitting}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approvalSubmitting}
                className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <UserCheck className="w-4 h-4" />
                <span>{approvalSubmitting ? 'Memproses...' : 'Setujui & Aktifkan Akun'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalEmployee && (
        <Modal
          isOpen={Boolean(rejectModalEmployee)}
          onClose={() => setRejectModalEmployee(null)}
          title="Tolak Pengajuan Pendaftaran Akun"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-900 dark:text-rose-200">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Penolakan Pendaftaran</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Anda akan menolak pengajuan akun atas nama <strong className="font-bold">{rejectModalEmployee.name}</strong> (NIP: {rejectModalEmployee.nip}). Akun ini tidak akan dapat masuk ke dalam sistem.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Penolakan *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                placeholder="Contoh: Bukan personil resmi perusahaan atau identitas tidak terverifikasi..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRejectModalEmployee(null)}
                disabled={rejectSubmitting}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectSubmitting}
                className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                <span>{rejectSubmitting ? 'Memproses...' : 'Tolak Pendaftaran'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingEmployee ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP (Nomor Induk Pegawai) *
                </label>
                <input
                  type="text"
                  required
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono text-xs"
                  placeholder="Contoh: DJI012548"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Perusahaan *
                </label>
                <select
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  disabled={currentUser?.companyCode && currentUser.companyCode !== 'ALL'}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {(companies || []).map((c) => (
                    <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                  {(!currentUser?.companyCode || currentUser.companyCode === 'ALL') && (
                    <option value="ALL">ALL - Holding</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Departemen *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-medium text-xs"
                >
                  {safeDepartments.map(d => (
                    <option key={d?.id || d?.code} value={d?.code}>{d?.code} - {d?.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Contoh: Baban Rachmat"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan *
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="Contoh: HRGA Staff"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border rounded-lg dark:bg-slate-800 font-mono"
                placeholder="contoh@gmail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Akses & Wewenang
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="viewer">Karyawan (Viewer - Hanya Baca Dokumen Aktif)</option>
                  <option value="staff">User (Staff Pemohon - Inisiator Dokumen)</option>
                  <option value="reviewer">Reviewer (Atasan / Kepala Departemen)</option>
                  <option value="doc_control">Document Control (DCO - Pengendali Format & Nomor)</option>
                  <option value="approver">Approver (Management Representative / MR)</option>
                  <option value="admin">System Administrator (Otoritas Sistem & Pengaturan)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Karyawan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2.5 border rounded-lg dark:bg-slate-800 text-xs"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                  <option value="Nonaktif">Nonaktif</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>

            {/* Role Explanation Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Matriks Wewenang Role ({role}):
              </div>
              {role === 'viewer' && 'Hanya memiliki hak akses membaca dan mengunduh dokumen terkendali berstatus AKTIF (Controlled Copy). Tidak dapat membuat draft, revisi, atau mengakses master data.'}
              {role === 'staff' && 'Hanya dapat membuat registrasi baru, menyimpan draf, dan mengajukan revisi untuk departemennya.'}
              {role === 'reviewer' && 'Berwenang memeriksa dan memberikan tinjauan teknis (Review Tahap 1) untuk dokumen departemen terkait.'}
              {role === 'doc_control' && 'Dapat mendaftarkan dokumen dari semua departemen, mengelola penomoran, distribusi salinan resmi, dan akses report.'}
              {role === 'approver' && 'Memiliki wewenang memeriksa, menyetujui (Approve), atau menolak (Reject) berkas pada Menunggu Verifikasi serta otorisasi pendaftaran akun baru.'}
              {role === 'admin' && 'Akses penuh ke semua modul sistem, kelola master data, otorisasi pendaftaran akun baru, pengaturan, serta hak khusus menghapus berkas.'}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
