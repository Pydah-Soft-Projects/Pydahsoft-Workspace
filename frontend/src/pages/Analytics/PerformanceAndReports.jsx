import React, { useState } from 'react';
import PerformanceAnalytics from './PerformanceAnalytics';
import ReportGenerator from '../Reports/ReportGenerator';

export default function PerformanceAndReports({ currentUser, activeSubTab = 'analytics' }) {
  return (
    <div className="space-y-6">
      {activeSubTab === 'analytics' && <PerformanceAnalytics currentUser={currentUser} />}
      {activeSubTab === 'reports' && <ReportGenerator currentUser={currentUser} />}
    </div>
  );
}
