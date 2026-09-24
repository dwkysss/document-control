import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/common/Toast';
import DocumentViewerModal from './components/common/DocumentViewerModal';

// View modules
import DashboardOverview from './components/dashboard/DashboardOverview';
import NewRegistrationView from './components/registration/NewRegistrationView';
import DraftListView from './components/registration/DraftListView';
import PendingVerificationView from './components/registration/PendingVerificationView';
import ApprovedListView from './components/registration/ApprovedListView';
import RejectedListView from './components/registration/RejectedListView';
import AllDocumentsView from './components/control/AllDocumentsView';
import ActiveDocumentsView from './components/control/ActiveDocumentsView';
import ObsoleteDocumentsView from './components/control/ObsoleteDocumentsView';
import RevisionHistoryView from './components/control/RevisionHistoryView';
import DocumentRevisionFormView from './components/revision/DocumentRevisionFormView';
import EmployeeMasterView from './components/master/EmployeeMasterView';
import DepartmentMasterView from './components/master/DepartmentMasterView';
import DocumentTypeMasterView from './components/master/DocumentTypeMasterView';
import RoleMasterView from './components/master/RoleMasterView';
import MasterRegisterReportView from './components/report/MasterRegisterReportView';
import DepartmentReportView from './components/report/DepartmentReportView';
import DocumentTypeReportView from './components/report/DocumentTypeReportView';
import RevisionAuditReportView from './components/report/RevisionAuditReportView';
import SystemSettingsView from './components/settings/SystemSettingsView';
import LoginView from './components/auth/LoginView';

import { DocumentControlProvider, useDocumentControl } from './context/DocumentControlContext';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('UI Render Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-rose-200 dark:border-rose-900 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto text-xl font-black">
            !
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Gagal Memuat Halaman</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {this.state.error?.message || 'Terjadi kesalahan saat merender tampilan.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import PublicDocumentVerifyView from './components/common/PublicDocumentVerifyView';

function MainAppContent() {
  const { currentUser, isAuthenticated, activeMenu, viewingDocument, setViewingDocument, systemSettings } = useDocumentControl();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [publicVerifyDoc, setPublicVerifyDoc] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('verify') || params.get('doc') || null;
    }
    return null;
  });

  // Jika URL memiliki parameter ?verify= atau ?doc=, tampilkan portal verifikasi publik tanpa perlu login!
  if (publicVerifyDoc) {
    return (
      <PublicDocumentVerifyView
        docNumber={publicVerifyDoc}
        onBackToApp={() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setPublicVerifyDoc(null);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'reg-new':
        return <NewRegistrationView />;
      case 'reg-draft':
        return <DraftListView />;
      case 'reg-pending':
        return <PendingVerificationView />;
      case 'reg-approved':
        return <ApprovedListView />;
      case 'reg-rejected':
        return <RejectedListView />;
      case 'ctrl-all':
        return <AllDocumentsView />;
      case 'ctrl-active':
        return <ActiveDocumentsView />;
      case 'ctrl-obsolete':
        return <ObsoleteDocumentsView />;
      case 'ctrl-history':
        return <RevisionHistoryView />;
      case 'rev-new':
        return <DocumentRevisionFormView />;
      case 'master-emp':
        return <EmployeeMasterView />;
      case 'master-dept':
        return <DepartmentMasterView />;
      case 'master-type':
        return <DocumentTypeMasterView />;
      case 'master-role':
        return <RoleMasterView />;
      case 'rep-register':
        return <MasterRegisterReportView />;
      case 'rep-dept':
        return <DepartmentReportView />;
      case 'rep-type':
        return <DocumentTypeReportView />;
      case 'rep-history':
        return <RevisionAuditReportView />;
      case 'settings':
        return <SystemSettingsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Header
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <ErrorBoundary>
            {renderActiveView()}
          </ErrorBoundary>
        </main>

        {/* Bottom Footer */}
        <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
          <p>© 2026 {systemSettings.companyName || 'PT DJI'} - {systemSettings.systemName || 'Document Control System'}. All rights reserved.</p>
        </footer>
      </div>

      {/* Modal & Toast Overlays */}
      <DocumentViewerModal
        doc={viewingDocument}
        isOpen={Boolean(viewingDocument)}
        onClose={() => setViewingDocument(null)}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DocumentControlProvider>
        <MainAppContent />
      </DocumentControlProvider>
    </ErrorBoundary>
  );
}
