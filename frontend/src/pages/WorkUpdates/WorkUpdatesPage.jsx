import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../../config/api';

// Helper to format YYYY-MM-DD string to DD/MM/YYYY format
const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export default function WorkUpdatesPage({ currentUser, onOpenMobileSidebar }) {
  // 1. Popup Modal State for Write Work Update
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 2. Date Selection States (Single Date & Date Range)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // 3. Tab State: 'my-updates' | 'team-submissions' (TL / Manager review)
  const [activeTab, setActiveTab] = useState('my-updates');

  // 4. Project Selection Dropdown State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 5. Dynamic Input Boxes State (Point-wise updates for selected project)
  const [employeePoints, setEmployeePoints] = useState([
    { point: '', hoursSpent: 1, status: 'Completed' }
  ]);
  const [employeeSummary, setEmployeeSummary] = useState('');

  // 6. Loading & Action States
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingDaily, setSubmittingDaily] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');

  // 7. Backend Data States
  const [groupedData, setGroupedData] = useState({
    projects: [],
    stats: {
      totalProjects: 0,
      activeProjectsWithUpdates: 0,
      totalEmployeesSubmitted: 0,
      totalVerified: 0,
      totalPending: 0,
      totalHoursLogged: 0,
      isUserTeamLead: false,
      myDailyRecord: null
    }
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // 8. Verification Modal States (For TL / Manager)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedUpdateToVerify, setSelectedUpdateToVerify] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('Verified');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Role permissions
  const isEmployeeRole = currentUser?.role === 'employee' || !['superadmin', 'superior', 'manager', 'teamlead'].includes(currentUser?.role);
  const isManagerRole = ['superadmin', 'superior', 'manager'].includes(currentUser?.role);

  // Fetch available projects & employees on mount
  useEffect(() => {
    fetchApi('/projects')
      .then((res) => {
        const list = res.data || (Array.isArray(res) ? res : []);
        setAvailableProjects(list);
      })
      .catch((err) => console.error('Error loading projects:', err));

    if (['superadmin', 'superior', 'manager', 'teamlead'].includes(currentUser?.role)) {
      fetchApi('/employees')
        .then((res) => setAvailableEmployees(res.data || []))
        .catch((err) => console.error('Error loading employees:', err));
    }
  }, [currentUser]);

  // Load Grouped Work Updates from API
  const loadWorkUpdates = () => {
    setLoading(true);
    setError('');

    const queryParams = new URLSearchParams();
    if (useDateRange) {
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
    } else if (selectedDate) {
      queryParams.append('date', selectedDate);
    }

    fetchApi(`/work-updates/grouped?${queryParams.toString()}`)
      .then((res) => {
        if (res.data) {
          setGroupedData(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load work updates');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWorkUpdates();
  }, [selectedDate, useDateRange, startDate, endDate]);

  // Derived array of my work updates for the selected date
  const myWorkUpdatesForDate = useMemo(() => {
    const list = [];
    if (!groupedData.projects) return list;

    groupedData.projects.forEach((pGroup) => {
      const projInfo = pGroup.project;
      const myBlock = pGroup.employees?.find(
        (e) => e.employee?._id?.toString() === currentUser?._id?.toString()
      );
      if (myBlock && myBlock.updates && myBlock.updates.length > 0) {
        list.push({
          project: projInfo,
          myBlock: myBlock
        });
      }
    });

    return list;
  }, [groupedData, currentUser]);

  // Sync Input Boxes when project selection changes or data reloads
  useEffect(() => {
    if (!selectedProjectId) {
      setEmployeePoints([{ point: '', hoursSpent: 1, status: 'Completed' }]);
      setEmployeeSummary('');
      return;
    }

    const projGroup = groupedData.projects?.find(
      (p) => p.project && p.project._id.toString() === selectedProjectId.toString()
    );

    if (projGroup && projGroup.employees) {
      // Find my own entry for this project
      const myBlock = projGroup.employees.find(
        (e) => e.employee?._id?.toString() === currentUser?._id?.toString()
      );

      if (myBlock && myBlock.updates && myBlock.updates.length > 0) {
        setEmployeePoints(
          myBlock.updates.map((u) => ({
            point: u.point || '',
            hoursSpent: u.hoursSpent || 1,
            status: u.status || 'Completed'
          }))
        );
        setEmployeeSummary(myBlock.overallSummary || '');
        return;
      }
    }

    // Default empty point if no existing updates found for this project
    setEmployeePoints([{ point: '', hoursSpent: 1, status: 'Completed' }]);
    setEmployeeSummary('');
  }, [selectedProjectId, groupedData, currentUser]);

  // --- Modal Open Helper ---
  const handleOpenWriteModal = (presetProjId = null) => {
    setModalSuccessMsg('');
    if (presetProjId) {
      setSelectedProjectId(presetProjId);
    } else if (myWorkUpdatesForDate.length > 0) {
      setSelectedProjectId(myWorkUpdatesForDate[0].project._id);
    } else if (availableProjects.length > 0) {
      setSelectedProjectId(availableProjects[0]._id);
    }
    setIsWriteModalOpen(true);
  };

  // --- Dynamic Input Box Handlers ---
  const handleAddInputPoint = () => {
    setEmployeePoints((prev) => [...prev, { point: '', hoursSpent: 1, status: 'Completed' }]);
  };

  const handleRemoveInputPoint = (index) => {
    setEmployeePoints((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleUpdateInputPoint = (index, field, value) => {
    setEmployeePoints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // --- Save as Draft (Private to current user, keeps modal OPEN for adding more projects) ---
  const handleSaveDraft = async () => {
    if (!selectedProjectId) {
      setError('Please select a project from the dropdown first.');
      return;
    }

    const validPoints = employeePoints.filter((pt) => pt.point && pt.point.trim());
    if (validPoints.length === 0) {
      setError('Please write at least one valid work update point before saving draft.');
      return;
    }

    setSavingDraft(true);
    setError('');

    const foundProj = availableProjects.find((p) => p._id.toString() === selectedProjectId.toString());

    try {
      const payload = {
        date: selectedDate,
        projectUpdates: [
          {
            project: selectedProjectId,
            projectName: foundProj ? foundProj.name : 'Project Work',
            updates: validPoints.map((pt) => ({
              point: pt.point.trim(),
              hoursSpent: parseFloat(pt.hoursSpent) || 0,
              status: pt.status
            }))
          }
        ],
        overallSummary: employeeSummary,
        action: 'draft'
      };

      await fetchApi('/work-updates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const msg = `Draft saved for "${foundProj ? foundProj.name : 'Selected Project'}"!`;
      setSuccessMsg(`Draft saved for "${foundProj ? foundProj.name : 'Selected Project'}" (Private to you).`);
      
      setIsWriteModalOpen(false);
      
      // Reload backend updates so the newly saved draft is immediately available
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // --- Save & Submit Update (Submits all project updates for date) ---
  const handleSaveAndSubmit = async () => {
    if (!selectedProjectId && myWorkUpdatesForDate.length === 0) {
      setError('Please select a project from the dropdown and write update points.');
      return;
    }

    setSubmittingDaily(true);
    setError('');

    try {
      // Gather current active project update points if user entered valid points
      let currentProjectUpdate = null;
      if (selectedProjectId) {
        const validPoints = employeePoints.filter((pt) => pt.point && pt.point.trim());
        if (validPoints.length > 0) {
          const foundProj = availableProjects.find((p) => p._id.toString() === selectedProjectId.toString());
          currentProjectUpdate = {
            project: selectedProjectId,
            projectName: foundProj ? foundProj.name : 'Project Work',
            updates: validPoints.map((pt) => ({
              point: pt.point.trim(),
              hoursSpent: parseFloat(pt.hoursSpent) || 0,
              status: pt.status
            }))
          };
        }
      }

      // Merge current active project update with all existing project updates for current user
      const allProjectUpdates = [];

      if (currentProjectUpdate) {
        allProjectUpdates.push(currentProjectUpdate);
      }

      myWorkUpdatesForDate.forEach((item) => {
        if (selectedProjectId && item.project._id.toString() === selectedProjectId.toString()) {
          // Skip because currentProjectUpdate already has latest points
        } else {
          allProjectUpdates.push({
            project: item.project._id,
            projectName: item.project.name,
            updates: item.myBlock.updates.map((u) => ({
              point: u.point,
              hoursSpent: u.hoursSpent || 0,
              status: u.status || 'Completed'
            }))
          });
        }
      });

      if (allProjectUpdates.length === 0) {
        setError('Please write at least one valid work update point to submit.');
        setSubmittingDaily(false);
        return;
      }

      const payload = {
        date: selectedDate,
        projectUpdates: allProjectUpdates,
        overallSummary: employeeSummary || (groupedData.stats?.myDailyRecord?.overallSummary || ''),
        action: 'submit'
      };

      await fetchApi('/work-updates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMsg(`Daily work updates submitted successfully! (${allProjectUpdates.length} Project(s) Submitted)`);
      setIsWriteModalOpen(false);
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setError(err.message || 'Failed to submit work update');
    } finally {
      setSubmittingDaily(false);
    }
  };

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formattedDateStr = useMemo(() => {
    if (useDateRange) {
      if (startDate === endDate) {
        return formatDateDDMMYYYY(startDate);
      }
      return `${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}`;
    }
    return formatDateDDMMYYYY(selectedDate);
  }, [selectedDate, useDateRange, startDate, endDate]);

  // Selected project details
  const currentSelectedProject = useMemo(() => {
    return availableProjects.find((p) => p._id.toString() === selectedProjectId.toString());
  }, [availableProjects, selectedProjectId]);

  // Find saved block for currently selected project
  const currentProjectSavedBlock = useMemo(() => {
    if (!selectedProjectId) return null;
    const pGroup = groupedData.projects?.find((p) => p.project && p.project._id.toString() === selectedProjectId.toString());
    if (!pGroup || !pGroup.employees) return null;

    return pGroup.employees.find((e) => e.employee?._id?.toString() === currentUser?._id?.toString()) || null;
  }, [groupedData, selectedProjectId, currentUser]);

  // Render TL Verification Action Button
  const renderVerifyButton = (itemStatus, onClickHandler) => {
    const isVerified = itemStatus === 'Verified';
    const isTLVerified = itemStatus === 'TL Verified';
    const isSubmitted = itemStatus === 'Submitted' || !itemStatus;
    const isTeamLead = currentUser?.role === 'teamlead' || groupedData.stats?.isUserTeamLead;

    if (isVerified) {
      return (
        <button
          type="button"
          onClick={onClickHandler}
          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span>✓ Verified (Edit)</span>
        </button>
      );
    }

    if (isTLVerified) {
      return (
        <button
          type="button"
          onClick={onClickHandler}
          className="px-3 py-1 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-lg text-[11px] font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span>{isManagerRole ? 'Approve & Verify (Manager)' : 'TL Verified (Edit)'}</span>
        </button>
      );
    }

    if (isSubmitted && isManagerRole && !isTeamLead) {
      return (
        <button
          type="button"
          disabled
          title="Team Lead must verify this update before Manager can approve."
          className="px-3 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[11px] font-bold cursor-not-allowed flex items-center gap-1 shrink-0 opacity-80"
        >
          <span>Awaiting TL Verification</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onClickHandler}
        className="px-3 py-1 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-lg text-[11px] font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
      >
        <span>Verify (TL)</span>
      </button>
    );
  };

  // TL Verification Action
  const handleConfirmVerification = async () => {
    if (!selectedUpdateToVerify) return;
    setVerifying(true);
    setError('');

    try {
      await fetchApi(`/work-updates/${selectedUpdateToVerify.updateRecordId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          status: verifyStatus,
          remarks: verifyRemarks,
          projectId: selectedUpdateToVerify.projectId,
          projectUpdateId: selectedUpdateToVerify.projectUpdateId
        })
      });

      setSuccessMsg(`Work update status marked as ${verifyStatus}.`);
      setIsVerifyModalOpen(false);
      setSelectedUpdateToVerify(null);
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to verify work update');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="work-updates-container space-y-4 pb-8 text-slate-800">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#0d6e49] text-white flex items-center justify-center font-black text-xs shrink-0">✓</div>
            <p className="leading-snug">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-black shrink-0 ml-2">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center justify-between shadow-xs text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0">!</div>
            <p className="leading-snug">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 font-black shrink-0 ml-2">✕</button>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        {/* Top Row: Title & Top-Right Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {onOpenMobileSidebar && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="md:hidden p-2 text-slate-600 hover:text-[#09233d] hover:bg-slate-100 rounded-xl border border-slate-200 shrink-0 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Icon hidden on mobile view */}
            <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-emerald-50 text-[#0d6e49] items-center justify-center shrink-0 border border-emerald-200/50 shadow-2xs">
              <svg className="w-6 h-6 text-[#0d6e49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-black text-[#09233d] tracking-tight truncate">
                Work Updates
              </h1>
              <p className="hidden sm:block text-xs text-slate-400 font-medium truncate">
                Track project work updates, write daily bullet points, and manage submissions.
              </p>
            </div>
          </div>

          {/* WRITE WORK UPDATE BUTTON (Top Right Corner - Only '+' Symbol on Mobile) */}
          <button
            type="button"
            onClick={() => handleOpenWriteModal()}
            className="bg-[#0d6e49] hover:bg-[#128a5c] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Write Work Update"
          >
            <span className="sm:hidden font-black text-base leading-none">+</span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Write Work Update</span>
            </span>
          </button>
        </div>

        {/* Second Row: Date Range Button and Date Selector Arranged Side-by-Side on Mobile */}
        <div className="flex flex-row items-center gap-2 text-xs w-full">
          {/* Single Date vs Date Range Toggle Button */}
          <button
            type="button"
            onClick={() => setUseDateRange(!useDateRange)}
            className="flex-1 sm:flex-initial px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer border border-slate-200 text-center truncate"
            title="Click to toggle between Single Date and Date Range modes"
          >
            {useDateRange ? '📆 Date Range' : '📅 Single Date'}
          </button>

          {/* Date Selector Box (Side-by-Side) */}
          {useDateRange ? (
            <div className="flex-1 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 font-bold text-[#09233d]">
              {/* Start Date Box */}
              <div
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector('input[type="date"]');
                  if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                }}
                className="relative flex-1 flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-[#09233d] cursor-pointer"
              >
                <span>{formatDateDDMMYYYY(startDate)}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
              <span className="text-slate-400 font-bold text-[10px]">to</span>
              {/* End Date Box */}
              <div
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector('input[type="date"]');
                  if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                }}
                className="relative flex-1 flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-[#09233d] cursor-pointer"
              >
                <span>{formatDateDDMMYYYY(endDate)}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl p-1 font-bold text-[#09233d] shadow-2xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="px-2 py-1 hover:bg-white rounded-lg text-slate-500 hover:text-[#09233d] transition-colors text-xs font-black cursor-pointer"
                title="Previous Day"
              >
                ‹
              </button>
              <div
                onClick={(e) => {
                  const inp = e.currentTarget.querySelector('input[type="date"]');
                  if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                }}
                className="relative flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-white border border-slate-200/90 rounded-lg text-xs font-extrabold text-[#09233d] cursor-pointer whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDateDDMMYYYY(selectedDate)}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                className="px-2 py-1 hover:bg-white rounded-lg text-slate-500 hover:text-[#09233d] transition-colors text-xs font-black cursor-pointer"
                title="Next Day"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW TABS */}
      <div className={`items-center justify-between border-b border-slate-200/80 pb-2 ${isEmployeeRole ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('my-updates')}
            className={`hidden sm:flex px-4 py-2 rounded-xl text-xs font-black items-center gap-2 transition-all cursor-pointer ${activeTab === 'my-updates'
              ? 'bg-[#0d6e49] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>My Work Updates</span>
          </button>

          {!isEmployeeRole && (
            <button
              type="button"
              onClick={() => setActiveTab('team-submissions')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'team-submissions'
                ? 'bg-[#0d6e49] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Team Submissions Review</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${activeTab === 'team-submissions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                {groupedData.projects.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* MY WORK UPDATES DISPLAY CARDS */}
      {activeTab === 'my-updates' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#09233d] uppercase tracking-wider">
                My Saved & Submitted Work Updates ({formattedDateStr})
              </h3>
              <button
                type="button"
                onClick={() => handleOpenWriteModal()}
                className="text-xs font-extrabold text-[#0d6e49] hover:underline cursor-pointer flex items-center gap-1"
              >
                + Write Update
              </button>
            </div>

            {myWorkUpdatesForDate.length === 0 ? (
              <div className="p-8 border border-slate-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0d6e49] flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-[#0d6e49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="text-sm font-black text-[#09233d]">No Work Updates Saved For Today</h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Click the "Write Work Update" button above to open the popup modal and log your project update points.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenWriteModal()}
                  className="px-4 py-2 bg-[#0d6e49] text-white rounded-xl text-xs font-black cursor-pointer shadow-2xs"
                >
                  Write Work Update Now →
                </button>
              </div>
            ) : (
              <div className="p-0 sm:p-5 bg-transparent sm:bg-slate-50/90 rounded-2xl border-0 sm:border-2 sm:border-emerald-500/30 space-y-4 shadow-none sm:shadow-2xs">
                {/* SINGLE CARD CONTAINER GROUPING ALL PROJECTS FOR THE DATE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {myWorkUpdatesForDate.map((item) => {
                    const projInfo = item.project;
                    const myBlock = item.myBlock;
                    const isDraft = myBlock.submissionStatus === 'Draft';

                    return (
                      <div
                        key={projInfo._id}
                        className="p-3.5 bg-white rounded-xl border border-slate-200/90 space-y-3 shadow-2xs hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between"
                        onClick={() => handleOpenWriteModal(projInfo._id)}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-[#0d6e49] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {projInfo.name.charAt(0).toUpperCase()}
                              </div>
                              <h4 className="text-xs font-black text-[#09233d] truncate">
                                {projInfo.name}
                              </h4>
                            </div>

                            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md shrink-0 ${isDraft
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : myBlock.submissionStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-sky-100 text-sky-900 border border-sky-300'
                              }`}>
                              {isDraft ? '🔒 Draft (Private)' : myBlock.submissionStatus}
                            </span>
                          </div>

                          <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
                            {myBlock.updates.map((u, idx) => (
                              <div key={idx} className="flex items-center justify-between text-slate-800 text-[11px] py-0.5">
                                <span className="truncate flex-1 font-semibold">• {u.point}</span>
                                <span className="text-[9.5px] font-bold text-slate-500 shrink-0 ml-1.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                  {u.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SINGLE CARD FOOTER */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                  <span className="text-slate-500 font-bold">
                    Ref: {myWorkUpdatesForDate[0]?.myBlock?.updateId || 'WUP'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenWriteModal()}
                    className="text-[#0d6e49] font-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Edit in Popup →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM SUBMISSIONS REVIEW (FOR TEAM LEADS / MANAGERS) */}
      {activeTab === 'team-submissions' && !isEmployeeRole && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-[#09233d]">
              Team Submissions Review ({formattedDateStr})
            </h3>

            {groupedData.projects.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium py-4 text-center">
                No work update submissions logged by team members for selected date.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedData.projects.map((pGroup) => {
                  const projInfo = pGroup.project;
                  // Filter out draft updates of other users
                  const visibleEmployees = pGroup.employees?.filter((empBlock) => {
                    if (empBlock.submissionStatus === 'Draft') {
                      return empBlock.employee?._id?.toString() === currentUser?._id?.toString();
                    }
                    return true;
                  }) || [];

                  return (
                    <div
                      key={projInfo._id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                    >
                      <div className="p-3 bg-[#0d6e49] text-white flex items-center justify-between">
                        <span className="text-xs font-black truncate">{projInfo.name}</span>
                        <span className="px-2 py-0.5 bg-white/20 text-white font-mono text-[10px] rounded-md font-bold">
                          {projInfo.projectId || 'PRJ'}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-3 flex-1">
                        {visibleEmployees.length === 0 ? (
                          <p className="text-xs text-slate-400 font-medium italic text-center py-3">
                            No submitted updates for this project.
                          </p>
                        ) : (
                          visibleEmployees.map((empBlock) => (
                            <div
                              key={empBlock.updateRecordId + (empBlock.employee?._id || '')}
                              className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs font-black text-[#09233d]">
                                <span>{empBlock.employee?.name || 'Staff'}</span>
                                <span className="text-[10px] text-slate-500">{empBlock.submissionStatus}</span>
                              </div>

                              <ul className="text-[11px] text-slate-700 space-y-1">
                                {empBlock.updates.map((u, uIdx) => (
                                  <li key={uIdx} className="truncate">• {u.point}</li>
                                ))}
                              </ul>

                              <div className="flex justify-end pt-1">
                                {renderVerifyButton(empBlock.submissionStatus, () => {
                                  setSelectedUpdateToVerify(empBlock);
                                  setVerifyRemarks(empBlock.verificationRemarks || '');
                                  setVerifyStatus(empBlock.submissionStatus === 'Verified' ? 'Verified' : 'Verified');
                                  setIsVerifyModalOpen(true);
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: WRITE / EDIT WORK UPDATE */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Write Icon hidden on mobile view */}
                <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-emerald-50 text-[#0d6e49] items-center justify-center font-black text-sm shrink-0 border border-emerald-200">
                  ✍
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-[#09233d] truncate">
                    Write Work Update
                  </h3>
                  <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate">
                    Select date and project from dropdown, add update points, save draft or submit.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm cursor-pointer transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Container (Scrolls INSIDE the dialogue card) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
              {/* MODAL SUCCESS NOTIFICATION */}
              {modalSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-150">
                  <span>✓ {modalSuccessMsg}</span>
                  <button onClick={() => setModalSuccessMsg('')} className="text-emerald-700 font-black ml-2">✕</button>
                </div>
              )}

              {/* STEP 1: DATE SELECTION INSIDE POPUP IN DD/MM/YYYY FORMAT */}
              <div className="p-3 sm:p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] sm:text-xs font-black text-[#09233d] uppercase tracking-wider truncate">
                    Update Date (DD/MM/YYYY)
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseDateRange(!useDateRange)}
                    className="text-[10px] sm:text-[11px] font-extrabold text-[#0d6e49] hover:underline cursor-pointer shrink-0"
                  >
                    {useDateRange ? 'Single Date' : 'Date Range'}
                  </button>
                </div>

                {useDateRange ? (
                  <div className="flex items-center gap-1.5">
                    {/* Start Date DD/MM/YYYY */}
                    <div
                      onClick={(e) => {
                        const inp = e.currentTarget.querySelector('input[type="date"]');
                        if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                      }}
                      className="relative flex-1 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#09233d] cursor-pointer"
                    >
                      <span>{formatDateDDMMYYYY(startDate)}</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400">to</span>
                    {/* End Date DD/MM/YYYY */}
                    <div
                      onClick={(e) => {
                        const inp = e.currentTarget.querySelector('input[type="date"]');
                        if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                      }}
                      className="relative flex-1 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-[#09233d] cursor-pointer"
                    >
                      <span>{formatDateDDMMYYYY(endDate)}</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-black text-xs cursor-pointer shrink-0"
                    >
                      ‹ <span className="hidden sm:inline">Prev</span>
                    </button>
                    {/* Single Date DD/MM/YYYY Formatted Display Box */}
                    <div
                      onClick={(e) => {
                        const inp = e.currentTarget.querySelector('input[type="date"]');
                        if (inp) { try { inp.showPicker(); } catch (err) { inp.focus(); } }
                      }}
                      className="relative flex-1 flex items-center justify-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-[#09233d] cursor-pointer"
                    >
                      <span className="font-black text-[#09233d]">{formatDateDDMMYYYY(selectedDate)}</span>
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleNextDay}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-black text-xs cursor-pointer shrink-0"
                    >
                      <span className="hidden sm:inline">Next</span> ›
                    </button>
                  </div>
                )}
              </div>

              {/* SAVED PROJECTS SELECTOR PILLS BAR INSIDE MODAL (SIDE-BY-SIDE EQUAL FLEX WRAP) */}
              {myWorkUpdatesForDate.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Projects Updated ({formattedDateStr}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {myWorkUpdatesForDate.map((item) => {
                      const isSelected = selectedProjectId === item.project._id;
                      const isDraft = item.myBlock.submissionStatus === 'Draft';

                      return (
                        <button
                          key={item.project._id}
                          type="button"
                          onClick={() => setSelectedProjectId(item.project._id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#0d6e49] text-white border-[#0d6e49] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{item.project.name}</span>
                          <span className={`px-1.5 py-0.5 text-[9.5px] rounded-md font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isDraft
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {isDraft ? 'Draft' : item.myBlock.submissionStatus}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setSelectedProjectId('')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0d6e49] border border-emerald-300 rounded-xl text-xs font-black cursor-pointer transition-colors whitespace-nowrap"
                    >
                      + Add Another Project
                    </button>
                  </div>
                </div>
              )}

            {/* STEP 2: PROJECT SELECTION DROPDOWN INSIDE POPUP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#09233d] uppercase tracking-wider">
                Select Project From Dropdown
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 rounded-2xl text-xs sm:text-sm font-extrabold text-[#09233d] focus:outline-none focus:ring-2 focus:ring-[#0d6e49] cursor-pointer transition-all truncate"
              >
                <option value="">-- Click to Select a Project --</option>
                {availableProjects.map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    {proj.name} ({proj.projectId || 'PRJ'}) — {proj.status || 'Active'}
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 3: DYNAMIC INPUT BOXES SECTION (WHEN PROJECT IS SELECTED) */}
            {selectedProjectId ? (
              <div className="space-y-3.5 sm:space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#09233d] uppercase tracking-wider truncate">
                    Work Update Points ({currentSelectedProject?.name})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddInputPoint}
                    className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0d6e49] border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    + Add Point
                  </button>
                </div>

                {/* Input Fields List */}
                <div className="space-y-2.5">
                  {employeePoints.map((pt, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-xl bg-[#0d6e49] text-white font-black text-xs flex items-center justify-center shrink-0">
                          {pIdx + 1}
                        </span>
                        <input
                          type="text"
                          placeholder="Enter point-wise work description..."
                          value={pt.point}
                          onChange={(e) => handleUpdateInputPoint(pIdx, 'point', e.target.value)}
                          className="flex-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#0d6e49]"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 w-full sm:w-auto">
                        <span className="sm:hidden text-[10px] font-black text-slate-400 uppercase tracking-wider">Status:</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={pt.status}
                            onChange={(e) => handleUpdateInputPoint(pIdx, 'status', e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] sm:text-xs font-black text-[#09233d] focus:outline-none focus:ring-2 focus:ring-[#0d6e49] cursor-pointer shadow-2xs min-w-[110px]"
                          >
                            <option value="Completed">Completed</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Blocked">Blocked</option>
                          </select>

                          {employeePoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInputPoint(pIdx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-black cursor-pointer transition-colors"
                              title="Remove input point"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Summary */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Additional Remarks / Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Notes, PR links, or comments..."
                    value={employeeSummary}
                    onChange={(e) => setEmployeeSummary(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#0d6e49]"
                  />
                </div>

                {/* MODAL FOOTER ACTION BUTTONS */}
                <div className="flex flex-row items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100">
                  {/* Save as Draft Button */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 text-center truncate"
                  >
                    <span className="sm:hidden">{savingDraft ? 'Saving...' : 'Save&Draft'}</span>
                    <span className="hidden sm:inline">{savingDraft ? 'Saving Draft...' : 'Save as Draft (Private)'}</span>
                  </button>

                  {/* Save & Submit Button */}
                  <button
                    type="button"
                    onClick={handleSaveAndSubmit}
                    disabled={submittingDaily}
                    className="flex-1 sm:flex-initial px-3 sm:px-5 py-2.5 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 text-center truncate"
                  >
                    <span className="sm:hidden">{submittingDaily ? 'Submitting...' : 'Save&Submit'}</span>
                    <span className="hidden sm:inline">{submittingDaily ? 'Submitting...' : 'Save & Submit All Updates'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-200 text-xs text-slate-500 font-medium">
                Please select a project from the dropdown above to write update points.
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* VERIFICATION MODAL */}
      {isVerifyModalOpen && selectedUpdateToVerify && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-[#09233d]">Verify Work Update</h3>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                Verification Decision
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyStatus('Verified')}
                  className={`p-2.5 rounded-xl border text-xs font-black cursor-pointer ${
                    verifyStatus === 'Verified' ? 'bg-[#0d6e49] text-white border-[#0d6e49]' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Verified
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyStatus('Needs Revision')}
                  className={`p-2.5 rounded-xl border text-xs font-black cursor-pointer ${
                    verifyStatus === 'Needs Revision' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Needs Revision
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyStatus('Rejected')}
                  className={`p-2.5 rounded-xl border text-xs font-black cursor-pointer ${
                    verifyStatus === 'Rejected' ? 'bg-rose-500 text-white border-rose-600' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Rejected
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                  Team Lead / Manager Remarks
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter verification comments or feedback..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#0d6e49]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  disabled={verifying}
                  className="px-5 py-2 bg-[#0d6e49] text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
                >
                  {verifying ? 'Saving...' : 'Confirm Verification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
