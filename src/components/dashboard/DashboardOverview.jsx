import React from 'react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import ControlTowerHeader from './ControlTowerHeader';
import MetricCardsGrid from './MetricCardsGrid';
import DocumentLifecyclePipeline from './DocumentLifecyclePipeline';
import ActionCenterTabs from './ActionCenterTabs';
import DashboardAnalytics from './DashboardAnalytics';

export default function DashboardOverview() {
  const {
    documents = [],
    departments = [],
    documentTypes = [],
    companies = [],
    selectedCompanyFilter = 'ALL',
    systemSettings = {},
    currentUser,
    setActiveMenu,
    setBreadcrumbs,
    isViewer,
    canRegisterDocument,
    canRequestRevision,
    canAccessReports,
    auditLogs = [],
    setViewingDocument,
    confirmDocumentPeriodicReview,
    setSelectedDocForRevision,
    canUserViewPendingDoc,
    canUserViewDraftDoc,
    canUserViewRejectedDoc
  } = useDocumentControl();

  // Metrics calculation strictly synchronized with Sidebar badges & User Authority
  const totalDocs = documents.length;
  const activeDocs = documents.filter(d => d.status === 'AKTIF').length;
  
  const scopedPendingList = documents.filter(d =>
    (d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL') &&
    (canUserViewPendingDoc ? canUserViewPendingDoc(d) : true)
  );
  const pendingDocs = scopedPendingList.length;

  const scopedDraftList = documents.filter(d =>
    (d.status === 'DRAFT' || d.status === 'PERLU REVISI' || d.status === 'REVISI') &&
    (canUserViewDraftDoc ? canUserViewDraftDoc(d) : true)
  );
  const draftDocs = scopedDraftList.length;

  const obsoleteDocs = documents.filter(d => d.status === 'OBSOLETE').length;

  const scopedRejectedList = documents.filter(d =>
    d.status === 'DITOLAK' &&
    (canUserViewRejectedDoc ? canUserViewRejectedDoc(d) : true)
  );
  const rejectedDocs = scopedRejectedList.length;

  // Periodic review check (ISO 9001 Clause 7.5.3: Level 1 & 2 = 12 bulan, Level 3 & 4 = 24 bulan)
  const reviewDueDocs = documents.filter(d => {
    if (d.status !== 'AKTIF') return false;
    const baseDateStr = d.lastReviewedDate || d.effectiveDate || d.approvedDate || d.createdDate;
    if (!baseDateStr) return false;

    const typeCode = (d.type || '').toUpperCase();
    const typeObj = (documentTypes || []).find(t => (t.code || '').toUpperCase() === typeCode);
    const docLevel = typeObj?.level || (
      typeCode.includes('POL') ? 1 :
      typeCode.includes('SOP') ? 2 :
      (typeCode.includes('IK') || typeCode.includes('WI')) ? 3 :
      (typeCode.includes('FORM') || typeCode.includes('MEM')) ? 4 : 2
    );
    const intervalMonths = docLevel >= 3
      ? (systemSettings.periodicReviewMonthsLevel34 || 24)
      : (systemSettings.periodicReviewMonths || 12);

    const baseDate = new Date(baseDateStr);
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + intervalMonths);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 30; // Due within 30 days or overdue
  });

  const navigateTo = (menuKey, crumbs) => {
    setActiveMenu(menuKey);
    setBreadcrumbs(crumbs);
  };

  return (
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* 1. Control Tower Executive Header */}
      <ControlTowerHeader
        currentUser={currentUser}
        systemSettings={systemSettings}
        companies={companies}
        selectedCompanyFilter={selectedCompanyFilter}
        isViewer={isViewer}
        canRegisterDocument={canRegisterDocument}
        canRequestRevision={canRequestRevision}
        canAccessReports={canAccessReports}
        navigateTo={navigateTo}
      />

      {/* 2. KPI Metric Stat Cards (Enhanced Visual Hierarchy) */}
      <MetricCardsGrid
        totalDocs={totalDocs}
        activeDocs={activeDocs}
        pendingDocs={pendingDocs}
        draftDocs={draftDocs}
        obsoleteDocs={obsoleteDocs}
        rejectedDocs={rejectedDocs}
        reviewDueCount={reviewDueDocs.length}
        departmentsCount={departments.length}
        documentTypesCount={documentTypes.length}
        navigateTo={navigateTo}
        isViewer={isViewer}
      />

      {/* 3. Document Lifecycle Pipeline (ISO 9001 Clause 7.5 Process Flow) */}
      {!isViewer && (
        <DocumentLifecyclePipeline
          documents={documents}
          navigateTo={navigateTo}
        />
      )}

      {/* 4. Action Center: Tasks, Reviews & Audit Trail */}
      <ActionCenterTabs
        pendingDocs={scopedPendingList}
        reviewDueDocs={reviewDueDocs}
        auditLogs={auditLogs}
        setViewingDocument={setViewingDocument}
        navigateTo={navigateTo}
        confirmDocumentPeriodicReview={confirmDocumentPeriodicReview}
        setSelectedDocForRevision={setSelectedDocForRevision}
        isViewer={isViewer}
        reviewIntervalMonths={systemSettings.periodicReviewMonths || 12}
      />

      {/* 5. Interactive Analytics (Charts for Hierarchy & Department Distribution) */}
      <DashboardAnalytics
        documents={documents}
        departments={departments}
        documentTypes={documentTypes}
        navigateTo={navigateTo}
      />
    </div>
  );
}
