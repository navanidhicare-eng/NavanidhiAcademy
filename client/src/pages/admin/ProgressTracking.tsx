import { useState } from 'react';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookOpen, School, Target, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  className: string;
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
  
  // States for filters
  const [activeTab, setActiveTab] = useState('homework');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [homeworkDate, setHomeworkDate] = useState(new Date().toISOString().split('T')[0]);

  // Homework activity states
  const [homeworkActivities, setHomeworkActivities] = useState<Record<string, {
    status: 'completed' | 'not_completed' | 'not_given' | '';
    completionType?: 'self' | 'helped_by_so';
    reason?: string;
  }>>({});

  // Fetch data
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

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students', user?.id],
    queryFn: async () => {
      if (user?.role === 'admin') {
        // Admin uses admin endpoint to see all students
        const response = await fetch('/api/admin/students', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch students');
        return response.json();
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
    enabled: !!user && !!selectedClass,
  });

  const { data: tuitionProgress = [] } = useQuery({
    queryKey: ['/api/tuition-progress', selectedClass, selectedTopic],
    enabled: !!selectedClass && !!selectedTopic,
  });

  // Get filtered data
  const filteredSubjects = subjects.filter((s: Subject) => s.classId === selectedClass);
  const filteredChapters = chapters.filter((c: Chapter) => c.subjectId === selectedSubject);
  const filteredTopics = topics.filter((t: Topic) => 
    filteredChapters.some((c: Chapter) => c.id === t.chapterId)
  );
  const classStudents = students.filter((s: Student) => s.classId === selectedClass);

  // Mutations
  const homeworkMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/homework-activity', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
      return apiRequest('/api/tuition-progress', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Topic progress updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tuition-progress'] });
    },
    onError: () => {
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
    if (!selectedClass || !selectedSubject || !homeworkDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select class, subject, and date',
        variant: 'destructive',
      });
      return;
    }

    const activities = Object.entries(homeworkActivities)
      .filter(([_, activity]) => activity.status)
      .map(([studentId, activity]) => ({
        studentId,
        subjectId: selectedSubject,
        date: homeworkDate,
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
      completedDate: new Date().toISOString(),
    });
  };

  const isTopicCompleted = (studentId: string, topicId: string) => {
    return tuitionProgress.some((progress: TuitionProgress) => 
      progress.studentId === studentId && 
      progress.topicId === topicId && 
      progress.status === 'learned'
    );
  };

  return (
    <DashboardLayout
      title="Progress Tracking"
      subtitle="Track homework and tuition activities for students"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="homework" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            School Homework Activity
          </TabsTrigger>
          <TabsTrigger value="tuition" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Tuition Activity
          </TabsTrigger>
        </TabsList>

        {/* School Homework Activity */}
        <TabsContent value="homework" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                School Homework Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
                <div className="flex items-end">
                  <Button 
                    onClick={submitHomeworkActivity}
                    disabled={homeworkMutation.isPending}
                    className="w-full"
                  >
                    {homeworkMutation.isPending ? 'Saving...' : 'Save Activity'}
                  </Button>
                </div>
              </div>

              {/* Student List */}
              {selectedClass && selectedSubject && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students in {classes.find((c: Class) => c.id === selectedClass)?.name}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              </div>

              {/* Topic Progress Matrix */}
              {selectedClass && selectedSubject && selectedTopic && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Topic: {topics.find((t: Topic) => t.id === selectedTopic)?.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Completed
                      <XCircle className="h-4 w-4 text-red-600 ml-2" />
                      Pending
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classStudents.map((student: Student) => {
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
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => markTopicCompleted(student.id, selectedTopic)}
                                  disabled={tuitionProgressMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Mark Complete
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