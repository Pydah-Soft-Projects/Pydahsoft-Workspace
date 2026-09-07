import React, { useState } from 'react';
import ProjectManagement from './ProjectManagement';
import ModuleManagement from '../Modules/ModuleManagement';

export default function ProjectsAndModules({ currentUser, activeSubTab = 'projects' }) {
  return (
    <div className="space-y-6">
      {activeSubTab === 'projects' && <ProjectManagement currentUser={currentUser} />}
      {activeSubTab === 'modules' && <ModuleManagement currentUser={currentUser} />}
    </div>
  );
}
