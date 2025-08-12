import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  CheckCircle, 
  Save,
  Calculator
} from 'lucide-react';

interface QuestionResult {
  questionText: string;
  maxMarks: number;
  obtainedMarks: number;
  assessment: 'did_not_write' | 'did_not_write_well' | 'wrote_no_marks' | 'wrote_well';
}

interface StudentExamResult {
  studentId: string;
  examId: string;
  questionResults: QuestionResult[];
  totalMarks: number;
}

export default function PostExamResult() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const examId = params.examId;

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isMarkingModalOpen, setIsMarkingModalOpen] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [totalMarks, setTotalMarks] = useState(0);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Data queries with proper error handling
  const { data: exam, isLoading: isExamLoading } = useQuery({
    queryKey: ['/api/so-center/exams', examId],
    queryFn: async () => {
      console.log('🔍 Fetching exam data for:', examId);
      const response = await apiRequest('GET', `/api/so-center/exams`);
      const examsData = await response.json();
      console.log('📊 Exams response:', examsData);

      // Find the specific exam
      if (Array.isArray(examsData)) {
        const foundExam = examsData.find((e: any) => e.id === examId);
        console.log('📊 Found exam:', foundExam);
        return foundExam;
      }
      return null;
    },
    enabled: !!examId,
  });

  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/so-center/exams', examId, 'students'],
    queryFn: async () => {
      if (!examId) return [];
      console.log('🔍 Fetching students for exam:', examId);
      const response = await apiRequest('GET', `/api/so-center/exams/${examId}/students`);
      if (!response.ok) {
        console.error('❌ Failed to fetch students');
        return [];
      }
      const studentsData = await response.json();
      console.log('📊 Students response:', studentsData);
      return Array.isArray(studentsData) ? studentsData : [];
    },
    enabled: !!examId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const { data: examQuestions = [], isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['/api/exams', examId, 'questions'],
    queryFn: async () => {
      if (!examId) return [];
      console.log('🔍 Fetching questions for exam:', examId);
      const response = await apiRequest('GET', `/api/exams/${examId}/questions`);
      if (!response.ok) {
        console.error('❌ Failed to fetch questions');
        return [];
      }
      const questionsData = await response.json();
      console.log('📊 Questions response:', questionsData);
      return Array.isArray(questionsData) ? questionsData : [];
    },
    enabled: !!examId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache - questions rarely change
    cacheTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Fetch existing results for all students
  const { data: existingResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/exams', examId, 'results'],
    queryFn: async () => {
      if (!examId) return [];
      console.log('🔍 Fetching results for exam:', examId);
      const response = await apiRequest('GET', `/api/exams/${examId}/results`);
      if (!response.ok) {
        console.error('❌ Failed to fetch results');
        return [];
      }
      const resultsData = await response.json();
      console.log('📊 Results response:', resultsData);
      return Array.isArray(resultsData) ? resultsData : [];
    },
    enabled: !!examId,
    staleTime: 2 * 60 * 1000, // 2 minutes cache - results change frequently
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const isLoading = isExamLoading || isStudentsLoading || isQuestionsLoading || resultsLoading;

  useEffect(() => {
    if (examId && exam && students && examQuestions) {
      console.log('✅ Exam data loaded successfully');
    }
  }, [examId, exam, students, examQuestions]);


  // Save student result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (resultData: StudentExamResult) => {
      const response = await apiRequest('POST', `/api/exams/${examId}/student-results`, {
        studentId: resultData.studentId,
        questionResults: resultData.questionResults,
        totalMarks: resultData.totalMarks,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Result Saved",
        description: "Student exam result has been saved successfully.",
      });
      setIsMarkingModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/exams', examId, 'results'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to save result. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter students for this exam's class
  const classStudents = (students as any[]).filter((student: any) => 
    student.classId === exam?.classId
  );

  const openMarkingModal = (student: any) => {
    setSelectedStudent(student);

    // Check if student already has results
    const existingResult = (existingResults as any[]).find((result: any) => 
      result.studentId === student.id
    );

    if (existingResult && existingResult.detailedResults) {
      try {
        const parsedResults = JSON.parse(existingResult.detailedResults);
        setQuestionResults(parsedResults);
        setTotalMarks(existingResult.marksObtained);
      } catch (error) {
        // Initialize with default values if parsing fails
        initializeQuestionResults();
      }
    } else {
      // Initialize with default values for new result
      initializeQuestionResults();
    }

    setIsMarkingModalOpen(true);
  };

  const initializeQuestionResults = () => {
    const initialResults = (examQuestions as any[]).map((question: any) => ({
      questionText: question.questionText,
      maxMarks: question.marks,
      obtainedMarks: 0,
      assessment: 'did_not_write' as const,
    }));
    setQuestionResults(initialResults);
    setTotalMarks(0);
  };

  const updateQuestionResult = (index: number, field: string, value: any) => {
    const updated = [...questionResults];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate marks based on assessment
    if (field === 'assessment') {
      const maxMarks = updated[index].maxMarks;
      switch (value) {
        case 'did_not_write':
          updated[index].obtainedMarks = 0;
          break;
        case 'did_not_write_well':
          updated[index].obtainedMarks = Math.round(maxMarks * 0.25);
          break;
        case 'wrote_no_marks':
          updated[index].obtainedMarks = Math.round(maxMarks * 0.5);
          break;
        case 'wrote_well':
          updated[index].obtainedMarks = maxMarks;
          break;
      }
    }

    setQuestionResults(updated);

    // Recalculate total marks
    const newTotal = updated.reduce((sum, result) => sum + result.obtainedMarks, 0);
    setTotalMarks(newTotal);
  };

  const updateMarksDirectly = (index: number, marks: number) => {
    const updated = [...questionResults];
    const maxMarks = updated[index].maxMarks;
    const validMarks = Math.min(Math.max(0, marks), maxMarks);
    updated[index].obtainedMarks = validMarks;
    setQuestionResults(updated);

    // Recalculate total marks
    const newTotal = updated.reduce((sum, result) => sum + result.obtainedMarks, 0);
    setTotalMarks(newTotal);
  };

  const saveResult = () => {
    if (!selectedStudent) return;

    const resultData: StudentExamResult = {
      studentId: selectedStudent.id,
      examId: examId!,
      questionResults,
      totalMarks,
    };

    saveResultMutation.mutate(resultData);
  };

  const getStudentResult = (studentId: string) => {
    return (existingResults as any[]).find((result: any) => result.studentId === studentId);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Post Exam Result">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-gray-200 animate-pulse rounded" />
              <div>
                <div className="w-48 h-8 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="w-96 h-4 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          </div>

          {/* Exam Details Card Skeleton */}
          <Card>
            <CardHeader>
              <div className="w-32 h-6 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="w-20 h-4 bg-gray-100 animate-pulse rounded mb-1" />
                    <div className="w-24 h-5 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Students Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="w-48 h-6 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <div className="space-y-1">
                      <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
                      <div className="w-24 h-3 bg-gray-100 animate-pulse rounded" />
                    </div>
                    <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500 mt-4">
            Loading exam data...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout title="Post Exam Result">
        <div className="text-center py-8">
          <p className="text-red-600">Exam not found or access denied.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Post Exam Result">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/exam-management')}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Exams
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-green-800">Post Exam Result</h1>
              <p className="text-green-600 mt-1">Update individual student results for {(exam as any)?.title}</p>
            </div>
          </div>
        </div>

        {/* Exam Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Exam Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Exam Title</p>
                <p className="font-medium">{(exam as any)?.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium">{(exam as any)?.className}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium">{(exam as any)?.subjectName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="font-medium">{(examQuestions as any[])?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Marks</p>
                <p className="font-medium">{(exam as any)?.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date((exam as any)?.examDate).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users size={20} />
              <span>Class Students ({classStudents.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No students found for this class.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student: any) => {
                    const result = getStudentResult(student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.regId}</TableCell>
                        <TableCell>
                          {result ? (
                            <Badge className="bg-green-100 text-green-800">
                              Result Entered
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {result ? `${result.marksObtained}/${(exam as any)?.totalMarks}` : 'Not entered'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => openMarkingModal(student)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {result ? 'Update' : 'Enter Marks'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Individual Student Marking Modal */}
        <Dialog open={isMarkingModalOpen} onOpenChange={setIsMarkingModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle size={20} />
                <span>Enter Marks - {selectedStudent?.name}</span>
              </DialogTitle>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="font-medium">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration ID</p>
                      <p className="font-medium">{selectedStudent.regId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Question-wise Marking</h3>

                  {examQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No questions found for this exam.</p>
                    </div>
                  ) : questionResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Button 
                        onClick={initializeQuestionResults}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Load Questions
                      </Button>
                    </div>
                  ) : (
                    questionResults.map((result, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-lg">Q{index + 1}: {result.questionText}</p>
                            <p className="text-sm text-gray-500 mt-1">Maximum Marks: {result.maxMarks}</p>
                          </div>
                          <div className="text-right min-w-[120px]">
                            <Label htmlFor={`marks-${index}`} className="text-sm font-medium">
                              Marks Obtained
                            </Label>
                            <Input
                              id={`marks-${index}`}
                              type="number"
                              min="0"
                              max={result.maxMarks}
                              value={result.obtainedMarks}
                              onChange={(e) => updateMarksDirectly(index, parseInt(e.target.value) || 0)}
                              className="w-20 mt-1 text-center font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">Assessment Options</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { value: 'did_not_write', label: '1. Did not write (0 marks)', marks: 0 },
                              { value: 'did_not_write_well', label: '2. Did not write well (25% marks)', marks: Math.round(result.maxMarks * 0.25) },
                              { value: 'wrote_no_marks', label: '3. Wrote but incomplete (50% marks)', marks: Math.round(result.maxMarks * 0.5) },
                              { value: 'wrote_well', label: '4. Wrote well (Full marks)', marks: result.maxMarks },
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                                <Checkbox
                                  id={`${index}-${option.value}`}
                                  checked={result.assessment === option.value}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      updateQuestionResult(index, 'assessment', option.value);
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={`${index}-${option.value}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {option.label}
                                </Label>
                                <span className="text-xs text-gray-500 font-medium">
                                  ({option.marks} marks)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calculator size={20} className="text-green-600" />
                      <span className="text-lg font-semibold text-green-800">
                        Total Marks: {totalMarks}/{(exam as any)?.totalMarks}
                      </span>
                    </div>
                    <div className="text-sm text-green-600">
                      Percentage: {(((totalMarks / ((exam as any)?.totalMarks || 1)) * 100).toFixed(1))}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsMarkingModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveResult}
                    disabled={saveResultMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saveResultMutation.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    Save Result
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}