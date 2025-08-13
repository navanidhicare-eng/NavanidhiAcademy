import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useScreenSize } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Calendar,
  Settings,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  DollarSign,
  BarChart3,
  UserCheck,
  School,
  Building,
  Award,
  ClipboardList,
  Bell,
  CheckCircle,
  Package,
  ShoppingCart,
  X,
  Plus
} from 'lucide-react';

interface SidebarProps {
  onMobileClose?: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon: any;
  children?: NavItem[];
  roles?: string[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Students',
    icon: Users,
    children: [
      { title: 'All Students', href: '/students', icon: Users },
      { title: 'Progress Tracking', href: '/progress', icon: TrendingUp },
      { title: 'Attendance', href: '/attendance', icon: Calendar },
      { title: 'Attendance Reports', href: '/attendance-reports', icon: FileText },
    ],
  },
  {
    title: 'Academics',
    icon: BookOpen,
    children: [
      { title: 'Exam Management', href: '/exam-management', icon: Award, roles: ['so_center'] },
      { title: 'SO Center Exams', href: '/so-center/exams', icon: ClipboardList, roles: ['so_center'] },
      { title: 'Exam Results', href: '/so-center/exam-results', icon: BarChart3, roles: ['so_center'] },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    children: [
      { title: 'Fee Payments', href: '/fee-payments', icon: CreditCard },
      { title: 'Wallet', href: '/wallet', icon: DollarSign },
      { title: 'Expenses', href: '/expenses', icon: FileText },
    ],
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Admin',
    icon: Settings,
    roles: ['admin', 'super_admin'],
    children: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'SO Centers', href: '/admin/centers', icon: Building },
      { title: 'Chapters and Topics Managing', href: '/admin/structure', icon: School },
      { title: 'Class & Subject Management', href: '/admin/class-subject-management', icon: Plus },
      { title: 'All Students', href: '/admin/students', icon: GraduationCap },
      { title: 'All Payments', href: '/admin/all-payments', icon: CreditCard },
      { title: 'Exam Management', href: '/admin/exam-management', icon: Award },
      { title: 'Products', href: '/admin/products', icon: Package },
      { title: 'Addresses', href: '/admin/addresses', icon: Building },
      { title: 'Announcements', href: '/admin/announcements', icon: Bell },
      { title: 'Approvals', href: '/admin/approvals', icon: CheckCircle },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ onMobileClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { isMobile } = useScreenSize();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleNavigation = (href: string) => {
    setLocation(href);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  };

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    if (!isItemVisible(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 px-3 text-left font-normal",
              level > 0 && "pl-6",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.title}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </Button>
          {isExpanded && (
            <div className="space-y-1 pl-3">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.title}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-11 px-3 text-left font-normal",
          level > 0 && "pl-6",
          isActive(item.href!) && "bg-sidebar-accent text-sidebar-accent-foreground",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
        )}
        onClick={() => item.href && handleNavigation(item.href)}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{item.title}</span>
      </Button>
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              Navanidhi Academy
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              Management System
            </p>
          </div>
        </div>
        {isMobile && onMobileClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map(item => renderNavItem(item))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
            <span className="text-xs font-medium">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.role?.replace('_', ' ') || 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}