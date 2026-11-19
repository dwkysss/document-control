import React, { useState } from 'react';
import {
  Home,
  FilePlus2,
  FileText,
  FileEdit,
  Database,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Archive,
  Layers,
  Users,
  Building,
  BookmarkCheck,
  GitBranch,
  FileSpreadsheet,
  PieChart,
  Sun,
  Moon
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  const {
    activeMenu,
    setActiveMenu,
    setBreadcrumbs,
    documents,
    systemSettings,
    currentUser,
    isHoldingAdmin,
    companies,
    selectedCompanyFilter,
    role,
    isViewer,
    isStaff,
    isAdmin,
    canRegisterDocument,
    canManageDrafts,
    canViewPendingVerification,
    canRequestRevision,
    canViewObsolete,
    canViewAllDocuments,
    canAccessReports,
    canManageMasterData,
    canManageSettings,
    canUserViewPendingDoc,
    canUserViewDraftDoc,
    canUserViewRejectedDoc,
    canApproveUser,
    pendingEmployeesCount,
    totalPendingUserActionsCount
  } = useDocumentControl();

  // Active Company Scope Resolution (Seamless synchronization with header & active session)
  const activeCompanyCode = (currentUser?.companyCode && currentUser.companyCode !== 'ALL')
    ? currentUser.companyCode
    : (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : 'ALL');

  const activeCompanyObj = (companies || []).find(c => c.code === activeCompanyCode);

  const displayCompanyName = activeCompanyCode === 'ALL'
    ? 'DOCUMENT CONTROL CENTER'
    : (activeCompanyObj?.name || (activeCompanyCode === 'UMI' ? 'PT ULTIMO MODA INDOTEX' : activeCompanyCode === 'IMK' ? 'PT IMK' : (systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX')));

  const displaySubtitle = activeCompanyCode === 'ALL'
    ? ''
    : `UNIT ${activeCompanyCode} - SISTEM TERKENDALI`;

  // Accordion open/close state
  const [openSections, setOpenSections] = useState({
    registration: true,
    control: true,
    revision: true,
    master: false,
    report: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Auto-expand accordion section when activeMenu changes
  React.useEffect(() => {
    const menu = String(activeMenu || '');
    if (menu.startsWith('reg-')) {
      setOpenSections(prev => ({ ...prev, registration: true }));
    } else if (menu.startsWith('ctrl-')) {
      setOpenSections(prev => ({ ...prev, control: true }));
    } else if (menu.startsWith('rev-')) {
      setOpenSections(prev => ({ ...prev, revision: true }));
    } else if (menu.startsWith('master-')) {
      setOpenSections(prev => ({ ...prev, master: true }));
    } else if (menu.startsWith('rep-')) {
      setOpenSections(prev => ({ ...prev, report: true }));
    }
  }, [activeMenu]);

  // Badge counts
  const safeDocs = Array.isArray(documents) ? documents : [];
  const draftCount = safeDocs
    .filter(d => d?.status === 'DRAFT' || d?.status === 'PERLU REVISI' || d?.status === 'REVISI')
    .filter(d => (canUserViewDraftDoc ? canUserViewDraftDoc(d) : true))
    .length;
  const pendingCount = safeDocs
    .filter(d => d?.status === 'REVIEW' || d?.status === 'VERIFIKASI' || d?.status === 'APPROVAL')
    .filter(d => (canUserViewPendingDoc ? canUserViewPendingDoc(d) : true))
    .length;
  const activeCount = safeDocs.filter(d => d?.status === 'AKTIF').length;
  const obsoleteCount = safeDocs.filter(d => d?.status === 'OBSOLETE').length;
  const rejectedCount = safeDocs
    .filter(d => d?.status === 'DITOLAK')
    .filter(d => (canUserViewRejectedDoc ? canUserViewRejectedDoc(d) : true))
    .length;

  const handleNavClick = (menuKey, crumbs) => {
    setActiveMenu(menuKey);
    setBreadcrumbs(crumbs);
    if (onCloseMobile) onCloseMobile();
  };

  // Sidebar Theme Mode: 'dark' (default/current) or 'light' (white)
  const [sidebarTheme, setSidebarTheme] = useState(() => {
    try {
      return localStorage.getItem('sidebar_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const toggleSidebarTheme = () => {
    const nextTheme = sidebarTheme === 'dark' ? 'light' : 'dark';
    setSidebarTheme(nextTheme);
    try {
      localStorage.setItem('sidebar_theme', nextTheme);
    } catch (e) {}
  };

  const isLight = sidebarTheme === 'light';

  // Theme helper classes (Ensures original dark theme is 100% preserved while providing crisp white theme)
  const theme = {
    isLight,
    aside: isLight
      ? 'bg-white text-slate-700 border-slate-200 shadow-xl shadow-slate-200/50'
      : 'bg-[#0a1628] text-slate-300 border-[#1b2d49] shadow-2xl shadow-slate-950/25',
    header: isLight
      ? 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200'
      : 'bg-gradient-to-r from-[#07101e] via-[#091527] to-[#07101e] border-[#172740]/80',
    title: isLight ? 'text-slate-900' : 'text-white',
    subTitle: isLight ? 'text-slate-500' : 'text-slate-400',
    closeBtn: isLight
      ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
      : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
    scrollbar: isLight ? '[scrollbar-color:#cbd5e1_transparent]' : '[scrollbar-color:#1e293b_transparent]',
    navSectionBtn: isLight
      ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900'
      : 'text-slate-200 hover:bg-[#13233c] hover:text-white',
    chevron: isLight ? 'text-slate-400' : 'text-slate-400',
    navItemActive: isLight
      ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-600'
      : 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500',
    navItemInactive: isLight
      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
      : 'text-slate-400 hover:text-white hover:bg-[#13233c]',
    mainNavInactive: isLight
      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      : 'text-slate-300 hover:bg-[#13233c] hover:text-white',
    footer: isLight
      ? 'border-slate-200 bg-slate-50/90'
      : 'border-[#172740] bg-[#07101e]',
    badgeDraft: isLight
      ? 'bg-slate-100 text-slate-700 border border-slate-200'
      : 'bg-slate-700 text-slate-200',
    badgePending: isLight
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    badgeActive: isLight
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    badgeObsolete: isLight
      ? 'bg-rose-50 text-rose-700 border border-rose-200'
      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    badgeRejected: isLight
      ? 'bg-rose-50 text-rose-700 border border-rose-200'
      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    badgeRole: isLight
      ? 'bg-purple-50 text-purple-700 border border-purple-200'
      : 'bg-purple-500/20 text-purple-300',
    badgeMultiPT: isLight
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  };

  const getSubItemClass = (isActive) =>
    `w-full text-left px-3 py-2 rounded-md text-xs transition flex items-center justify-between ${
      isActive ? theme.navItemActive : theme.navItemInactive
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] border-r z-40 transition-all duration-300 flex flex-col rounded-r-[24px] lg:rounded-r-[28px] overflow-hidden ${
          theme.aside
        } ${
          isCollapsed ? 'w-20' : 'w-72 max-w-[85vw]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header (Dynamic per Active Unit / Holding) */}
        {(() => {
          const renderCompanyIcon = () => {
            // Central Holding View (ALL units): use the custom 3D document-shield app logo
            if (activeCompanyCode === 'ALL') {
              return (
                <div className="w-10 h-10 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
                  <img
                    src="/app-logo.png"
                    alt="Document Control Logo"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              );
            }

            const compLogo = activeCompanyObj?.logoUrl || activeCompanyObj?.logo_url || (activeCompanyCode === 'DJI' ? '/dji-logo.png' : null);
            if (compLogo) {
              return (
                <div className={`w-10 h-10 rounded-xl ${isLight ? 'bg-slate-100 border-slate-200 shadow-sm' : 'bg-white border-slate-700/60 shadow-md shadow-slate-950/40'} p-1 flex items-center justify-center shrink-0 overflow-hidden border transition-transform hover:scale-105`}>
                  <img src={compLogo} alt={`${activeCompanyCode} Logo`} className="w-full h-full object-contain" />
                </div>
              );
            }

            // Fallback for company without uploaded logo: high-contrast company monogram badge
            const badgeBg = activeCompanyCode === 'UMI' ? 'bg-indigo-600' : activeCompanyCode === 'IMK' ? 'bg-emerald-600' : 'bg-blue-600';
            return (
              <div className={`w-10 h-10 rounded-xl ${badgeBg} flex items-center justify-center font-black text-xs text-white shadow-md shadow-slate-950/40 shrink-0 border border-white/20 transition-transform hover:scale-105`}>
                {activeCompanyCode}
              </div>
            );
          };

          // Small text underneath title: shows active company name when activeCompanyCode !== 'ALL'
          const companySubLabel = activeCompanyCode !== 'ALL'
            ? (activeCompanyObj?.name || (activeCompanyCode === 'DJI' ? 'PT DENTELLE JAYA INFINITEX' : activeCompanyCode === 'UMI' ? 'PT ULTIMO MODA INDOTEX' : activeCompanyCode === 'IMK' ? 'PT IMK' : `UNIT ${activeCompanyCode}`))
            : (isHoldingAdmin ? 'HOLDING GROUP (MULTI-PT)' : null);

          return (
            <div className={`h-16 px-4 border-b flex items-center min-w-0 shrink-0 transition-colors ${
              theme.header
            } ${
              isCollapsed ? 'justify-center px-0' : 'justify-between gap-2'
            }`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {renderCompanyIcon()}
                {!isCollapsed && (
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-[14px] tracking-tight font-sans leading-tight ${theme.title}`}>
                        Document Control
                      </span>
                    </div>
                    {companySubLabel && (
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#34d399]" title="Sistem Aktif & Terkendali" />
                        <p className={`text-[10px] font-medium tracking-wide uppercase truncate ${theme.subTitle}`} title={companySubLabel}>
                          {companySubLabel}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Mobile Close Button (Touch target 44px) */}
              {isMobileOpen && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className={`lg:hidden p-2 rounded-xl transition min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer ${theme.closeBtn}`}
                  aria-label="Tutup menu navigasi"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })()}

        {/* Navigation Menu List */}
        <div className={`flex-1 overflow-y-auto px-3 py-4 space-y-1.5 [scrollbar-width:thin] ${theme.scrollbar}`}>
          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard', ['Dashboard', 'Overview'])}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition group ${
              activeMenu === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : theme.mainNavInactive
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* 2. Document Registration Accordion (Hidden for Viewer) */}
          {canRegisterDocument && (
            <div>
              <button
                onClick={() => toggleSection('registration')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme.navSectionBtn}`}
              >
                <div className="flex items-center gap-3">
                  <FilePlus2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {!isCollapsed && <span>Document Registration</span>}
                </div>
                {!isCollapsed && (
                  openSections.registration ? <ChevronUp className={`w-3.5 h-3.5 ${theme.chevron}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${theme.chevron}`} />
                )}
              </button>

              {(!isCollapsed && openSections.registration) && (
                <div className="mt-1 pl-7 pr-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
                    className={getSubItemClass(activeMenu === 'reg-new')}
                  >
                    <span>Registrasi Baru</span>
                  </button>
                  {canManageDrafts && (
                    <button
                      onClick={() => handleNavClick('reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft'])}
                      className={getSubItemClass(activeMenu === 'reg-draft')}
                    >
                      <span>Draft</span>
                      {draftCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgeDraft}`}>
                          {draftCount}
                        </span>
                      )}
                    </button>
                  )}
                  {canViewPendingVerification && (
                    <button
                      onClick={() => handleNavClick('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
                      className={getSubItemClass(activeMenu === 'reg-pending')}
                    >
                      <span>Menunggu Verifikasi</span>
                      {pendingCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgePending}`}>
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick('reg-approved', ['Dashboard', 'Registrasi Dokumen', 'Disetujui'])}
                    className={getSubItemClass(activeMenu === 'reg-approved')}
                  >
                    <span>Disetujui</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'])}
                    className={getSubItemClass(activeMenu === 'reg-rejected')}
                  >
                    <span>Ditolak</span>
                    {rejectedCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgeRejected}`}>
                        {rejectedCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Document Control Accordion */}
          <div>
            <button
              onClick={() => toggleSection('control')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme.navSectionBtn}`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {!isCollapsed && <span>Document Control</span>}
              </div>
              {!isCollapsed && (
                openSections.control ? <ChevronUp className={`w-3.5 h-3.5 ${theme.chevron}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${theme.chevron}`} />
              )}
            </button>

            {(!isCollapsed && openSections.control) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                {canViewAllDocuments && (
                  <button
                    onClick={() => handleNavClick('ctrl-all', ['Dashboard', 'Document Control', 'Semua Dokumen'])}
                    className={getSubItemClass(activeMenu === 'ctrl-all')}
                  >
                    <span>Semua Dokumen</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400 font-semibold' : 'text-slate-500'}`}>{documents.length}</span>
                  </button>
                )}
                <button
                  onClick={() => handleNavClick('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
                  className={getSubItemClass(activeMenu === 'ctrl-active')}
                >
                  <span>Dokumen Aktif</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgeActive}`}>
                    {activeCount}
                  </span>
                </button>
                {canViewObsolete && (
                  <button
                    onClick={() => handleNavClick('ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete'])}
                    className={getSubItemClass(activeMenu === 'ctrl-obsolete')}
                  >
                    <span>Dokumen Obsolete</span>
                    {obsoleteCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgeObsolete}`}>
                        {obsoleteCount}
                      </span>
                    )}
                  </button>
                )}
                {!isViewer && (
                  <button
                    onClick={() => handleNavClick('ctrl-history', ['Dashboard', 'Document Control', 'Riwayat Revisi'])}
                    className={getSubItemClass(activeMenu === 'ctrl-history')}
                  >
                    <span>Riwayat Revisi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Document Revision Accordion (Hidden for Viewer) */}
          {canRequestRevision && (
            <div>
              <button
                onClick={() => toggleSection('revision')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme.navSectionBtn}`}
              >
                <div className="flex items-center gap-3">
                  <FileEdit className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  {!isCollapsed && <span>Document Revision</span>}
                </div>
                {!isCollapsed && (
                  openSections.revision ? <ChevronUp className={`w-3.5 h-3.5 ${theme.chevron}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${theme.chevron}`} />
                )}
              </button>

              {(!isCollapsed && openSections.revision) && (
                <div className="mt-1 pl-7 pr-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
                    className={getSubItemClass(activeMenu === 'rev-new')}
                  >
                    <span>Pengajuan Revisi</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Master Data Accordion (Admin & Approver Only) */}
          {canManageMasterData && (
            <div>
              <button
                onClick={() => toggleSection('master')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme.navSectionBtn}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Database className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {canApproveUser && (totalPendingUserActionsCount || pendingEmployeesCount) > 0 && isCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="flex items-center gap-1.5">
                      <span>Master Data</span>
                      {canApproveUser && (totalPendingUserActionsCount || pendingEmployeesCount) > 0 ? (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${theme.badgePending}`}>
                          {totalPendingUserActionsCount || pendingEmployeesCount} Menunggu
                        </span>
                      ) : (
                        <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${isLight ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                          Admin
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  openSections.master ? <ChevronUp className={`w-3.5 h-3.5 ${theme.chevron}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${theme.chevron}`} />
                )}
              </button>

              {(!isCollapsed && openSections.master) && (
                <div className="mt-1 pl-7 pr-1 space-y-1">
                  {isHoldingAdmin && (
                    <button
                      onClick={() => handleNavClick('master-company', ['Dashboard', 'Master Data', 'Perusahaan'])}
                      className={getSubItemClass(activeMenu === 'master-company')}
                    >
                      <span>Perusahaan (Multi-PT)</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick('master-emp', ['Dashboard', 'Master Data', 'Karyawan'])}
                    className={getSubItemClass(activeMenu === 'master-emp')}
                  >
                    <span>Karyawan</span>
                    {canApproveUser && (totalPendingUserActionsCount || pendingEmployeesCount) > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${theme.badgePending}`}>
                        {totalPendingUserActionsCount || pendingEmployeesCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick('master-dept', ['Dashboard', 'Master Data', 'Departemen'])}
                    className={getSubItemClass(activeMenu === 'master-dept')}
                  >
                    <span>Departemen</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('master-type', ['Dashboard', 'Master Data', 'Jenis Dokumen'])}
                    className={getSubItemClass(activeMenu === 'master-type')}
                  >
                    <span>Jenis Dokumen</span>
                  </button>
                  {isHoldingAdmin && (
                    <button
                      onClick={() => handleNavClick('master-role', ['Dashboard', 'Master Data', 'Role & Hak Akses'])}
                      className={getSubItemClass(activeMenu === 'master-role')}
                    >
                      <span>Role & Hak Akses</span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${theme.badgeRole}`}>
                        6
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. Report Accordion (Reviewer, DCO, Approver, Admin) */}
          {canAccessReports && (
            <div>
              <button
                onClick={() => toggleSection('report')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${theme.navSectionBtn}`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                  {!isCollapsed && <span>Report</span>}
                </div>
                {!isCollapsed && (
                  openSections.report ? <ChevronUp className={`w-3.5 h-3.5 ${theme.chevron}`} /> : <ChevronDown className={`w-3.5 h-3.5 ${theme.chevron}`} />
                )}
              </button>

              {(!isCollapsed && openSections.report) && (
                <div className="mt-1 pl-7 pr-1 space-y-1">
                  <button
                    onClick={() => handleNavClick('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
                    className={getSubItemClass(activeMenu === 'rep-register')}
                  >
                    <span>Register Dokumen</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('rep-dept', ['Dashboard', 'Report', 'Dokumen per Departemen'])}
                    className={getSubItemClass(activeMenu === 'rep-dept')}
                  >
                    <span>Dokumen per Departemen</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('rep-type', ['Dashboard', 'Report', 'Dokumen per Jenis'])}
                    className={getSubItemClass(activeMenu === 'rep-type')}
                  >
                    <span>Dokumen per Jenis</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('rep-history', ['Dashboard', 'Laporan & Audit', 'Audit Trail (Log Sistem)'])}
                    className={getSubItemClass(activeMenu === 'rep-history')}
                  >
                    <span>Audit Trail (Log Sistem)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. Setting (Holding Admin Only) */}
          {(isHoldingAdmin && canManageSettings) && (
            <button
              onClick={() => handleNavClick('settings', ['Dashboard', 'Pengaturan', 'Sistem & Database'])}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition group cursor-pointer ${
                activeMenu === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : theme.mainNavInactive
              }`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>Setting</span>
                  <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${theme.badgeMultiPT}`}>
                    Multi-PT
                  </span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Footer Area with Sidebar Theme Toggle */}
        <div className={`border-t transition-colors ${theme.footer}`}>
          {!isCollapsed ? (
            <div className="p-3 space-y-2">
              {/* Toggle Switch Row */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${isLight ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-blue-400 shadow-[0_0_6px_#60a5fa]'}`} />
                  <span className={`text-[11px] font-semibold truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Sidebar {isLight ? 'Putih' : 'Gelap'}
                  </span>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSidebarTheme}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isLight ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                  title={isLight ? 'Beralih ke Sidebar Gelap (Hitam)' : 'Beralih ke Sidebar Putih'}
                  aria-label="Ganti mode warna sidebar"
                >
                  <span
                    className={`pointer-events-none flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out text-[9px] ${
                      isLight ? 'translate-x-5 text-amber-500' : 'translate-x-0 text-slate-700'
                    }`}
                  >
                    {isLight ? (
                      <Sun className="w-2.5 h-2.5" />
                    ) : (
                      <Moon className="w-2.5 h-2.5" />
                    )}
                  </span>
                </button>
              </div>

              {/* Copyright & Info */}
              <div className={`text-center text-[10px] pt-1.5 border-t ${isLight ? 'border-slate-200 text-slate-500' : 'border-[#172740] text-slate-500'}`}>
                <div className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                  © 2026 {activeCompanyCode === 'ALL' ? 'Document Control Center' : (activeCompanyObj?.name || `PT ${activeCompanyCode}`)}
                </div>
                <div className={`text-[9px] ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                  Document Control System v2.4
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed View: Compact Icon Toggle Button */
            <div className="p-2 flex justify-center">
              <button
                type="button"
                onClick={toggleSidebarTheme}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 text-amber-600 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={isLight ? 'Mode Putih (Klik untuk Gelap)' : 'Mode Gelap (Klik untuk Putih)'}
                aria-label="Toggle warna sidebar"
              >
                {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
