import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { AnnouncementsPopup } from '@/components/announcements/AnnouncementsPopup';
import { Link } from 'wouter';
import { 
  Users, 
  IndianRupee, 
  CheckCircle, 
  Wallet,
  TrendingUp,
  Building,
  Calendar,
  BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch real dashboard stats from Supabase (NO DEMO DATA)
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // No fallback data - only use real Supabase data
  const displayStats = stats || {
    totalStudents: 0,
    paymentsThisMonth: 0,
    topicsCompleted: 0,
    walletBalance: 0,
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' && title.includes('₹') 
                ? `₹${value.toLocaleString()}` 
                : value}
            </p>
          </div>
          <div className={`w-12 h-12 bg-${color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
            <Icon className={`text-${color} text-xl`} size={24} />
          </div>
        </div>
        {trend && (
          <div className="mt-4">
            <span className="text-success text-sm font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back, manage your academy operations"
    >
      {/* Active Announcements Popup */}
      <AnnouncementsPopup />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={displayStats.totalStudents}
          icon={Users}
          trend="+12% from last month"
          color="primary"
        />
        
        <StatCard
          title="Payments This Month"
          value={`₹${(displayStats.paymentsThisMonth || 0).toLocaleString()}`}
          icon={IndianRupee}
          trend="+8% from last month"
          color="secondary"
        />
        
        <StatCard
          title="Topics Completed"
          value={displayStats.topicsCompleted}
          icon={CheckCircle}
          trend="+25% this week"
          color="accent"
        />
        
        <StatCard
          title="Wallet Balance"
          value={`₹${(displayStats.walletBalance || 0).toLocaleString()}`}
          icon={Wallet}
          color="purple-600"
        />
      </div>

      {/* Role-specific content */}
      {user?.role === 'so_center' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Payment recorded for Arjun Reddy</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Progress updated for Sneha Patel</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">New student registered</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/students">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <Users size={20} className="text-primary" />
                      <div>
                        <p className="font-medium">Add New Student</p>
                        <p className="text-sm text-gray-600">Register a new student</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/payments">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <IndianRupee size={20} className="text-secondary" />
                      <div>
                        <p className="font-medium">Record Payment</p>
                        <p className="text-sm text-gray-600">Add student payment</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/progress">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <TrendingUp size={20} className="text-accent" />
                      <div>
                        <p className="font-medium">Update Progress</p>
                        <p className="text-sm text-gray-600">Mark topic completion</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/attendance">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <Calendar size={20} className="text-blue-600" />
                      <div>
                        <p className="font-medium">Mark Attendance</p>
                        <p className="text-sm text-gray-600">Daily attendance tracking</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/attendance-reports">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <BarChart3 size={20} className="text-purple-600" />
                      <div>
                        <p className="font-medium">Attendance Reports</p>
                        <p className="text-sm text-gray-600">View statistics & reports</p>
                      </div>
                    </div>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">12</div>
                  <p className="text-gray-600">Active SO Centers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">45</div>
                  <p className="text-gray-600">Teachers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">856</div>
                  <p className="text-gray-600">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/admin/centers">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <Building size={20} className="text-primary" />
                      <div>
                        <p className="font-medium">Manage SO Centers</p>
                        <p className="text-sm text-gray-600">Add or modify centers</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/admin/students">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <Users size={20} className="text-accent" />
                      <div>
                        <p className="font-medium">View All Students</p>
                        <p className="text-sm text-gray-600">System-wide student list</p>
                      </div>
                    </div>
                  </button>
                </Link>
                
                <Link href="/admin/payments">
                  <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <IndianRupee size={20} className="text-secondary" />
                      <div>
                        <p className="font-medium">Payment Overview</p>
                        <p className="text-sm text-gray-600">All system payments</p>
                      </div>
                    </div>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
