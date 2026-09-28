const WorkUpdate = require('../models/WorkUpdate');
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

// Submit or update a daily work update (Point-wise work updates per project)
// Submit or update a daily work update (Point-wise work updates per project)
const submitWorkUpdate = async (req, res) => {
  try {
    const { date, projectUpdates, overallSummary, employeeId, action, submissionStatus } = req.body;

    if (!projectUpdates || !Array.isArray(projectUpdates) || projectUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one project update with point-wise entries is required' }
      });
    }

    // Determine target employee
    let targetEmployeeId = req.user._id;
    if (employeeId && (req.user.role === 'superadmin' || req.user.role === 'superior' || req.user.role === 'teamlead')) {
      targetEmployeeId = employeeId;
    }

    // Find target employee's team if available
    const userTeam = await Team.findOne({ members: targetEmployeeId });

    // Normalize target date to midnight UTC/local date
    const updateDate = date ? new Date(date) : new Date();
    updateDate.setHours(0, 0, 0, 0);

    const endDate = new Date(updateDate);
    endDate.setDate(endDate.getDate() + 1);

    // Determine target submission status ('Draft' or 'Submitted')
    const targetStatus = (action === 'draft' || submissionStatus === 'Draft') ? 'Draft' : 'Submitted';

    // Format & validate project updates from request
    const sanitizedProjectUpdates = [];

    for (const pUpdate of projectUpdates) {
      if (!pUpdate.project) continue;

      let pName = pUpdate.projectName;
      if (!pName) {
        const proj = await Project.findById(pUpdate.project);
        if (proj) pName = proj.name;
      }

      const validPoints = [];
      if (Array.isArray(pUpdate.updates)) {
        for (const pointObj of pUpdate.updates) {
          const text = typeof pointObj === 'string' ? pointObj : pointObj.point;
          if (text && text.trim()) {
            const hrs = Number(pointObj.hoursSpent) || 0;
            validPoints.push({
              point: text.trim(),
              hoursSpent: hrs,
              status: pointObj.status || 'Completed'
            });
          }
        }
      }

      if (validPoints.length > 0) {
        sanitizedProjectUpdates.push({
          project: pUpdate.project,
          projectName: pName || 'Project Work',
          updates: validPoints
        });
      }
    }

    if (sanitizedProjectUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide valid point-wise work updates' }
      });
    }

    // Check if an entry already exists for this employee on this date
    let existingRecord = await WorkUpdate.findOne({
      employee: targetEmployeeId,
      date: { $gte: updateDate, $lt: endDate }
    });

    if (existingRecord) {
      const isSuperAdminOrSuperior = ['superadmin', 'superior'].includes(req.user.role);

      // Work update is editable UP TO verification: Block edits if fully Verified
      if (existingRecord.submissionStatus === 'Verified' && !isSuperAdminOrSuperior) {
        return res.status(400).json({
          success: false,
          error: { message: 'This work update has already been verified and can no longer be edited.' }
        });
      }
    }

    let mergedProjectUpdates = [];
    if (existingRecord) {
      if (action === 'draft') {
        // Merge with existing project blocks: replace blocks for updated projects, keep others intact
        const updatedProjIds = sanitizedProjectUpdates.map(p => p.project.toString());
        const retainedExisting = existingRecord.projectUpdates.filter(
          pu => pu.project && !updatedProjIds.includes(pu.project._id ? pu.project._id.toString() : pu.project.toString())
        );
        mergedProjectUpdates = [...retainedExisting, ...sanitizedProjectUpdates];
      } else {
        mergedProjectUpdates = sanitizedProjectUpdates;
      }
    } else {
      mergedProjectUpdates = sanitizedProjectUpdates;
    }

    // Calculate total hours logged across all project blocks
    let calculatedTotalHours = 0;
    mergedProjectUpdates.forEach(pu => {
      if (Array.isArray(pu.updates)) {
        pu.updates.forEach(u => {
          calculatedTotalHours += (Number(u.hoursSpent) || 0);
        });
      }
    });

    let savedRecord;

    if (existingRecord) {
      existingRecord.projectUpdates = mergedProjectUpdates;
      existingRecord.overallSummary = overallSummary || existingRecord.overallSummary || '';
      existingRecord.totalHours = calculatedTotalHours;

      if (targetStatus === 'Submitted') {
        existingRecord.submissionStatus = 'Submitted';
        existingRecord.submittedAt = new Date();
        // Reset TL and Manager verification so updated work can be verified fresh
        existingRecord.verifiedBy = null;
        existingRecord.verificationRemarks = '';
        existingRecord.verifiedAt = null;

        existingRecord.projectUpdates.forEach((pu) => {
          if (pu.submissionStatus !== 'Verified') {
            pu.submissionStatus = 'Submitted';
            pu.verifiedBy = null;
            pu.verificationRemarks = '';
            pu.verifiedAt = null;
            pu.tlVerifiedBy = null;
            pu.tlVerificationRemarks = '';
            pu.tlVerifiedAt = null;
            pu.managerVerifiedBy = null;
            pu.managerVerificationRemarks = '';
            pu.managerVerifiedAt = null;
          }
        });
      } else {
        // If user explicitly saves as draft, set status to 'Draft'
        existingRecord.submissionStatus = 'Draft';
        existingRecord.projectUpdates.forEach((pu) => {
          if (pu.submissionStatus !== 'Verified') {
            pu.submissionStatus = 'Draft';
          }
        });
      }

      savedRecord = await existingRecord.save();
    } else {
      const count = await WorkUpdate.countDocuments();
      const generatedUpdateId = `WUP-${String(count + 1).padStart(4, '0')}`;

      savedRecord = await WorkUpdate.create({
        updateId: generatedUpdateId,
        date: updateDate,
        employee: targetEmployeeId,
        team: userTeam ? userTeam._id : null,
        projectUpdates: mergedProjectUpdates,
        overallSummary: overallSummary || '',
        totalHours: calculatedTotalHours,
        submissionStatus: targetStatus,
        submittedAt: targetStatus === 'Submitted' ? new Date() : null
      });
    }

    const populated = await WorkUpdate.findById(savedRecord._id)
      .populate('employee', 'name username employeeId designation department')
      .populate('verifiedBy', 'name username designation')
      .populate('team', 'name teamId')
      .populate('projectUpdates.project', 'name projectId priority status');

    await logAudit({
      entityType: 'WorkUpdate',
      entityId: savedRecord._id,
      action: targetStatus === 'Draft' ? 'SAVE_WORK_UPDATE_DRAFT' : 'SUBMIT_WORK_UPDATE',
      performedBy: req.user._id,
      details: { date: updateDate, totalHours: calculatedTotalHours, status: targetStatus }
    });

    res.status(200).json({
      success: true,
      message: targetStatus === 'Draft' ? 'Work update saved as draft' : 'Work update submitted successfully',
      data: populated
    });
  } catch (error) {
    console.error('[Submit Work Update Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error saving work update' }
    });
  }
};

// Get Work Updates with filtering (date, employee, team, project, status)
const getWorkUpdates = async (req, res) => {
  try {
    const { date, startDate, endDate, employee, project, team, status } = req.query;
    const filter = {};

    // Date filtering
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: sDate, $lte: eDate };
    } else if (date) {
      const sDate = new Date(date);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + 1);
      filter.date = { $gte: sDate, $lt: eDate };
    }

    if (employee) filter.employee = employee;
    if (team) filter.team = team;
    if (status && status !== 'All') filter.submissionStatus = status;

    if (project) {
      filter['projectUpdates.project'] = project;
    }

    // Dynamic Team Lead & Visibility Scoping
    // Check if current user is designated as Team Lead of any team in Team model
    const ledTeams = await Team.find({ teamLead: req.user._id });
    const isTeamLeadOfAnyTeam = ledTeams.length > 0;
    const isSuperiorOrAdmin = ['superadmin', 'superior'].includes(req.user.role);

    if (!isSuperiorOrAdmin && !employee) {
      if (isTeamLeadOfAnyTeam) {
        // Team Lead sees work updates from all members of the teams they lead, plus their own
        const teamMemberIds = [];
        ledTeams.forEach(t => {
          if (Array.isArray(t.members)) {
            t.members.forEach(m => teamMemberIds.push(m.toString()));
          }
        });
        teamMemberIds.push(req.user._id.toString());
        filter.employee = { $in: teamMemberIds };
      } else {
        // Regular employee sees only their own work updates
        filter.employee = req.user._id;
      }
    }

    const updates = await WorkUpdate.find(filter)
      .populate('employee', 'name username employeeId designation department')
      .populate('verifiedBy', 'name username designation')
      .populate('team', 'name teamId teamLead')
      .populate('projectUpdates.project', 'name projectId priority status')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: updates,
      count: updates.length,
      message: 'Work updates fetched successfully'
    });
  } catch (error) {
    console.error('[Get Work Updates Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching work updates' }
    });
  }
};

// Get Work Updates Grouped by Project (Primary display for Work Reports & Updates page)
const getGroupedWorkUpdates = async (req, res) => {
  try {
    const { date, startDate, endDate, team, employee, status } = req.query;
    const filter = {};

    // Date filtering (defaults to today if neither date nor date range specified)
    if (startDate && endDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: sDate, $lte: eDate };
    } else if (date) {
      const sDate = new Date(date);
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + 1);
      filter.date = { $gte: sDate, $lt: eDate };
    } else {
      // Default to today
      const sDate = new Date();
      sDate.setHours(0, 0, 0, 0);
      const eDate = new Date(sDate);
      eDate.setDate(eDate.getDate() + 1);
      filter.date = { $gte: sDate, $lt: eDate };
    }

    if (employee) filter.employee = employee;
    if (team) filter.team = team;
    if (status && status !== 'All') filter.submissionStatus = status;

    // Dynamic Team Lead & Visibility Scoping
    const isEmployee = req.user.role === 'employee';
    const ledTeams = !isEmployee ? await Team.find({ teamLead: req.user._id }) : [];
    const isTeamLeadOfAnyTeam = ledTeams.length > 0;
    const isSuperiorOrAdmin = ['superadmin', 'superior', 'manager'].includes(req.user.role);

    if (isEmployee) {
      // Regular employee sees ONLY their own work updates
      filter.employee = req.user._id;
    } else if (!isSuperiorOrAdmin && !employee) {
      if (isTeamLeadOfAnyTeam) {
        const teamMemberIds = [];
        ledTeams.forEach(t => {
          if (Array.isArray(t.members)) {
            t.members.forEach(m => teamMemberIds.push(m.toString()));
          }
        });
        teamMemberIds.push(req.user._id.toString());
        filter.employee = { $in: teamMemberIds };

        // Exclude unsubmitted drafts of other team members from TL view unless specifically requested
        if (!status) {
          filter.$or = [
            { employee: req.user._id },
            { submissionStatus: { $ne: 'Draft' } }
          ];
        }
      } else {
        filter.employee = req.user._id;
      }
    } else if (isSuperiorOrAdmin && !employee && !status) {
      filter.$or = [
        { employee: req.user._id },
        { submissionStatus: { $ne: 'Draft' } }
      ];
    }

    const workUpdates = await WorkUpdate.find(filter)
      .populate('employee', 'name username employeeId designation department')
      .populate('verifiedBy', 'name username designation')
      .populate('projectUpdates.verifiedBy', 'name username designation')
      .populate('team', 'name teamId teamLead')
      .populate('projectUpdates.project', 'name projectId priority status')
      .sort({ createdAt: -1 });

    // Fetch projects to display (Team-wise filtering for employees)
    let allProjects = [];
    if (isEmployee) {
      const myTeams = await Team.find({
        $or: [
          { members: req.user._id },
          { teamLead: req.user._id }
        ]
      });

      const myTeamIds = myTeams.map(t => t._id);
      const teamProjectIds = [];
      myTeams.forEach(t => {
        if (Array.isArray(t.projects)) {
          t.projects.forEach(pId => teamProjectIds.push(pId));
        }
      });

      const teamProjects = await Project.find({
        status: { $ne: 'Cancelled' },
        $or: [
          { assignedTeam: { $in: myTeamIds } },
          { _id: { $in: teamProjectIds } }
        ]
      }).sort({ name: 1 });

      if (teamProjects.length > 0) {
        allProjects = teamProjects;
      } else {
        allProjects = await Project.find({ status: { $ne: 'Cancelled' } }).sort({ name: 1 });
      }
    } else {
      allProjects = await Project.find({ status: { $ne: 'Cancelled' } }).sort({ name: 1 });
    }

    // Map projects -> employee updates
    const projectMap = new Map();

    // Initialize map with all projects
    allProjects.forEach((proj) => {
      projectMap.set(proj._id.toString(), {
        project: {
          _id: proj._id,
          name: proj.name,
          projectId: proj.projectId || 'PRJ',
          priority: proj.priority || 'Medium',
          status: proj.status || 'In Progress'
        },
        employees: []
      });
    });

    let totalEmployeesSubmitted = new Set();
    let totalVerifiedCount = 0;
    let totalPendingCount = 0;
    let totalHoursLoggedSum = 0;
    let myDailyRecord = null;

    workUpdates.forEach((record) => {
      if (record.employee && record.employee._id) {
        if (record.employee._id.toString() === req.user._id.toString()) {
          myDailyRecord = record;
        }
        if (record.submissionStatus !== 'Draft') {
          totalEmployeesSubmitted.add(record.employee._id.toString());
        }
      }
      if (record.submissionStatus === 'Verified') totalVerifiedCount++;
      else if (record.submissionStatus === 'Submitted') totalPendingCount++;

      totalHoursLoggedSum += record.totalHours || 0;

      record.projectUpdates.forEach((pu) => {
        const projIdStr = pu.project ? (pu.project._id ? pu.project._id.toString() : pu.project.toString()) : 'unassigned';
        
        let projContainer = projectMap.get(projIdStr);
        if (!projContainer) {
          projContainer = {
            project: {
              _id: pu.project ? (pu.project._id || pu.project) : 'other',
              name: pu.projectName || (pu.project && pu.project.name) || 'General / Other Updates',
              projectId: (pu.project && pu.project.projectId) || 'GENERAL',
              priority: (pu.project && pu.project.priority) || 'Medium',
              status: (pu.project && pu.project.status) || 'Active'
            },
            employees: []
          };
          projectMap.set(projIdStr, projContainer);
        }

        const itemStatus = pu.submissionStatus || record.submissionStatus || 'Submitted';
        const itemVerifiedBy = pu.verifiedBy || record.verifiedBy;
        const itemRemarks = (pu.verificationRemarks !== undefined && pu.verificationRemarks !== '') ? pu.verificationRemarks : (record.verificationRemarks || '');
        const itemVerifiedAt = pu.verifiedAt || record.verifiedAt;

        // Add employee work update block under this project
        projContainer.employees.push({
          updateRecordId: record._id,
          projectUpdateId: pu._id,
          projectId: pu.project ? (pu.project._id || pu.project) : null,
          updateId: record.updateId,
          date: record.date,
          submittedAt: record.submittedAt,
          employee: record.employee,
          team: record.team,
          updates: pu.updates || [],
          overallSummary: record.overallSummary,
          submissionStatus: itemStatus,
          verifiedBy: itemVerifiedBy,
          verificationRemarks: itemRemarks,
          verifiedAt: itemVerifiedAt,
          totalHours: record.totalHours
        });
      });
    });

    // Convert map to array and compute totals per project
    const groupedProjects = Array.from(projectMap.values()).map((pGroup) => {
      const uniqueEmps = new Set(pGroup.employees.map(e => e.employee?._id?.toString()).filter(Boolean));
      const totalProjHours = pGroup.employees.reduce((acc, empBlock) => {
        const projHours = empBlock.updates.reduce((hAcc, u) => hAcc + (u.hoursSpent || 0), 0);
        return acc + projHours;
      }, 0);

      return {
        ...pGroup,
        totalEmployees: uniqueEmps.size,
        totalHours: totalProjHours
      };
    });

    res.status(200).json({
      success: true,
      data: {
        projects: groupedProjects,
        stats: {
          totalProjects: groupedProjects.length,
          activeProjectsWithUpdates: groupedProjects.filter(p => p.employees.length > 0).length,
          totalEmployeesSubmitted: totalEmployeesSubmitted.size,
          totalVerified: totalVerifiedCount,
          totalPending: totalPendingCount,
          totalHoursLogged: Math.round(totalHoursLoggedSum * 10) / 10,
          isUserTeamLead: !isEmployee && (isTeamLeadOfAnyTeam || isSuperiorOrAdmin),
          myDailyRecord: myDailyRecord ? {
            _id: myDailyRecord._id,
            updateId: myDailyRecord.updateId,
            submissionStatus: myDailyRecord.submissionStatus,
            submittedAt: myDailyRecord.submittedAt,
            verifiedBy: myDailyRecord.verifiedBy,
            verificationRemarks: myDailyRecord.verificationRemarks,
            verifiedAt: myDailyRecord.verifiedAt,
            totalHours: myDailyRecord.totalHours,
            overallSummary: myDailyRecord.overallSummary
          } : null
        }
      },
      message: 'Grouped project work updates fetched successfully'
    });
  } catch (error) {
    console.error('[Get Grouped Work Updates Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error fetching grouped work updates' }
    });
  }
};

// Team Lead / Superior / Manager Verification of Work Update
const verifyWorkUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, projectId, projectUpdateId } = req.body;

    const validStatuses = ['Verified', 'Needs Revision', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status must be one of: Verified, Needs Revision, Rejected' }
      });
    }

    const record = await WorkUpdate.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Work update submission not found' }
      });
    }

    // Determine Team Lead vs Manager role for this employee/team
    let targetTeam = record.team;
    if (!targetTeam) {
      targetTeam = await Team.findOne({ members: record.employee });
    } else {
      targetTeam = await Team.findById(record.team);
    }

    const isAssignedTeamLead = targetTeam && targetTeam.teamLead && targetTeam.teamLead.toString() === req.user._id.toString();
    const isTeamLeadRole = req.user.role === 'teamlead' || isAssignedTeamLead;
    const isManagerRole = ['superadmin', 'superior', 'manager'].includes(req.user.role);

    if (!isTeamLeadRole && !isManagerRole) {
      return res.status(403).json({
        success: false,
        error: { message: 'Only Team Leads or Managers can verify work updates' }
      });
    }

    // Target specific project block if projectId or projectUpdateId provided
    let targetBlock = null;
    if (projectUpdateId) {
      targetBlock = record.projectUpdates.id(projectUpdateId);
    } else if (projectId) {
      targetBlock = record.projectUpdates.find(
        (pu) => pu.project && pu.project.toString() === projectId.toString()
      );
    }

    const blocksToVerify = targetBlock ? [targetBlock] : record.projectUpdates;

    for (const block of blocksToVerify) {
      const currentBlockStatus = block.submissionStatus || 'Submitted';

      if (status === 'Verified') {
        if (isTeamLeadRole && !isManagerRole) {
          // TL verifying -> Sets to 'TL Verified'
          block.submissionStatus = 'TL Verified';
          block.tlVerifiedBy = req.user._id;
          block.tlVerificationRemarks = remarks || '';
          block.tlVerifiedAt = new Date();
          block.verifiedBy = req.user._id;
          block.verificationRemarks = remarks || '';
          block.verifiedAt = new Date();
        } else if (isManagerRole && !isAssignedTeamLead) {
          // Manager verifying -> MUST check if TL has verified first!
          if (currentBlockStatus !== 'TL Verified' && currentBlockStatus !== 'Verified') {
            return res.status(400).json({
              success: false,
              error: { message: 'Manager can only verify after Team Lead verification. Waiting for Team Lead to verify first.' }
            });
          }
          block.submissionStatus = 'Verified';
          block.managerVerifiedBy = req.user._id;
          block.managerVerificationRemarks = remarks || '';
          block.managerVerifiedAt = new Date();
          block.verifiedBy = req.user._id;
          block.verificationRemarks = remarks || '';
          block.verifiedAt = new Date();
        } else {
          // User has both TL & Manager capabilities -> If 'Submitted', mark 'TL Verified', if 'TL Verified', mark 'Verified'
          if (currentBlockStatus === 'TL Verified') {
            block.submissionStatus = 'Verified';
            block.managerVerifiedBy = req.user._id;
            block.managerVerificationRemarks = remarks || '';
            block.managerVerifiedAt = new Date();
          } else {
            block.submissionStatus = 'TL Verified';
            block.tlVerifiedBy = req.user._id;
            block.tlVerificationRemarks = remarks || '';
            block.tlVerifiedAt = new Date();
          }
          block.verifiedBy = req.user._id;
          block.verificationRemarks = remarks || '';
          block.verifiedAt = new Date();
        }
      } else {
        // Needs Revision or Rejected
        block.submissionStatus = status;
        block.verificationRemarks = remarks || '';
        block.verifiedBy = req.user._id;
        block.verifiedAt = new Date();
      }
    }

    // Recalculate record-level overall submission status
    const allStatuses = record.projectUpdates.map((pu) => pu.submissionStatus || 'Submitted');
    if (allStatuses.every((s) => s === 'Verified')) {
      record.submissionStatus = 'Verified';
    } else if (allStatuses.every((s) => s === 'TL Verified' || s === 'Verified')) {
      record.submissionStatus = 'TL Verified';
    } else if (allStatuses.some((s) => s === 'Needs Revision')) {
      record.submissionStatus = 'Needs Revision';
    } else if (allStatuses.some((s) => s === 'Rejected')) {
      record.submissionStatus = 'Rejected';
    } else {
      record.submissionStatus = 'Submitted';
    }

    record.verifiedBy = req.user._id;
    record.verificationRemarks = remarks || record.verificationRemarks || '';
    record.verifiedAt = new Date();

    const updatedRecord = await record.save();

    const populated = await WorkUpdate.findById(updatedRecord._id)
      .populate('employee', 'name username employeeId designation department')
      .populate('verifiedBy', 'name username designation')
      .populate('projectUpdates.verifiedBy', 'name username designation')
      .populate('team', 'name teamId teamLead')
      .populate('projectUpdates.project', 'name projectId priority status');

    await logAudit({
      entityType: 'WorkUpdate',
      entityId: updatedRecord._id,
      action: 'VERIFY_WORK_UPDATE',
      performedBy: req.user._id,
      details: { status, remarks, projectId, projectUpdateId }
    });

    res.status(200).json({
      success: true,
      message: `Work update successfully marked as ${status}`,
      data: populated
    });
  } catch (error) {
    console.error('[Verify Work Update Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error verifying work update' }
    });
  }
};

// Delete Work Update
const deleteWorkUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await WorkUpdate.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Work update submission not found' }
      });
    }

    // Permission check: only author or superadmin/superior/TL can delete
    if (
      record.employee.toString() !== req.user._id.toString() &&
      !['superadmin', 'superior', 'teamlead'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this work update' }
      });
    }

    await WorkUpdate.findByIdAndDelete(id);

    await logAudit({
      entityType: 'WorkUpdate',
      entityId: id,
      action: 'DELETE_WORK_UPDATE',
      performedBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Work update deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Work Update Error]:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Error deleting work update' }
    });
  }
};

module.exports = {
  submitWorkUpdate,
  getWorkUpdates,
  getGroupedWorkUpdates,
  verifyWorkUpdate,
  deleteWorkUpdate
};
