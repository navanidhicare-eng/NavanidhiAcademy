import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  Target,
  Award,
  Calendar,
  PlusCircle,
  Loader2,
  User,
  GraduationCap,
  Book,
  FileText,
  Brain
} from 'lucide-react';
import { MathJaxComponent } from '@/components/ui/MathJax';

interface Class {
  id: string;
  name: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  className?: string;
}

interface Subject {
  id: string;
  name: string;
  classId?: string;
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
}

export function EnhancedProgressTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Homework Activity States
  const [selectedClassHomework, setSelectedClassHomework] = useState('');
  const [selectedStudentHomework, setSelectedStudentHomework] = useState('');
  const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().split('T')[0]);
  const [homeworkStatus, setHomeworkStatus] = useState(''); // 'completed', 'not_completed', 'not_given'
  const [completionMethod, setCompletionMethod] = useState(''); // 'alone', 'so_help'
  const [notCompletedReason, setNotCompletedReason] = useState('');
  const [homeworkActivities, setHomeworkActivities] = useState<any[]>([]);

  // Topic Completion States
  const [selectedClassTopic, setSelectedClassTopic] = useState('');
  const [selectedStudentTopic, setSelectedStudentTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  // Fetch classes - use manual API call to avoid caching issues with TanStack Query default queryFn
  const { data: classesResponse = [], isLoading: isLoadingClasses, error: classesError } = useQuery({
    queryKey: ["/api/classes", "progress-manual"],
    queryFn: async () => {
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  const classes = Array.isArray(classesResponse) ? classesResponse : [];



  // Fetch students for homework activity - use manual fetch to avoid caching issues
  const { data: studentsHomeworkResponse = [], isLoading: isLoadingStudentsHomework } = useQuery({
    queryKey: ["/api/students", "homework-manual"],
    queryFn: async () => {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const allStudentsHomework = Array.isArray(studentsHomeworkResponse) ? studentsHomeworkResponse : [];



  // Filter students by selected class for homework
  const filteredStudentsHomework = useMemo(() => {
    if (!selectedClassHomework || !allStudentsHomework.length) return [];
    return allStudentsHomework.filter((student: Student) => student.classId === selectedClassHomework);
  }, [allStudentsHomework, selectedClassHomework]);

  // Fetch students for topic completion - use manual fetch to avoid caching issues
  const { data: studentsTopicResponse = [], isLoading: isLoadingStudentsTopic } = useQuery({
    queryKey: ["/api/students", "topic-manual"],
    queryFn: async () => {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: true,
    staleTime: 0,
    cacheTime: 0,
  });

  const allStudentsTopic = Array.isArray(studentsTopicResponse) ? studentsTopicResponse : [];

  // Filter students by selected class for topics
  const filteredStudentsTopic = useMemo(() => {
    if (!selectedClassTopic || !allStudentsTopic.length) return [];
    return allStudentsTopic.filter((student: Student) => student.classId === selectedClassTopic);
  }, [allStudentsTopic, selectedClassTopic]);

  // Fetch subjects based on selected class for topics
  const { data: subjectsResponse = [], isLoading: isLoadingSubjects, error: subjectsError } = useQuery({
    queryKey: ["/api/subjects", selectedClassTopic],
    queryFn: async () => {
      if (!selectedClassTopic) return [];
      console.log('🔍 Fetching subjects for class:', selectedClassTopic);
      const response = await apiRequest("GET", `/api/subjects/${selectedClassTopic}`);
      const data = await response.json();
      console.log('📚 Subjects response:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedClassTopic,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const subjects = Array.isArray(subjectsResponse) ? subjectsResponse : [];

  // Fetch chapters based on selected subject
  const { data: chaptersResponse = [], isLoading: isLoadingChapters, error: chaptersError } = useQuery({
    queryKey: ["/api/chapters", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      console.log('🔍 Fetching chapters for subject:', selectedSubject);
      const response = await apiRequest("GET", `/api/chapters/${selectedSubject}`);
      const data = await response.json();
      console.log('📚 Chapters response:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedSubject,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const chapters = Array.isArray(chaptersResponse) ? chaptersResponse : [];

  // Fetch topics based on selected chapter
  const { data: topicsResponse = [], isLoading: isLoadingTopics, error: topicsError } = useQuery({
    queryKey: ["/api/topics", selectedChapter],
    queryFn: async () => {
      if (!selectedChapter) return [];
      console.log('🔍 Fetching topics for chapter:', selectedChapter);
      const response = await apiRequest("GET", `/api/topics/${selectedChapter}`);
      const data = await response.json();
      console.log('📝 Topics response:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedChapter,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const topics = Array.isArray(topicsResponse) ? topicsResponse : [];

  // Reset dependent dropdowns when parent changes
  useEffect(() => {
    setSelectedStudentHomework('');
  }, [selectedClassHomework]);

  useEffect(() => {
    setSelectedStudentTopic('');
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedTopic('');
    setCompletedTopics([]);
  }, [selectedClassTopic]);

  useEffect(() => {
    setSelectedChapter('');
    setSelectedTopic('');
    setCompletedTopics([]);
  }, [selectedSubject]);

  // Debug logging for class selection
  useEffect(() => {
    if (selectedClassTopic) {
      console.log('🏫 Class selected for topics:', selectedClassTopic);
      console.log('📚 Will fetch subjects for class:', selectedClassTopic);
    }
  }, [selectedClassTopic]);

  // Debug logging for subject selection
  useEffect(() => {
    if (selectedSubject) {
      console.log('📖 Subject selected for topics:', selectedSubject);
      console.log('📑 Will fetch chapters for subject:', selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    setSelectedTopic('');
    setCompletedTopics([]);
  }, [selectedChapter]);

  // Debug logging for chapter selection
  useEffect(() => {
    if (selectedChapter) {
      console.log('📖 Chapter selected for topics:', selectedChapter);
      console.log('📝 Will fetch topics for chapter:', selectedChapter);
    }
  }, [selectedChapter]);

  // Fetch topic completion status when student and chapter are selected
  const { data: topicStatusResponse } = useQuery({
    queryKey: ["/api/progress-tracking/topics/status", selectedStudentTopic, selectedChapter],
    queryFn: () => apiRequest("GET", `/api/progress-tracking/topics/status?studentId=${selectedStudentTopic}&chapterId=${selectedChapter}`),
    enabled: !!selectedStudentTopic && !!selectedChapter,
  });

  useEffect(() => {
    if (topicStatusResponse?.completed) {
      setCompletedTopics(topicStatusResponse.completed);
    }
  }, [topicStatusResponse]);

  // Homework Activity Submission
  const homeworkMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/progress-tracking/homework", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Homework activities saved successfully",
      });
      setHomeworkActivities([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save homework activities",
        variant: "destructive",
      });
    },
  });

  // Topic Completion Submission
  const topicCompletionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/progress-tracking/topics/complete", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic marked as completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress-tracking/topics/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark topic as completed",
        variant: "destructive",
      });
    },
  });

  const handleAddHomeworkActivity = () => {
    if (!selectedStudentHomework || !homeworkStatus) {
      toast({
        title: "Error",
        description: "Please select a student and homework status",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields based on status
    if (homeworkStatus === 'completed' && !completionMethod) {
      toast({
        title: "Error",
        description: "Please specify how the student completed the homework",
        variant: "destructive",
      });
      return;
    }

    if (homeworkStatus === 'not_completed' && !notCompletedReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for not completing homework",
        variant: "destructive",
      });
      return;
    }

    const newActivity = {
      studentId: selectedStudentHomework,
      date: homeworkDate,
      status: homeworkStatus,
      completionType: homeworkStatus === 'completed' ? completionMethod : undefined,
      reason: homeworkStatus === 'not_completed' ? notCompletedReason.trim() : undefined,
    };

    setHomeworkActivities([...homeworkActivities, newActivity]);

    // Reset form after adding
    setSelectedStudentHomework('');
    setHomeworkStatus('');
    setCompletionMethod('');
    setNotCompletedReason('');
  };

  const handleSubmitHomework = () => {
    if (homeworkActivities.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one homework activity",
        variant: "destructive",
      });
      return;
    }

    homeworkMutation.mutate({ activities: homeworkActivities });
  };

  const handleCompleteTopics = () => {
    if (!selectedStudentTopic || !selectedTopic) {
      toast({
        title: "Error",
        description: "Please select student and topic",
        variant: "destructive",
      });
      return;
    }

    topicCompletionMutation.mutate({
      studentId: selectedStudentTopic,
      topicId: selectedTopic,
      chapterId: selectedChapter,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
          <p className="text-muted-foreground">Track homework activities and topic completion for your students</p>
        </div>
      </div>

      <Tabs defaultValue="homework" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="homework" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            School Homework Activity
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Topic Completion Tracking
          </TabsTrigger>
        </TabsList>

        {/* School Homework Activity */}
        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                School Homework Activity Tracking
              </CardTitle>
              <CardDescription>
                Track daily homework completion status for students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Class Selection */}
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50/50">
                  <h3 className="font-medium text-blue-900 mb-3">Step 1: Select Class</h3>
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select
                      value={selectedClassHomework}
                      onValueChange={(value) => {
                        setSelectedClassHomework(value);
                        setSelectedStudentHomework(''); // Reset student when class changes
                        setHomeworkStatus(''); // Reset status
                        setCompletionMethod('');
                        setNotCompletedReason('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "First, select the class"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClasses ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading classes...
                          </SelectItem>
                        ) : classes.length === 0 ? (
                          <SelectItem value="no-classes-available" disabled>
                            No classes available
                          </SelectItem>
                        ) : (
                          classes
                            .filter((classItem: Class) => classItem.id && classItem.id.trim() !== '')
                            .map((classItem: Class) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                {classItem.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Step 2: Student Selection */}
                {selectedClassHomework && (
                  <div className="p-4 border rounded-lg bg-green-50/50">
                    <h3 className="font-medium text-green-900 mb-3">Step 2: Select Student from that Class</h3>
                    <div className="space-y-2">
                      <Label>Student *</Label>
                      <Select
                        value={selectedStudentHomework}
                        onValueChange={(value) => {
                          setSelectedStudentHomework(value);
                          setHomeworkStatus(''); // Reset status when student changes
                          setCompletionMethod('');
                          setNotCompletedReason('');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingStudentsHomework
                              ? "Loading students..."
                              : "Then, select the student from that class"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingStudentsHomework ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading students...
                            </SelectItem>
                          ) : filteredStudentsHomework.length === 0 ? (
                            <SelectItem value="no-students" disabled>
                              No students found in this class
                            </SelectItem>
                          ) : (
                            filteredStudentsHomework.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {student.name} ({student.studentId})
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 3: Homework Status Selection */}
                {selectedStudentHomework && (
                  <div className="p-4 border rounded-lg bg-purple-50/50">
                    <h3 className="font-medium text-purple-900 mb-3">Step 3: Select Homework Status</h3>
                    <div className="space-y-3">
                      <Label>Homework Status *</Label>
                      <Select
                        value={homeworkStatus}
                        onValueChange={(value) => {
                          setHomeworkStatus(value);
                          setCompletionMethod(''); // Reset completion method
                          setNotCompletedReason(''); // Reset reason
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select the homework status with these 3 options" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="not_completed">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-red-600" />
                              Not Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="not_given">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              Not Given (by school)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 4a: If Completed - Ask completion method */}
                {homeworkStatus === 'completed' && (
                  <div className="p-4 border rounded-lg bg-yellow-50/50">
                    <h3 className="font-medium text-yellow-900 mb-3">Step 4: How did the student complete it?</h3>
                    <div className="space-y-3">
                      <Label>Completion Method *</Label>
                      <Select value={completionMethod} onValueChange={setCompletionMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Did the student complete it on their own?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              Did the student complete it on their own?
                            </div>
                          </SelectItem>
                          <SelectItem value="helped_by_so">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              Did SO help the student to complete it?
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 4b: If Not Completed - Ask for reason */}
                {homeworkStatus === 'not_completed' && (
                  <div className="p-4 border rounded-lg bg-red-50/50">
                    <h3 className="font-medium text-red-900 mb-3">Step 4: Provide a reason</h3>
                    <div className="space-y-3">
                      <Label>Reason for not completing homework *</Label>
                      <Textarea
                        placeholder="Please provide a reason for not completing homework..."
                        value={notCompletedReason}
                        onChange={(e) => setNotCompletedReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4c: If Not Given - No further input needed */}
                {homeworkStatus === 'not_given' && (
                  <div className="p-4 border rounded-lg bg-gray-50/50">
                    <h3 className="font-medium text-gray-900 mb-3">Step 4: No further input needed</h3>
                    <p className="text-gray-600">Since homework was not given by school, no additional information is required.</p>
                  </div>
                )}

                {/* Date Selection */}
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={homeworkDate}
                      onChange={(e) => setHomeworkDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    onClick={handleAddHomeworkActivity}
                    disabled={
                      !selectedStudentHomework ||
                      !homeworkStatus ||
                      (homeworkStatus === 'completed' && !completionMethod) ||
                      (homeworkStatus === 'not_completed' && !notCompletedReason.trim())
                    }
                    variant="outline"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Homework Activity
                  </Button>

                  <Button
                    onClick={handleSubmitHomework}
                    disabled={homeworkActivities.length === 0 || homeworkMutation.isPending}
                  >
                    {homeworkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Activities ({homeworkActivities.length})
                  </Button>
                </div>

                {/* Pending Activities */}
                {homeworkActivities.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Pending Activities</h3>
                    <div className="space-y-2">
                      {homeworkActivities.map((activity, index) => {
                        const student = filteredStudentsHomework.find(s => s.id === activity.studentId);

                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded border">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{student?.name} ({student?.studentId})</div>
                                <div className="text-sm text-muted-foreground">
                                  Status: {activity.status === 'completed' ? 'Completed' : activity.status === 'not_completed' ? 'Not Completed' : 'Not Given'}
                                  {activity.completionType && ` - ${activity.completionType === 'self' ? 'On their own' : 'With SO help'}`}
                                  {activity.reason && ` - Reason: ${activity.reason}`}
                                </div>
                              </div>
                              <Badge variant="outline">{activity.date}</Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHomeworkActivities(activities =>
                                activities.filter((_, i) => i !== index)
                              )}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Completion Tracking */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Topic Completion Tracking
              </CardTitle>
              <CardDescription>
                Mark topics as completed for students with automatic date capture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Date Display */}
              <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="font-medium text-gray-900 mb-2">Date Automatically Captured</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-medium text-blue-900">
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Workflow */}
              <div className="space-y-4">
                {/* Step 1: Class Selection */}
                <div className="p-4 border rounded-lg bg-blue-50/50">
                  <h3 className="font-medium text-blue-900 mb-3">Step 1: Select Class</h3>
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select
                      value={selectedClassTopic}
                      onValueChange={(value) => {
                        setSelectedClassTopic(value);
                        setSelectedStudentTopic(''); // Reset dependent selections
                        setSelectedSubject('');
                        setSelectedChapter('');
                        setSelectedTopic('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "First, select the class"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingClasses ? (
                          <SelectItem value="loading" disabled>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading classes...
                          </SelectItem>
                        ) : classes.length === 0 ? (
                          <SelectItem value="no-classes-available" disabled>
                            No classes available
                          </SelectItem>
                        ) : (
                          classes
                            .filter((classItem: Class) => classItem.id && classItem.id.trim() !== '')
                            .map((classItem: Class) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                {classItem.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Step 2: Student Selection */}
                {selectedClassTopic && (
                  <div className="p-4 border rounded-lg bg-green-50/50">
                    <h3 className="font-medium text-green-900 mb-3">Step 2: Select Student from that Class</h3>
                    <div className="space-y-2">
                      <Label>Student *</Label>
                      <Select
                        value={selectedStudentTopic}
                        onValueChange={setSelectedStudentTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingStudentsTopic
                              ? "Loading students..."
                              : "Then, select the student from that class"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingStudentsTopic ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading students...
                            </SelectItem>
                          ) : filteredStudentsTopic.length === 0 ? (
                            <SelectItem value="no-students" disabled>
                              No students found in this class
                            </SelectItem>
                          ) : (
                            filteredStudentsTopic.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {student.name} ({student.studentId})
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 3: Subject Selection */}
                {selectedClassTopic && (
                  <div className="p-4 border rounded-lg bg-purple-50/50">
                    <h3 className="font-medium text-purple-900 mb-3">Step 3: Select Subject for that Class</h3>
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Select
                        value={selectedSubject}
                        onValueChange={(value) => {
                          setSelectedSubject(value);
                          setSelectedChapter(''); // Reset dependent selections
                          setSelectedTopic('');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingSubjects
                              ? "Loading subjects..."
                              : "Then, select the subject assigned to that class"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingSubjects ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading subjects...
                            </SelectItem>
                          ) : subjects.length === 0 ? (
                            <SelectItem value="no-subjects" disabled>
                              {subjectsError ? 'Error loading subjects' : 'No subjects found for this class'}
                            </SelectItem>
                          ) : (
                            subjects.map((subject: Subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                <div className="flex items-center gap-2">
                                  <Book className="h-4 w-4" />
                                  {subject.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 4: Chapter Selection */}
                {selectedSubject && (
                  <div className="p-4 border rounded-lg bg-yellow-50/50">
                    <h3 className="font-medium text-yellow-900 mb-3">Step 4: Select Chapter for that Subject</h3>
                    <div className="space-y-2">
                      <Label>Chapter *</Label>
                      <Select
                        value={selectedChapter}
                        onValueChange={(value) => {
                          setSelectedChapter(value);
                          setSelectedTopic(''); // Reset dependent selection
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingChapters
                              ? "Loading chapters..."
                              : "Then, select the chapter for that subject"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingChapters ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading chapters...
                            </SelectItem>
                          ) : chapters.length === 0 ? (
                            <SelectItem value="no-chapters" disabled>
                              {chaptersError ? 'Error loading chapters' : 'No chapters found for this subject'}
                            </SelectItem>
                          ) : (
                            chapters.map((chapter: Chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  {chapter.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 5: Topic Selection */}
                {selectedChapter && (
                  <div className="p-4 border rounded-lg bg-orange-50/50">
                    <h3 className="font-medium text-orange-900 mb-3">Step 5: Select Topic for that Chapter</h3>
                    <div className="space-y-2">
                      <Label>Topic *</Label>
                      <Select
                        value={selectedTopic}
                        onValueChange={setSelectedTopic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingTopics
                              ? "Loading topics..."
                              : "Finally, select the topic for that chapter"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTopics ? (
                            <SelectItem value="loading" disabled>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading topics...
                            </SelectItem>
                          ) : topics.length === 0 ? (
                            <SelectItem value="no-topics" disabled>
                              {topicsError ? 'Error loading topics' : 'No topics found for this chapter'}
                            </SelectItem>
                          ) : (
                            topics.map((topic: Topic) => {
                              const isCompleted = completedTopics.includes(topic.id);
                              return (
                                <SelectItem key={topic.id} value={topic.id}>
                                  <div className="flex items-center gap-2">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="font-medium">
                                      <MathJaxComponent inline={true}>{topic.name}</MathJaxComponent>
                                    </span>
                                    {isCompleted && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Completed
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {selectedTopic && (
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      onClick={handleCompleteTopics}
                      disabled={
                        !selectedStudentTopic ||
                        !selectedTopic ||
                        completedTopics.includes(selectedTopic) ||
                        topicCompletionMutation.isPending
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {topicCompletionMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Topic as Completed
                    </Button>

                    {completedTopics.includes(selectedTopic) && selectedTopic && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Already Completed
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Summary */}
              {selectedStudentTopic && selectedChapter && topicStatusResponse && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Progress Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Completed: {topicStatusResponse.completed?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Remaining: {topicStatusResponse.remaining?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Total: {topicStatusResponse.total || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}