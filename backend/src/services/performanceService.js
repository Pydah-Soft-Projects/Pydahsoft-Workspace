const Task = require('../models/Task');
const TaskReview = require('../models/TaskReview');
const PerformanceRecord = require('../models/PerformanceRecord');
const User = require('../models/User');
const Team = require('../models/Team');

const calculateEmployeePerformance = async (employeeId) => {
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const tasks = await Task.find({ assignedTo: employeeId });
  const totalTasks = tasks.length;

  const approvedTasks = tasks.filter((t) => t.status === 'Approved');
  const completedTasks = approvedTasks.length;

  const now = new Date();
  let onTimeTasks = 0;
  let delayedTasks = 0;
  let totalEstimatedHours = 0;
  let totalActualHours = 0;

  tasks.forEach((t) => {
    totalEstimatedHours += t.estimatedHours || 0;
    totalActualHours += t.actualHours || 0;

    if (t.status === 'Approved') {
      if (!t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate)) {
        onTimeTasks += 1;
      }
    } else if (t.status === 'Delayed' || (t.dueDate && new Date(t.dueDate) < now)) {
      delayedTasks += 1;
    }
  });

  const rejectionsCount = await TaskReview.countDocuments({
    submitter: employeeId,
    status: 'Rejected'
  });

  const completionRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;
  const onTimeRate = completedTasks > 0 ? Number(((onTimeTasks / completedTasks) * 100).toFixed(2)) : 0;
  
  const actHours = Number(totalActualHours.toFixed(2));
  const estHours = Number(totalEstimatedHours.toFixed(2));
  const efficiencyPercentage = actHours > 0 
    ? Number(((estHours / actHours) * 100).toFixed(2)) 
    : (estHours > 0 ? 100 : 0);

  const rejectionRate = totalTasks > 0 ? (rejectionsCount / totalTasks) * 100 : 0;
  const cappedEfficiency = Math.min(efficiencyPercentage, 120);

  let rawScore = (completionRate * 0.35) + (onTimeRate * 0.35) + (cappedEfficiency * 0.20) - (rejectionRate * 0.10);
  const performanceScore = Math.max(0, Math.min(100, Number(rawScore.toFixed(2))));

  const record = await PerformanceRecord.findOneAndUpdate(
    { employee: employeeId },
    {
      totalTasks,
      completedTasks,
      onTimeTasks,
      delayedTasks,
      rejectionsCount,
      estimatedHours: estHours,
      actualHours: actHours,
      completionRate,
      onTimeRate,
      efficiencyPercentage,
      performanceScore,
      lastCalculated: new Date()
    },
    { upsert: true, new: true }
  ).populate('employee', 'name username employeeId department designation role');

  return record;
};

const getTeamPerformance = async (teamId) => {
  const team = await Team.findById(teamId).populate('members', 'name username employeeId department designation');
  if (!team) throw new Error('Team not found');

  const memberIds = team.members.map((m) => m._id);
  const performanceRecords = await Promise.all(
    team.members.map((member) => calculateEmployeePerformance(member._id))
  );

  const totalMembers = performanceRecords.length;
  let sumScore = 0;
  let sumCompletion = 0;
  let sumEfficiency = 0;
  let totalTeamTasks = 0;
  let totalTeamCompleted = 0;

  performanceRecords.forEach((p) => {
    sumScore += p.performanceScore || 0;
    sumCompletion += p.completionRate || 0;
    sumEfficiency += p.efficiencyPercentage || 0;
    totalTeamTasks += p.totalTasks || 0;
    totalTeamCompleted += p.completedTasks || 0;
  });

  return {
    team: {
      _id: team._id,
      name: team.name,
      teamLead: team.teamLead
    },
    metrics: {
      averagePerformanceScore: totalMembers > 0 ? Number((sumScore / totalMembers).toFixed(2)) : 0,
      averageCompletionRate: totalMembers > 0 ? Number((sumCompletion / totalMembers).toFixed(2)) : 0,
      averageEfficiency: totalMembers > 0 ? Number((sumEfficiency / totalMembers).toFixed(2)) : 0,
      totalTasks: totalTeamTasks,
      totalCompletedTasks: totalTeamCompleted
    },
    memberPerformance: performanceRecords
  };
};

module.exports = {
  calculateEmployeePerformance,
  getTeamPerformance
};
