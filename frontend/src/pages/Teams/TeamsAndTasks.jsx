import React, { useState } from 'react';
import TeamManagement from './TeamManagement';
import TaskManagement from '../Tasks/TaskManagement';

export default function TeamsAndTasks({ currentUser, activeSubTab = 'teams' }) {
  return (
    <div className="space-y-6">
      {activeSubTab === 'teams' && <TeamManagement currentUser={currentUser} />}
      {activeSubTab === 'tasks' && <TaskManagement currentUser={currentUser} />}
    </div>
  );
}
