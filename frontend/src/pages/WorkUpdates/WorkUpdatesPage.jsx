import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';

export default function WorkUpdatesPage({ currentUser, onOpenMobileSidebar }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode tab state: 'by-project' | 'by-employee'
  const [activeTab, setActiveTab] = useState('by-project');

  // Selected project for Level-2 detailed 3-per-row view (TL / Manager)
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState(null);

  // Selected employee for Level-2 detailed view in "By Employee" tab
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState(null);

  // Selected project for Employee Point Editor (Employee Flow)
  const [activeProjectForEmployee, setActiveProjectForEmployee] = useState(null);
  const [employeePoints, setEmployeePoints] = useState([
    { point: '', hoursSpent: 1, status: 'Completed' }
  ]);
  const [employeeSummary, setEmployeeSummary] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingDaily, setSubmittingDaily] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Modal States (For TL / Manager verification or TL submitting on behalf)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedUpdateToVerify, setSelectedUpdateToVerify] = useState(null);

  // Form State for TL/Manager Submission Modal
  const [submitFormDate, setSubmitFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitEmployeeId, setSubmitEmployeeId] = useState('');
  const [projectBlocks, setProjectBlocks] = useState([
    {
      projectId: '',
      projectName: '',
      points: [{ point: '', hoursSpent: 1, status: 'Completed' }]
    }
  ]);
  const [overallSummary, setOverallSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verification Form State
  const [verifyStatus, setVerifyStatus] = useState('Verified');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Determine user role mode
  const isEmployeeRole = currentUser?.role === 'employee' || !['superadmin', 'superior', 'manager', 'teamlead'].includes(currentUser?.role);
  const isManagerRole = ['superadmin', 'superior', 'manager'].includes(currentUser?.role);

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
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Edit Remarks</span>
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
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
          <svg className="w-3 h-3 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Verify (TL)</span>
      </button>
    );
  };

  // Load available projects and employees
  useEffect(() => {
    fetchApi('/projects')
      .then((res) => {
        const list = res.data || (Array.isArray(res) ? res : []);
        setAvailableProjects(list);
      })
      .catch((err) => console.error('Error loading projects:', err));

    if (['superadmin', 'superior', 'teamlead'].includes(currentUser?.role)) {
      fetchApi('/employees')
        .then((res) => setAvailableEmployees(res.data || []))
        .catch((err) => console.error('Error loading employees:', err));
    }
  }, [currentUser]);

  // Load Grouped Work Updates
  const loadWorkUpdates = () => {
    setLoading(true);
    setError('');
    const queryParams = new URLSearchParams();
    if (selectedDate) queryParams.append('date', selectedDate);
    if (selectedStatusFilter !== 'All') queryParams.append('status', selectedStatusFilter);

    fetchApi(`/work-updates/grouped?${queryParams.toString()}`)
      .then((res) => {
        if (res.data) {
          setGroupedData(res.data);

          // Refresh active detail view reference if open for TL
          if (selectedProjectForDetail) {
            const updatedGroup = res.data.projects.find(
              (p) => p.project._id === selectedProjectForDetail.project._id
            );
            if (updatedGroup) {
              setSelectedProjectForDetail(updatedGroup);
            }
          }
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
  }, [selectedDate, selectedStatusFilter]);

  // Derive Employee-Centric Grouping from groupedData.projects and availableEmployees
  const employeeGroupedList = React.useMemo(() => {
    const empMap = new Map();

    if (groupedData.projects && Array.isArray(groupedData.projects)) {
      groupedData.projects.forEach((pGroup) => {
        const projInfo = pGroup.project;
        if (!pGroup.employees) return;

        pGroup.employees.forEach((empBlock) => {
          const empObj = empBlock.employee;
          if (!empObj || !empObj._id) return;
          const empIdStr = empObj._id.toString();

          let empEntry = empMap.get(empIdStr);
          if (!empEntry) {
            empEntry = {
              employee: empObj,
              updateRecordId: empBlock.updateRecordId,
              updateId: empBlock.updateId,
              submissionStatus: empBlock.submissionStatus,
              submittedAt: empBlock.submittedAt,
              overallSummary: empBlock.overallSummary,
              verifiedBy: empBlock.verifiedBy,
              verificationRemarks: empBlock.verificationRemarks,
              verifiedAt: empBlock.verifiedAt,
              totalHours: empBlock.totalHours || 0,
              projects: []
            };
            empMap.set(empIdStr, empEntry);
          }

          const existingProj = empEntry.projects.find(
            (p) => p.project._id.toString() === projInfo._id.toString()
          );

          if (!existingProj) {
            empEntry.projects.push({
              project: projInfo,
              projectUpdateId: empBlock.projectUpdateId,
              updates: empBlock.updates || [],
              submissionStatus: empBlock.submissionStatus || 'Submitted',
              verifiedBy: empBlock.verifiedBy || null,
              verificationRemarks: empBlock.verificationRemarks || '',
              verifiedAt: empBlock.verifiedAt || null
            });
          }
        });
      });
    }

    if (Array.isArray(availableEmployees)) {
      availableEmployees.forEach((emp) => {
        if (!emp._id) return;
        const empIdStr = emp._id.toString();
        if (!empMap.has(empIdStr)) {
          empMap.set(empIdStr, {
            employee: emp,
            updateRecordId: null,
            updateId: null,
            submissionStatus: 'No Update',
            submittedAt: null,
            overallSummary: '',
            verifiedBy: null,
            verificationRemarks: '',
            verifiedAt: null,
            totalHours: 0,
            projects: []
          });
        }
      });
    }

    return Array.from(empMap.values());
  }, [groupedData, availableEmployees]);

  const filteredEmployeesList = React.useMemo(() => {
    return employeeGroupedList.filter((empRecord) => {
      if (selectedProjectFilter !== 'ALL') {
        const workedOnProj = empRecord.projects.some(
          (p) => p.project._id.toString() === selectedProjectFilter
        );
        if (!workedOnProj) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empNameMatch =
          empRecord.employee.name?.toLowerCase().includes(q) ||
          empRecord.employee.username?.toLowerCase().includes(q) ||
          empRecord.employee.department?.toLowerCase().includes(q) ||
          empRecord.employee.designation?.toLowerCase().includes(q);

        const projMatch = empRecord.projects.some(
          (p) =>
            p.project.name?.toLowerCase().includes(q) ||
            p.project.projectId?.toLowerCase().includes(q) ||
            p.updates.some((u) => u.point.toLowerCase().includes(q))
        );

        return empNameMatch || projMatch;
      }

      return true;
    });
  }, [employeeGroupedList, selectedProjectFilter, searchQuery]);

  useEffect(() => {
    if (selectedEmployeeForDetail) {
      const updatedEmp = employeeGroupedList.find(
        (e) => e.employee?._id?.toString() === selectedEmployeeForDetail.employee?._id?.toString()
      );
      if (updatedEmp) {
        setSelectedEmployeeForDetail(updatedEmp);
      }
    }
  }, [employeeGroupedList]);

  // Handle Date Quick Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setActiveProjectForEmployee(null);
    setSelectedProjectForDetail(null);
    setSelectedEmployeeForDetail(null);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setActiveProjectForEmployee(null);
    setSelectedProjectForDetail(null);
    setSelectedEmployeeForDetail(null);
  };

  // ---------------- EMPLOYEE WORKFLOW HANDLERS ----------------
  const handleOpenEmployeeProjectEditor = (pGroup) => {
    setActiveProjectForEmployee(pGroup.project);
    // Find existing updates for this employee in this project
    const empBlock = pGroup.employees.find(
      (e) => e.employee?._id?.toString() === currentUser?._id?.toString()
    );

    if (empBlock && empBlock.updates && empBlock.updates.length > 0) {
      setEmployeePoints(
        empBlock.updates.map((u) => ({
          point: u.point || '',
          hoursSpent: u.hoursSpent || 1,
          status: u.status || 'Completed'
        }))
      );
      setEmployeeSummary(empBlock.overallSummary || '');
    } else {
      setEmployeePoints([{ point: '', hoursSpent: 1, status: 'Completed' }]);
      setEmployeeSummary('');
    }
  };

  const handleAddEmployeePoint = () => {
    setEmployeePoints((prev) => [...prev, { point: '', hoursSpent: 1, status: 'Completed' }]);
  };

  const handleRemoveEmployeePoint = (index) => {
    setEmployeePoints((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleUpdateEmployeePoint = (index, field, value) => {
    setEmployeePoints((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  // Save Draft for current active employee project
  const handleSaveEmployeeDraft = async () => {
    if (!activeProjectForEmployee) return;
    setSavingDraft(true);
    setError('');

    const validPoints = employeePoints.filter((pt) => pt.point && pt.point.trim());
    if (validPoints.length === 0) {
      setError('Please write at least one valid update point before saving draft.');
      setSavingDraft(false);
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        projectUpdates: [
          {
            project: activeProjectForEmployee._id,
            projectName: activeProjectForEmployee.name,
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

      setSuccessMsg(`Draft saved successfully for "${activeProjectForEmployee.name}"!`);
      setActiveProjectForEmployee(null);
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit All Daily Work Updates for Employee
  const handleSubmitAllEmployeeUpdates = async () => {
    setSubmittingDaily(true);
    setError('');

    try {
      // Gather current active project draft points if user is currently editing a project
      let currentProjectUpdate = null;
      if (activeProjectForEmployee) {
        const validPoints = employeePoints.filter((pt) => pt.point && pt.point.trim());
        if (validPoints.length > 0) {
          currentProjectUpdate = {
            project: activeProjectForEmployee._id,
            projectName: activeProjectForEmployee.name,
            updates: validPoints.map((pt) => ({
              point: pt.point.trim(),
              hoursSpent: parseFloat(pt.hoursSpent) || 0,
              status: pt.status
            }))
          };
        }
      }

      // Gather all project updates for employee from groupedData
      const allProjectUpdates = [];
      groupedData.projects.forEach((pGroup) => {
        if (activeProjectForEmployee && pGroup.project._id === activeProjectForEmployee._id) {
          if (currentProjectUpdate) allProjectUpdates.push(currentProjectUpdate);
        } else {
          const empBlock = pGroup.employees.find(
            (e) => e.employee?._id?.toString() === currentUser?._id?.toString()
          );
          if (empBlock && empBlock.updates && empBlock.updates.length > 0) {
            allProjectUpdates.push({
              project: pGroup.project._id,
              projectName: pGroup.project.name,
              updates: empBlock.updates.map((u) => ({
                point: u.point,
                hoursSpent: u.hoursSpent || 0,
                status: u.status || 'Completed'
              }))
            });
          }
        }
      });

      if (allProjectUpdates.length === 0) {
        setError('No work update points found to submit. Please write update points for a project first.');
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

      setSuccessMsg('Your daily work update has been submitted to your Team Lead for verification!');
      setActiveProjectForEmployee(null);
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.message || 'Error submitting work update');
    } finally {
      setSubmittingDaily(false);
    }
  };

  // ---------------- TL / MANAGER MODAL HANDLERS ----------------
  const handleOpenSubmitModal = (presetProjId = null) => {
    setSubmitFormDate(selectedDate || new Date().toISOString().split('T')[0]);
    setSubmitEmployeeId(currentUser?._id || '');

    const initialProjId = presetProjId || (availableProjects.length > 0 ? availableProjects[0]._id : '');
    const foundProj = availableProjects.find((p) => p._id === initialProjId);
    const initialProjName = foundProj ? foundProj.name : '';

    setProjectBlocks([
      {
        projectId: initialProjId,
        projectName: initialProjName,
        points: [{ point: '', hoursSpent: 1, status: 'Completed' }]
      }
    ]);
    setOverallSummary('');
    setIsSubmitModalOpen(true);
  };

  const handleAddPoint = (blockIndex) => {
    setProjectBlocks((prev) => {
      const next = [...prev];
      next[blockIndex].points.push({ point: '', hoursSpent: 1, status: 'Completed' });
      return next;
    });
  };

  const handleRemovePoint = (blockIndex, pointIndex) => {
    setProjectBlocks((prev) => {
      const next = [...prev];
      if (next[blockIndex].points.length > 1) {
        next[blockIndex].points.splice(pointIndex, 1);
      }
      return next;
    });
  };

  const handleUpdatePointText = (blockIndex, pointIndex, field, value) => {
    setProjectBlocks((prev) => {
      const next = [...prev];
      next[blockIndex].points[pointIndex][field] = value;
      return next;
    });
  };

  const handleAddProjectBlock = () => {
    const unselectedProj = availableProjects.find(
      (p) => !projectBlocks.some((b) => b.projectId === p._id)
    ) || availableProjects[0];

    setProjectBlocks((prev) => [
      ...prev,
      {
        projectId: unselectedProj ? unselectedProj._id : '',
        projectName: unselectedProj ? unselectedProj.name : '',
        points: [{ point: '', hoursSpent: 1, status: 'Completed' }]
      }
    ]);
  };

  const handleRemoveProjectBlock = (blockIndex) => {
    if (projectBlocks.length > 1) {
      setProjectBlocks((prev) => prev.filter((_, idx) => idx !== blockIndex));
    }
  };

  const handleProjectSelect = (blockIndex, projId) => {
    const found = availableProjects.find((p) => p._id === projId);
    setProjectBlocks((prev) => {
      const next = [...prev];
      next[blockIndex].projectId = projId;
      next[blockIndex].projectName = found ? found.name : '';
      return next;
    });
  };

  const handleSubmitWorkUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formattedUpdates = projectBlocks.map((block) => ({
      project: block.projectId,
      projectName: block.projectName,
      updates: block.points.map((pt) => ({
        point: pt.point,
        hoursSpent: parseFloat(pt.hoursSpent) || 0,
        status: pt.status
      }))
    }));

    try {
      const payload = {
        date: submitFormDate,
        projectUpdates: formattedUpdates,
        overallSummary,
        action: 'submit',
        employeeId: !isEmployeeRole && submitEmployeeId !== currentUser?._id ? submitEmployeeId : undefined
      };

      await fetchApi('/work-updates', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMsg('Work update submitted successfully!');
      setIsSubmitModalOpen(false);
      loadWorkUpdates();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Error submitting work update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenVerifyModal = (empUpdateBlock, projInfo) => {
    setSelectedUpdateToVerify({ ...empUpdateBlock, projectInfo: projInfo });
    setVerifyStatus(empUpdateBlock.submissionStatus === 'Verified' ? 'Verified' : 'Verified');
    setVerifyRemarks(empUpdateBlock.verificationRemarks || '');
    setIsVerifyModalOpen(true);
  };

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
          projectId: selectedUpdateToVerify.projectId || (selectedUpdateToVerify.projectInfo ? selectedUpdateToVerify.projectInfo._id : undefined),
          projectUpdateId: selectedUpdateToVerify.projectUpdateId
        })
      });

      setSuccessMsg(`Work update status marked as ${verifyStatus} with TL remarks.`);
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

  // Filter Grouped Projects
  const filteredProjects = groupedData.projects.filter((pGroup) => {
    if (selectedProjectFilter !== 'ALL' && pGroup.project._id !== selectedProjectFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchProject = pGroup.project.name.toLowerCase().includes(q) || (pGroup.project.projectId && pGroup.project.projectId.toLowerCase().includes(q));
      const matchEmp = pGroup.employees.some(
        (empBlock) =>
          empBlock.employee?.name?.toLowerCase().includes(q) ||
          empBlock.employee?.username?.toLowerCase().includes(q) ||
          empBlock.updates.some((u) => u.point.toLowerCase().includes(q))
      );
      return matchProject || matchEmp;
    }

    return true;
  });

  const formattedDateStr = React.useMemo(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [selectedDate]);

  const myDailyRecord = groupedData.stats?.myDailyRecord;
  const isDraftState = myDailyRecord?.submissionStatus === 'Draft';
  const isSubmittedState = myDailyRecord?.submissionStatus === 'Submitted';
  const isTLVerifiedState = myDailyRecord?.submissionStatus === 'TL Verified';
  const isVerifiedState = myDailyRecord?.submissionStatus === 'Verified';
  const isNeedsRevisionState = myDailyRecord?.submissionStatus === 'Needs Revision';

  return (
    <div className="work-updates-container space-y-3.5 sm:space-y-4 pb-8 text-slate-800">
      {/* Toast Messages */}
      {successMsg && (
        <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">✓</div>
            <p className="leading-snug">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-black shrink-0 ml-2">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0">!</div>
            <p className="leading-snug">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 font-black shrink-0 ml-2">✕</button>
        </div>
      )}

      {/* 1. TOP HEADER CARD (Fully Mobile Responsive) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 lg:gap-4 w-full">
        {/* Left Side: Icon, Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 text-slate-600 hover:text-[#09233d] hover:bg-slate-100 rounded-xl border border-slate-200 shrink-0 transition-colors"
              title="Toggle sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-[#0d6e49] flex items-center justify-center shrink-0 border border-emerald-200/50 shadow-2xs">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0d6e49]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-black text-[#09233d] tracking-tight truncate">
              {isEmployeeRole ? 'My Work Updates' : 'Work Updates'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
              {isEmployeeRole
                ? 'Select a project to write update points, save drafts, and submit when complete.'
                : 'Track and manage project work updates, staff submissions and verification status.'}
            </p>
          </div>
        </div>

        {/* Right Side: Toolbar Controls (All 4 in a SINGLE ROW on desktop) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 text-xs w-full lg:w-auto shrink-0 flex-wrap lg:flex-nowrap">
          {/* Date Navigator Box */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl p-0.5 sm:p-1 font-bold text-[#09233d] shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-1.5 sm:px-2 py-1 hover:bg-white rounded-lg text-slate-500 hover:text-[#09233d] transition-colors text-xs font-black"
              title="Previous Day"
            >
              ‹
            </button>
            <div className="relative flex items-center gap-1 px-1 sm:px-1.5 text-xs font-extrabold text-[#09233d] cursor-pointer whitespace-nowrap">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10.5px] sm:text-xs">{formattedDateStr}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setActiveProjectForEmployee(null);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={handleNextDay}
              className="px-1.5 sm:px-2 py-1 hover:bg-white rounded-lg text-slate-500 hover:text-[#09233d] transition-colors text-xs font-black"
              title="Next Day"
            >
              ›
            </button>
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            className="flex-1 sm:flex-initial min-w-[120px] sm:min-w-[130px] px-2 sm:px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875] cursor-pointer truncate"
          >
            <option value="ALL">All My Projects ({groupedData.projects.length})</option>
            {(isEmployeeRole
              ? groupedData.projects.map((g) => g.project)
              : availableProjects
            ).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.projectId || 'PRJ'})
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial min-w-[110px] sm:w-36">
            <input
              type="text"
              placeholder={isEmployeeRole ? 'Search...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-bold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Action Button */}
          {isEmployeeRole ? (
            <button
              type="button"
              onClick={handleSubmitAllEmployeeUpdates}
              disabled={submittingDaily}
              className="w-full sm:w-auto bg-[#0d6e49] hover:bg-[#128a5c] text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {submittingDaily ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>Submit Daily Work Update</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenSubmitModal(selectedProjectForDetail?.project?._id)}
              className="w-full sm:w-auto bg-[#0d6e49] hover:bg-[#128a5c] text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Work Update</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. VIEW NAVIGATION TABS ("By Project" vs "By Employee") */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('by-project');
            setSelectedProjectForDetail(null);
            setSelectedEmployeeForDetail(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'by-project'
              ? 'bg-[#0d6e49] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>By Project</span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
            activeTab === 'by-project' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {groupedData.projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('by-employee');
            setSelectedProjectForDetail(null);
            setSelectedEmployeeForDetail(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'by-employee'
              ? 'bg-[#0d6e49] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>By Employee</span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
            activeTab === 'by-employee' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {filteredEmployeesList.length}
          </span>
        </button>
      </div>

      {/* -------------------- MAIN DISPLAY VIEWS -------------------- */}
      {activeTab === 'by-employee' ? (
        /* ==================== BY EMPLOYEE TAB VIEW ==================== */
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-10 sm:p-12 border border-slate-200/80 text-center">
              <div className="w-8 h-8 border-4 border-[#0d6e49] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading employee work updates...</p>
            </div>
          ) : selectedEmployeeForDetail ? (
            /* LEVEL 2: DETAILED PROJECTS WORKED & UPDATE POINTS FOR SELECTED EMPLOYEE */
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Back Header Bar */}
              <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeForDetail(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>←</span>
                    <span>Back to Employees List</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#0d6e49] text-white font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                      {selectedEmployeeForDetail.employee?.name ? selectedEmployeeForDetail.employee.name.charAt(0).toUpperCase() : 'E'}
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-black text-[#09233d] truncate">
                        {selectedEmployeeForDetail.employee?.name}
                      </h2>
                      <span className="text-[10px] text-slate-400 font-medium block truncate">
                        {selectedEmployeeForDetail.employee?.designation || selectedEmployeeForDetail.employee?.department || 'Staff'} • {selectedEmployeeForDetail.employee?.username || 'Member'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                    selectedEmployeeForDetail.submissionStatus === 'Verified'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : selectedEmployeeForDetail.submissionStatus === 'Submitted'
                      ? 'bg-sky-100 border-sky-300 text-sky-800'
                      : selectedEmployeeForDetail.submissionStatus === 'Needs Revision'
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : selectedEmployeeForDetail.submissionStatus === 'Draft'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {selectedEmployeeForDetail.submissionStatus === 'No Update'
                      ? 'No Update Written'
                      : `Status: ${selectedEmployeeForDetail.submissionStatus}`}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                    {selectedEmployeeForDetail.projects.length} Project(s) Worked
                  </span>
                </div>
              </div>

              {/* Projects Worked List */}
              {selectedEmployeeForDetail.projects.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-500">
                    No project work updates logged by {selectedEmployeeForDetail.employee?.name} on {selectedDate}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEmployeeForDetail.projects.map((projBlock, pIdx) => (
                    <div
                      key={projBlock.project._id || pIdx}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:border-emerald-400 transition-all flex flex-col justify-between"
                    >
                      {/* Card Top Banner */}
                      <div className="p-3 bg-[#0d6e49] text-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs text-white font-black flex items-center justify-center text-xs shrink-0">
                            {projBlock.project.name ? projBlock.project.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-white truncate">
                            {projBlock.project.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 text-[9.5px] font-black rounded-md shrink-0 shadow-2xs ${
                            (projBlock.submissionStatus || 'Submitted') === 'Verified'
                              ? 'bg-emerald-900 text-emerald-200'
                              : (projBlock.submissionStatus || 'Submitted') === 'Needs Revision'
                              ? 'bg-amber-900 text-amber-200'
                              : (projBlock.submissionStatus || 'Submitted') === 'Rejected'
                              ? 'bg-rose-900 text-rose-200'
                              : 'bg-white/20 text-white'
                          }`}>
                            {projBlock.submissionStatus || 'Submitted'}
                          </span>
                          <span className="px-2 py-0.5 bg-white/20 text-white font-mono font-bold text-[10px] rounded-md backdrop-blur-xs shrink-0">
                            {projBlock.project.projectId || 'PRJ'}
                          </span>
                        </div>
                      </div>

                      {/* Point-wise updates */}
                      <div className="p-3.5 space-y-3 flex-1">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>Update Points ({projBlock.updates.length}):</span>
                        </div>

                        <div className="bg-slate-50 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden text-xs">
                          {projBlock.updates.map((pt, ptIdx) => (
                            <div key={ptIdx} className="p-2.5 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0d6e49] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {ptIdx + 1}
                                </span>
                                <span className="font-semibold text-slate-800 leading-snug">
                                  {pt.point}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 text-[9.5px] font-bold rounded shrink-0 ${
                                  pt.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pt.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {pt.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Remarks Inside Approved Card */}
                        {(projBlock.verificationRemarks || projBlock.verifiedBy) && (
                          <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center justify-between text-emerald-950 font-bold">
                              <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-black">TL Remarks:</span>
                              {projBlock.verifiedAt && (
                                <span className="text-[9px] text-emerald-700 font-medium">
                                  {new Date(projBlock.verifiedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-emerald-950 italic">
                              "{projBlock.verificationRemarks || 'Verified without remarks'}"
                            </p>
                            {projBlock.verifiedBy && (
                              <span className="text-[9.5px] font-extrabold text-emerald-700 block">
                                By: {projBlock.verifiedBy.name || 'Team Lead'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* TL / Manager Verify Action Button - Small Right Corner */}
                        {!isEmployeeRole && selectedEmployeeForDetail.updateRecordId && (
                          <div className="flex justify-end pt-1">
                            {renderVerifyButton(projBlock.submissionStatus, () =>
                              handleOpenVerifyModal(
                                {
                                  updateRecordId: selectedEmployeeForDetail.updateRecordId,
                                  projectUpdateId: projBlock.projectUpdateId,
                                  projectId: projBlock.project._id,
                                  updateId: selectedEmployeeForDetail.updateId,
                                  employee: selectedEmployeeForDetail.employee,
                                  submissionStatus: projBlock.submissionStatus || 'Submitted',
                                  verificationRemarks: projBlock.verificationRemarks || '',
                                  updates: projBlock.updates
                                },
                                projBlock.project
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Overall Summary */}
                      {selectedEmployeeForDetail.overallSummary && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Summary Notes:</span>
                          <p className="font-medium text-slate-700 italic">{selectedEmployeeForDetail.overallSummary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* LEVEL 1: EMPLOYEE CARDS GRID */
            <div className="space-y-3">
              {filteredEmployeesList.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-black text-[#09233d]">No Employee Work Updates Found</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
                    There are no staff update entries matching your selected date ({selectedDate}) and search/filter criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredEmployeesList.map((empRecord) => {
                    const { employee, projects, submissionStatus } = empRecord;
                    const hasUpdates = projects.length > 0;

                    return (
                      <div
                        key={employee._id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-emerald-400 hover:shadow-md flex flex-col justify-between group"
                      >
                        {/* Top Solid Green Card Header */}
                        <div className="p-3 bg-[#0d6e49] text-white space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs text-white font-black flex items-center justify-center text-xs shrink-0">
                                {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-black tracking-tight text-white truncate">
                                  {employee.name}
                                </h3>
                                <span className="text-[10px] text-emerald-100/90 font-medium block truncate">
                                  {employee.designation || employee.department || 'Staff Member'}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 text-[9.5px] font-black rounded-md shrink-0 shadow-2xs ${
                              submissionStatus === 'Verified'
                                ? 'bg-emerald-900 text-emerald-200'
                                : submissionStatus === 'Submitted'
                                ? 'bg-sky-900 text-sky-200'
                                : submissionStatus === 'Needs Revision'
                                ? 'bg-amber-900 text-amber-200'
                                : submissionStatus === 'Draft'
                                ? 'bg-amber-800 text-amber-100'
                                : 'bg-[#08422c] text-emerald-200/60'
                            }`}>
                              {submissionStatus === 'No Update' ? 'No Submission' : submissionStatus}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3.5 bg-white space-y-3 flex-1 flex flex-col justify-between">
                          {hasUpdates ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span>Projects Worked:</span>
                                <span className="text-xs font-black text-[#09233d]">{projects.length} Project(s)</span>
                              </div>

                              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
                                {projects.map((pBlock, pIdx) => (
                                  <div key={pIdx} className="flex items-center justify-between text-slate-800 text-[11px] py-0.5">
                                    <span className="font-extrabold text-[#09233d] truncate flex-1">• {pBlock.project.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1.5 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                      {pBlock.updates.length} point(s)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <p className="text-xs font-semibold text-slate-400">
                                No work updates submitted by this employee for today.
                              </p>
                            </div>
                          )}

                          {/* View Projects & Update Points Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForDetail(empRecord)}
                            className="w-full py-2 px-3 bg-[#f3fbf6] hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs font-extrabold text-[#0d6e49] transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center gap-1.5 min-w-0">
                              <svg className="w-4 h-4 text-[#0d6e49] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="truncate">View Projects & Update Points</span>
                            </span>
                            <span className="text-xs transition-transform group-hover:translate-x-1 shrink-0">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : isEmployeeRole ? (
        /* ==================== EMPLOYEE ROLE VIEW ==================== */
        <div className="space-y-4">
          {/* Daily Status Banner for Employee */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isVerifiedState
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : isSubmittedState
              ? 'bg-sky-50/90 border-sky-200 text-sky-950'
              : isNeedsRevisionState
              ? 'bg-amber-50/90 border-amber-200 text-amber-950'
              : isDraftState
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 sm:mt-0 ${
                isVerifiedState
                  ? 'bg-emerald-500 text-white'
                  : isSubmittedState
                  ? 'bg-sky-500 text-white'
                  : isNeedsRevisionState
                  ? 'bg-amber-500 text-white'
                  : isDraftState
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {isVerifiedState ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isSubmittedState ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : isNeedsRevisionState ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : isDraftState ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-black tracking-tight">
                  {isVerifiedState
                    ? 'Daily Work Update Verified by Team Lead'
                    : isSubmittedState
                    ? 'Daily Work Update Submitted'
                    : isNeedsRevisionState
                    ? 'Work Update Needs Revision'
                    : isDraftState
                    ? 'Draft Updates Saved (Not Submitted Yet)'
                    : 'No Work Updates Saved For Today Yet'}
                </h3>
                <p className="text-[11px] font-medium opacity-80 leading-snug">
                  {isVerifiedState
                    ? `Verified on ${myDailyRecord?.verifiedAt ? new Date(myDailyRecord.verifiedAt).toLocaleDateString() : 'today'}. Work update is locked from further editing. ${myDailyRecord?.verificationRemarks ? `Manager Remarks: "${myDailyRecord.verificationRemarks}"` : ''}`
                    : isSubmittedState
                    ? 'Your daily submission is under review. You can edit your points anytime before final verification.'
                    : isTLVerifiedState
                    ? 'Your daily submission has been verified by your Team Lead and is pending Manager approval. You can still edit if needed.'
                    : isNeedsRevisionState
                    ? `TL Remarks: "${myDailyRecord?.verificationRemarks || 'Please review and update points.'}"`
                    : isDraftState
                    ? 'You have saved draft updates. Open projects to add or edit points, then click "Submit All Updates" when done.'
                    : 'Click on any project below to start writing your daily update points.'}
                </p>
              </div>
            </div>

            {/* Banner Quick Submit / Edit Action */}
            {!isVerifiedState && (
              <button
                type="button"
                onClick={handleSubmitAllEmployeeUpdates}
                disabled={submittingDaily}
                className="w-full sm:w-auto px-4 py-2 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 text-center disabled:opacity-50"
              >
                {submittingDaily
                  ? 'Submitting...'
                  : (isSubmittedState || isTLVerifiedState)
                  ? 'Edit & Re-submit Update →'
                  : 'Submit All Updates →'}
              </button>
            )}
          </div>

          {/* LEVEL 2: ACTIVE PROJECT POINT EDITOR FOR EMPLOYEE */}
          {activeProjectForEmployee ? (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4 animate-in fade-in duration-150">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveProjectForEmployee(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>←</span>
                    <span>Back to Projects List</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#0d6e49] text-white font-black text-xs flex items-center justify-center shrink-0">
                      {activeProjectForEmployee.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-[#09233d] truncate">
                      {activeProjectForEmployee.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-slate-100 font-mono text-slate-600 font-bold text-[10px] rounded-md border border-slate-200 shrink-0">
                      {activeProjectForEmployee.projectId || 'PRJ'}
                    </span>
                  </div>
                </div>

                {!isVerifiedState && (
                  <div className="w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSaveEmployeeDraft}
                      disabled={savingDraft}
                      className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50 text-center"
                    >
                      {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                    </button>
                  </div>
                )}
              </div>

              {/* Locked Notice if Verified */}
              {isVerifiedState && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <span>🔒</span>
                  <span>This work update has been verified and approved by your Manager. Editing is locked.</span>
                </div>
              )}

              {/* Point-Wise Form Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-black text-[#09233d] uppercase tracking-wider">
                    Point-Wise Work Updates for {activeProjectForEmployee.name}
                  </span>
                  {!isVerifiedState && (
                    <button
                      type="button"
                      onClick={handleAddEmployeePoint}
                      className="text-xs font-black text-[#0d6e49] hover:text-emerald-800 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      + Add Point
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {employeePoints.map((pt, pIdx) => (
                    <div key={pIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0d6e49] font-black text-xs flex items-center justify-center shrink-0">
                          {pIdx + 1}
                        </span>

                        <input
                          type="text"
                          disabled={isVerifiedState}
                          placeholder="Enter point-wise task description..."
                          value={pt.point}
                          onChange={(e) => handleUpdateEmployeePoint(pIdx, 'point', e.target.value)}
                          className="flex-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                        <select
                          disabled={isVerifiedState}
                          value={pt.status}
                          onChange={(e) => handleUpdateEmployeePoint(pIdx, 'status', e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#20b875] disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                        </select>

                        {!isVerifiedState && employeePoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployeePoint(pIdx)}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
                            title="Remove Point"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Project Notes */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Additional Remarks / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  disabled={isVerifiedState}
                  placeholder="Notes, links to pull requests, or blockers..."
                  value={employeeSummary}
                  onChange={(e) => setEmployeeSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875] disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveProjectForEmployee(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  ← Save & Back to Projects
                </button>

                {!isVerifiedState && (
                  <button
                    type="button"
                    onClick={handleSaveEmployeeDraft}
                    disabled={savingDraft}
                    className="w-full sm:w-auto px-5 py-2 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 text-center"
                  >
                    {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* LEVEL 1: EMPLOYEE PROJECT CARDS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredProjects.map((pGroup) => {
                const { project, employees } = pGroup;
                const empBlock = employees.find(
                  (e) => e.employee?._id?.toString() === currentUser?._id?.toString()
                );
                const hasMyUpdate = empBlock && empBlock.updates && empBlock.updates.length > 0;
                const totalProjHours = hasMyUpdate
                  ? empBlock.updates.reduce((sum, u) => sum + (u.hoursSpent || 0), 0)
                  : 0;

                return (
                  <div
                    key={project._id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Top Solid Dark Green Card Header */}
                    <div className="p-3 bg-[#0d6e49] text-white space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs text-white font-black flex items-center justify-center text-sm shrink-0">
                            {project.name ? project.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <h3 className="text-sm font-black tracking-tight text-white truncate">
                            {project.name}
                          </h3>
                        </div>

                        <span className="px-2 py-0.5 bg-white/20 text-white font-mono font-bold text-[10px] rounded-md backdrop-blur-xs shrink-0">
                          {project.projectId || 'PRJ'}
                        </span>
                      </div>

                      {/* Status Tag on Project Card */}
                      <div>
                        {hasMyUpdate ? (
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full inline-flex items-center gap-1.5 shadow-2xs ${
                            empBlock.submissionStatus === 'Verified'
                              ? 'bg-emerald-900 text-emerald-200'
                              : empBlock.submissionStatus === 'Submitted'
                              ? 'bg-sky-900 text-sky-200'
                              : 'bg-[#08422c] text-emerald-100'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>
                              {empBlock.submissionStatus === 'Draft'
                                ? `Draft Saved (${empBlock.updates.length} pts)`
                                : empBlock.submissionStatus === 'Submitted'
                                ? `Submitted (${empBlock.updates.length} pts)`
                                : empBlock.submissionStatus === 'Verified'
                                ? `Verified (${empBlock.updates.length} pts)`
                                : `Updated (${empBlock.updates.length} pts)`}
                            </span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#08422c] text-emerald-100/80 text-[10px] font-medium rounded-full inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>No Updates Written Yet</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body & Preview of Points */}
                    <div className="p-3.5 bg-white space-y-3 flex-1 flex flex-col justify-between">
                      {hasMyUpdate ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Saved Bullet Points:
                          </span>
                          <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200/70 text-xs">
                            {empBlock.updates.slice(0, 3).map((u, uIdx) => (
                              <div key={uIdx} className="flex items-center justify-between text-slate-800 text-[11px]">
                                <span className="truncate flex-1">• {u.point}</span>
                              </div>
                            ))}
                            {empBlock.updates.length > 3 && (
                              <p className="text-[10px] text-emerald-700 font-bold pt-0.5">
                                +{empBlock.updates.length - 3} more point(s)
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-xs font-semibold text-slate-400">
                            Click below to write your work update bullet points for this project.
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEmployeeProjectEditor(pGroup)}
                        className="w-full py-2 px-3 bg-[#f3fbf6] hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs font-extrabold text-[#0d6e49] transition-colors cursor-pointer group"
                      >
                        <span>{hasMyUpdate ? 'Edit Project Updates' : 'Write Project Update'}</span>
                        <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==================== TEAM LEAD / MANAGER / ADMIN VIEW ==================== */
        <div className="space-y-4">
          {/* 2. STATS OVERVIEW BAR (Responsive Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Active Projects */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0 border border-emerald-100">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Active Projects</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-[#09233d]">{groupedData.stats.activeProjectsWithUpdates}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-400">/ {groupedData.stats.totalProjects}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Staff Submitted */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 border border-blue-100">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Staff Submitted</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-[#09233d]">{groupedData.stats.totalEmployeesSubmitted}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500">Staff</span>
                </div>
              </div>
            </div>

            {/* Card 3: Verified by TL */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black shrink-0 border border-emerald-200">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Verified by TL</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-[#09233d]">{groupedData.stats.totalVerified}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-600">Verified</span>
                </div>
              </div>
            </div>

            {/* Card 4: Pending Verification */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0 border border-amber-200/60">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 truncate">Pending Verification</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-amber-600">{groupedData.stats.totalPending}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-600">Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MAIN CONTENT VIEW FOR TL / MANAGER */}
          {loading ? (
            <div className="bg-white rounded-2xl p-10 sm:p-12 border border-slate-200/80 text-center">
              <div className="w-8 h-8 border-4 border-[#0d6e49] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Loading team project work updates...</p>
            </div>
          ) : selectedProjectForDetail ? (
            /* LEVEL 2: DETAILED EMPLOYEE CARDS VIEW FOR CLICKED PROJECT (3 PER ROW) */
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Back Header Bar */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForDetail(null)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>←</span>
                    <span>Back to All Projects</span>
                  </button>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#0d6e49] text-white font-black text-xs flex items-center justify-center shrink-0">
                      {selectedProjectForDetail.project?.name ? selectedProjectForDetail.project.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <h2 className="text-xs sm:text-sm font-black text-[#09233d] truncate">
                      {selectedProjectForDetail.project?.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-slate-100 font-mono text-slate-600 font-bold text-[10px] rounded-md border border-slate-200 shrink-0">
                      {selectedProjectForDetail.project?.projectId || 'PRJ'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-center w-full sm:w-auto">
                    {selectedProjectForDetail.totalEmployees} Employee(s) Logged
                  </span>
                </div>
              </div>

              {/* DETAILED EMPLOYEES WORK UPDATE CARDS GRID */}
              {selectedProjectForDetail.employees.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 text-center space-y-3">
                  <p className="text-xs font-bold text-slate-500">No staff work update submissions for {selectedProjectForDetail.project.name} on selected date.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenSubmitModal(selectedProjectForDetail.project._id)}
                    className="px-4 py-2 bg-[#0d6e49] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Submit Update Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {selectedProjectForDetail.employees.map((empBlock) => {
                    const {
                      updateRecordId,
                      updateId,
                      employee,
                      updates,
                      overallSummary: empSummary,
                      submissionStatus,
                      verifiedBy,
                      verificationRemarks,
                      verifiedAt,
                      totalHours: empTotalHours
                    } = empBlock;

                    const isVerified = submissionStatus === 'Verified';
                    const isNeedsRevision = submissionStatus === 'Needs Revision';
                    const isRejected = submissionStatus === 'Rejected';

                    return (
                      <div
                        key={updateRecordId + (employee?._id || '')}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-3">
                          {/* Employee Header */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                                {employee?.name ? employee.name.charAt(0).toUpperCase() : 'E'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-[#09233d] truncate">
                                  {employee?.name || 'Staff Member'}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium block truncate">
                                  {employee?.designation || employee?.department || 'Staff'} • Ref: {updateId || 'WUP'}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isVerified && (
                                <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[9.5px] font-black block">
                                  Verified
                                </span>
                              )}
                              {isNeedsRevision && (
                                <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-[9.5px] font-black block">
                                  Revision
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-[9.5px] font-black block">
                                  Rejected
                                </span>
                              )}
                              {!isVerified && !isNeedsRevision && !isRejected && (
                                <span className="px-2 py-0.5 bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-[9.5px] font-black block">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* TL / Manager Verify Action Button - Small Right Corner */}
                          <div className="flex justify-end pt-0.5">
                            {renderVerifyButton(submissionStatus, () =>
                              handleOpenVerifyModal(empBlock, selectedProjectForDetail.project)
                            )}
                          </div>

                          {/* Point-Wise Work Updates List */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              <span>Work Update Points:</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden text-xs">
                              {updates.map((pt, pIdx) => (
                                <div key={pIdx} className="p-2 flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#0d6e49] font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                                      {pIdx + 1}
                                    </span>
                                    <span className="font-semibold text-slate-800 leading-snug">
                                      {pt.point}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 text-[9.5px]">
                                    <span
                                      className={`px-1.5 py-0.5 font-bold rounded ${
                                        pt.status === 'Completed'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : pt.status === 'In Progress'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {pt.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Daily Summary Notes */}
                          {empSummary && (
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Notes:</span>
                              <p className="font-medium text-slate-700 italic">{empSummary}</p>
                            </div>
                          )}
                        </div>

                        {/* Team Lead Remarks Display */}
                        {(verificationRemarks || verifiedBy) && (
                          <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl text-xs space-y-1 mt-auto">
                            <div className="flex items-center justify-between text-emerald-950 font-bold">
                              <span>TL Remarks:</span>
                              {verifiedAt && (
                                <span className="text-[9px] text-emerald-700 font-normal">
                                  {new Date(verifiedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-emerald-950 italic">
                              "{verificationRemarks || 'Verified without remarks'}"
                            </p>
                            {verifiedBy && (
                              <span className="text-[9.5px] font-bold text-emerald-700 block">
                                By: {verifiedBy.name || 'Team Lead'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* LEVEL 1: PROJECT CARDS VIEW FOR TL / MANAGER */
            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 text-center space-y-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-black text-[#09233d]">No Work Updates Found</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
                    There are no project update submissions matching your selected date ({selectedDate}) and filter criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenSubmitModal()}
                    className="px-4 py-2 bg-[#0d6e49] text-white rounded-xl text-xs font-extrabold cursor-pointer"
                  >
                    Submit Work Update
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredProjects.map((pGroup) => {
                    const { project, employees, totalEmployees, totalHours } = pGroup;
                    const hasSubmissions = employees.length > 0;
                    const progressPercentage = hasSubmissions
                      ? Math.min(100, Math.round((totalHours / 6) * 100))
                      : 0;

                    return (
                      <div
                        key={project._id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-emerald-400 hover:shadow-md flex flex-col justify-between group"
                      >
                        {/* Top Solid Green Card Header */}
                        <div className="p-3 bg-[#0d6e49] text-white space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs text-white font-black flex items-center justify-center text-sm shrink-0">
                                {project.name ? project.name.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <h3 className="text-sm font-black tracking-tight text-white truncate">
                                {project.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 bg-white/20 text-white font-mono font-bold text-[10px] rounded-md backdrop-blur-xs">
                                {project.projectId || 'PRJ-001'}
                              </span>
                              {project.priority && (
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md backdrop-blur-xs ${
                                    project.priority === 'Critical' || project.priority === 'High'
                                      ? 'bg-rose-500/90 text-white'
                                      : 'bg-amber-400/90 text-amber-950'
                                  }`}
                                >
                                  {project.priority}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Small Status Tag on Project Card */}
                          <div>
                            {hasSubmissions ? (
                              <span className="px-2.5 py-0.5 bg-[#08422c] text-emerald-100 text-[10px] font-bold rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{employees.length} Staff Submission(s) Logged</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-[#08422c] text-emerald-100/90 text-[10px] font-medium rounded-full inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>No Work Updates Today</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body with Stat Box & Progress Bar */}
                        <div className="p-3 bg-white space-y-3 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-1 gap-2">
                            {/* Box 1: Staff Worked */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-medium text-slate-400 block truncate">Staff Worked</span>
                                <span className="text-xs font-black text-[#09233d] truncate block">{totalEmployees} Staff</span>
                              </div>
                            </div>
                          </div>

                          {/* Today's Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                              <span>Today's Progress</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0d6e49] rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* View Detailed Work Update Points Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedProjectForDetail(pGroup)}
                            className="w-full py-2 px-3 bg-[#f3fbf6] hover:bg-emerald-100/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs font-bold text-[#0d6e49] transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <svg className="w-4 h-4 text-[#0d6e49] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate">View Detailed Work Update Points</span>
                            </span>
                            <span className="text-xs transition-transform group-hover:translate-x-1 shrink-0">→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SUBMIT WORK UPDATE MODAL (TL / MANAGER) -------------------- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 my-auto max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#09233d]">Submit Work Update</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Add point-wise work updates for projects worked on.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitWorkUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Update Date
                  </label>
                  <input
                    type="date"
                    required
                    value={submitFormDate}
                    onChange={(e) => setSubmitFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                  />
                </div>

                {/* Target Employee */}
                {!isEmployeeRole && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Submitting For Staff Member
                    </label>
                    <select
                      value={submitEmployeeId}
                      onChange={(e) => setSubmitEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                    >
                      <option value={currentUser?._id}>Myself ({currentUser?.name})</option>
                      {availableEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.username || emp.employeeId || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Project Work Blocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#09233d] uppercase tracking-wider">
                    Project Work & Point-Wise Updates
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProjectBlock}
                    className="text-xs font-extrabold text-[#0d6e49] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Add Another Project
                  </button>
                </div>

                {projectBlocks.map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Select Project #{bIdx + 1}
                        </label>
                        <select
                          required
                          value={block.projectId}
                          onChange={(e) => handleProjectSelect(bIdx, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                        >
                          <option value="">-- Select Project --</option>
                          {availableProjects.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.projectId || 'PRJ'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {projectBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectBlock(bIdx)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors mt-3 cursor-pointer"
                          title="Remove Project Block"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Point-wise List */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Update Points (Bullet Items)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddPoint(bIdx)}
                          className="text-xs font-black text-[#0d6e49] hover:text-emerald-800 cursor-pointer"
                        >
                          + Add Point
                        </button>
                      </div>

                      {block.points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px] flex items-center justify-center shrink-0">
                              {pIdx + 1}
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="Enter point-wise work description..."
                              value={pt.point}
                              onChange={(e) => handleUpdatePointText(bIdx, pIdx, 'point', e.target.value)}
                              className="flex-1 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                            />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                            <select
                              value={pt.status}
                              onChange={(e) => handleUpdatePointText(bIdx, pIdx, 'status', e.target.value)}
                              className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                            >
                              <option value="Completed">Completed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                            {block.points.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePoint(bIdx, pIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg text-xs cursor-pointer font-bold"
                                title="Remove point"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Summary Notes */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Overall Work Summary / Remarks (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional notes for the day, code commits, PR links, or upcoming blockers..."
                  value={overallSummary}
                  onChange={(e) => setOverallSummary(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0d6e49] hover:bg-[#128a5c] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Submit Work Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- TEAM LEAD VERIFICATION MODAL -------------------- */}
      {isVerifyModalOpen && selectedUpdateToVerify && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#09233d]">Verify Work Update & Add Remarks</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Review submitted points for {selectedUpdateToVerify.employee?.name || 'Staff Member'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Submission Points Summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#09233d]">
                <span>Project: {selectedUpdateToVerify.projectInfo?.name || 'Project'}</span>
                <span className="text-slate-500 font-mono text-[10px]">Ref: {selectedUpdateToVerify.updateId}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Submitted Points:</p>
              <ul className="space-y-1">
                {selectedUpdateToVerify.updates.map((pt, idx) => (
                  <li key={idx} className="flex items-center justify-between text-slate-700 text-[11px]">
                    <span>• {pt.point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Verification Decision */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Verification Decision
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyStatus('Verified')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    verifyStatus === 'Verified'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Verified
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyStatus('Needs Revision')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    verifyStatus === 'Needs Revision'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Needs Revision
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyStatus('Rejected')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    verifyStatus === 'Rejected'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Reject
                </button>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Team Lead Remarks & Feedback
                </label>
                <textarea
                  rows="3"
                  required={verifyStatus !== 'Verified'}
                  placeholder="Enter remarks for employee..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#09233d] focus:outline-none focus:ring-1 focus:ring-[#20b875]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={verifying}
                className="px-5 py-2 bg-[#09233d] hover:bg-[#123659] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {verifying && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Verification</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
