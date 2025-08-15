import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Target, Users, School, Building, BookOpen, CheckCircle, Clock,
  TrendingUp, BarChart3, Filter, Search, Calendar, AlertCircle,
  MapPin, GraduationCap, User, Brain, Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Interfaces
interface State {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  stateId: string;
}

interface Mandal {
  id: string;
  name: string;
  districtId: string;
}

interface Village {
  id: string;
  name: string;
  mandalId: string;
}

interface SoCenter {
  id: string;
  name: string;
  center_id: string;
  villageId: string;
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  class_id: string;
  class_name: string;
  so_center_id: string;
  center_name: string;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
}

interface Chapter {
  id: string;
  name: string;
  subjectId: string;
}

interface Topic {
  id: string;
  name: string;
  chapterId: string;
  isImportant: boolean;
  isModerate: boolean;
}

interface ProgressSummary {
  soCenterId: string;
  centerName: string;
  centerCode: string;
  totalStudents: number;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  homeworkCompletionPercentage: number;
  lastUpdated: string;
}

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  soCenterId: string;
  centerName: string;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  homeworkCompletionPercentage: number;
  lastActivity: string;
}

interface TopicProgress {
  topicId: string;
  topicName: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  isImportant: boolean;
  isModerate: boolean;
  totalStudents: number;
  completedStudents: number;
  completionPercentage: number;
}

export default function AdminProgressTracking() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Access control
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access Progress Tracking.",
        variant: "destructive",
      });
      setLocation('/dashboard');
      return;
    }
  }, [user, setLocation, toast]);

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return null;
  }

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // API calls for hierarchical data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/locations/states'],
    enabled: true,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/locations/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const response = await fetch(`/api/locations/districts?stateId=${selectedState}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    },
    enabled: !!selectedState,
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/locations/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const response = await fetch(`/api/locations/mandals?districtId=${selectedDistrict}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch mandals');
      return response.json();
    },
    enabled: !!selectedDistrict,
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/locations/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      const response = await fetch(`/api/locations/villages?mandalId=${selectedMandal}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch villages');
      return response.json();
    },
    enabled: !!selectedMandal,
  });

  const { data: centers = [] } = useQuery({
    queryKey: ['/api/locations/so-centers', selectedVillage],
    queryFn: async () => {
      if (!selectedVillage) return [];
      const response = await fetch(`/api/locations/so-centers?villageId=${selectedVillage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch SO centers');
      return response.json();
    },
    enabled: !!selectedVillage,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/admin/chapters'],
  });

  // Fetch SO Center-wise Progress Summary
  const { data: centerProgressSummary = [] } = useQuery({
    queryKey: ['/api/admin/progress-tracking/centers', selectedState, selectedDistrict, selectedMandal, selectedVillage, selectedCenter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState) params.append('stateId', selectedState);
      if (selectedDistrict) params.append('districtId', selectedDistrict);
      if (selectedMandal) params.append('mandalId', selectedMandal);
      if (selectedVillage) params.append('villageId', selectedVillage);
      if (selectedCenter) params.append('centerId', selectedCenter);

      const response = await fetch(`/api/admin/progress-tracking/centers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch center progress');
      return response.json();
    },
    enabled: activeTab === 'overview',
  });

  // Fetch Student-wise Progress
  const { data: studentProgress = [] } = useQuery({
    queryKey: ['/api/admin/progress-tracking/students', selectedCenter, selectedClass, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCenter) params.append('centerId', selectedCenter);
      if (selectedClass) params.append('classId', selectedClass);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/progress-tracking/students?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch student progress');
      return response.json();
    },
    enabled: activeTab === 'students',
  });

  // Fetch Topic-wise Progress
  const { data: topicProgress = [] } = useQuery({
    queryKey: ['/api/admin/progress-tracking/topics', selectedClass, selectedSubject, selectedChapter, selectedCenter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedChapter) params.append('chapterId', selectedChapter);
      if (selectedCenter) params.append('centerId', selectedCenter);

      const response = await fetch(`/api/admin/progress-tracking/topics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch topic progress');
      return response.json();
    },
    enabled: activeTab === 'topics',
  });

  // Reset functions for hierarchical dropdowns
  const resetChildDropdowns = (level: 'state' | 'district' | 'mandal') => {
    if (level === 'state') {
      setSelectedDistrict('all-districts');
      setSelectedMandal('all-mandals');
      setSelectedCenter('');
    } else if (level === 'district') {
      setSelectedMandal('all-mandals');
      setSelectedCenter('');
    } else if (level === 'mandal') {
      setSelectedCenter('');
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: 'default' as const, className: 'bg-green-600', text: 'Excellent' };
    if (percentage >= 60) return { variant: 'secondary' as const, className: 'bg-yellow-600 text-white', text: 'Good' };
    return { variant: 'destructive' as const, text: 'Needs Attention' };
  };

  return (
    <DashboardLayout
      title="Admin Progress Tracking"
      subtitle="Comprehensive tracking of student progress across SO Centers, Classes, and Topics"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            SO Center Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Progress
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Topic Analysis
          </TabsTrigger>
        </TabsList>

        {/* SO Center Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Location Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={selectedState} onValueChange={(value) => {
                    setSelectedState(value);
                    resetChildDropdowns('state');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {(states as State[]).map((state: State) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={selectedDistrict} onValueChange={(value) => {
                    setSelectedDistrict(value);
                    resetChildDropdowns('district');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Districts</SelectItem>
                      {(districts as District[]).map((district: District) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mandal</Label>
                  <Select value={selectedMandal} onValueChange={(value) => {
                    setSelectedMandal(value);
                    resetChildDropdowns('mandal');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Mandals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Mandals</SelectItem>
                      {(mandals as Mandal[]).map((mandal: Mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Village</Label>
                  <Select value={selectedVillage} onValueChange={(value) => {
                    setSelectedVillage(value);
                    resetChildDropdowns('village');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Villages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Villages</SelectItem>
                      {(villages as Village[]).map((village: Village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SO Center</Label>
                  <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Centers</SelectItem>
                      {(centers as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SO Center Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(centerProgressSummary as ProgressSummary[]).map((center) => (
              <Card key={center.soCenterId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{center.centerName}</CardTitle>
                    <Badge variant="outline">{center.centerCode}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="font-medium">{center.totalStudents}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Topic Progress</span>
                      <span className="font-medium">{center.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(center.completionPercentage)}`}
                        style={{ width: `${Math.min(center.completionPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Homework</span>
                      <span className="font-medium">{center.homeworkCompletionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getStatusColor(center.homeworkCompletionPercentage)}`}
                        style={{ width: `${Math.min(center.homeworkCompletionPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge {...getStatusBadge(center.completionPercentage)}>
                      {getStatusBadge(center.completionPercentage).text}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {center.completedTopics}/{center.totalTopics} topics
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(centerProgressSummary as ProgressSummary[]).length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No SO Centers Found</p>
                <p className="text-muted-foreground">Adjust your filters to view SO Center progress data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Student Progress Tab */}
        <TabsContent value="students" className="space-y-6">
          {/* Student Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Student Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>SO Center</Label>
                  <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Centers</SelectItem>
                      {(centers as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {(classes as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Progress Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Progress Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="border-b px-4 py-3 text-left font-medium">Student</th>
                        <th className="border-b px-4 py-3 text-left font-medium">Class</th>
                        <th className="border-b px-4 py-3 text-left font-medium">SO Center</th>
                        <th className="border-b px-4 py-3 text-center font-medium">Topics Progress</th>
                        <th className="border-b px-4 py-3 text-center font-medium">Homework Progress</th>
                        <th className="border-b px-4 py-3 text-center font-medium">Status</th>
                        <th className="border-b px-4 py-3 text-center font-medium">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(studentProgress as StudentProgress[]).map((student) => (
                        <tr key={student.studentId} className="hover:bg-muted/30">
                          <td className="border-b px-4 py-3">
                            <div>
                              <div className="font-medium">{student.studentName}</div>
                              <div className="text-xs text-muted-foreground">{student.studentCode}</div>
                            </div>
                          </td>
                          <td className="border-b px-4 py-3 font-medium">{student.className}</td>
                          <td className="border-b px-4 py-3">
                            <div className="text-sm">{student.centerName}</div>
                          </td>
                          <td className="border-b px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-full bg-muted rounded-full h-2 max-w-[80px]">
                                <div
                                  className={`h-2 rounded-full ${getStatusColor(student.completionPercentage)}`}
                                  style={{ width: `${Math.min(student.completionPercentage, 100)}%` }}
                                />
                              </div>
                              <div className="text-xs font-medium">
                                {student.completionPercentage.toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.completedTopics}/{student.totalTopics}
                              </div>
                            </div>
                          </td>
                          <td className="border-b px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-full bg-muted rounded-full h-2 max-w-[80px]">
                                <div
                                  className={`h-2 rounded-full ${getStatusColor(student.homeworkCompletionPercentage)}`}
                                  style={{ width: `${Math.min(student.homeworkCompletionPercentage, 100)}%` }}
                                />
                              </div>
                              <div className="text-xs font-medium">
                                {student.homeworkCompletionPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </td>
                          <td className="border-b px-4 py-3 text-center">
                            <Badge {...getStatusBadge(student.completionPercentage)}>
                              {getStatusBadge(student.completionPercentage).text}
                            </Badge>
                          </td>
                          <td className="border-b px-4 py-3 text-center text-xs text-muted-foreground">
                            {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'No activity'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(studentProgress as StudentProgress[]).length === 0 && (
                <div className="py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No Students Found</p>
                  <p className="text-muted-foreground">Adjust your filters to view student progress data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Analysis Tab */}
        <TabsContent value="topics" className="space-y-6">
          {/* Topic Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Topic Analysis Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedSubject('');
                    setSelectedChapter('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {(classes as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedChapter('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      {(subjects as Subject[]).filter(s => s.classId === selectedClass).map((subject: Subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Chapters</SelectItem>
                      {(chapters as Chapter[]).filter(c => c.subjectId === selectedSubject).map((chapter: Chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SO Center</Label>
                  <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Centers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Centers</SelectItem>
                      {(centers as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic Progress Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Topic Completion Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClass && selectedSubject ? (
                <div className="space-y-4">
                  {(topicProgress as TopicProgress[]).map((topic) => (
                    <div key={topic.topicId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{topic.topicName}</h3>
                            <p className="text-sm text-muted-foreground">{topic.chapterName} • {topic.subjectName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {topic.isImportant && (
                            <Badge variant="destructive" className="text-xs">Important</Badge>
                          )}
                          {topic.isModerate && (
                            <Badge variant="secondary" className="text-xs">Moderate</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="font-medium">{topic.completionPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${getStatusColor(topic.completionPercentage)}`}
                              style={{ width: `${Math.min(topic.completionPercentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Completed: {topic.completedStudents}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">Pending: {topic.totalStudents - topic.completedStudents}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <Badge {...getStatusBadge(topic.completionPercentage)}>
                            {getStatusBadge(topic.completionPercentage).text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(topicProgress as TopicProgress[]).length === 0 && (
                    <div className="py-8 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">No Topics Found</p>
                      <p className="text-muted-foreground">Topics will appear here for the selected filters</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Select Class and Subject</p>
                  <p className="text-muted-foreground">Please select both class and subject to view topic analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}