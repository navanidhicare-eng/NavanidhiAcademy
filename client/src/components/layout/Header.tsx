
import { Button } from '@/components/ui/button';
import { Plus, Settings, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useScreenSize } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  isMobile?: boolean;
}

export function Header({ title, subtitle, showAddButton, onAddClick, isMobile }: HeaderProps) {
  const { user, logout } = useAuth();
  const { breakpoint } = useScreenSize();
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <header className={cn(
      "bg-white border-b border-gray-200 px-4 py-4 shadow-sm",
      isMobile ? "ml-0" : "ml-0"
    )}>
      <div className="flex items-center justify-between">
        <div className={cn(
          "flex-1",
          isMobile && "ml-12" // Account for mobile menu button
        )}>
          <h1 className={cn(
            "font-bold text-gray-900 truncate",
            breakpoint === 'mobile' ? "text-lg" : "text-2xl"
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              "text-gray-600 truncate",
              breakpoint === 'mobile' ? "text-xs mt-0.5" : "text-sm mt-1"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Button */}
          {showAddButton && onAddClick && (
            <Button 
              onClick={onAddClick}
              size={breakpoint === 'mobile' ? "sm" : "default"}
              className="gap-2"
            >
              <Plus className={cn(
                breakpoint === 'mobile' ? "h-3 w-3" : "h-4 w-4"
              )} />
              {breakpoint !== 'mobile' && "Add"}
            </Button>
          )}
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size={breakpoint === 'mobile' ? "sm" : "default"}
            className="relative"
          >
            <Bell className={cn(
              breakpoint === 'mobile' ? "h-4 w-4" : "h-5 w-5"
            )} />
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.name || user?.email || 'User')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="flex-col items-start">
                <div className="font-medium truncate max-w-full">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-full">
                  {user?.email}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <User className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
