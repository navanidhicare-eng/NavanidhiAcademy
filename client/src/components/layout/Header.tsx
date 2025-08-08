import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function Header({ title, subtitle, showAddButton, onAddClick }: HeaderProps) {
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* Quick Actions */}
          {showAddButton && user?.role === 'so_center' && (
            <Button onClick={onAddClick} className="bg-primary text-white hover:bg-blue-700">
              <Plus className="mr-2" size={16} />
              Add Student
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
