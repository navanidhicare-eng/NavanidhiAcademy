
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
  const [homeworkActivities, setHomeworkActivities] = useState<any[]>([]);

  // Topic Completion States
  const [selectedClassTopic, setSelectedClassTopic] = useState('');
  const [selectedStudentTopic, setSelectedStudentTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  // Fetch classes - only classes with students in this SO Center
  const { data: classesResponse = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes"],
    queryFn: () => apiRequest("GET", "/api/classes"),
  });

  const classes = Array.isArray(classesResponse) ? classesResponse : [];

  // Fetch students for homework activity - use regular students endpoint which works consistently
  const { data: studentsHomeworkResponse = [], isLoading: isLoadingStudentsHomework } = useQuery({
    queryKey: ["/api/students"],
    queryFn: () => apiRequest("GET", "/api/students"),
    enabled: true,
  });

  const allStudentsHomework = Array.isArray(studentsHomeworkResponse) ? studentsHomeworkResponse : [];

  // Filter students by selected class for homework
  const filteredStudentsHomework = useMemo(() => {
    if (!selectedClassHomework || !allStudentsHomework.length) return [];
    return allStudentsHomework.filter((student: Student) => student.classId === selectedClassHomework);
  }, [allStudentsHomework, selectedClassHomework]);

  // Fetch students for topic completion - use regular students endpoint which works consistently
  const { data: studentsTopicResponse = [], isLoading: isLoadingStudentsTopic } = useQuery({
    queryKey: ["/api/students"],
    queryFn: () => apiRequest("GET", "/api/students"),
    enabled: true,
  });

  const allStudentsTopic = Array.isArray(studentsTopicResponse) ? studentsTopicResponse : [];

  // Filter students by selected class for topics
  const filteredStudentsTopic = useMemo(() => {
    if (!selectedClassTopic || !allStudentsTopic.length) return [];
    return allStudentsTopic.filter((student: Student) => student.classId === selectedClassTopic);
  }, [allStudentsTopic, selectedClassTopic]);

  // Fetch subjects based on selected class for topics
  const { data: subjectsResponse = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects", selectedClassTopic],
    queryFn: () => apiRequest("GET", `/api/subjects/${selectedClassTopic}`),
    enabled: !!selectedClassTopic,
  });

  const subjects = Array.isArray(subjectsResponse) ? subjectsResponse : [];

  // Fetch chapters based on selected subject
  const { data: chaptersResponse = [], isLoading: isLoadingChapters } = useQuery({
    queryKey: ["/api/chapters", selectedSubject],
    queryFn: () => apiRequest("GET", `/api/chapters/${selectedSubject}`),
    enabled: !!selectedSubject,
  });

  const chapters = Array.isArray(chaptersResponse) ? chaptersResponse : [];

  // Fetch topics based on selected chapter
  const { data: topicsResponse = [], isLoading: isLoadingTopics } = useQuery({
    queryKey: ["/api/topics", selectedChapter],
    queryFn: () => apiRequest("GET", `/api/topics/${selectedChapter}`),
    enabled: !!selectedChapter,
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

  useEffect(() => {
    setSelectedTopic('');
    setCompletedTopics([]);
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
    if (!selectedStudentHomework) {
      toast({
        title: "Error",
        description: "Please select a student first",
        variant: "destructive",
      });
      return;
    }

    const newActivity = {
      studentId: selectedStudentHomework,
      date: homeworkDate,
      status: 'not_completed',
      completionType: 'full',
      reason: '',
    };

    setHomeworkActivities([...homeworkActivities, newActivity]);
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
              {/* Class and Student Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={selectedClassHomework} onValueChange={setSelectedClassHomework}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading classes...
                        </SelectItem>
                      ) : classes.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((classItem: Class) => (
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

                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select 
                    value={selectedStudentHomework} 
                    onValueChange={setSelectedStudentHomework}
                    disabled={!selectedClassHomework}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedClassHomework 
                          ? "Select class first" 
                          : isLoadingStudentsHomework 
                          ? "Loading students..." 
                          : "Select student"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingStudentsHomework ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading students...
                        </SelectItem>
                      ) : !selectedClassHomework ? (
                        <SelectItem value="no-class" disabled>
                          Please select a class first
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

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={homeworkDate}
                    onChange={(e) => setHomeworkDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleAddHomeworkActivity}
                  disabled={!selectedStudentHomework}
                  variant="outline"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>

                <Button 
                  onClick={handleSubmitHomework}
                  disabled={homeworkActivities.length === 0 || homeworkMutation.isPending}
                >
                  {homeworkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Activities ({homeworkActivities.length})
                </Button>
              </div>

              {homeworkActivities.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Pending Activities</h3>
                  <div className="space-y-2">
                    {homeworkActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{filteredStudentsHomework.find(s => s.id === activity.studentId)?.name}</span>
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
                    ))}
                  </div>
                </div>
              )}
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
                Mark topics as completed for individual students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={selectedClassTopic} onValueChange={setSelectedClassTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading classes...
                        </SelectItem>
                      ) : classes.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes available
                        </SelectItem>
                      ) : (
                        classes.map((classItem: Class) => (
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

                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select 
                    value={selectedStudentTopic} 
                    onValueChange={setSelectedStudentTopic}
                    disabled={!selectedClassTopic}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedClassTopic 
                          ? "Select class first" 
                          : isLoadingStudentsTopic 
                          ? "Loading students..." 
                          : "Select student"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingStudentsTopic ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading students...
                        </SelectItem>
                      ) : !selectedClassTopic ? (
                        <SelectItem value="no-class" disabled>
                          Please select a class first
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

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={setSelectedSubject}
                    disabled={!selectedClassTopic}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedClassTopic 
                          ? "Select class first" 
                          : isLoadingSubjects 
                          ? "Loading subjects..." 
                          : "Select subject"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSubjects ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading subjects...
                        </SelectItem>
                      ) : !selectedClassTopic ? (
                        <SelectItem value="no-class" disabled>
                          Please select a class first
                        </SelectItem>
                      ) : subjects.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>
                          No subjects found
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

                <div className="space-y-2">
                  <Label>Chapter *</Label>
                  <Select 
                    value={selectedChapter} 
                    onValueChange={setSelectedChapter}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedSubject 
                          ? "Select subject first" 
                          : isLoadingChapters 
                          ? "Loading chapters..." 
                          : "Select chapter"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingChapters ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading chapters...
                        </SelectItem>
                      ) : !selectedSubject ? (
                        <SelectItem value="no-subject" disabled>
                          Please select a subject first
                        </SelectItem>
                      ) : chapters.length === 0 ? (
                        <SelectItem value="no-chapters" disabled>
                          No chapters found
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

                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Select 
                    value={selectedTopic} 
                    onValueChange={setSelectedTopic}
                    disabled={!selectedChapter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedChapter 
                          ? "Select chapter first" 
                          : isLoadingTopics 
                          ? "Loading topics..." 
                          : "Select topic"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTopics ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading topics...
                        </SelectItem>
                      ) : !selectedChapter ? (
                        <SelectItem value="no-chapter" disabled>
                          Please select a chapter first
                        </SelectItem>
                      ) : topics.length === 0 ? (
                        <SelectItem value="no-topics" disabled>
                          No topics found
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
                                <span className={isCompleted ? "text-green-600" : ""}>
                                  {topic.name}
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

              <div className="flex items-center justify-between">
                <Button 
                  onClick={handleCompleteTopics}
                  disabled={
                    !selectedStudentTopic || 
                    !selectedTopic || 
                    completedTopics.includes(selectedTopic) ||
                    topicCompletionMutation.isPending
                  }
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
