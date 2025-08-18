import React, { useState } from 'react';
import SpecialistSidebar from '../dashboard/SpecialistSidebar';

interface SpecialistPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SpecialistPageWrapper: React.FC<SpecialistPageWrapperProps> = ({ 
  children, 
  className = "" 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <SpecialistSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className={`flex-1 overflow-y-auto lg:ml-0 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default SpecialistPageWrapper;