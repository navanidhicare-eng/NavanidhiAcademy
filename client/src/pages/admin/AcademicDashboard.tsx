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

// Exam Management Tab
function ExamManagementTab({ 
  selectedState, 
  selectedDistrict, 
  selectedMandal, 
  selectedVillage, 
  selectedSoCenter, 
  filteredSoCenters 
}: any) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [selectedSoCenterIds, setSelectedSoCenterIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/exams'],
  });

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects'],
  });

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      return apiRequest('POST', '/api/admin/exams', examData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsCreateModalOpen(false);
      setSelectedSoCenterIds([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      return apiRequest('DELETE', `/api/admin/exams/${examId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      });
    },
  });

  const handleCreateExam = (formData: FormData) => {
    const examData = {
      title: formData.get('name'),
      description: formData.get('description'),
      classId: formData.get('classId'),
      subjectId: formData.get('subjectId'),
      examDate: formData.get('examDate'),
      duration: parseInt(formData.get('duration') as string),
      totalMarks: parseInt(formData.get('maxMarks') as string),
      passingMarks: parseInt(formData.get('passingMarks') as string),
      soCenterIds: selectedSoCenterIds,
      chapterIds: [], // Default empty, can be enhanced later
    };
    createExamMutation.mutate(examData);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      deleteExamMutation.mutate(examId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap size={20} />
              <span>Exam Management</span>
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-white">
              <PlusCircle className="mr-2" size={16} />
              Create Exam
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {exams.map((exam: any) => (
              <div key={exam.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{exam.className}</Badge>
                    <Badge variant="secondary">{exam.subjectName}</Badge>
                    <Badge variant="outline">{exam.examDate}</Badge>
                    <Badge>{exam.maxMarks} marks</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingExam(exam)}>
                    <Edit className="text-primary" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                    <Trash2 className="text-destructive" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Exam Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateExam(formData);
          }} className="space-y-4">
            <div>
              <Label htmlFor="name">Exam Name</Label>
              <Input id="name" name="name" placeholder="Enter exam name" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Enter exam description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classId">Class</Label>
                <Select name="classId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subjectId">Subject</Label>
                <Select name="subjectId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examDate">Exam Date</Label>
                <Input id="examDate" name="examDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" placeholder="120" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxMarks">Maximum Marks</Label>
                <Input id="maxMarks" name="maxMarks" type="number" placeholder="100" required />
              </div>
              <div>
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input id="passingMarks" name="passingMarks" type="number" placeholder="35" required />
              </div>
            </div>
            
            {/* SO Centers Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>SO Centers (Select Multiple)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSoCenterIds.length === filteredSoCenters.length) {
                      // If all are selected, unselect all
                      setSelectedSoCenterIds([]);
                    } else {
                      // Select all
                      setSelectedSoCenterIds(filteredSoCenters.map((center: any) => center.id));
                    }
                  }}
                  className="text-xs"
                >
                  {selectedSoCenterIds.length === filteredSoCenters.length ? 'Unselect All' : 'Select All'}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {filteredSoCenters.map((center: any) => (
                  <div key={center.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`center-${center.id}`}
                      checked={selectedSoCenterIds.includes(center.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSoCenterIds([...selectedSoCenterIds, center.id]);
                        } else {
                          setSelectedSoCenterIds(selectedSoCenterIds.filter(id => id !== center.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`center-${center.id}`} className="text-sm cursor-pointer">
                      {center.name}
                    </label>
                  </div>
                ))}
                {filteredSoCenters.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {selectedSoCenter ? 'Use the universal location filter above to see SO Centers' : 'No SO Centers available. Please apply location filters above.'}
                  </p>
                )}
              </div>
              {selectedSoCenterIds.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedSoCenterIds.length} SO Center(s) selected
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedSoCenterIds([]);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExamMutation.isPending || selectedSoCenterIds.length === 0}>
                {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </form>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="exams">Exam Management</TabsTrigger>
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

          <TabsContent value="exams">
            <ExamManagementTab 
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