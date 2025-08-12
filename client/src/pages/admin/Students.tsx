import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Eye, 
  Filter,
  MapPin,
  School,
  Users,
  Phone,
  Calendar,
  User,
  CreditCard,
  GraduationCap,
  Home,
  FileText,
  Plus,
  Download,
  BarChart3,
  TrendingUp,
  Activity,
  BookOpen,
  ClipboardCheck,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMandal, setSelectedMandal] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { toast } = useToast();

  // Fetch students data
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/admin/students'],
  });

  // Fetch filter options
  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages'],
  });

  const { data: soCenters = [] } = useQuery({
    queryKey: ['/api/admin/so-centers'],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  // Filter location data based on selections
  const filteredDistricts = (districts as any[]).filter((district: any) => 
    selectedState === 'all' || district.stateId === selectedState
  );

  const filteredMandals = (mandals as any[]).filter((mandal: any) => 
    selectedDistrict === 'all' || mandal.districtId === selectedDistrict
  );

  const filteredVillages = (villages as any[]).filter((village: any) => 
    selectedMandal === 'all' || village.mandalId === selectedMandal
  );

  const filteredSoCenters = (soCenters as any[]).filter((center: any) => {
    if (selectedState === 'all' && selectedDistrict === 'all' && selectedMandal === 'all' && selectedVillage === 'all') {
      return true;
    }

    // Use the joined location data from the center
    const stateMatch = selectedState === 'all' || center.stateName === (states as any[]).find(s => s.id === selectedState)?.name;
    const districtMatch = selectedDistrict === 'all' || center.districtName === (districts as any[]).find(d => d.id === selectedDistrict)?.name;
    const mandalMatch = selectedMandal === 'all' || center.mandalName === (mandals as any[]).find(m => m.id === selectedMandal)?.name;
    const villageMatch = selectedVillage === 'all' || center.villageName === (villages as any[]).find(v => v.id === selectedVillage)?.name;

    return stateMatch && districtMatch && mandalMatch && villageMatch;
  });

  // Filter students based on search, class, and location
  const filteredStudents = (students as any[]).filter((student: any) => {
    // Enhanced search including SO Center and location information
    const studentCenter = (soCenters as any[]).find(c => c.id === student.soCenterId);
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherMobile?.includes(searchTerm) ||
      student.motherMobile?.includes(searchTerm) ||
      student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.centerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.villageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.mandalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.districtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.stateName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
    const matchesCenter = selectedCenter === 'all' || student.soCenterId === selectedCenter;

    // Location-based filtering through student's SO center
    let matchesLocation = true;
    if (selectedState !== 'all' || selectedDistrict !== 'all' || selectedMandal !== 'all' || selectedVillage !== 'all') {
      if (studentCenter) {
        const stateMatch = selectedState === 'all' || studentCenter.stateName === (states as any[]).find(s => s.id === selectedState)?.name;
        const districtMatch = selectedDistrict === 'all' || studentCenter.districtName === (districts as any[]).find(d => d.id === selectedDistrict)?.name;
        const mandalMatch = selectedMandal === 'all' || studentCenter.mandalName === (mandals as any[]).find(m => m.id === selectedMandal)?.name;
        const villageMatch = selectedVillage === 'all' || studentCenter.villageName === (villages as any[]).find(v => v.id === selectedVillage)?.name;
        matchesLocation = stateMatch && districtMatch && mandalMatch && villageMatch;
      } else {
        matchesLocation = false;
      }
    }

    return matchesSearch && matchesClass && matchesCenter && matchesLocation;
  });

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleMandalChange = (mandalId: string) => {
    setSelectedMandal(mandalId);
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleVillageChange = (villageId: string) => {
    setSelectedVillage(villageId);
    setSelectedCenter('all');
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
    setSelectedClass('all');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: any) => {
    return `₹${(parseFloat(amount) || 0).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600 mt-2">Manage all students across the system</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredStudents.length} Students
            </Badge>
          </div>
        </div>

        {/* Location Filters Section */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Location Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* State Filter */}
              <Select onValueChange={handleStateChange} value={selectedState}>
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏛️ Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {(states as any[]).map((state: any) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* District Filter */}
              <Select 
                onValueChange={handleDistrictChange} 
                value={selectedDistrict}
                disabled={selectedState === 'all'}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏘️ Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {filteredDistricts.map((district: any) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mandal Filter */}
              <Select 
                onValueChange={handleMandalChange} 
                value={selectedMandal}
                disabled={selectedDistrict === 'all'}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏛️ Select Mandal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mandals</SelectItem>
                  {filteredMandals.map((mandal: any) => (
                    <SelectItem key={mandal.id} value={mandal.id}>
                      {mandal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Village Filter */}
              <Select 
                onValueChange={handleVillageChange} 
                value={selectedVillage}
                disabled={selectedMandal === 'all'}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏘️ Select Village" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  {filteredVillages.map((village: any) => (
                    <SelectItem key={village.id} value={village.id}>
                      {village.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Search and Actions Bar */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Left side - Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, phone, or father's name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Right side - Filters and Actions */}
            <div className="flex gap-3 items-center">
              {/* SO Center Filter */}
              <Select onValueChange={setSelectedCenter} value={selectedCenter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All SO Centers" />
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

              {/* Class Filter */}
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(classes as any[]).map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Student Button */}
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>

              {/* Export CSV Button */}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Students Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student: any) => {
                  const studentClass = (classes as any[]).find(c => c.id === student.classId);
                  const studentCenter = (soCenters as any[]).find(c => c.id === student.soCenterId);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.fatherName || student.motherName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.fatherMobile || student.motherMobile || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{studentClass?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {student.feeType === 'monthly' ? 'monthly' : 'yearly'} •
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredStudents.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </Card>
        )}
      </div>

      {/* Enhanced Student Details Modal */}
      {selectedStudent && <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </div>
  );
}

// Color scheme for charts
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Student Details Modal Component
function StudentDetailsModal({ student, onClose }: { student: any; onClose: () => void }) {
  // Fetch detailed student data
  const { data: studentDetails, isLoading: loadingDetails } = useQuery({
    queryKey: [`/api/students/${student.id}`],
    enabled: !!student.id,
  });

  const { data: progressData, isLoading: loadingProgress } = useQuery({
    queryKey: [`/api/progress-tracking/student/${student.id}`],
    enabled: !!student.id,
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: [`/api/attendance/student/${student.id}`],
    enabled: !!student.id,
  });

  const isLoading = loadingDetails || loadingProgress || loadingAttendance;

  // Format date utility
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare attendance pie chart data
  const attendancePieData = attendanceData ? [
    { name: 'Present', value: attendanceData.presentDays, color: '#00C49F' },
    { name: 'Absent', value: attendanceData.absentDays, color: '#FF8042' }
  ] : [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6" />
            {studentDetails?.name || student.name} - Detailed Profile
          </DialogTitle>
          <DialogDescription>
            Comprehensive academic and personal information for student ID: {studentDetails?.studentCode || student.studentId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !studentDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Student details not available</p>
              <p className="text-gray-600">Unable to retrieve student information at this time.</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activities
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Full Name</p>
                        <p className="text-gray-900">{studentDetails.name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Student ID</p>
                        <p className="text-gray-900 font-mono">{studentDetails.studentCode}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Date of Birth</p>
                        <p className="text-gray-900">{formatDate(studentDetails.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Enrollment Date</p>
                        <p className="text-gray-900">{formatDate(studentDetails.enrollmentDate)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Class</p>
                        <p className="text-gray-900">{studentDetails.className}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">SO Center</p>
                        <p className="text-gray-900">{studentDetails.soCenterName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Student Phone</p>
                        <p className="text-gray-900">{studentDetails.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Parent/Guardian Phone</p>
                        <p className="text-gray-900">{studentDetails.parentPhone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Email</p>
                        <p className="text-gray-900">{studentDetails.email || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-600 mb-1">State</p>
                        <p className="text-gray-900">{studentDetails.location?.state}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">District</p>
                        <p className="text-gray-900">{studentDetails.location?.district}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Mandal</p>
                        <p className="text-gray-900">{studentDetails.location?.mandal}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">Village</p>
                        <p className="text-gray-900">{studentDetails.location?.village}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Attendance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceData ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {attendanceData.attendancePercentage}%
                          </div>
                          <p className="text-sm text-gray-600">Overall Attendance</p>
                        </div>
                        
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={attendancePieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                              >
                                {attendancePieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <p className="font-medium text-gray-600">Total Days</p>
                            <p className="text-lg font-bold text-blue-600">{attendanceData.totalDays}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Present</p>
                            <p className="text-lg font-bold text-green-600">{attendanceData.presentDays}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Absent</p>
                            <p className="text-lg font-bold text-red-600">{attendanceData.absentDays}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No attendance data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              {progressData && progressData.subjectData ? (
                <div className="space-y-6">
                  {/* Subject-wise Performance Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Subject-wise Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={progressData.subjectData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="subject" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={0}
                            />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="homeworkPercentage" fill="#0088FE" name="Homework %" />
                            <Bar dataKey="tuitionPercentage" fill="#00C49F" name="Tuition %" />
                            <Bar dataKey="averageScore" fill="#FFBB28" name="Average Score %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Trend Line Chart */}
                  {attendanceData?.monthlyTrend && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Attendance Trend (Last 6 Months)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceData.monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip 
                                formatter={(value: any, name: string) => [
                                  `${value}%`, 
                                  'Attendance %'
                                ]}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="percentage" 
                                stroke="#8884d8" 
                                strokeWidth={2}
                                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Subject Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {progressData.subjectData.map((subject: any, index: number) => (
                      <Card key={subject.subject}>
                        <CardContent className="pt-6">
                          <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg text-gray-900">{subject.subject}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Homework</p>
                                <p className="text-xl font-bold text-blue-600">{subject.homeworkPercentage}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Tuition</p>
                                <p className="text-xl font-bold text-green-600">{subject.tuitionPercentage}%</p>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <p className="text-gray-600">Average Score</p>
                              <p className="text-xl font-bold text-purple-600">{subject.averageScore}%</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No progress data available</p>
                    <p className="text-gray-600">Progress information will appear here once academic activities begin.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Homework */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Homework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progressData?.recentHomework?.length > 0 ? (
                      <div className="space-y-3">
                        {progressData.recentHomework.map((hw: any) => (
                          <div key={hw.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{hw.subject}</h4>
                              <Badge variant={hw.status === 'completed' ? 'default' : 'secondary'}>
                                {hw.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{hw.topic}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{formatDate(hw.date)}</span>
                              {hw.score && <span>Score: {hw.score}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No homework activities found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Tuition Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Recent Tuition Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {progressData?.recentTuition?.length > 0 ? (
                      <div className="space-y-3">
                        {progressData.recentTuition.map((tp: any) => (
                          <div key={tp.id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{tp.subject}</h4>
                              <Badge variant={tp.status === 'learned' ? 'default' : 'secondary'}>
                                {tp.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{tp.chapter} - {tp.topic}</p>
                            <div className="text-xs text-gray-500">
                              {tp.completionDate ? formatDate(tp.completionDate) : 'In Progress'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No tuition progress found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Attendance */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Recent Attendance (Last 20 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendanceData?.recentAttendance?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {attendanceData.recentAttendance.map((record: any) => (
                          <div key={record.id} className="border rounded-lg p-3 text-center">
                            <div className={`text-sm font-medium mb-1 ${
                              record.status === 'present' 
                                ? 'text-green-600' 
                                : record.status === 'absent' 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                            }`}>
                              {record.status.toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatDate(record.date)}
                            </div>
                            {record.remarks && (
                              <div className="text-xs text-gray-500 mt-1">
                                {record.remarks}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No attendance records found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}