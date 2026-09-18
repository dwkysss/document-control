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
  Archive,
  Layers,
  Users,
  Building,
  BookmarkCheck,
  GitBranch,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';

export default function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  const {
    activeMenu,
    setActiveMenu,
    setBreadcrumbs,
    documents,
    systemSettings,
    isAdmin
  } = useDocumentControl();

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
  const draftCount = safeDocs.filter(d => d?.status === 'DRAFT').length;
  const pendingCount = safeDocs.filter(d => d?.status === 'REVIEW' || d?.status === 'VERIFIKASI' || d?.status === 'APPROVAL').length;
  const activeCount = safeDocs.filter(d => d?.status === 'AKTIF').length;
  const obsoleteCount = safeDocs.filter(d => d?.status === 'OBSOLETE').length;
  const rejectedCount = safeDocs.filter(d => d?.status === 'DITOLAK').length;

  const handleNavClick = (menuKey, crumbs) => {
    setActiveMenu(menuKey);
    setBreadcrumbs(crumbs);
    if (onCloseMobile) onCloseMobile();
  };

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
        className={`fixed lg:sticky top-0 left-0 h-screen bg-[#0a1628] text-slate-300 border-r border-[#1b2d49] z-40 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#172740] flex items-center gap-3 bg-[#07101e]">
          <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0 overflow-hidden ring-1 ring-white/20">
            <img src="/dji-logo.png" alt="PT DJI Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="font-extrabold text-sm tracking-wider text-white truncate font-sans">
                {systemSettings.companyName || 'PT DENTELLE JAYA INFINITEX'}
              </h2>
              <p className="text-[10px] text-sky-400 font-semibold tracking-widest uppercase truncate mt-0.5">
                {systemSettings.systemName || 'DOCUMENT CONTROL SYSTEM'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          {/* 1. Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard', ['Dashboard', 'Overview'])}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition group ${
              activeMenu === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-[#13233c] hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          {/* 2. Document Registration Accordion */}
          <div>
            <button
              onClick={() => toggleSection('registration')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-[#13233c] transition"
            >
              <div className="flex items-center gap-3">
                <FilePlus2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {!isCollapsed && <span>Document Registration</span>}
              </div>
              {!isCollapsed && (
                openSections.registration ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {(!isCollapsed && openSections.registration) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                <button
                  onClick={() => handleNavClick('reg-new', ['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'reg-new'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Registrasi Baru</span>
                </button>
                <button
                  onClick={() => handleNavClick('reg-draft', ['Dashboard', 'Registrasi Dokumen', 'Draft'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'reg-draft'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Draft</span>
                  {draftCount > 0 && (
                    <span className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.2 rounded-full font-bold">
                      {draftCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('reg-pending', ['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'reg-pending'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Menunggu Verifikasi</span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('reg-approved', ['Dashboard', 'Registrasi Dokumen', 'Disetujui'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'reg-approved'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Disetujui</span>
                </button>
                <button
                  onClick={() => handleNavClick('reg-rejected', ['Dashboard', 'Registrasi Dokumen', 'Ditolak'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'reg-rejected'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Ditolak</span>
                  {rejectedCount > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full font-bold">
                      {rejectedCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 3. Document Control Accordion */}
          <div>
            <button
              onClick={() => toggleSection('control')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-[#13233c] transition"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {!isCollapsed && <span>Document Control</span>}
              </div>
              {!isCollapsed && (
                openSections.control ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {(!isCollapsed && openSections.control) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                <button
                  onClick={() => handleNavClick('ctrl-all', ['Dashboard', 'Document Control', 'Semua Dokumen'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'ctrl-all'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Semua Dokumen</span>
                  <span className="text-[10px] text-slate-500">{documents.length}</span>
                </button>
                <button
                  onClick={() => handleNavClick('ctrl-active', ['Dashboard', 'Document Control', 'Dokumen Aktif'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'ctrl-active'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Dokumen Aktif</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">
                    {activeCount}
                  </span>
                </button>
                <button
                  onClick={() => handleNavClick('ctrl-obsolete', ['Dashboard', 'Document Control', 'Dokumen Obsolete'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'ctrl-obsolete'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Dokumen Obsolete</span>
                  {obsoleteCount > 0 && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full font-bold">
                      {obsoleteCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('ctrl-history', ['Dashboard', 'Document Control', 'Riwayat Revisi'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'ctrl-history'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Riwayat Revisi</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Document Revision Accordion */}
          <div>
            <button
              onClick={() => toggleSection('revision')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-[#13233c] transition"
            >
              <div className="flex items-center gap-3">
                <FileEdit className="w-4 h-4 text-purple-400 flex-shrink-0" />
                {!isCollapsed && <span>Document Revision</span>}
              </div>
              {!isCollapsed && (
                openSections.revision ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {(!isCollapsed && openSections.revision) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                <button
                  onClick={() => handleNavClick('rev-new', ['Dashboard', 'Document Revision', 'Pengajuan Revisi'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'rev-new'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Pengajuan Revisi</span>
                </button>
              </div>
            )}
          </div>

          {/* 5. Master Data Accordion */}
          <div>
            <button
              onClick={() => toggleSection('master')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-[#13233c] transition"
            >
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex items-center gap-1.5">
                    <span>Master Data</span>
                    <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Admin
                    </span>
                  </span>
                )}
              </div>
              {!isCollapsed && (
                openSections.master ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {(!isCollapsed && openSections.master) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                <button
                  onClick={() => handleNavClick('master-emp', ['Dashboard', 'Master Data', 'Karyawan'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'master-emp'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Karyawan</span>
                </button>
                <button
                  onClick={() => handleNavClick('master-dept', ['Dashboard', 'Master Data', 'Departemen'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'master-dept'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Departemen</span>
                </button>
                <button
                  onClick={() => handleNavClick('master-type', ['Dashboard', 'Master Data', 'Jenis Dokumen'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'master-type'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Jenis Dokumen</span>
                </button>
                <button
                  onClick={() => handleNavClick('master-team', ['Dashboard', 'Master Data', 'Team Verifikator'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'master-team'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Team Verifikator</span>
                </button>
                <button
                  onClick={() => handleNavClick('master-role', ['Dashboard', 'Master Data', 'Role & Hak Akses'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'master-role'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Role & Hak Akses</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300">
                    5
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 6. Report Accordion */}
          <div>
            <button
              onClick={() => toggleSection('report')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-[#13233c] transition"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                {!isCollapsed && <span>Report</span>}
              </div>
              {!isCollapsed && (
                openSections.report ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {(!isCollapsed && openSections.report) && (
              <div className="mt-1 pl-7 pr-1 space-y-1">
                <button
                  onClick={() => handleNavClick('rep-register', ['Dashboard', 'Report', 'Register Dokumen'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'rep-register'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Register Dokumen</span>
                </button>
                <button
                  onClick={() => handleNavClick('rep-dept', ['Dashboard', 'Report', 'Dokumen per Departemen'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'rep-dept'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Dokumen per Departemen</span>
                </button>
                <button
                  onClick={() => handleNavClick('rep-type', ['Dashboard', 'Report', 'Dokumen per Jenis'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'rep-type'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>Dokumen per Jenis</span>
                </button>
                <button
                  onClick={() => handleNavClick('rep-history', ['Dashboard', 'Report', 'History Revision'])}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition flex items-center justify-between ${
                    activeMenu === 'rep-history'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-[#13233c]'
                  }`}
                >
                  <span>History Revision</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. Setting */}
          <button
            onClick={() => handleNavClick('settings', ['Dashboard', 'Pengaturan', 'Sistem & Database'])}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition group ${
              activeMenu === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-[#13233c] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Setting</span>
                <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Admin
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-[#172740] bg-[#07101e] text-center text-[10px] text-slate-500">
            <div>© 2026 PT DJI</div>
            <div className="text-[9px] text-slate-600">Document Control System v2.4</div>
          </div>
        )}
      </aside>
    </>
  );
}
