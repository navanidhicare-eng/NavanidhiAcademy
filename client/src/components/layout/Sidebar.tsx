import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
  Wallet,
  UserCog,
  Table,
  Building,
  Presentation,
  CheckSquare,
  LogOut,
  Shield,
  IndianRupee,
  DollarSign,
  BookOpen,
  ClipboardCheck,
  Megaphone,
  FileCheck,
  MapPin,
  Receipt,
  Calendar,
  BarChart3,
  Settings,
  Package,
  ShoppingCart,
  UserMinus,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleNavItems = (role: string) => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: UserCog, label: 'Manage Users', href: '/admin/users' },
          { icon: Shield, label: 'Role Management', href: '/admin/roles' },
          { icon: MapPin, label: 'Address Management', href: '/admin/addresses' },
          { icon: Table, label: 'Academic Structure', href: '/admin/structure' },
          { icon: Building, label: 'SO Centers', href: '/admin/centers' },
          { icon: Users, label: 'All Students', href: '/admin/students' },
          { icon: CreditCard, label: 'All Payments', href: '/admin/payments' },
          { icon: IndianRupee, label: 'Fee Management', href: '/admin/fees' },
          { icon: DollarSign, label: 'Expenses & Salary', href: '/admin/expenses' },
          { icon: BookOpen, label: 'Academic Management', href: '/admin/academics' },
          { icon: Presentation, label: 'Teacher Management', href: '/admin/teachers' },
          { icon: Package, label: 'Products', href: '/admin/products' },
          { icon: ClipboardCheck, label: 'Attendance Monitoring', href: '/admin/attendance' },
          { icon: Megaphone, label: 'Announcements', href: '/admin/announcements' },
          { icon: ShoppingCart, label: 'Course Purchases', href: '/admin/course-purchases' },
          { icon: FileCheck, label: 'Approvals', href: '/admin/approvals' },
          { icon: BookOpen, label: 'Topics Management', href: '/admin/topics-management' },
          { icon: UserMinus, label: 'Dropout Requests', href: '/admin/dropout-requests' },
        ];
      
      case 'so_center':
        return [
          ...baseItems,
          { icon: Users, label: 'Students', href: '/students' },
          { icon: Receipt, label: 'Fee Payments', href: '/fee-payments' },
          { icon: TrendingUp, label: 'Progress Tracking', href: '/progress' },
          { icon: Calendar, label: 'Attendance', href: '/attendance' },
          { icon: BarChart3, label: 'Attendance Reports', href: '/attendance-reports' },
          { icon: Package, label: 'Products', href: '/products' },
          { icon: Wallet, label: 'Wallet', href: '/wallet' },
          { icon: DollarSign, label: 'Expenses', href: '/expenses' },
          { icon: GraduationCap, label: 'Exam Management', href: '/so-center/exam-management' },
          { icon: UserMinus, label: 'Dropout Requests', href: '/so-center/dropout-requests' },
        ];
      
      case 'teacher':
        return [
          ...baseItems,
          { icon: Users, label: 'Students', href: '/students' },
          { icon: TrendingUp, label: 'Progress Tracking', href: '/progress' },
          { icon: Calendar, label: 'Attendance', href: '/attendance' },
          { icon: BarChart3, label: 'Attendance Reports', href: '/attendance-reports' },
        ];
      
      case 'academic_admin':
        return [
          ...baseItems,
          { icon: BarChart3, label: 'Academic Dashboard', href: '/admin/academic-dashboard' },
          { icon: GraduationCap, label: 'Exam Management', href: '/admin/exam-management' },
          { icon: Table, label: 'Academic Structure', href: '/admin/structure' },
        ];
      
      case 'agent':
        return [
          ...baseItems,
          { icon: Package, label: 'Products', href: '/products' },
          { icon: Wallet, label: 'Wallet', href: '/wallet' },
          { icon: DollarSign, label: 'Expenses', href: '/expenses' },
        ];

      default:
        return baseItems;
    }
  };

  const navItems = getRoleNavItems(user?.role || '');

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-900 shadow-xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap className="text-white text-sm" size={16} />
          </div>
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">Navanidhi</h2>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user ? getInitials(user.name) : 'NA'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {user?.role?.replace('_', ' ') || 'Role'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 pb-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center px-4 py-3 rounded-lg transition-colors text-sm",
                isActive 
                  ? "text-primary bg-blue-50 dark:bg-blue-900/50" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}>
                <Icon className="mr-3" size={18} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings and Logout */}
      <div className="p-4 space-y-2">
        <Link href="/settings">
          <div className={cn(
            "flex items-center px-4 py-3 rounded-lg transition-colors text-sm",
            location === '/settings'
              ? "text-primary bg-blue-50 dark:bg-blue-900/50" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}>
            <Settings className="mr-3" size={18} />
            Settings
          </div>
        </Link>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          onClick={() => logout()}
        >
          <LogOut className="mr-3" size={18} />
          Logout
        </Button>
      </div>
    </div>
  );
}
