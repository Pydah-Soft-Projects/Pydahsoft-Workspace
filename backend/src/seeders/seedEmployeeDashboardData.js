const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Project = require('../models/Project');
const Module = require('../models/Module');
const Task = require('../models/Task');
const PerformanceRecord = require('../models/PerformanceRecord');
const { calculateEmployeePerformance } = require('../services/performanceService');

const seedVamsiData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] MongoDB connected');

    let vamsi = await User.findOne({ username: 'vamsi' });
    if (!vamsi) {
      console.log('[Seeder] vamsi user not found, checking by role employee...');
      vamsi = await User.findOne({ role: 'employee' });
    }

    if (!vamsi) {
      console.error('[Seeder] No employee found to seed data for!');
      process.exit(1);
    }

    // Update vamsi profile details if needed
    vamsi.email = vamsi.email || 'vamsi@pydahsoft.com';
    vamsi.department = 'Engineering Team';
    vamsi.designation = 'Software Engineer';
    await vamsi.save();
    console.log(`[Seeder] Updated profile for employee: ${vamsi.name} (${vamsi._id})`);

    // Ensure Projects exist
    const projectNames = ['Website Development', 'Mobile App', 'Backend API'];
    const projectDocs = {};

    for (const pName of projectNames) {
      let proj = await Project.findOne({ name: pName });
      if (!proj) {
        proj = await Project.create({
          name: pName,
          projectId: pName.replace(/\s+/g, '').slice(0, 4).toUpperCase() + '-01',
          description: `${pName} initiative for PydahSoft`,
          status: 'In Progress',
          progress: pName === 'Website Development' ? 70 : (pName === 'Mobile App' ? 50 : 80),
          createdBy: vamsi._id
        });
        console.log(`[Seeder] Created Project: ${pName}`);
      }
      projectDocs[pName] = proj;
    }

    // Ensure Modules exist
    const moduleDocs = {};
    let modIdx = 100;
    for (const pName of projectNames) {
      let mod = await Module.findOne({ project: projectDocs[pName]._id });
      if (!mod) {
        mod = await Module.create({
          moduleId: `MOD-${++modIdx}`,
          name: `${pName} Core`,
          project: projectDocs[pName]._id,
          description: `Core module for ${pName}`
        });
        console.log(`[Seeder] Created Module for ${pName}`);
      }
      moduleDocs[pName] = mod;
    }

    // Check existing tasks for vamsi
    const existingTasks = await Task.find({ assignedTo: vamsi._id });
    if (existingTasks.length === 0) {
      console.log('[Seeder] Seeding 5 tasks for vamsi matching the reference dashboard...');
      
      const sampleTasks = [
        {
          taskId: 'TSK-101',
          title: 'Design UI for Dashboard',
          project: projectDocs['Website Development']._id,
          module: moduleDocs['Website Development']._id,
          assignedTo: vamsi._id,
          createdBy: vamsi._id,
          priority: 'High',
          dueDate: new Date('2025-08-28'),
          status: 'In Progress',
          estimatedHours: 8,
          actualHours: 4.5
        },
        {
          taskId: 'TSK-102',
          title: 'Implement Login API',
          project: projectDocs['Mobile App']._id,
          module: moduleDocs['Mobile App']._id,
          assignedTo: vamsi._id,
          createdBy: vamsi._id,
          priority: 'Medium',
          dueDate: new Date('2025-08-29'),
          status: 'Submitted for Review', // will count as pending
          estimatedHours: 6,
          actualHours: 2.0
        },
        {
          taskId: 'TSK-103',
          title: 'Fix UI Bugs',
          project: projectDocs['Website Development']._id,
          module: moduleDocs['Website Development']._id,
          assignedTo: vamsi._id,
          createdBy: vamsi._id,
          priority: 'Low',
          dueDate: new Date('2025-08-27'),
          status: 'Approved', // completed
          estimatedHours: 4,
          actualHours: 3.5
        },
        {
          taskId: 'TSK-104',
          title: 'Write Test Cases',
          project: projectDocs['Backend API']._id,
          module: moduleDocs['Backend API']._id,
          assignedTo: vamsi._id,
          createdBy: vamsi._id,
          priority: 'Medium',
          dueDate: new Date('2025-08-30'),
          status: 'Not Started', // pending
          estimatedHours: 6,
          actualHours: 0
        },
        {
          taskId: 'TSK-105',
          title: 'Code Review',
          project: projectDocs['Mobile App']._id,
          module: moduleDocs['Mobile App']._id,
          assignedTo: vamsi._id,
          createdBy: vamsi._id,
          priority: 'High',
          dueDate: new Date('2025-08-26'),
          status: 'Approved', // completed
          estimatedHours: 3,
          actualHours: 3.0
        }
      ];

      for (const t of sampleTasks) {
        await Task.create(t);
      }
      console.log('[Seeder] Created 5 tasks for vamsi');
    } else {
      console.log(`[Seeder] vamsi already has ${existingTasks.length} tasks assigned.`);
    }

    // Recalculate performance
    const perf = await calculateEmployeePerformance(vamsi._id);
    console.log('[Seeder] Calculated Performance Score for vamsi:', perf.performanceScore);

    console.log('[Seeder] Done successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
};

seedVamsiData();
