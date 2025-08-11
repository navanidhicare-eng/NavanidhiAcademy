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
  FileEdit
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

  // Data queries
  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['/api/so-center/exams'],
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/so-center/students'],
  });

  // Mark exam as completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest('POST', `/api/so-center/exams/${examId}/complete`);
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
        description: "Failed to mark exam as completed. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit results mutation
  const submitResultsMutation = useMutation({
    mutationFn: async ({ examId, results }: { examId: string; results: ExamResultStudent[] }) => {
      const response = await apiRequest('POST', `/api/so-center/exams/${examId}/results`, {
        results: results,
      });
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
        description: "Failed to submit results. Please try again.",
        variant: "destructive",
      });
    },
  });

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
                  <div className="text-center py-8">
                    <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No exams assigned to your center yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {exams.map((exam: any) => {
                      const status = getExamStatus(exam);
                      return (
                        <div key={exam.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">{exam.title}</h3>
                                <Badge className={`${status.color} text-white`}>
                                  {status.text}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-600 mb-3">{exam.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Class:</span>
                                  <p className="font-medium">{exam.className}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Subject:</span>
                                  <p className="font-medium">{exam.subjectName}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Date:</span>
                                  <p className="font-medium">{new Date(exam.examDate).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Duration:</span>
                                  <p className="font-medium">{exam.duration} minutes</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Total Questions:</span>
                                  <p className="font-medium">{exam.totalQuestions}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Max Marks:</span>
                                  <p className="font-medium">{exam.totalMarks}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Passing Marks:</span>
                                  <p className="font-medium">{exam.passingMarks}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock size={16} className="text-blue-500" />
                                  <span className="text-sm text-blue-600">
                                    {getTimeRemaining(exam.examDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              {exam.status !== 'completed' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => markCompletedMutation.mutate(exam.id)}
                                    disabled={markCompletedMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <CheckCircle size={16} className="mr-2" />
                                    Mark Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setLocation(`/post-exam-result/${exam.id}`)}
                                  >
                                    Post Results
                                  </Button>
                                </>
                              )}
                              
                              {exam.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocation(`/post-exam-result/${exam.id}`)}
                                >
                                  Update Results
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Enhanced Results Modal - Students Table with Individual Update Buttons */}
        <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                Post Exam Results - {selectedExam?.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Exam Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Exam Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Class:</span>
                    <p className="font-medium">{selectedExam?.className}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Subject:</span>
                    <p className="font-medium">{selectedExam?.subjectName}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Total Questions:</span>
                    <p className="font-medium">{selectedExam?.totalQuestions}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Max Marks:</span>
                    <p className="font-medium">{selectedExam?.totalMarks}</p>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Students in {selectedExam?.className}
                    <Badge variant="secondary" className="ml-2">
                      {students.filter((s: any) => s.classId === selectedExam?.classId).length} Students
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {students.filter((s: any) => s.classId === selectedExam?.classId).length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No students found in this class.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Current Status</TableHead>
                            <TableHead>Quick Marks Entry</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students
                            .filter((student: any) => student.classId === selectedExam?.classId)
                            .map((student: any) => {
                              const existingResult = examResults.find(r => r.id === student.id);
                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell className="text-sm text-gray-600">{student.studentId}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{student.className}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {existingResult ? (
                                      <Badge 
                                        className={
                                          existingResult.answeredQuestions === 'fully_answered' ? 'bg-green-100 text-green-800' :
                                          existingResult.answeredQuestions === 'partially_answered' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }
                                      >
                                        {existingResult.answeredQuestions === 'fully_answered' ? 'Fully Answered' :
                                         existingResult.answeredQuestions === 'partially_answered' ? 'Partial' :
                                         'Not Answered'}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">Not Entered</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {existingResult ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="0"
                                          max={selectedExam?.totalMarks}
                                          value={existingResult.marksObtained}
                                          onChange={(e) => updateStudentResult(
                                            student.id, 
                                            'marksObtained', 
                                            parseInt(e.target.value) || 0
                                          )}
                                          className="w-20"
                                        />
                                        <span className="text-sm text-gray-500">/ {selectedExam?.totalMarks}</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">Add to enter marks</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => openIndividualMarksModal(student, selectedExam)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Edit3 className="h-4 w-4 mr-1" />
                                        Update
                                      </Button>
                                      {!existingResult && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const newResult = {
                                              id: student.id,
                                              name: student.name,
                                              regId: student.studentId,
                                              marksObtained: 0,
                                              answeredQuestions: 'not_answered' as const,
                                            };
                                            setExamResults(prev => [...prev, newResult]);
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Add
                                        </Button>
                                      )}
                                      {existingResult && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeStudentFromResults(student.id)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {examResults.length} student(s) have results entered
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsResultsModalOpen(false);
                      setExamResults([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => submitResultsMutation.mutate({ 
                      examId: selectedExamId, 
                      results: examResults 
                    })}
                    disabled={submitResultsMutation.isPending || examResults.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {submitResultsMutation.isPending ? 'Submitting...' : 'Submit Results'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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