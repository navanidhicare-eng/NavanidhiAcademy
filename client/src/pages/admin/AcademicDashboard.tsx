import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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

  // Mock performance data for selected student
  const performanceData = selectedStudent ? [
    { month: 'Jan', marks: 85, attendance: 92 },
    { month: 'Feb', marks: 78, attendance: 88 },
    { month: 'Mar', marks: 92, attendance: 95 },
    { month: 'Apr', marks: 89, attendance: 90 },
    { month: 'May', marks: 94, attendance: 97 },
    { month: 'Jun', marks: 87, attendance: 89 },
  ] : [];

  const subjectProgress = selectedStudent ? [
    { subject: 'Mathematics', progress: 85, color: '#8884d8' },
    { subject: 'Science', progress: 92, color: '#82ca9d' },
    { subject: 'English', progress: 78, color: '#ffc658' },
    { subject: 'Social Studies', progress: 88, color: '#ff7300' },
  ] : [];

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
                    <div className="font-semibold">{Math.floor(Math.random() * 40) + 60}%</div>
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
                    <Line type="monotone" dataKey="marks" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="attendance" stroke="#82ca9d" strokeWidth={2} />
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
                  {subjectProgress.map((subject: any) => (
                    <div key={subject.subject} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{subject.subject}</span>
                        <span className="font-semibold">{subject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${subject.progress}%`, 
                            backgroundColor: subject.color 
                          }}
                        />
                      </div>
                    </div>
                  ))}
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: attendanceStats } = useQuery({
    queryKey: ['/api/attendance/stats', selectedSoCenter, selectedMonth],
    enabled: !!selectedSoCenter,
  });

  // Mock attendance data for visualization
  const attendanceData = [
    { date: '1', present: 85, absent: 15, holiday: 0 },
    { date: '2', present: 78, absent: 22, holiday: 0 },
    { date: '3', present: 92, absent: 8, holiday: 0 },
    { date: '4', present: 88, absent: 12, holiday: 0 },
    { date: '5', present: 0, absent: 0, holiday: 100 },
    { date: '6', present: 95, absent: 5, holiday: 0 },
    { date: '7', present: 89, absent: 11, holiday: 0 },
  ];

  const soCenterStats = [
    { name: 'Center A', attendance: 92 },
    { name: 'Center B', attendance: 88 },
    { name: 'Center C', attendance: 95 },
    { name: 'Center D', attendance: 85 },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar size={20} />
            <span>Attendance Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Month</Label>
              <Input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
              />
            </div>
            <div>
              <Label>SO Center</Label>
              <Select value={selectedSoCenter} onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedSoCenter ? filteredSoCenters.find((c: any) => c.id === selectedSoCenter)?.name : "Use location filter above"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled" disabled>Use universal location filter above</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#82ca9d" />
                <Bar dataKey="absent" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SO Center Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={soCenterStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attendance" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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