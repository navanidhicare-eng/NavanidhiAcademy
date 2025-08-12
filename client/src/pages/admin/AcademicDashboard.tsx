import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CardDescription } from '@/components/ui/card';
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
  Building
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
  const [activeTab, setActiveTab] = useState('progress');
  
  // Universal location filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedSoCenter, setSelectedSoCenter] = useState('');

  // Location data queries
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts'],
    enabled: !!selectedState,
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals'],
    enabled: !!selectedDistrict,
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages'],
    enabled: !!selectedMandal,
  });

  const { data: soCenters = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/so-centers'],
  });

  // Filter SO Centers based on selected location
  const filteredSoCenters = soCenters.filter((center: any) => {
    if (selectedVillage && center.villageId !== selectedVillage) return false;
    if (selectedMandal && !villages.some((v: any) => v.id === center.villageId && v.mandalId === selectedMandal)) return false;
    if (selectedDistrict && !mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === selectedDistrict)) return false;
    if (selectedState && !districts.some((d: any) => mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === d.id) && d.stateId === selectedState)) return false;
    return true;
  });

  // Reset dependent filters when parent changes
  const handleStateChange = (value: string) => {
    setSelectedState(value === 'all' ? '' : value);
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value === 'all' ? '' : value);
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleMandalChange = (value: string) => {
    setSelectedMandal(value === 'all' ? '' : value);
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value === 'all' ? '' : value);
    setSelectedSoCenter('');
  };

  return (
    <DashboardLayout
      title="Academic Admin Dashboard"
      subtitle="Comprehensive academic management and student progress tracking"
    >
      <div className="space-y-6">
        {/* Universal Location Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin size={20} />
              <span>Location Filter</span>
            </CardTitle>
            <CardDescription>
              Filter all dashboard data by geographic location. Changes apply to all tabs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state: any) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="district">District</Label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={handleDistrictChange}
                  disabled={!selectedState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {districts
                      .filter((district: any) => district.stateId === selectedState)
                      .map((district: any) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mandal">Mandal</Label>
                <Select 
                  value={selectedMandal} 
                  onValueChange={handleMandalChange}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Mandal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Mandals</SelectItem>
                    {mandals
                      .filter((mandal: any) => mandal.districtId === selectedDistrict)
                      .map((mandal: any) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="village">Village</Label>
                <Select 
                  value={selectedVillage} 
                  onValueChange={handleVillageChange}
                  disabled={!selectedMandal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Village" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Villages</SelectItem>
                    {villages
                      .filter((village: any) => village.mandalId === selectedMandal)
                      .map((village: any) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="soCenter">SO Center</Label>
                <Select value={selectedSoCenter} onValueChange={setSelectedSoCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SO Center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SO Centers</SelectItem>
                    {filteredSoCenters.map((center: any) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedState('');
                    setSelectedDistrict('');
                    setSelectedMandal('');
                    setSelectedVillage('');
                    setSelectedSoCenter('');
                  }}
                  className="w-full"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <StudentProgressTab 
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedMandal={selectedMandal}
              selectedVillage={selectedVillage}
              selectedSoCenter={selectedSoCenter}
              filteredSoCenters={filteredSoCenters}
            />
          </TabsContent>



          <TabsContent value="attendance">
            <AttendanceReportsTab 
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedMandal={selectedMandal}
              selectedVillage={selectedVillage}
              selectedSoCenter={selectedSoCenter}
              filteredSoCenters={filteredSoCenters}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}