import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useScreenSize } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonText?: string;
}

export default function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  showAddButton = false, 
  onAddClick,
  addButtonText = "Add New"
}: DashboardLayoutProps) {
  const { isMobile, isTablet } = useScreenSize();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCompact = isMobile || isTablet;

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Mobile Sidebar Overlay */}
      {isCompact && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "z-50 transition-transform duration-300 ease-in-out",
        isCompact ? "fixed inset-y-0 left-0 w-64" : "fixed inset-y-0 left-0 w-64",
        isCompact && !sidebarOpen && "-translate-x-full"
      )}>
        <Sidebar onMobileClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        !isCompact && "ml-64"
      )}>
        {/* Mobile Menu Button */}
        {isCompact && (
          <div className="fixed top-4 left-4 z-30">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-white shadow-md"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <Header 
          title={title}
          subtitle={subtitle}
          showAddButton={showAddButton}
          onAddClick={onAddClick}
          isMobile={isCompact}
        />

        <main className={cn(
          "flex-1 p-4 overflow-x-hidden",
          isCompact ? "pt-6" : "p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}