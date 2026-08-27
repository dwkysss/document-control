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
import VerifierTeamMasterView from './components/master/VerifierTeamMasterView';
import MasterRegisterReportView from './components/report/MasterRegisterReportView';
import DepartmentReportView from './components/report/DepartmentReportView';
import DocumentTypeReportView from './components/report/DocumentTypeReportView';
import RevisionAuditReportView from './components/report/RevisionAuditReportView';
import SystemSettingsView from './components/settings/SystemSettingsView';

import { DocumentControlProvider, useDocumentControl } from './context/DocumentControlContext';

function MainAppContent() {
  const { activeMenu, viewingDocument, setViewingDocument, systemSettings } = useDocumentControl();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      case 'master-team':
        return <VerifierTeamMasterView />;
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
        return <NewRegistrationView />;
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
          {renderActiveView()}
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
    <DocumentControlProvider>
      <MainAppContent />
    </DocumentControlProvider>
  );
}
