import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Bell, Search, UserCheck, ChevronDown, Check, Shield, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Eye, LogOut, Building2, Lock } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import { initialEmployees } from '../../data/initialData';
import Badge from '../common/Badge';

export default function Header({ onToggleSidebar, isSidebarCollapsed }) {
  const {
    currentUser,
    setCurrentUser,
    logout,
    role,
    isAdmin,
    isApprover,
    isDocControl,
    employees,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    breadcrumbs,
    setBreadcrumbs,
    activeMenu,
    setActiveMenu,
    setViewingDocument,
    companies,
    selectedCompanyFilter,
    setSelectedCompanyFilter,
    isCompanyLocked,
    userCompanyCode,
    allEmployees,
    documents,
    searchQuery,
    setSearchQuery,
    showToast
  } = useDocumentControl();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [demoCompanyTab, setDemoCompanyTab] = useState('ALL');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // List personil demo: Memadukan initialEmployees secara deterministik agar akun IMK/UMI selalu ada dan tidak pernah kosong
  const demoEmployeesList = useMemo(() => {
    const sourceMap = new Map();
    // 1. Masukkan semua akun standar (DJI, IMK, UMI, ALL) dari initialData
    (initialEmployees || []).forEach(e => {
      const empNip = e.nip || e.nik;
      const canonicalComp = empNip?.startsWith('UMI')
        ? 'UMI'
        : empNip?.startsWith('IMK')
        ? 'IMK'
        : empNip === '123463'
        ? 'ALL'
        : (e.companyCode || 'DJI');
      sourceMap.set(String(empNip || '').trim(), { ...e, companyCode: canonicalComp });
    });

    // 2. Tumpuk dengan state allEmployees / employees jika ada personil tambahan
    (allEmployees || employees || []).forEach(e => {
      const nip = String(e?.nip || e?.nik || '').trim();
      if (nip) {
        const canonicalComp = nip.startsWith('UMI')
          ? 'UMI'
          : nip.startsWith('IMK')
          ? 'IMK'
          : nip === '123463'
          ? 'ALL'
          : (e.companyCode || 'DJI');
        const prev = sourceMap.get(nip) || {};
        sourceMap.set(nip, { ...prev, ...e, companyCode: canonicalComp });
      }
    });

    const list = Array.from(sourceMap.values());
    const filtered = demoCompanyTab === 'ALL'
      ? list
      : list.filter(e => (e.companyCode || '').toUpperCase() === demoCompanyTab.toUpperCase());

    // Urutan prioritas: Holding (ALL) -> IMK -> UMI -> DJI
    const priority = { ALL: 1, IMK: 2, UMI: 3, DJI: 4 };
    return [...filtered].sort((a, b) => {
      const pDiff = (priority[a.companyCode] || 99) - (priority[b.companyCode] || 99);
      if (pDiff !== 0) return pDiff;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allEmployees, employees, demoCompanyTab]);

  const unreadCount = (notifications || []).filter(n => !n?.read).length;

  // Filtered documents from search query
  const searchResults = (searchQuery || '').trim()
    ? (documents || []).filter(d => {
        if (!d) return false;
        const q = (searchQuery || '').toLowerCase();
        return (
          String(d.docNumber || '').toLowerCase().includes(q) ||
          String(d.title || '').toLowerCase().includes(q) ||
          String(d.department || '').toLowerCase().includes(q) ||
          String(d.creator || '').toLowerCase().includes(q)
        );
      })
    : [];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearching(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    if (notif.docId) {
      const doc = documents.find(d => d.id === notif.docId);
      if (doc) {
        setViewingDocument(doc);
      }
    }
    setShowNotifications(false);
  };

  const handleCrumbClick = (crumb, idx) => {
    const c = crumb.toLowerCase();
    if (c.includes('dashboard')) {
      setActiveMenu('dashboard');
      setBreadcrumbs(['Dashboard', 'Overview']);
    } else if (c.includes('registrasi')) {
      setActiveMenu('reg-new');
      setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Dokumen Baru']);
    } else if (c.includes('control') || c.includes('dokumen')) {
      setActiveMenu('ctrl-all');
      setBreadcrumbs(['Dashboard', 'Document Control', 'Semua Dokumen']);
    } else if (c.includes('master')) {
      setActiveMenu('master-emp');
      setBreadcrumbs(['Dashboard', 'Master Data', 'Karyawan']);
    } else if (c.includes('report') || c.includes('laporan')) {
      setActiveMenu('rep-register');
      setBreadcrumbs(['Dashboard', 'Report', 'Register Dokumen']);
    } else if (c.includes('pengaturan') || c.includes('setting')) {
      setActiveMenu('settings');
      setBreadcrumbs(['Dashboard', 'Pengaturan', 'Sistem & Database']);
    }
  };

  const getPageTitle = () => {
    if (breadcrumbs && breadcrumbs.length > 1) {
      return breadcrumbs[1].toUpperCase();
    }
    return 'DASHBOARD';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left Side: Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs flex-shrink-0"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block flex-shrink-0" />

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight font-sans truncate">
              {getPageTitle()}
            </h1>
            <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300 dark:text-slate-600">&gt;</span>}
                  <button
                    onClick={() => handleCrumbClick(crumb, idx)}
                    className={`transition truncate ${
                      idx === breadcrumbs.length - 1
                        ? 'text-blue-600 dark:text-blue-400 font-bold cursor-default'
                        : 'hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer'
                    }`}
                  >
                    {crumb}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Side: Global Search, Notification Center, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Multi-Company Scope Filter Pill (Hanya untuk Admin Holding) */}
          {!isCompanyLocked && (
            <div className="hidden lg:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedCompanyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  selectedCompanyFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Semua (3 PT)
              </button>
              {(companies || []).map((comp) => {
                const isActive = selectedCompanyFilter === comp.code;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setSelectedCompanyFilter(comp.code)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={comp.name}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        comp.code === 'DJI'
                          ? 'bg-blue-500'
                          : comp.code === 'UMI'
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {comp.code}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Search dropdown */}
          <div className="relative hidden md:block w-52 lg:w-64" ref={searchRef}>
            <input
              type="text"
              placeholder="Cari no. dokumen / judul..."
              value={searchQuery}
              onFocus={() => setIsSearching(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white placeholder-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live Search Quick Results Popup */}
            {isSearching && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                  Hasil Pencarian ({searchResults.length} dokumen ditemukan)
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ada dokumen yang cocok dengan kata kunci "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setViewingDocument(doc);
                          setIsSearching(false);
                        }}
                        className="p-3 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 cursor-pointer transition text-xs flex items-center justify-between gap-2"
                      >
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{doc.docNumber}</span>
                            <Badge status={doc.status} size="sm" />
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5" title={doc.title}>
                            {doc.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Dept: {doc.department} | Rev: {doc.revision} | Pembuat: {doc.creator}
                          </span>
                        </div>
                        <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800 transition"
              title="Notifikasi Sistem"
              aria-label="Notifikasi Sistem"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute 1.5 -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popup Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition flex gap-3 ${
                          !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                          {notif.type === 'danger' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                          {notif.type === 'info' && <FileText className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 self-center"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/60 dark:bg-slate-800/40">
                  <button
                    onClick={() => {
                      setActiveMenu('ctrl-all');
                      setShowNotifications(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Buka Master Register Dokumen &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 shadow-2xs"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs">
                {currentUser ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                  <span className="truncate max-w-[130px]">{currentUser ? currentUser.name : 'Tamu'}</span>
                  {currentUser && (
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                        : currentUser.role === 'approver'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : currentUser.role === 'reviewer'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : currentUser.role === 'doc_control'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                        : currentUser.role === 'viewer'
                        ? 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'approver' ? 'Approver (MR)' : currentUser.role === 'reviewer' ? 'Reviewer' : currentUser.role === 'doc_control' ? 'DCO' : currentUser.role === 'viewer' ? 'Viewer' : 'Staff'}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] leading-tight mt-0.5">
                  {currentUser ? currentUser.position : ''}
                </div>
              </div>
            </button>

            {/* Profile & Auth Menu */}
            {showUserMenu && currentUser && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {currentUser.position || 'Personil Terdaftar'}
                      </p>
                    </div>
                    <span className="uppercase text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>NIP: {currentUser.nip || currentUser.nik}</span>
                    <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                    <span>Dept: {currentUser.department}</span>
                  </div>
                </div>

                {/* Quick Account Switcher for Testing/Demo */}
                <div className="px-3 py-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 pb-1.5 flex items-center justify-between">
                    <span>Simulasi Akun Demo</span>
                    <span className="text-[10px] text-slate-400">Pilih Entitas</span>
                  </div>

                  {/* Filter Pills PT Demo */}
                  <div className="flex items-center gap-1 mb-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDemoCompanyTab('ALL')}
                      className={`flex-1 py-1 rounded transition text-center cursor-pointer ${
                        demoCompanyTab === 'ALL'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCompanyTab('IMK')}
                      className={`flex-1 py-1 rounded transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                        demoCompanyTab === 'IMK'
                          ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                          : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      IMK
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCompanyTab('UMI')}
                      className={`flex-1 py-1 rounded transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                        demoCompanyTab === 'UMI'
                          ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                          : 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      UMI
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoCompanyTab('DJI')}
                      className={`flex-1 py-1 rounded transition text-center flex items-center justify-center gap-1 cursor-pointer ${
                        demoCompanyTab === 'DJI'
                          ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                          : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      DJI
                    </button>
                  </div>

                  <div className="space-y-1 mt-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {demoEmployeesList.length === 0 ? (
                      <div className="py-3 text-center text-xs text-slate-400 font-medium">
                        Tidak ada personil untuk unit {demoCompanyTab}.
                      </div>
                    ) : (
                      demoEmployeesList.map(emp => {
                      const empId = emp.nip || emp.nik || '';
                      const empComp = (emp.companyCode || (empId.startsWith('UMI') ? 'UMI' : empId.startsWith('IMK') ? 'IMK' : (empId === '123463' ? 'ALL' : 'DJI'))).toUpperCase();
                      const badgeClass = empComp === 'UMI'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : empComp === 'IMK'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : empComp === 'ALL'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';

                      return (
                        <button
                          key={emp.id || emp.nip || emp.nik}
                          onClick={() => {
                            setCurrentUser(emp);
                            if (empComp && empComp !== 'ALL') {
                              setSelectedCompanyFilter(empComp);
                            }
                            try {
                              localStorage.setItem('dji_auth_user', JSON.stringify(emp));
                            } catch (e) {
                              // ignore
                            }
                            setShowUserMenu(false);
                            showToast(`Beralih ke ${emp.name} [${empComp}] (${emp.position})`, 'info');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                            currentUser.id === emp.id || (currentUser.nip || currentUser.nik) === (emp.nip || emp.nik)
                              ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-left truncate flex-1 pr-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${badgeClass}`}>
                                {empComp}
                              </span>
                              <span className="truncate">{emp.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                              NIP: {emp.nip || emp.nik} • {emp.position}
                            </div>
                          </div>
                          {(currentUser.id === emp.id || (currentUser.nip || currentUser.nik) === (emp.nip || emp.nik)) && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 px-3 pt-2 mt-1 space-y-1">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveMenu('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      Pengaturan Sistem & Database
                    </button>
                  )}
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
