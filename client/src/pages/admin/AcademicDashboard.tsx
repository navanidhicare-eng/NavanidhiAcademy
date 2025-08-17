import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  GraduationCap,
  FileText,
  PlusCircle,
  Edit,
  Trash2,
  BarChart3,
  Target,
  Award,
  RotateCcw,
  Filter,
  Eye,
  User,
  Phone,
  MapPin as MapPinIcon,
  Building,
  ArrowRight,
  Building2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Student Progress with SO Center and Location Filters
function StudentProgressTab({
  selectedState,
  selectedDistrict,
  selectedMandal,
  selectedVillage,
  selectedSoCenter,
  filteredSoCenters
}: any) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Use filtered SO Centers from parent component

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  // Filter students based on location and SO center
  const filteredStudents = students.filter((student: any) => {
    if (selectedSoCenter && student.soCenterId !== selectedSoCenter) return false;
    // Add additional location filtering logic here
    return true;
  });

  // Real performance data for selected student
  const { data: performanceData = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/student-performance', selectedStudent?.id],
    enabled: !!selectedStudent?.id,
  });

  // Real academic progress data
  const { data: academicProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/analytics/academic-progress'],
    ...(selectedSoCenter && {
      queryKey: ['/api/analytics/academic-progress', { soCenterId: selectedSoCenter }]
    }),
  });

  return (
    <div className="space-y-6">
      {/* Location and SO Center Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin size={20} />
            <span>Student Progress Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>State</Label>
              <div className="text-sm text-gray-600">
                {selectedState ? 'State filter applied from universal filter above' : 'Use universal location filter above'}
              </div>
            </div>

            <div>
              <Label>District</Label>
              <div className="text-sm text-gray-600">
                {selectedDistrict ? 'District filter applied from universal filter above' : 'Use universal location filter above'}
              </div>
            </div>

            <div>
              <Label>SO Center (Filtered)</Label>
              <div className="text-sm text-gray-600 mb-2">
                {selectedSoCenter ? filteredSoCenters.find((c: any) => c.id === selectedSoCenter)?.name || 'Selected center from universal filter' : 'Use universal location filter above to select SO center'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users size={20} />
            <span>Students Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredStudents.map((student: any) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedStudent(student)}
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{student.studentId}</Badge>
                    <Badge variant="secondary">{student.soCenterName || 'Unknown Center'}</Badge>
                    <Badge variant="outline">{student.className || 'No Class'}</Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Progress</div>
                    <div className="font-semibold">
                      {academicProgress.filter((p: any) => p.status === 'learned').length > 0
                        ? Math.round((academicProgress.filter((p: any) => p.status === 'learned').length / academicProgress.length) * 100)
                        : 0}%
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="text-primary" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Performance Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Performance Analytics - {selectedStudent?.name} ({selectedStudent?.studentId})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp size={20} />
                  <span>Performance Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="percentage" stroke="#8884d8" strokeWidth={2} name="Completion %" />
                    <Line type="monotone" dataKey="completedTopics" stroke="#82ca9d" strokeWidth={2} name="Topics Learned" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject-wise Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target size={20} />
                  <span>Subject-wise Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {academicProgress
                    .filter((item: any, index: number, self: any[]) =>
                      self.findIndex((i: any) => i.subject === item.subject) === index
                    )
                    .map((subject: any) => {
                      const subjectData = academicProgress.filter((p: any) => p.subject === subject.subject);
                      const totalTopics = subjectData.reduce((sum: number, p: any) => sum + p.count, 0);
                      const learnedTopics = subjectData
                        .filter((p: any) => p.status === 'learned')
                        .reduce((sum: number, p: any) => sum + p.count, 0);
                      const progress = totalTopics > 0 ? Math.round((learnedTopics / totalTopics) * 100) : 0;

                      return (
                        <div key={subject.subject} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{subject.subject}</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// Attendance Reports Tab
function AttendanceReportsTab({
  selectedState,
  selectedDistrict,
  selectedMandal,
  selectedVillage,
  selectedSoCenter,
  filteredSoCenters
}: any) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Center-wise Month-wise Attendance Report (real data)
  const { data: centerAttendanceReport = [] } = useQuery({
    queryKey: ['/api/analytics/center-month-attendance', selectedMonth, selectedYear, selectedSoCenter],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      if (selectedSoCenter) params.append('soCenterId', selectedSoCenter);

      return apiRequest('GET', `/api/analytics/center-month-attendance?${params.toString()}`);
    },
  });

  // Real attendance data from database
  const { data: attendanceData = [] } = useQuery({
    queryKey: ['/api/analytics/attendance-trends'],
    queryFn: () => apiRequest('GET', `/api/analytics/attendance-trends?soCenterId=${selectedSoCenter}&month=${selectedYear}-${String(selectedMonth).padStart(2, '0')}`),
    enabled: !!selectedSoCenter,
  });

  // Group attendance data by center for table display - ensure centerAttendanceReport is an array
  const groupedAttendanceData = Array.isArray(centerAttendanceReport) ? centerAttendanceReport.reduce((acc: any, record: any) => {
    const key = record.centerId;
    if (!acc[key]) {
      acc[key] = {
        centerInfo: {
          centerId: record.centerId,
          centerName: record.centerName,
          state: record.state,
          district: record.district,
          mandal: record.mandal,
          totalStudents: record.totalStudents
        },
        dailyAttendance: []
      };
    }
    acc[key].dailyAttendance.push({
      date: record.date,
      presentCount: record.presentCount,
      attendancePercentage: record.attendancePercentage
    });
    return acc;
  }, {}) : {};

  const centerAttendanceArray = Object.values(groupedAttendanceData);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar size={20} />
            <span>Center-wise Month-wise Attendance Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => (
                    <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                      {2020 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SO Center Filter</Label>
              <div className="text-sm text-gray-600 mt-2">
                {selectedSoCenter ? filteredSoCenters.find((c: any) => c.id === selectedSoCenter)?.name || 'Selected from universal filter' : 'All centers (use filter above to select specific center)'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Center-wise Attendance Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building size={20} />
            <span>Center-wise Daily Attendance Report - {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </CardTitle>
          <CardDescription>
            Detailed attendance data for each SO Center with daily breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {centerAttendanceArray.map((centerData: any) => (
              <div key={centerData.centerInfo.centerId} className="border rounded-lg p-6">
                {/* Center Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{centerData.centerInfo.centerName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <MapPinIcon size={14} />
                        <span>{centerData.centerInfo.state}, {centerData.centerInfo.district}, {centerData.centerInfo.mandal}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{centerData.centerInfo.totalStudents} Total Students</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Average Attendance</div>
                    <div className="text-2xl font-bold text-primary">
                      {centerData.dailyAttendance.length > 0
                        ? Math.round(centerData.dailyAttendance.reduce((sum: number, day: any) => sum + day.attendancePercentage, 0) / centerData.dailyAttendance.length)
                        : 0}%
                    </div>
                  </div>
                </div>

                {/* Daily Attendance Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Present</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total Students</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Attendance %</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {centerData.dailyAttendance.map((dayData: any, index: number) => {
                        const attendanceDate = new Date(dayData.date);
                        const dayName = attendanceDate.toLocaleDateString('en-US', { weekday: 'short' });
                        const isWeekend = dayName === 'Sat' || dayName === 'Sun';

                        return (
                          <tr key={index} className={isWeekend ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {attendanceDate.toLocaleDateString('en-IN')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <Badge variant={isWeekend ? "secondary" : "outline"}>
                                {dayName}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {dayData.presentCount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {centerData.centerInfo.totalStudents}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{dayData.attendancePercentage}%</span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{ width: `${Math.min(dayData.attendancePercentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isWeekend ? (
                                <Badge variant="secondary">Weekend</Badge>
                              ) : dayData.attendancePercentage >= 75 ? (
                                <Badge className="bg-green-100 text-green-800">Good</Badge>
                              ) : dayData.attendancePercentage >= 50 ? (
                                <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Poor</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Center Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {centerData.dailyAttendance.filter((d: any) => d.attendancePercentage >= 75).length}
                    </div>
                    <div className="text-sm text-gray-600">Good Days (≥75%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {centerData.dailyAttendance.filter((d: any) => d.attendancePercentage >= 50 && d.attendancePercentage < 75).length}
                    </div>
                    <div className="text-sm text-gray-600">Average Days (50-74%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {centerData.dailyAttendance.filter((d: any) => d.attendancePercentage < 50).length}
                    </div>
                    <div className="text-sm text-gray-600">Poor Days (&lt;50%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {Math.round(centerData.dailyAttendance.reduce((sum: number, day: any) => sum + day.presentCount, 0) / centerData.dailyAttendance.length) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Present</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {centerAttendanceArray.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
              <p className="text-gray-600">No attendance records found for the selected month and year.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function AcademicDashboard() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Filter states for Student Progress
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Filter states for Attendance Reports
  const [attendanceState, setAttendanceState] = useState('');
  const [attendanceDistrict, setAttendanceDistrict] = useState('');
  const [attendanceMandal, setAttendanceMandal] = useState('');
  const [attendanceVillage, setAttendanceVillage] = useState('');
  const [attendanceCenter, setAttendanceCenter] = useState('');
  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceStudent, setAttendanceStudent] = useState('');

  // Academic Management Sections
  const academicSections = [
    {
      title: 'Class & Subject Management',
      description: 'Manage classes, subjects, and their relationships',
      icon: BookOpen,
      path: '/admin/class-subject-management',
      color: 'from-blue-500 to-blue-600',
      stats: 'Organize Academic Structure'
    },
    {
      title: 'Topics Management',
      description: 'Manage chapters, topics, and academic content',
      icon: Target,
      path: '/admin/topics-management',
      color: 'from-green-500 to-green-600',
      stats: 'Content Organization'
    },
    {
      title: 'Exam Management',
      description: 'Create and manage academic examinations',
      icon: GraduationCap,
      path: '/admin/exam-management',
      color: 'from-purple-500 to-purple-600',
      stats: 'Assessment Tools'
    },
    {
      title: 'Academic Structure',
      description: 'Comprehensive academic hierarchy management',
      icon: Building2,
      path: '/admin/structure',
      color: 'from-orange-500 to-orange-600',
      stats: 'System Organization'
    }
  ];

  // Fetch location data
  const { data: locationData } = useQuery<LocationData>({
    queryKey: ['locations'],
    queryFn: () => apiRequest('/api/locations/all'),
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiRequest('/api/classes'),
  });

  // Fetch SO Centers based on selected village
  const { data: centers } = useQuery({
    queryKey: ['so-centers', selectedVillage, attendanceVillage],
    queryFn: () => apiRequest(`/api/locations/so-centers${selectedVillage || attendanceVillage ? `?villageId=${selectedVillage || attendanceVillage}` : ''}`),
    enabled: !!(selectedVillage || attendanceVillage),
  });

  // Fetch students based on filters
  const { data: students } = useQuery({
    queryKey: ['students-filter', attendanceClass, attendanceCenter],
    queryFn: () => apiRequest(`/api/students/by-filter?${new URLSearchParams({
      ...(attendanceClass && { classId: attendanceClass }),
      ...(attendanceCenter && { centerId: attendanceCenter })
    }).toString()}`),
    enabled: !!(attendanceClass || attendanceCenter),
  });

  // Fetch progress data
  const { data: progressData, isLoading: isLoadingProgress } = useQuery<ProgressData[]>({
    queryKey: ['admin-progress-tracking', selectedClass, selectedCenter],
    queryFn: () => apiRequest(`/api/admin/progress-tracking?${new URLSearchParams({
      ...(selectedClass && { classId: selectedClass }),
      ...(selectedCenter && { soCenterId: selectedCenter })
    }).toString()}`),
    enabled: activeTab === 'progress' && !!(selectedClass || selectedCenter),
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery<AttendanceData[]>({
    queryKey: ['attendance', attendanceStudent, attendanceClass, attendanceCenter],
    queryFn: () => apiRequest(`/api/attendance?${new URLSearchParams({
      ...(attendanceStudent && { studentId: attendanceStudent }),
      ...(attendanceClass && { classId: attendanceClass }),
      ...(attendanceCenter && { centerId: attendanceCenter })
    }).toString()}`),
    enabled: activeTab === 'attendance' && !!(attendanceStudent || attendanceClass || attendanceCenter),
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Filter data based on location
  const getFilteredDistricts = (stateId: string) =>
    locationData?.districts.filter(d => d.stateId === stateId) || [];

  const getFilteredMandals = (districtId: string) =>
    locationData?.mandals.filter(m => m.districtId === districtId) || [];

  const getFilteredVillages = (mandalId: string) =>
    locationData?.villages.filter(v => v.mandalId === mandalId) || [];

  return (
    <DashboardLayout
      title="Academic Admin Dashboard"
      subtitle="Comprehensive academic management and student progress tracking"
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor academic progress and manage educational content</p>
          </div>

          {/* Academic Management Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {academicSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <Card key={section.path} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-r from-white to-gray-50">
                  <CardContent className="p-6" onClick={() => handleNavigation(section.path)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {section.description}
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                      {section.stats}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Student Progress
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Academic Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-700 text-sm mb-4">
                    Track student progress and attendance across all centers
                  </p>
                  <Button
                    onClick={() => setActiveTab('progress')}
                    variant="outline"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    View Progress Reports
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 text-sm mb-4">
                    Organize classes, subjects, chapters, and topics
                  </p>
                  <Button
                    onClick={() => handleNavigation('/admin/class-subject-management')}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-200"
                  >
                    Manage Content
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-purple-800 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Examination System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-700 text-sm mb-4">
                    Create and manage academic examinations
                  </p>
                  <Button
                    onClick={() => handleNavigation('/admin/exam-management')}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-200"
                  >
                    Manage Exams
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Student Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Select value={selectedState} onValueChange={(value) => {
                    setSelectedState(value);
                    setSelectedDistrict('');
                    setSelectedMandal('');
                    setSelectedVillage('');
                    setSelectedCenter('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {locationData?.states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedDistrict} onValueChange={(value) => {
                    setSelectedDistrict(value);
                    setSelectedMandal('');
                    setSelectedVillage('');
                    setSelectedCenter('');
                  }} disabled={!selectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Districts</SelectItem>
                      {getFilteredDistricts(selectedState).map((district) => (
                        <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedMandal} onValueChange={(value) => {
                    setSelectedMandal(value);
                    setSelectedVillage('');
                    setSelectedCenter('');
                  }} disabled={!selectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Mandals</SelectItem>
                      {getFilteredMandals(selectedDistrict).map((mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>{mandal.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedVillage} onValueChange={(value) => {
                    setSelectedVillage(value);
                    setSelectedCenter('');
                  }} disabled={!selectedMandal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Village" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Villages</SelectItem>
                      {getFilteredVillages(selectedMandal).map((village) => (
                        <SelectItem key={village.id} value={village.id}>{village.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCenter} onValueChange={setSelectedCenter} disabled={!selectedVillage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Center" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Centers</SelectItem>
                      {centers?.map((center: any) => (
                        <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Progress Data Display */}
                {isLoadingProgress ? (
                  <div className="text-center py-8">Loading progress data...</div>
                ) : progressData && progressData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Student</th>
                          <th className="border border-gray-300 p-2 text-left">Class</th>
                          <th className="border border-gray-300 p-2 text-left">Center</th>
                          <th className="border border-gray-300 p-2 text-center">Homework %</th>
                          <th className="border border-gray-300 p-2 text-center">Tuition %</th>
                          <th className="border border-gray-300 p-2 text-center">Activities</th>
                          <th className="border border-gray-300 p-2 text-center">Topics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressData.map((student) => (
                          <tr key={student.studentId} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2">
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-gray-500">{student.studentCode}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">{student.className}</td>
                            <td className="border border-gray-300 p-2">
                              <div>
                                <div className="font-medium">{student.centerName}</div>
                                <div className="text-sm text-gray-500">{student.centerCode}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <div className={`inline-block px-2 py-1 rounded-full text-sm ${
                                student.homeworkCompletionPercentage >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : student.homeworkCompletionPercentage >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.homeworkCompletionPercentage}%
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <div className={`inline-block px-2 py-1 rounded-full text-sm ${
                                student.tuitionCompletionPercentage >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : student.tuitionCompletionPercentage >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.tuitionCompletionPercentage}%
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {student.completedHomework}/{student.totalHomeworkActivities}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {student.completedTuitionTopics}/{student.totalTuitionTopics}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {selectedClass || selectedCenter ? 'No progress data found for selected filters' : 'Select filters to view progress data'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Reports Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Attendance Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                  <Select value={attendanceState} onValueChange={(value) => {
                    setAttendanceState(value);
                    setAttendanceDistrict('');
                    setAttendanceMandal('');
                    setAttendanceVillage('');
                    setAttendanceCenter('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {locationData?.states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceDistrict} onValueChange={(value) => {
                    setAttendanceDistrict(value);
                    setAttendanceMandal('');
                    setAttendanceVillage('');
                    setAttendanceCenter('');
                  }} disabled={!attendanceState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Districts</SelectItem>
                      {getFilteredDistricts(attendanceState).map((district) => (
                        <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceMandal} onValueChange={(value) => {
                    setAttendanceMandal(value);
                    setAttendanceVillage('');
                    setAttendanceCenter('');
                  }} disabled={!attendanceDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Mandals</SelectItem>
                      {getFilteredMandals(attendanceDistrict).map((mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>{mandal.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceVillage} onValueChange={(value) => {
                    setAttendanceVillage(value);
                    setAttendanceCenter('');
                  }} disabled={!attendanceMandal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Village" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Villages</SelectItem>
                      {getFilteredVillages(attendanceMandal).map((village) => (
                        <SelectItem key={village.id} value={village.id}>{village.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceCenter} onValueChange={setAttendanceCenter} disabled={!attendanceVillage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Center" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Centers</SelectItem>
                      {centers?.map((center: any) => (
                        <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceClass} onValueChange={setAttendanceClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes?.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={attendanceStudent} onValueChange={setAttendanceStudent} disabled={!attendanceClass && !attendanceCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Students</SelectItem>
                      {students?.map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attendance Data Display */}
                {isLoadingAttendance ? (
                  <div className="text-center py-8">Loading attendance data...</div>
                ) : attendanceData && attendanceData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Student</th>
                          <th className="border border-gray-300 p-2 text-left">Class</th>
                          <th className="border border-gray-300 p-2 text-left">Center</th>
                          <th className="border border-gray-300 p-2 text-center">Date</th>
                          <th className="border border-gray-300 p-2 text-center">Status</th>
                          <th className="border border-gray-300 p-2 text-left">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2">
                              <div>
                                <div className="font-medium">{record.studentName}</div>
                                <div className="text-sm text-gray-500">{record.studentCode}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">{record.className}</td>
                            <td className="border border-gray-300 p-2">
                              <div>
                                <div className="font-medium">{record.centerName}</div>
                                <div className="text-sm text-gray-500">{record.centerCode}</div>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              <div className={`inline-block px-2 py-1 rounded-full text-sm ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.status}
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">{record.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {attendanceStudent || attendanceClass || attendanceCenter ? 'No attendance data found for selected filters' : 'Select filters to view attendance data'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}