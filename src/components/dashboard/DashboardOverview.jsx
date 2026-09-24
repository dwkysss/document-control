import React from 'react';
import { useDocumentControl } from '../../context/DocumentControlContext';
import ControlTowerHeader from './ControlTowerHeader';
import MetricCardsGrid from './MetricCardsGrid';
import DocumentLifecyclePipeline from './DocumentLifecyclePipeline';
import DashboardAnalytics from './DashboardAnalytics';

export default function DashboardOverview() {
  const {
    documents = [],
    departments = [],
    documentTypes = [],
    systemSettings = {},
    currentUser,
    setActiveMenu,
    setBreadcrumbs,
    isViewer,
    canRegisterDocument,
    canRequestRevision,
    canAccessReports
  } = useDocumentControl();

  // Metrics calculation
  const totalDocs = documents.length;
  const activeDocs = documents.filter(d => d.status === 'AKTIF').length;
  const pendingDocs = documents.filter(d => d.status === 'REVIEW' || d.status === 'VERIFIKASI' || d.status === 'APPROVAL').length;
  const draftDocs = documents.filter(d => d.status === 'DRAFT').length;
  const obsoleteDocs = documents.filter(d => d.status === 'OBSOLETE').length;
  const rejectedDocs = documents.filter(d => d.status === 'DITOLAK').length;

  // Periodic review check (Langkah 8 & 9 ISO 9001 Clause 7.5)
  const reviewIntervalMonths = systemSettings.periodicReviewMonths || 12;
  const reviewDueDocs = documents.filter(d => {
    if (d.status !== 'AKTIF') return false;
    const baseDateStr = d.lastReviewedDate || d.effectiveDate || d.approvedDate || d.createdDate;
    if (!baseDateStr) return false;
    const baseDate = new Date(baseDateStr);
    const dueDate = new Date(baseDate);
    dueDate.setMonth(dueDate.getMonth() + reviewIntervalMonths);
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

      {/* 4. Interactive Analytics (Charts for Hierarchy & Department Distribution) */}
      <DashboardAnalytics
        documents={documents}
        departments={departments}
        documentTypes={documentTypes}
        navigateTo={navigateTo}
      />
    </div>
  );
}
