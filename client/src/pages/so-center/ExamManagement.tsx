import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import IndividualStudentMarksModal from '@/components/exam/IndividualStudentMarksModal';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Plus,
  Minus,
  Edit3,
  FileEdit,
  Loader2
} from 'lucide-react';

interface ExamResultStudent {
  id: string;
  name: string;
  regId: string;
  marksObtained: number;
  answeredQuestions: 'not_answered' | 'partially_answered' | 'fully_answered';
}

export default function SoCenterExamManagement() {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [examResults, setExamResults] = useState<ExamResultStudent[]>([]);
  const [activeTab, setActiveTab] = useState('progress-tracking');

  // Individual student marks modal state
  const [isIndividualMarksModalOpen, setIsIndividualMarksModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get SO Center ID from logged-in user (assuming user has soCenterId or similar field)
  const soCenterId = user?.id; // Using user ID for now, will be mapped server-side

  // Mark exam as completed mutation - moved to top
  const markCompletedMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('POST', `/api/so-center/exams/${examId}/complete`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exam Marked Complete",
        description: "The exam has been marked as completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/exams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to mark exam as completed. ${error.message || ''}`,
        variant: "destructive",
      });
    },
  });

  // Submit results mutation - moved to top
  const submitResultsMutation = useMutation({
    mutationFn: async ({ examId, results }: { examId: string; results: ExamResultStudent[] }) => {
      const response = await apiRequest('POST', `/api/so-center/exams/${examId}/results`, {
        results: results,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Results Submitted",
        description: "Exam results have been posted successfully.",
      });
      setIsResultsModalOpen(false);
      setExamResults([]);
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/exams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to submit results. ${error.message || ''}`,
        variant: "destructive",
      });
    },
  });

  // Get SO Center exams with optimized caching
  const { data: exams = [], isLoading: isLoadingExams, error: examsError } = useQuery<any[]>({
    queryKey: ['/api/so-center/exams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/so-center/exams');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const examsData = await response.json();
      console.log('✅ SO Center exams fetched successfully:', examsData.length);
      return Array.isArray(examsData) ? examsData : [];
    },
    retry: 2,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Get SO Center students with optimized caching
  const { data: students = [], isLoading: isLoadingStudents, error: studentsError } = useQuery<any[]>({
    queryKey: ['/api/so-center/students'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/so-center/students');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const studentsData = await response.json();
      console.log('✅ SO Center students fetched successfully:', studentsData.length);
      return Array.isArray(studentsData) ? studentsData : [];
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Simplified loading state
  if (isLoadingExams || isLoadingStudents) {
    return (
      <DashboardLayout title="Exam Management" subtitle="Manage exams and post results for your center">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading exams and students...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error states
  if (examsError) {
    return (
      <DashboardLayout title="Exam Management" subtitle="Manage exams and post results for your center">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Failed to load exams</p>
          <p className="text-gray-600">Error: {examsError.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/so-center/exams'] })} className="mt-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (studentsError) {
    return (
      <DashboardLayout title="Exam Management" subtitle="Manage exams and post results for your center">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Failed to load students</p>
          <p className="text-gray-600">Error: {studentsError.message}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/so-center/students'] })} className="mt-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }


  

  const openResultsModal = (exam: any) => {
    setSelectedExamId(exam.id);
    setSelectedExam(exam);
    // Initialize results with class students
    const classStudents = students.filter((student: any) => student.classId === exam.classId);
    const initialResults = classStudents.map((student: any) => ({
      id: student.id,
      name: student.name,
      regId: student.regId,
      marksObtained: 0,
      answeredQuestions: 'not_answered' as const,
    }));
    setExamResults(initialResults);
    setIsResultsModalOpen(true);
  };

  const openIndividualMarksModal = (student: any, exam: any) => {
    setSelectedStudent(student);
    setSelectedExam(exam);
    setIsIndividualMarksModalOpen(true);
  };

  const closeIndividualMarksModal = () => {
    setIsIndividualMarksModalOpen(false);
    setSelectedStudent(null);
    setSelectedExam(null);
  };

  const updateStudentResult = (studentId: string, field: string, value: any) => {
    setExamResults(prev => prev.map(result => 
      result.id === studentId 
        ? { ...result, [field]: value }
        : result
    ));
  };

  const addStudentToCategory = (category: 'not_answered' | 'partially_answered' | 'fully_answered') => {
    const availableStudents = students.filter((student: any) => 
      !examResults.some(result => result.id === student.id)
    );

    if (availableStudents.length > 0) {
      const newStudent = availableStudents[0];
      setExamResults(prev => [...prev, {
        id: newStudent.id,
        name: newStudent.name,
        regId: newStudent.regId,
        marksObtained: 0,
        answeredQuestions: category,
      }]);
    }
  };

  const removeStudentFromResults = (studentId: string) => {
    setExamResults(prev => prev.filter(result => result.id !== studentId));
  };

  const getTimeRemaining = (examDate: string) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diff = exam.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Exam date passed';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} days, ${hours} hours remaining`;
    } else {
      return `${hours} hours remaining`;
    }
  };

  const getExamStatus = (exam: any) => {
    const now = new Date();
    const examDate = new Date(exam.examDate);

    if (exam.status === 'completed') {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    }

    if (examDate < now) {
      return { status: 'overdue', color: 'bg-red-500', text: 'Overdue' };
    }

    return { status: 'scheduled', color: 'bg-blue-500', text: 'Scheduled' };
  };

  const categorizedResults = {
    not_answered: examResults.filter(r => r.answeredQuestions === 'not_answered'),
    partially_answered: examResults.filter(r => r.answeredQuestions === 'partially_answered'),
    fully_answered: examResults.filter(r => r.answeredQuestions === 'fully_answered'),
  };

  return (
    <DashboardLayout title="Exam Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Exam Management</h1>
            <p className="text-green-600 mt-1">Manage exams and post results for your center</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/so-center/exams'] });
                queryClient.invalidateQueries({ queryKey: ['/api/so-center/students'] });
              }}
              variant="outline"
              size="sm"
              disabled={isLoadingExams || isLoadingStudents}
            >
              {isLoadingExams || isLoadingStudents ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <GraduationCap className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress-tracking">Progress Tracking</TabsTrigger>
            <TabsTrigger value="exams">Exams & Results</TabsTrigger>
          </TabsList>

          <TabsContent value="progress-tracking" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap size={20} />
                  <span>Student Progress Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Track student progress and exam performance</p>
                {/* Existing progress tracking content can be integrated here */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Total Students</p>
                          <p className="text-2xl font-bold text-blue-800">{students.length}</p>
                        </div>
                        <Users className="text-blue-500" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Completed Exams</p>
                          <p className="text-2xl font-bold text-green-800">
                            {exams.filter(exam => exam.status === 'completed').length}
                          </p>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600">Pending Exams</p>
                          <p className="text-2xl font-bold text-orange-800">
                            {exams.filter(exam => exam.status !== 'completed').length}
                          </p>
                        </div>
                        <AlertCircle className="text-orange-500" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap size={20} />
                  <span>Exams for Your Center</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exams.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap size={64} className="mx-auto text-gray-300 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exams Available</h3>
                    <p className="text-gray-500 mb-4">No exams have been assigned to your SO Center yet.</p>
                    <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Exams are created and assigned by the admin. 
                        Contact your administrator if you expect to see exams here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exams.map((exam: any) => {
                      const status = getExamStatus(exam);
                      return (
                        <Card key={exam.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{exam.title}</h3>
                                <Badge className={`${status.color} text-white text-xs`}>
                                  {status.text}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Class:</span>
                                  <span className="ml-1 font-medium">{exam.className}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Subject:</span>
                                  <span className="ml-1 font-medium">{exam.subjectName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Date:</span>
                                  <span className="ml-1 font-medium">{new Date(exam.examDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Marks:</span>
                                  <span className="ml-1 font-medium">{exam.totalMarks}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              {exam.status !== 'completed' ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => markCompletedMutation.mutate(exam.id)}
                                    disabled={markCompletedMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle size={14} className="mr-1" />
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setLocation(`/post-exam-result/${exam.id}`)}
                                  >
                                    <FileEdit size={14} className="mr-1" />
                                    Results
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocation(`/post-exam-result/${exam.id}`)}
                                >
                                  <Edit3 size={14} className="mr-1" />
                                  Update
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        

        {/* Individual Student Marks Modal */}
        <IndividualStudentMarksModal
          isOpen={isIndividualMarksModalOpen}
          onClose={closeIndividualMarksModal}
          student={selectedStudent}
          exam={selectedExam}
        />
      </div>
    </DashboardLayout>
  );
}