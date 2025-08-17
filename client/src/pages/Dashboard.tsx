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
  BookOpen,
  DollarSign,
  GraduationCap,
  FileText,
  CreditCard
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// SO Center Dashboard Component with Key Metrics
function SOCenterDashboard() {
  const { user } = useAuth();

  // Fetch SO Center specific metrics with auto-refresh
  const { data: soCenterStats } = useQuery({
    queryKey: ['/api/so-center/dashboard-stats', user?.email],
    queryFn: async () => {
      console.log('🔄 Fetching SO Center dashboard stats');
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/so-center/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch SO center stats');
      }
      const data = await response.json();
      console.log('🏢 SO Center stats received:', data);
      return data;
    },
    enabled: !!user && user.role === 'so_center',
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider data stale to ensure fresh updates
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

  // Fetch real dashboard stats with auto-refresh
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats', user?.role],
    queryFn: async () => {
      console.log('🔄 Fetching dashboard stats for user:', user?.role);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      console.log('📊 Dashboard stats received:', data);
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });

  // No fallback data - only use real Supabase data
  const displayStats = stats || {
    totalStudents: 0,
    paymentsThisMonth: 0,
    topicsCompleted: 0,
    totalTopics: 0,
    walletBalance: 0,
    newStudentsThisMonth: 0,
    yearlyRevenue: 0,
    totalSoCenters: 0,
    totalWalletBalance: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    attendanceRate: 0,
    studentsWithAttendance: 0,
    totalExams: 0,
    averageExamScore: 0,
    totalProducts: 0,
    homeworkCompleted: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    totalCommission: 0,
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = "primary",
    delay = 0
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: string;
    delay?: number;
  }) => (
    <Card className={`group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-slide-up-stagger cursor-pointer transform hover:scale-105`} 
          style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider group-hover:text-gray-800 transition-colors duration-300">{title}</p>
            <div className="relative">
              <p className="text-3xl font-black text-gray-900 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500 transform group-hover:scale-110">
                {typeof value === 'number' && title.includes('₹') 
                  ? `₹${value.toLocaleString()}` 
                  : value}
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            {trend && (
              <div className="mt-3">
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">{trend}</span>
              </div>
            )}
          </div>
          <div className="relative">
            <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-2xl`}>
              <Icon className="text-white text-xl drop-shadow-lg" size={28} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Dashboard">
      <AnnouncementsPopup />

      <div className="p-6 space-y-8 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-float-slower"></div>

        <div className="relative z-10">
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-block">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent animate-gradient-text">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-2 animate-slide-in-from-left"></div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay">
              Your academy command center - Real-time insights, powerful analytics, and complete control at your fingertips.
            </p>
            <div className="flex justify-center space-x-2 animate-fade-in-up-delay-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">{/* Moved the padding here */}

        {/* Loading skeleton with premium animations */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse-premium bg-gradient-to-br from-gray-100 to-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-300 rounded-full w-24 animate-shimmer"></div>
                      <div className="h-8 bg-gray-300 rounded-full w-16 animate-shimmer"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-300 rounded-2xl animate-shimmer"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* General Stats for all users except SO Center */}
        {!isLoading && user?.role !== 'so_center' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {user?.role === 'admin' ? (
              <>
                {/* Admin Dashboard Cards with premium animations */}
                <StatCard
                  title="Total Students"
                  value={displayStats.totalStudents}
                  icon={Users}
                  trend={`${displayStats.newStudentsThisMonth || 0} new this month`}
                  delay={0}
                />
                <StatCard
                  title="Monthly Revenue"
                  value={formatCurrency(displayStats.paymentsThisMonth)}
                  icon={DollarSign}
                  trend={`Yearly: ${formatCurrency(displayStats.yearlyRevenue || 0)}`}
                  delay={100}
                />
                <StatCard
                  title="Total Topics"
                  value={displayStats.totalTopics}
                  icon={BookOpen}
                  trend={`${displayStats.topicsCompleted || 0} topics completed`}
                  delay={200}
                />
                <StatCard
                  title="SO Centers"
                  value={displayStats.totalSoCenters}
                  icon={Building}
                  trend={`${formatCurrency(displayStats.totalWalletBalance || 0)} total balance`}
                  delay={300}
                />

                {/* Additional Admin Metrics Row with premium effects */}
                <StatCard
                  title="Teachers"
                  value={displayStats.totalTeachers}
                  icon={GraduationCap}
                  trend={`${displayStats.totalClasses || 0} classes, ${displayStats.totalSubjects || 0} subjects`}
                  delay={400}
                />
                <StatCard
                  title="Attendance Rate"
                  value={`${displayStats.attendanceRate || 0}%`}
                  icon={Calendar}
                  trend={`${displayStats.studentsWithAttendance || 0} students this month`}
                  delay={500}
                />
                <StatCard
                  title="Exams"
                  value={displayStats.totalExams}
                  icon={FileText}
                  trend={`Avg Score: ${displayStats.averageExamScore || 0}%`}
                  delay={600}
                />
                <StatCard
                  title="Products"
                  value={displayStats.totalProducts}
                  icon={Package}
                  trend={`${displayStats.homeworkCompleted || 0} homework completed`}
                  delay={700}
                />
              </>
            ) : user?.role === 'agent' ? (
              <>
                {/* Agent Dashboard Cards with premium animations */}
                <StatCard
                  title="Product Sales"
                  value={displayStats.totalSales || 0}
                  icon={ShoppingCart}
                  trend="This month"
                  delay={0}
                />
                <StatCard
                  title="Monthly Revenue"
                  value={formatCurrency(displayStats.monthlyRevenue || 0)}
                  icon={DollarSign}
                  trend="Course sales revenue"
                  delay={100}
                />
                <StatCard
                  title="Commission Earned"
                  value={formatCurrency(displayStats.totalCommission || 0)}
                  icon={TrendingUp}
                  trend="Total commission earned"
                  delay={200}
                />
                <StatCard
                  title="Available Balance"
                  value={formatCurrency(displayStats.walletBalance || 0)}
                  icon={Wallet}
                  trend="Ready for withdrawal"
                  delay={300}
                />
              </>
            ) : (
              <>
                {/* Default Cards for Academic Admin and other roles with premium animations */}
                <StatCard
                  title="Total Students"
                  value={displayStats.totalStudents}
                  icon={Users}
                  trend="Active students"
                  delay={0}
                />
                <StatCard
                  title="SO Centers"
                  value={displayStats.totalSoCenters}
                  icon={Building}
                  trend="Active centers"
                  delay={100}
                />
                <StatCard
                  title="Total Topics"
                  value={displayStats.totalTopics}
                  icon={BookOpen}
                  trend={`${displayStats.topicsCompleted || 0} topics completed`}
                  delay={200}
                />
                <StatCard
                  title="Monthly Payments"
                  value={formatCurrency(displayStats.paymentsThisMonth)}
                  icon={DollarSign}
                  trend="This month"
                  delay={300}
                />
              </>
            )}
          </div>
        )}

        {/* SO Center specific dashboard */}
        {user?.role === 'so_center' && (
          <SOCenterDashboard />
        )}

        {/* Admin specific content with premium animations */}
        {!isLoading && user?.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
            {/* Recent Activity with premium effects */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {[
                    { color: 'green', title: 'New SO Center registered', time: '2 hours ago', delay: '0ms' },
                    { color: 'blue', title: 'System backup completed', time: '4 hours ago', delay: '100ms' },
                    { color: 'yellow', title: 'Monthly report generated', time: '1 day ago', delay: '200ms' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-all duration-300 animate-slide-in-right" style={{ animationDelay: item.delay }}>
                      <div className={`w-3 h-3 bg-${item.color}-500 rounded-full animate-pulse shadow-lg`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions with premium effects */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 via-pink-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
                  <span>Admin Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {[
                    { href: '/admin/users', icon: Users, title: 'Manage Users', subtitle: 'Add or edit user accounts', color: 'blue', delay: '0ms' },
                    { href: '/admin/so-centers', icon: Building, title: 'SO Centers', subtitle: 'Manage satellite offices', color: 'green', delay: '100ms' },
                    { href: '/admin/academic-dashboard', icon: BarChart3, title: 'Academic Dashboard', subtitle: 'View academic progress', color: 'purple', delay: '200ms' }
                  ].map((action, index) => (
                    <Link key={index} href={action.href}>
                      <button className="w-full p-4 text-left border-0 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-slide-in-left group" style={{ animationDelay: action.delay }}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-br from-${action.color}-400 to-${action.color}-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg`}>
                            <action.icon size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">{action.title}</p>
                            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{action.subtitle}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}