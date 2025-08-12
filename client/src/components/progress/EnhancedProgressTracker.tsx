import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { 
  BookOpen, 
  School, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Save,
  Calendar,
  Filter
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  className: string;
  isPresent?: boolean;
}

interface Class {
  id: string;
  name: string;
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
  isCompleted?: boolean;
}

interface TopicCounts {
  completed: number;
  remaining: number;
}

interface HomeworkActivity {
  studentId: string;
  status: 'completed' | 'not_completed' | 'not_given';
  completionType?: 'self' | 'helped_by_so';
  reason?: string;
  date: string;
}

export function EnhancedProgressTracker() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState('school-homework');

  // School Homework states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().split('T')[0]);
  const [homeworkActivities, setHomeworkActivities] = useState<Record<string, HomeworkActivity>>({});

  // Topic Completion states
  const [topicSelectedClass, setTopicSelectedClass] = useState('');
  const [topicSelectedStudent, setTopicSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'completed' | 'not_completed'
  const [topicCounts, setTopicCounts] = useState<Record<string, TopicCounts>>({});

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/classes');
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch students for homework (only present students)
  const { data: homeworkStudents = [], isLoading: homeworkStudentsLoading } = useQuery({
    queryKey: ['/api/students', selectedClass, 'present', homeworkDate],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const students = await apiRequest('GET', `/api/students?classId=${selectedClass}`);
        // Filter only present students from today's attendance
        const attendance = await apiRequest('GET', `/api/attendance/existing?date=${homeworkDate}`);
        return Array.isArray(students) ? students.filter((student: Student) => 
          attendance[student.id]?.status === 'present'
        ) : [];
      } catch (error) {
        console.error('Error fetching homework students:', error);
        return [];
      }
    },
    enabled: !!selectedClass,
  });

  // Fetch students for topic completion
  const { data: topicStudents = [], isLoading: topicStudentsLoading } = useQuery({
    queryKey: ['/api/students', topicSelectedClass],
    queryFn: async () => {
      if (!topicSelectedClass) return [];
      try {
        const response = await apiRequest('GET', `/api/students?classId=${topicSelectedClass}`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching topic students:', error);
        return [];
      }
    },
    enabled: !!topicSelectedClass,
  });

  // Fetch subjects
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects', topicSelectedClass],
    queryFn: async () => {
      if (!topicSelectedClass) return [];
      try {
        const response = await apiRequest('GET', `/api/subjects/${topicSelectedClass}`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }
    },
    enabled: !!topicSelectedClass,
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/chapters', selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      try {
        const response = await apiRequest('GET', `/api/chapters/${selectedSubject}`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
      }
    },
    enabled: !!selectedSubject,
  });

  // Fetch topics with completion status
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/topics', selectedChapter, topicSelectedStudent, topicFilter],
    queryFn: async () => {
      if (!selectedChapter) return [];
      try {
        const allTopics = await apiRequest('GET', `/api/topics/${selectedChapter}`);
        
        if (!Array.isArray(allTopics)) return [];
        if (!topicSelectedStudent) return allTopics;
        
        // Get completion status for student
        try {
          const completionStatus = await apiRequest('GET', `/api/progress-tracking/topics/status?studentId=${topicSelectedStudent}&chapterId=${selectedChapter}`);
          
          const topicsWithStatus = allTopics.map((topic: Topic) => ({
            ...topic,
            isCompleted: completionStatus.completed && completionStatus.completed.includes(topic.id)
          }));

          // Apply filter
          if (topicFilter === 'completed') {
            return topicsWithStatus.filter((t: Topic) => t.isCompleted);
          } else if (topicFilter === 'not_completed') {
            return topicsWithStatus.filter((t: Topic) => !t.isCompleted);
          }
          
          return topicsWithStatus;
        } catch (statusError) {
          console.error('Error fetching completion status:', statusError);
          return allTopics;
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
      }
    },
    enabled: !!selectedChapter,
  });

  // Fetch topic counts for each student
  useEffect(() => {
    if (topicStudents.length > 0 && selectedChapter) {
      topicStudents.forEach(async (student: Student) => {
        try {
          const counts = await apiRequest('GET', `/api/progress-tracking/topics/status?studentId=${student.id}&chapterId=${selectedChapter}`);
          setTopicCounts(prev => ({
            ...prev,
            [student.id]: {
              completed: counts.completed.length,
              remaining: counts.remaining.length
            }
          }));
        } catch (error) {
          console.error('Error fetching topic counts:', error);
        }
      });
    }
  }, [topicStudents, selectedChapter]);

  // Homework submission mutation
  const homeworkMutation = useMutation({
    mutationFn: (data: HomeworkActivity[]) => 
      apiRequest('POST', '/api/progress-tracking/homework', { activities: data }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Homework activities saved successfully",
      });
      setHomeworkActivities({});
      queryClient.invalidateQueries({ queryKey: ['/api/homework-activities'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save homework activities",
        variant: "destructive",
      });
    }
  });

  // Topic completion mutation
  const topicCompletionMutation = useMutation({
    mutationFn: (data: { studentId: string; topicId: string; chapterId: string }) =>
      apiRequest('POST', '/api/progress-tracking/topics/complete', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Topic marked as completed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress-tracking'] });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to mark topic as completed",
        variant: "destructive",
      });
    }
  });

  // Handle homework activity change
  const handleHomeworkActivityChange = (studentId: string, field: keyof HomeworkActivity, value: any) => {
    setHomeworkActivities(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        date: homeworkDate,
        [field]: value
      }
    }));
  };

  // Handle homework status change
  const handleHomeworkStatusChange = (studentId: string, status: HomeworkActivity['status']) => {
    setHomeworkActivities(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        status,
        date: homeworkDate,
        // Reset conditional fields
        completionType: undefined,
        reason: undefined
      }
    }));
  };

  // Submit homework activities
  const handleHomeworkSubmit = () => {
    const activities = Object.values(homeworkActivities).filter(activity => activity.status);
    if (activities.length === 0) {
      toast({
        title: "No Data",
        description: "Please select homework status for at least one student",
        variant: "destructive",
      });
      return;
    }
    homeworkMutation.mutate(activities);
  };

  // Mark topic as completed
  const handleTopicComplete = (topicId: string) => {
    if (!topicSelectedStudent || !selectedChapter) {
      toast({
        title: "Error",
        description: "Please select a student and chapter first",
        variant: "destructive",
      });
      return;
    }
    
    topicCompletionMutation.mutate({
      studentId: topicSelectedStudent,
      topicId,
      chapterId: selectedChapter
    });
  };

  // Reset dependent dropdowns
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedStudent('');
    setHomeworkActivities({});
  };

  const handleTopicClassChange = (classId: string) => {
    setTopicSelectedClass(classId);
    setTopicSelectedStudent('');
    setSelectedSubject('');
    setSelectedChapter('');
    setTopicCounts({});
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedChapter('');
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapter(chapterId);
    setTopicCounts({});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracking</h1>
          <p className="text-muted-foreground">
            Track homework activities and topic completion for students
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="school-homework" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Homework
          </TabsTrigger>
          <TabsTrigger value="topic-completion" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Topic Completion Tracking
          </TabsTrigger>
        </TabsList>

        {/* School Homework Tab */}
        <TabsContent value="school-homework" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                School Homework Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={homeworkDate}
                    onChange={(e) => setHomeworkDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((cls: Class) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-muted-foreground">
                          No classes available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Students List */}
              {selectedClass && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Present Students</h3>
                    <Badge variant="secondary">
                      {homeworkStudents.length} students present
                    </Badge>
                  </div>

                  {homeworkStudentsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading students...</span>
                    </div>
                  ) : homeworkStudents.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No students present for this class on {homeworkDate}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(homeworkStudents) ? homeworkStudents.map((student: Student) => (
                        <Card key={student.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{student.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  ID: {student.studentId}
                                </p>
                              </div>
                            </div>

                            {/* Homework Status Checkboxes */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Homework Status</Label>
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${student.id}-completed`}
                                    checked={homeworkActivities[student.id]?.status === 'completed'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleHomeworkStatusChange(student.id, 'completed');
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`${student.id}-completed`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Homework Completed
                                  </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${student.id}-not-completed`}
                                    checked={homeworkActivities[student.id]?.status === 'not_completed'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleHomeworkStatusChange(student.id, 'not_completed');
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`${student.id}-not-completed`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    Homework Not Completed
                                  </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${student.id}-not-given`}
                                    checked={homeworkActivities[student.id]?.status === 'not_given'}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleHomeworkStatusChange(student.id, 'not_given');
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`${student.id}-not-given`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                  >
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    Homework Not Given
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Conditional Fields */}
                            {homeworkActivities[student.id]?.status === 'completed' && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">How was it completed?</Label>
                                <RadioGroup
                                  value={homeworkActivities[student.id]?.completionType || ''}
                                  onValueChange={(value) => 
                                    handleHomeworkActivityChange(student.id, 'completionType', value as 'self' | 'helped_by_so')
                                  }
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="self" id={`${student.id}-self`} />
                                    <label htmlFor={`${student.id}-self`} className="text-sm">
                                      Completed Independently
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="helped_by_so" id={`${student.id}-helped`} />
                                    <label htmlFor={`${student.id}-helped`} className="text-sm">
                                      SO Help to Complete
                                    </label>
                                  </div>
                                </RadioGroup>
                              </div>
                            )}

                            {homeworkActivities[student.id]?.status === 'not_completed' && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Reason for Not Completed</Label>
                                <Textarea
                                  placeholder="Enter reason why homework was not completed..."
                                  value={homeworkActivities[student.id]?.reason || ''}
                                  onChange={(e) => 
                                    handleHomeworkActivityChange(student.id, 'reason', e.target.value)
                                  }
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )) : null}

                      {/* Submit Button */}
                      <div className="flex justify-end pt-4">
                        <Button 
                          onClick={handleHomeworkSubmit}
                          disabled={homeworkMutation.isPending || Object.keys(homeworkActivities).length === 0}
                          className="flex items-center gap-2"
                        >
                          {homeworkMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Homework Activities
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topic Completion Tab */}
        <TabsContent value="topic-completion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Topic Completion Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dependent Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={topicSelectedClass} onValueChange={handleTopicClassChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((cls: Class) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-muted-foreground">
                          No classes available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select 
                    value={topicSelectedStudent} 
                    onValueChange={setTopicSelectedStudent}
                    disabled={!topicSelectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {topicStudentsLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : Array.isArray(topicStudents) && topicStudents.length > 0 ? (
                        topicStudents.map((student: Student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.studentId})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-muted-foreground">
                          No students available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={handleSubjectChange}
                    disabled={!topicSelectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : Array.isArray(subjects) && subjects.length > 0 ? (
                        subjects.map((subject: Subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-muted-foreground">
                          No subjects available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select 
                    value={selectedChapter} 
                    onValueChange={handleChapterChange}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chaptersLoading ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : Array.isArray(chapters) && chapters.length > 0 ? (
                        chapters.map((chapter: Chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {chapter.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center p-2 text-muted-foreground">
                          No chapters available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Topic Filter */}
              {selectedChapter && (
                <div className="flex items-center gap-4">
                  <Label>Filter Topics:</Label>
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="not_completed">Not Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Student Progress Summary */}
              {topicSelectedStudent && topicCounts[topicSelectedStudent] && (
                <div className="flex gap-4">
                  <Badge variant="default" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Completed: {topicCounts[topicSelectedStudent].completed}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Remaining: {topicCounts[topicSelectedStudent].remaining}
                  </Badge>
                </div>
              )}

              {/* Topics List */}
              {selectedChapter && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Topics</h3>
                    <Badge variant="outline">
                      {topics.length} topics
                    </Badge>
                  </div>

                  {topicsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading topics...</span>
                    </div>
                  ) : topics.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No topics found for the selected filters
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(topics) ? topics.map((topic: Topic) => (
                        <Card key={topic.id} className={`p-4 ${topic.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm">{topic.name}</h4>
                              {topic.isCompleted ? (
                                <Badge variant="default" className="ml-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-2">
                                  Pending
                                </Badge>
                              )}
                            </div>
                            
                            {!topic.isCompleted && topicSelectedStudent && (
                              <Button
                                size="sm"
                                onClick={() => handleTopicComplete(topic.id)}
                                disabled={topicCompletionMutation.isPending}
                                className="w-full"
                              >
                                {topicCompletionMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Mark Complete'
                                )}
                              </Button>
                            )}
                          </div>
                        </Card>
                      )) : null}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}