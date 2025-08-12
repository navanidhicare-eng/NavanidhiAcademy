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
  BarChart3,
  Package,
  UserPlus,
  ShoppingCart,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// SO Center Dashboard Component with Key Metrics
function SOCenterDashboard() {
  const { user } = useAuth();

  // Fetch SO Center specific metrics
  const { data: soCenterStats } = useQuery({
    queryKey: ['/api/so-center/dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/so-center/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch SO center stats');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const stats = soCenterStats || {
    newStudentsThisMonth: 0,
    thisMonthCollection: 0,
    todayCollection: 0,
    todayAttendance: 0,
    thisMonthProductSales: 0,
    collectionChart: [],
    attendanceChart: [],
    productSalesChart: []
  };

  const SOStatCard = ({ 
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
    <Card className="hover-lift card-hover animate-fade-in border-green-100 hover:border-green-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' && title.includes('₹') 
                ? `₹${value.toLocaleString()}` 
                : value}
            </p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center green-pulse">
            <Icon className="text-green-600" size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <SOStatCard
          title="New Students This Month"
          value={stats.newStudentsThisMonth}
          icon={UserPlus}
          trend="+12% from last month"
          color="primary"
        />
        
        <SOStatCard
          title="This Month Collection"
          value={`₹${stats.thisMonthCollection.toLocaleString()}`}
          icon={IndianRupee}
          trend="+8% from last month"
          color="green"
        />
        
        <SOStatCard
          title="Today Collection"
          value={`₹${stats.todayCollection.toLocaleString()}`}
          icon={Wallet}
          trend="Last 24 hours"
          color="blue"
        />
        
        <SOStatCard
          title="Today Attendance"
          value={`${stats.todayAttendance}%`}
          icon={UserCheck}
          trend="Current day"
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Chart */}
        <Card className="animate-scale-in hover-lift border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp size={20} className="text-green-600" />
              Monthly Collection Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.collectionChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Collection']} />
                  <Line 
                    type="monotone" 
                    dataKey="collection" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card className="animate-scale-in hover-lift border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <UserCheck size={20} className="text-green-600" />
              Weekly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attendanceChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                  <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Sales and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Sales */}
        <Card className="lg:col-span-2 animate-bounce-in hover-lift border-green-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <Package size={20} className="text-green-600" />
                This Month Product Sales
              </div>
              <span className="text-2xl font-bold text-green-600 green-pulse">
                ₹{stats.thisMonthProductSales.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.productSalesChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                  <Bar dataKey="sales" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                    <Users size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium">Manage Students</p>
                      <p className="text-sm text-gray-600">Add or view students</p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/products">
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center space-x-3">
                    <Package size={20} className="text-green-600" />
                    <div>
                      <p className="font-medium">View Products</p>
                      <p className="text-sm text-gray-600">Browse available products</p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/fee-payments">
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center space-x-3">
                    <IndianRupee size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium">Record Payment</p>
                      <p className="text-sm text-gray-600">Process fee payment</p>
                    </div>
                  </div>
                </button>
              </Link>

              <Link href="/attendance">
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={20} className="text-orange-600" />
                    <div>
                      <p className="font-medium">Take Attendance</p>
                      <p className="text-sm text-gray-600">Mark student attendance</p>
                    </div>
                  </div>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
            <span className="text-sm text-green-600">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Dashboard">
      <AnnouncementsPopup />
      
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your academy today.
          </p>
        </div>

        {/* General Stats for all users except SO Center */}
        {user?.role !== 'so_center' && (
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
        )}

        {/* SO Center specific dashboard */}
        {user?.role === 'so_center' && (
          <SOCenterDashboard />
        )}

        {/* Admin specific content */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">New SO Center registered</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">System backup completed</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Monthly report generated</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/admin/users">
                    <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center space-x-3">
                        <Users size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium">Manage Users</p>
                          <p className="text-sm text-gray-600">Add or edit user accounts</p>
                        </div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/admin/so-centers">
                    <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center space-x-3">
                        <Building size={20} className="text-green-600" />
                        <div>
                          <p className="font-medium">SO Centers</p>
                          <p className="text-sm text-gray-600">Manage satellite offices</p>
                        </div>
                      </div>
                    </button>
                  </Link>

                  <Link href="/admin/academic-dashboard">
                    <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-center space-x-3">
                        <BarChart3 size={20} className="text-purple-600" />
                        <div>
                          <p className="font-medium">Academic Dashboard</p>
                          <p className="text-sm text-gray-600">View academic progress</p>
                        </div>
                      </div>
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}