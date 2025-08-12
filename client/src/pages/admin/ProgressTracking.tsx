import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookOpen, School, Target, CheckCircle, XCircle, Clock, Users, MapPin, Building, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

// Hierarchical location interfaces
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

interface Student {
  id: string;
  name: string;
  student_id: string;
  class_id: string;
  class_name: string;
}

interface ProgressTrackingData {
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  className: string;
  soCenterId: string;
  centerName: string;
  centerCode: string;
  homeworkCompletionPercentage: number;
  tuitionCompletionPercentage: number;
  totalHomeworkActivities: number;
  completedHomework: number;
  totalTuitionTopics: number;
  completedTuitionTopics: number;
}

interface SoCenter {
  id: string;
  name: string;
  center_id: string;
  villageId: string;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
}

interface Topic {
  id: string;
  name: string;
  chapterId: string;
  isModerate: boolean;
  isImportant: boolean;
}

interface Chapter {
  id: string;
  name: string;
  subjectId: string;
}

interface Class {
  id: string;
  name: string;
}

interface TuitionProgress {
  id: string;
  studentId: string;
  topicId: string;
  status: 'pending' | 'learned';
  completedDate?: string;
}

export default function ProgressTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Hierarchical filter states
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedCenterNew, setSelectedCenterNew] = useState<string>('');
  const [selectedClassNew, setSelectedClassNew] = useState<string>('');
  const [selectedStudentNew, setSelectedStudentNew] = useState<string>('');
  
  // States for filters (legacy)
  const [activeTab, setActiveTab] = useState('school-homework');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'pending'
  const [selectedTopic, setSelectedTopic] = useState('');
  const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  // Homework activity states
  const [homeworkActivities, setHomeworkActivities] = useState<Record<string, {
    status: 'completed' | 'not_completed' | 'not_given' | '';
    completionType?: 'self' | 'helped_by_so';
    reason?: string;
  }>>({});

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

  const { data: centersNew = [] } = useQuery({
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

  const { data: classesNew = [] } = useQuery({
    queryKey: ['/api/classes/by-center', selectedCenterNew],
    queryFn: async () => {
      if (!selectedCenterNew) return [];
      const response = await fetch(`/api/classes/by-center?centerId=${selectedCenterNew}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    enabled: !!selectedCenterNew,
  });

  const { data: studentsNew = [] } = useQuery({
    queryKey: ['/api/students/by-filter', selectedClassNew, selectedCenterNew],
    queryFn: async () => {
      if (!selectedClassNew && !selectedCenterNew) return [];
      const params = new URLSearchParams();
      if (selectedClassNew) params.append('classId', selectedClassNew);
      if (selectedCenterNew) params.append('centerId', selectedCenterNew);
      
      const response = await fetch(`/api/students/by-filter?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!(selectedClassNew || selectedCenterNew),
  });

  // Fetch data (Legacy)
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/admin/chapters'],
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['/api/admin/topics'],
  });

  // Fetch SO Centers for filter dropdown
  const { data: soCenters = [] } = useQuery({
    queryKey: ['/api/admin/so-centers'],
    enabled: user?.role === 'admin',
  });

  // Comprehensive progress tracking data for admin
  const { data: progressTrackingData = [] } = useQuery({
    queryKey: ['/api/admin/progress-tracking', selectedClass === 'all' ? '' : selectedClass, selectedCenter === 'all' ? '' : selectedCenter, dateRange.fromDate, dateRange.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClass && selectedClass !== 'all') params.append('classId', selectedClass);
      if (selectedCenter && selectedCenter !== 'all') params.append('soCenterId', selectedCenter);
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
      if (dateRange.toDate) params.append('toDate', dateRange.toDate);
      
      const response = await fetch(`/api/admin/progress-tracking?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch progress tracking data');
      return response.json();
    },
    enabled: user?.role === 'admin' && activeTab === 'all-students',
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students', user?.id],
    queryFn: async () => {
      if (user?.role === 'admin') {
        // For legacy class-based views, we'll use the default query function
        return [];
      } else {
        // SO center users get students from their specific center
        const soCenterId = user?.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : user?.id;
        const response = await fetch('/api/students?soCenterId=' + soCenterId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
    },
    enabled: !!user && (user.role !== 'admin' || activeTab !== 'all-students'),
  });

  const { data: tuitionProgress = [] } = useQuery({
    queryKey: ['/api/tuition-progress', selectedClass, selectedTopic],
    queryFn: async () => {
      const response = await fetch(`/api/tuition-progress?classId=${selectedClass}&topicId=${selectedTopic}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tuition progress');
      const data = await response.json();
      console.log('Tuition progress API response:', data);
      return data;
    },
    enabled: !!selectedClass && !!selectedTopic,
  });

  // Get filtered data
  const filteredSubjects = (subjects as Subject[]).filter((s: Subject) => s.classId === selectedClass);
  const filteredChapters = (chapters as Chapter[]).filter((c: Chapter) => c.subjectId === selectedSubject);
  const filteredTopics = (topics as Topic[]).filter((t: Topic) => 
    selectedChapter ? t.chapterId === selectedChapter : filteredChapters.some((c: Chapter) => c.id === t.chapterId)
  );
  const classStudents = (students as Student[]).filter((s: Student) => s.class_id === selectedClass);

  // Reset function for hierarchical dropdowns
  const resetChildDropdowns = (level: string) => {
    switch(level) {
      case 'state':
        setSelectedDistrict('');
        setSelectedMandal('');
        setSelectedVillage('');
        setSelectedCenterNew('');
        setSelectedClassNew('');
        setSelectedStudentNew('');
        break;
      case 'district':
        setSelectedMandal('');
        setSelectedVillage('');
        setSelectedCenterNew('');
        setSelectedClassNew('');
        setSelectedStudentNew('');
        break;
      case 'mandal':
        setSelectedVillage('');
        setSelectedCenterNew('');
        setSelectedClassNew('');
        setSelectedStudentNew('');
        break;
      case 'village':
        setSelectedCenterNew('');
        setSelectedClassNew('');
        setSelectedStudentNew('');
        break;
      case 'center':
        setSelectedClassNew('');
        setSelectedStudentNew('');
        break;
      case 'class':
        setSelectedStudentNew('');
        break;
    }
  };

  // Handle hierarchical filter changes
  const handleStateChange = (value: string) => {
    setSelectedState(value);
    resetChildDropdowns('state');
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    resetChildDropdowns('district');
  };

  const handleMandalChange = (value: string) => {
    setSelectedMandal(value);
    resetChildDropdowns('mandal');
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value);
    resetChildDropdowns('village');
  };

  const handleCenterChange = (value: string) => {
    setSelectedCenterNew(value);
    resetChildDropdowns('center');
  };

  const handleClassChange = (value: string) => {
    setSelectedClassNew(value);
    resetChildDropdowns('class');
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentNew(value);
  };
  
  // Helper function to check if topic is completed
  const isTopicCompleted = (studentId: string, topicId: string) => {
    const found = (tuitionProgress as TuitionProgress[]).find((progress: TuitionProgress) => 
      progress.studentId === studentId && 
      progress.topicId === topicId
    );
    
    // Debug logging
    if (found) {
      console.log(`Found progress for student ${studentId}, topic ${topicId}:`, found);
    }
    
    return found?.status === 'learned';
  };
  
  // Filter students based on status filter
  const filteredStudents = classStudents.filter((student: Student) => {
    if (statusFilter === 'all') return true;
    const isCompleted = isTopicCompleted(student.id, selectedTopic);
    return statusFilter === 'completed' ? isCompleted : !isCompleted;
  });

  // Mutations
  const homeworkMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/homework-activity', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Homework activity recorded successfully',
      });
      setHomeworkActivities({});
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record homework activity',
        variant: 'destructive',
      });
    },
  });

  const tuitionProgressMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/tuition-progress', data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: 'Topic marked as completed successfully',
      });
      // Immediately invalidate and refetch the specific query to get updated data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/tuition-progress', selectedClass, selectedTopic] 
      });
      // Force immediate refetch with manual refetch
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['/api/tuition-progress', selectedClass, selectedTopic] 
        });
      }, 100);
    },
    onError: (error) => {
      console.error('Tuition progress error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update topic progress',
        variant: 'destructive',
      });
    },
  });

  const handleHomeworkStatusChange = (studentId: string, status: string) => {
    setHomeworkActivities(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status as any,
        completionType: status === 'completed' ? prev[studentId]?.completionType : undefined,
        reason: status === 'not_completed' ? prev[studentId]?.reason : undefined,
      }
    }));
  };

  const handleCompletionTypeChange = (studentId: string, type: string) => {
    setHomeworkActivities(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        completionType: type as any,
      }
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setHomeworkActivities(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason,
      }
    }));
  };

  const submitHomeworkActivity = () => {
    if (!selectedClass || !homeworkDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select class and date',
        variant: 'destructive',
      });
      return;
    }

    const activities = Object.entries(homeworkActivities)
      .filter(([_, activity]) => activity.status)
      .map(([studentId, activity]) => ({
        studentId,
        classId: selectedClass,
        homeworkDate: homeworkDate,
        status: activity.status,
        completionType: activity.completionType,
        reason: activity.reason,
      }));

    if (activities.length === 0) {
      toast({
        title: 'No Data',
        description: 'Please mark homework status for at least one student',
        variant: 'destructive',
      });
      return;
    }

    homeworkMutation.mutate({ activities });
  };

  const markTopicCompleted = (studentId: string, topicId: string) => {
    tuitionProgressMutation.mutate({
      studentId,
      topicId,
      status: 'learned',
      updatedBy: user?.id || '',
    });
  };

  return (
    <DashboardLayout
      title="Progress Tracking"
      subtitle="Track homework and tuition activities for students"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="school-homework" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Homework Activity
          </TabsTrigger>
          <TabsTrigger value="tuition-activity" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Tuition Activity
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="all-students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Students
            </TabsTrigger>
          )}
        </TabsList>

        {/* School Homework Activity Tab */}
        <TabsContent value="school-homework" className="space-y-6">
          {/* Hierarchical Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* State */}
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {(states as State[]).map((state: State) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select 
                    value={selectedDistrict} 
                    onValueChange={handleDistrictChange}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {(districts as District[]).map((district: District) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mandal */}
                <div className="space-y-2">
                  <Label>Mandal</Label>
                  <Select 
                    value={selectedMandal} 
                    onValueChange={handleMandalChange}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mandals as Mandal[]).map((mandal: Mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Village */}
                <div className="space-y-2">
                  <Label>Village</Label>
                  <Select 
                    value={selectedVillage} 
                    onValueChange={handleVillageChange}
                    disabled={!selectedMandal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Village" />
                    </SelectTrigger>
                    <SelectContent>
                      {(villages as Village[]).map((village: Village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SO Center */}
                <div className="space-y-2">
                  <Label>SO Center</Label>
                  <Select 
                    value={selectedCenterNew} 
                    onValueChange={handleCenterChange}
                    disabled={!selectedVillage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {(centersNew as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select 
                    value={selectedClassNew} 
                    onValueChange={handleClassChange}
                    disabled={!selectedCenterNew}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(classesNew as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student */}
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select 
                    value={selectedStudentNew} 
                    onValueChange={handleStudentChange}
                    disabled={!selectedClassNew}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {(studentsNew as Student[]).map((student: Student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {!selectedStudentNew && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Please select a student to view School Homework Activity</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* School Homework Activity Data */}
          {selectedStudentNew && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  School Homework Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">Data will be loaded automatically for selected student</div>
                  <div className="text-sm">
                    <strong>Selected Student:</strong> {studentsNew.find(s => s.id === selectedStudentNew)?.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tuition Activity Tab */}
        <TabsContent value="tuition-activity" className="space-y-6">
          {/* Hierarchical Filters - Same as School Homework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* Same hierarchical filters as above */}
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select 
                    value={selectedDistrict} 
                    onValueChange={handleDistrictChange}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select 
                    value={selectedMandal} 
                    onValueChange={handleMandalChange}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select 
                    value={selectedVillage} 
                    onValueChange={handleVillageChange}
                    disabled={!selectedMandal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Village" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select 
                    value={selectedCenterNew} 
                    onValueChange={handleCenterChange}
                    disabled={!selectedVillage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {(centersNew as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select 
                    value={selectedClassNew} 
                    onValueChange={handleClassChange}
                    disabled={!selectedCenterNew}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(classesNew as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select 
                    value={selectedStudentNew} 
                    onValueChange={handleStudentChange}
                    disabled={!selectedClassNew}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {(studentsNew as Student[]).map((student: Student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Message */}
          {!selectedStudentNew && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Please select a student to view Tuition Activity</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tuition Activity Data */}
          {selectedStudentNew && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  Tuition Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">Data will be loaded automatically for selected student</div>
                  <div className="text-sm">
                    <strong>Selected Student:</strong> {studentsNew.find(s => s.id === selectedStudentNew)?.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Students Progress Overview - Admin Only */}
        {user?.role === 'admin' && (
          <TabsContent value="all-students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Students Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>SO Center</Label>
                    <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Centers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Centers</SelectItem>
                        {(soCenters as SoCenter[]).map((center: SoCenter) => (
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
                        <SelectItem value="all">All Classes</SelectItem>
                        {(classes as Class[]).map((cls: Class) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={dateRange.fromDate}
                      onChange={(e) => setDateRange(prev => ({...prev, fromDate: e.target.value}))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={dateRange.toDate}
                      onChange={(e) => setDateRange(prev => ({...prev, toDate: e.target.value}))}
                    />
                  </div>
                </div>

                {/* Progress Table */}
                <div className="border rounded-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="border-b px-4 py-3 text-left font-medium">Center</th>
                          <th className="border-b px-4 py-3 text-left font-medium">Class</th>
                          <th className="border-b px-4 py-3 text-left font-medium">Student</th>
                          <th className="border-b px-4 py-3 text-center font-medium">School HW %</th>
                          <th className="border-b px-4 py-3 text-center font-medium">Tuition %</th>
                          <th className="border-b px-4 py-3 text-center font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(progressTrackingData as ProgressTrackingData[]).length > 0 ? (
                          (progressTrackingData as ProgressTrackingData[]).map((data: ProgressTrackingData) => (
                            <tr key={data.studentId} className="hover:bg-muted/30">
                              <td className="border-b px-4 py-3">
                                <div>
                                  <div className="font-medium">{data.centerName}</div>
                                  <div className="text-xs text-muted-foreground">{data.centerCode}</div>
                                </div>
                              </td>
                              <td className="border-b px-4 py-3 font-medium">{data.className}</td>
                              <td className="border-b px-4 py-3">
                                <div>
                                  <div className="font-medium">{data.studentName}</div>
                                  <div className="text-xs text-muted-foreground">{data.studentCode}</div>
                                </div>
                              </td>
                              <td className="border-b px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge 
                                    variant={data.homeworkCompletionPercentage >= 70 ? "default" : "destructive"}
                                    className={data.homeworkCompletionPercentage >= 70 ? "bg-green-600" : ""}
                                  >
                                    {data.homeworkCompletionPercentage.toFixed(1)}%
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {data.completedHomework}/{data.totalHomeworkActivities}
                                  </span>
                                </div>
                              </td>
                              <td className="border-b px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Badge 
                                    variant={data.tuitionCompletionPercentage >= 70 ? "default" : "destructive"}
                                    className={data.tuitionCompletionPercentage >= 70 ? "bg-blue-600" : ""}
                                  >
                                    {data.tuitionCompletionPercentage.toFixed(1)}%
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {data.completedTuitionTopics}/{data.totalTuitionTopics}
                                  </span>
                                </div>
                              </td>
                              <td className="border-b px-4 py-3 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  {data.homeworkCompletionPercentage >= 70 && (
                                    <CheckCircle className="h-4 w-4 text-green-600" title="Good homework progress" />
                                  )}
                                  {data.tuitionCompletionPercentage >= 70 && (
                                    <Target className="h-4 w-4 text-blue-600" title="Good tuition progress" />
                                  )}
                                  {data.homeworkCompletionPercentage < 70 && data.tuitionCompletionPercentage < 70 && (
                                    <XCircle className="h-4 w-4 text-red-600" title="Needs attention" />
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="border-b px-4 py-8 text-center text-muted-foreground">
                              No progress data available. Select filters to view student progress.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Stats */}
                {(progressTrackingData as ProgressTrackingData[]).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="text-2xl font-bold">{(progressTrackingData as ProgressTrackingData[]).length}</div>
                          <div className="text-sm text-muted-foreground">Total Students</div>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <School className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="text-2xl font-bold">
                            {Math.round((progressTrackingData as ProgressTrackingData[])
                              .reduce((sum, data) => sum + data.homeworkCompletionPercentage, 0) / 
                              (progressTrackingData as ProgressTrackingData[]).length || 0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Avg. Homework</div>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-purple-600" />
                        <div>
                          <div className="text-2xl font-bold">
                            {Math.round((progressTrackingData as ProgressTrackingData[])
                              .reduce((sum, data) => sum + data.tuitionCompletionPercentage, 0) / 
                              (progressTrackingData as ProgressTrackingData[]).length || 0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Avg. Tuition</div>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Target className="h-8 w-8 text-orange-600" />
                        <div>
                          <div className="text-2xl font-bold">
                            {(progressTrackingData as ProgressTrackingData[])
                              .filter(data => data.homeworkCompletionPercentage >= 70 && data.tuitionCompletionPercentage >= 70)
                              .length}
                          </div>
                          <div className="text-sm text-muted-foreground">High Performers</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* School Homework Activity */}
        <TabsContent value="homework" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                School Homework Activity (Class-based)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track overall homework completion status for each student by class (not subject-specific)
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={homeworkDate}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                    title="Date is locked to today only"
                  />
                  <p className="text-xs text-muted-foreground">Date is set to today only</p>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedSubject('');
                    setSelectedChapter('');
                    setSelectedTopic('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {(classes as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={submitHomeworkActivity}
                    disabled={homeworkMutation.isPending || !selectedClass}
                    className="w-full"
                  >
                    {homeworkMutation.isPending ? 'Saving...' : 'Save Activity'}
                  </Button>
                </div>
              </div>

              {/* Student List */}
              {selectedClass && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students in {(classes as Class[]).find((c: Class) => c.id === selectedClass)?.name}
                  </h3>
                  
                  <div className="space-y-4">
                    {classStudents.map((student: Student) => (
                      <Card key={student.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                          </div>

                          {/* Homework Status Checkboxes */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Homework Status</Label>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`completed-${student.id}`}
                                  checked={homeworkActivities[student.id]?.status === 'completed'}
                                  onCheckedChange={(checked) => 
                                    handleHomeworkStatusChange(student.id, checked ? 'completed' : '')
                                  }
                                />
                                <Label htmlFor={`completed-${student.id}`} className="text-green-600">
                                  Completed
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`not-completed-${student.id}`}
                                  checked={homeworkActivities[student.id]?.status === 'not_completed'}
                                  onCheckedChange={(checked) => 
                                    handleHomeworkStatusChange(student.id, checked ? 'not_completed' : '')
                                  }
                                />
                                <Label htmlFor={`not-completed-${student.id}`} className="text-red-600">
                                  Not Completed
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`not-given-${student.id}`}
                                  checked={homeworkActivities[student.id]?.status === 'not_given'}
                                  onCheckedChange={(checked) => 
                                    handleHomeworkStatusChange(student.id, checked ? 'not_given' : '')
                                  }
                                />
                                <Label htmlFor={`not-given-${student.id}`} className="text-orange-600">
                                  Not Given in School
                                </Label>
                              </div>
                            </div>
                          </div>

                          {/* Completion Type (if completed) */}
                          {homeworkActivities[student.id]?.status === 'completed' && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Completed By</Label>
                              <Select 
                                value={homeworkActivities[student.id]?.completionType || ''}
                                onValueChange={(value) => handleCompletionTypeChange(student.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select completion type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="self">Self</SelectItem>
                                  <SelectItem value="helped_by_so">Helped by SO</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Reason (if not completed) */}
                          {homeworkActivities[student.id]?.status === 'not_completed' && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Reason for Not Completing</Label>
                              <Textarea
                                placeholder="Enter reason..."
                                value={homeworkActivities[student.id]?.reason || ''}
                                onChange={(e) => handleReasonChange(student.id, e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tuition Activity */}
        <TabsContent value="tuition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Tuition Activity - Topic Progress Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedSubject('');
                    setSelectedChapter('');
                    setSelectedTopic('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
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
                    setSelectedTopic('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((subject: Subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={selectedChapter} onValueChange={(value) => {
                    setSelectedChapter(value);
                    setSelectedTopic('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredChapters.map((chapter: Chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTopics.map((topic: Topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          <div className="flex items-center gap-2">
                            {topic.name}
                            {topic.isImportant && (
                              <Badge variant="destructive" className="text-xs">IMP</Badge>
                            )}
                            {topic.isModerate && (
                              <Badge variant="secondary" className="text-xs">Moderate</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="completed">Completed Only</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Topic Progress Matrix */}
              {selectedClass && selectedSubject && selectedChapter && selectedTopic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Topic: {(topics as Topic[]).find((t: Topic) => t.id === selectedTopic)?.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Completed: {filteredStudents.filter(s => isTopicCompleted(s.id, selectedTopic)).length}
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Pending: {filteredStudents.filter(s => !isTopicCompleted(s.id, selectedTopic)).length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student: Student) => {
                      const isCompleted = isTopicCompleted(student.id, selectedTopic);
                      return (
                        <Card key={student.id} className={`p-4 ${isCompleted ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">{student.studentId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">Topic already completed</p>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => markTopicCompleted(student.id, selectedTopic)}
                                  disabled={tuitionProgressMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {tuitionProgressMutation.isPending ? (
                                    <>
                                      <div className="animate-spin h-3 w-3 mr-1 rounded-full border-b-2 border-white"></div>
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Mark Complete
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}