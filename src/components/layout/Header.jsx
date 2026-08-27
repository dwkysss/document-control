import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, UserCheck, ChevronDown, Check, Shield, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Eye } from 'lucide-react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import Badge from '../common/Badge';

export default function Header({ onToggleSidebar, isSidebarCollapsed }) {
  const {
    currentUser,
    setCurrentUser,
    employees,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    breadcrumbs,
    setBreadcrumbs,
    activeMenu,
    setActiveMenu,
    setViewingDocument,
    documents,
    searchQuery,
    setSearchQuery,
    isCloudConnected,
    showToast
  } = useDocumentControl();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filtered documents from search query
  const searchResults = searchQuery.trim()
    ? documents.filter(d =>
        d.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.creator.toLowerCase().includes(searchQuery.toLowerCase())
      )
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
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-soft">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Side: Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-wide font-sans">
              {getPageTitle()}
            </h1>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-400">&gt;</span>}
                  <button
                    onClick={() => handleCrumbClick(crumb, idx)}
                    className={`transition ${
                      idx === breadcrumbs.length - 1
                        ? 'text-blue-600 dark:text-blue-400 font-semibold cursor-default'
                        : 'hover:text-blue-600 cursor-pointer'
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
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Search dropdown */}
          <div className="relative hidden md:block w-72" ref={searchRef}>
            <input
              type="text"
              placeholder="Cari no. dokumen / judul..."
              value={searchQuery}
              onFocus={() => setIsSearching(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
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

          {/* Database Connection Status Badge */}
          <div className="hidden lg:flex items-center">
            {isCloudConnected ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs"
                title="Terhubung ke Supabase Cloud PostgreSQL Database"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase Cloud</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full border border-slate-200 dark:border-slate-700"
                title="Berjalan dalam mode Persistent LocalStorage Database"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Local DB</span>
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifikasi Sistem"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
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

          {/* User Profile & Role Switcher */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-500/20">
                {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {currentUser.name}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser.position}
                </div>
              </div>
            </button>

            {/* Role Switcher Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-elevated border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-xs text-slate-500">Masuk sebagai:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    <span>NIK: {currentUser.nik} | Dept: {currentUser.department}</span>
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider">
                    Ganti Role / User Simulasi:
                  </div>
                  <div className="space-y-1 mt-1">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          setCurrentUser(emp);
                          setShowUserMenu(false);
                          showToast(`Berhasil beralih profil ke ${emp.name} (${emp.position})`, 'info');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                          currentUser.id === emp.id
                            ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-left">
                          <div>{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{emp.position} ({emp.department})</div>
                        </div>
                        {currentUser.id === emp.id && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 px-3 pt-2 mt-1">
                  <button
                    onClick={() => {
                      setActiveMenu('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    Pengaturan Sistem & Database
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
