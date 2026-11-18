import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, ChevronDown, Shield, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Eye, LogOut, Building2, Lock, ScanBarcode, KeyRound } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import Badge from '../common/Badge';
import BarcodeScannerModal from '../common/BarcodeScannerModal';

export default function Header({ onToggleSidebar, isSidebarCollapsed }) {
  const {
    currentUser,
    logout,
    role,
    isAdmin,
    isApprover,
    isDocControl,
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
    documents,
    searchQuery,
    setSearchQuery,
    showToast
  } = useDocumentControl();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const unreadCount = (notifications || []).filter(n => !n?.read && !n?.is_read).length;

  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return 'Baru saja';
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      if (diffMs < 0) return 'Baru saja';
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour} jam lalu`;
      const diffDays = Math.floor(diffHour / 24);
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return new Date(isoDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return 'Baru saja';
    }
  };

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
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setIsMobileSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    const targetDocId = notif.docId || notif.doc_id;
    if (targetDocId) {
      const doc = (documents || []).find(d => d.id === targetDocId);
      if (doc) {
        setViewingDocument(doc);
      }
    } else if (notif.link) {
      if (notif.link.includes('master-emp')) {
        setActiveMenu('master-emp');
        setBreadcrumbs(['Dashboard', 'Master Data', 'Karyawan']);
      } else if (notif.link.includes('reg-pending')) {
        setActiveMenu('reg-pending');
        setBreadcrumbs(['Dashboard', 'Registrasi Dokumen', 'Menunggu Verifikasi']);
      } else if (notif.link.includes('ctrl-active')) {
        setActiveMenu('ctrl-active');
        setBreadcrumbs(['Dashboard', 'Document Control', 'Dokumen Aktif']);
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
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs[breadcrumbs.length - 1];
    }
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center lg:-ml-8 lg:w-[calc(100%+2rem)] lg:pl-8">
      <div className="w-full flex items-center justify-between px-3 sm:px-6 gap-1.5 sm:gap-4 min-w-0">
        {/* Left Side: Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-1 sm:mr-0">
          <button
            onClick={onToggleSidebar}
            className="w-8.5 h-8.5 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs flex-shrink-0 cursor-pointer"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block flex-shrink-0" />

          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white tracking-tight font-sans truncate">
              {getPageTitle()}
            </h1>
            <nav className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px] md:max-w-xs">
              {breadcrumbs.length > 1 ? (
                breadcrumbs.slice(0, -1).map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-600">&gt;</span>}
                    <button
                      onClick={() => handleCrumbClick(crumb, idx)}
                      className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition truncate"
                    >
                      {crumb}
                    </button>
                  </React.Fragment>
                ))
              ) : (
                <span className="text-slate-400 text-[10px]">Overview & Analitik</span>
              )}
            </nav>
          </div>
        </div>

        {/* Right Side: Global Search, Notification Center, User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Multi-Company Scope Filter (Desktop Pill & Mobile Select) */}
          {!isCompanyLocked && (
            <>
              {/* Mobile Company Select */}
              <div className="sm:hidden flex items-center">
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="h-8 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-lg px-1.5 py-0 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  aria-label="Pilih Perusahaan"
                >
                  <option value="ALL">ALL PT</option>
                  {(companies || []).map((comp) => (
                    <option key={comp.id} value={comp.code}>{comp.code}</option>
                  ))}
                </select>
              </div>

              {/* Desktop Company Pill */}
              <div className="hidden sm:flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyFilter('ALL')}
                  className={`px-2 xl:px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                    selectedCompanyFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="hidden xl:inline">Semua (3 PT)</span>
                  <span className="xl:hidden">ALL</span>
                </button>
                {(companies || []).map((comp) => {
                  const isActive = selectedCompanyFilter === comp.code;
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => setSelectedCompanyFilter(comp.code)}
                      className={`px-1.5 xl:px-2 py-1 rounded-lg font-bold text-[11px] transition ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title={comp.name}
                    >
                      <span>{comp.code}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            title="Cari Dokumen"
            aria-label="Cari Dokumen"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Quick Search dropdown */}
          <div className="relative hidden md:block w-28 lg:w-36 xl:w-48 focus-within:w-44 xl:focus-within:w-56 transition-all duration-200" ref={searchRef}>
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={searchQuery}
              onFocus={() => setIsSearching(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white placeholder-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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

          {/* In-App Barcode / QR Scanner Button (Icon only) */}
          <button
            type="button"
            onClick={() => setShowBarcodeScanner(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            title="Pindai / Scan Barcode Dokumen"
            aria-label="Pindai Barcode Dokumen"
          >
            <ScanBarcode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition shadow-2xs cursor-pointer"
              title="Notifikasi Sistem"
              aria-label="Notifikasi Sistem"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popup Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in">
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
                    notifications.map((notif) => {
                      const isUnread = !notif.read && !notif.is_read;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer transition flex gap-3 ${
                            isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {notif.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                            {notif.type === 'danger' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                            {notif.type === 'info' && <FileText className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {notif.time || formatTimeAgo(notif.created_at || notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center"></span>
                          )}
                        </div>
                      );
                    })
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
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-0.5 sm:p-1 sm:pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left sm:border sm:border-slate-200/80 dark:sm:border-slate-700/80 sm:bg-white/80 dark:sm:bg-slate-900/80 sm:shadow-2xs shrink-0 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-[11px] shadow-xs shrink-0 ring-1 ring-blue-500/20 sm:ring-0">
                {currentUser ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 leading-tight">
                  <span className="truncate max-w-[70px] md:max-w-[85px] xl:max-w-[120px]">{currentUser ? currentUser.name : 'Tamu'}</span>
                  {currentUser && (
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border shrink-0 ${
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
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'approver' ? 'Approver' : currentUser.role === 'reviewer' ? 'Reviewer' : currentUser.role === 'doc_control' ? 'DCO' : currentUser.role === 'viewer' ? 'Viewer' : 'Staff'}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </div>
            </button>

            {/* Profile & Auth Menu */}
            {showUserMenu && currentUser && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-xs bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fadeIn">
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
                  {currentUser.companyName && (
                    <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.companyName}
                    </div>
                  )}
                </div>

                <div className="px-3 pt-2 space-y-1">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMenu('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      Pengaturan Sistem & Database
                    </button>
                  )}

                  {/* Change Password Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveMenu('change-password');
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 transition cursor-pointer font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                    <span>Ubah Kata Sandi</span>
                  </button>
                  
                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
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

      {/* Mobile Live Search Dropdown */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden absolute top-14 sm:top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xl z-50 animate-fadeIn"
        >
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="Cari nomor, judul, dept, pembuat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="mt-2.5 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                Hasil Pencarian ({searchResults.length} dokumen)
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada dokumen yang cocok
                </div>
              ) : (
                searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setViewingDocument(doc);
                      setIsMobileSearchOpen(false);
                    }}
                    className="p-3 hover:bg-blue-50/70 dark:hover:bg-slate-800 active:bg-blue-100 cursor-pointer text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate">{doc.docNumber}</span>
                        <Badge status={doc.status} size="sm" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">{doc.title}</p>
                      <span className="text-[10px] text-slate-400">Dept: {doc.department} | Rev: {doc.revision}</span>
                    </div>
                    <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Scanner Barcode / QR */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </header>
  );
}
