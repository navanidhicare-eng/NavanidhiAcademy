import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  showAddButton, 
  onAddClick 
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="fixed inset-y-0 left-0 w-64 z-50">
        <Sidebar />
      </div>
      
      <div className="ml-64 flex-1 flex flex-col">
        <Header 
          title={title}
          subtitle={subtitle}
          showAddButton={showAddButton}
          onAddClick={onAddClick}
        />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
