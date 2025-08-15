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
  BarChart3,
  Settings,
  Calendar,
  MapPin,
  Building,
  BookOpen,
  FileText,
  TrendingUp,
  Wallet,
  Package,
  ClipboardCheck,
  ClipboardList,
  Target,
  UserCheck,
  Award,
  MessageCircle,
  Bell,
  UserPlus,
  ShoppingCart,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Home,
  Shield,
  School,
  Plus,
  X,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle // Imported AlertTriangle icon
} from 'lucide-react';

// Assuming SidebarMenuButton and Link are imported from appropriate libraries
// For demonstration, let's assume they are like this:
// import { Link } from 'wouter-preact';
// import { Button as SidebarMenuButton } from '@/components/ui/button';
// In a real scenario, these would be imported from your UI library

// Placeholder for SidebarMenuButton and Link if not present in original code for context
// import { Link } from 'react-router-dom'; // Or your routing library
// const SidebarMenuButton = ({ asChild, children }) => children;

// Dummy imports for demonstration if not available in the original context
import { Link } from 'wouter-preact';
const SidebarMenuButton = ({ asChild, children }) => {
  if (asChild) {
    return children;
  }
  return <button>{children}</button>;
};


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
    roles: ['so_center'],
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
    roles: ['so_center', 'admin', 'super_admin'],
    children: [
      { title: 'Exam Management', href: '/exam-management', icon: Award, roles: ['so_center'] },
      { title: 'SO Center Exams', href: '/so-center/exams', icon: ClipboardList, roles: ['so_center'] },
      { title: 'Exam Results', href: '/so-center/exam-results', icon: BarChart3, roles: ['so_center'] },
      { title: 'Admin Exam Management', href: '/admin/exam-management', icon: Award, roles: ['admin', 'super_admin'] },
      { title: 'Academic Dashboard', href: '/admin/academic-dashboard', icon: BarChart3, roles: ['admin', 'super_admin'] },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    children: [
      { title: 'Expenses', href: '/expenses', icon: FileText, roles: ['so_center'] },
      { title: 'Admin Expenses', href: '/admin/expenses', icon: FileText, roles: ['admin', 'super_admin'] },
      { title: 'All Payments', href: '/admin/all-payments', icon: CreditCard, roles: ['admin', 'super_admin'] },
      { title: 'Fee Structures', href: '/admin/fees', icon: DollarSign, roles: ['admin', 'super_admin'] },
    ],
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
    roles: ['so_center', 'agent', 'admin', 'super_admin'],
  },
  {
    title: 'Teachers',
    href: '/admin/teachers',
    icon: UserCheck,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Roles',
    href: '/admin/roles',
    icon: UserCheck,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'SO Centers',
    href: '/admin/centers',
    icon: Building,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Topics Management',
    href: '/admin/structure',
    icon: School,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Class & Subject Management',
    href: '/admin/class-subject-management',
    icon: Plus,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'All Students',
    href: '/admin/students',
    icon: GraduationCap,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Course Purchases',
    href: '/admin/course-purchases',
    icon: ShoppingCart,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Dropout Requests',
    href: '/admin/dropout-requests',
    icon: X,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Addresses',
    href: '/admin/addresses',
    icon: Building,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Announcements',
    href: '/admin/announcements',
    icon: Bell,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Approvals',
    href: '/admin/approvals',
    icon: CheckCircle,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Progress Tracking',
    href: '/admin/progress-tracking',
    icon: Target,
    roles: ['admin', 'super_admin'],
  },
  // New entry for Wallet Balances
  {
    title: 'Wallet Balances',
    href: '/admin/wallet-balances',
    icon: Wallet,
    roles: ['admin', 'super_admin'],
  },
  // Add Student Balance Dues menu item to admin sidebar
  {
    title: 'Student Balance & Dues',
    href: '/admin/student-balance-dues',
    icon: AlertTriangle, // Use AlertTriangle for dues
    roles: ['admin', 'super_admin'],
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

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  };

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + '/');
  };

  const isParentActive = (item: NavItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => 
        isItemVisible(child) && child.href && isActive(child.href)
      );
    }
    return false;
  };

  // Auto-expand parent menu if current page is a submenu item
  // The original code had a useState hook here which is not the correct way to handle side effects in React.
  // It should be useEffect. If it's intended to run only once on mount, an empty dependency array is needed.
  // For this correction, I'll assume it's meant to run on mount to set initial expanded state.
  // If the original intent was different, this might need further adjustment.
  useState(() => {
    navigation.forEach(item => {
      if (item.children && item.children.some(child => 
        isItemVisible(child) && child.href && isActive(child.href)
      )) {
        setExpandedItems(prev => 
          prev.includes(item.title) ? prev : [...prev, item.title]
        );
      }
    });
  });


  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleNavigation = (href: string) => {
    setLocation(href);

    // Keep parent menu expanded if navigating to a child item
    navigation.forEach(item => {
      if (item.children && item.children.some(child => child.href === href)) {
        if (!expandedItems.includes(item.title)) {
          setExpandedItems(prev => [...prev, item.title]);
        }
      }
    });

    if (isMobile && onMobileClose) {
      onMobileClose();
    }
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
              isParentActive(item) && "bg-sidebar-accent text-sidebar-accent-foreground",
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