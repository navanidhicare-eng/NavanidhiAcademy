import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  CircleX,
  Save,
  Plus,
  Trash2
} from 'lucide-react';

interface StudentQuestion {
  questionId: string;
  questionText: string;
  maxMarks: number;
  marksObtained: number;
  answerStatus: 'not_answered' | 'partial_answered' | 'wrong_answer' | 'full_answer';
}

interface StudentDetailedResult {
  studentId: string;
  totalMarks: number;
  questions: StudentQuestion[];
}

interface IndividualStudentMarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    studentId: string;
    className: string;
  } | null;
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    totalQuestions: number;
    className: string;
    subjectName: string;
  } | null;
}

const answerStatusOptions = [
  { value: 'not_answered', label: 'Not Answered', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'partial_answered', label: 'Partial Answered', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  { value: 'wrong_answer', label: 'Wrong Answer', color: 'bg-orange-100 text-orange-800', icon: CircleX },
  { value: 'full_answer', label: 'Full Answer', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
];

export default function IndividualStudentMarksModal({ 
  isOpen, 
  onClose, 
  student, 
  exam 
}: IndividualStudentMarksModalProps) {
  const [studentResult, setStudentResult] = useState<StudentDetailedResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exam questions
  const { data: examQuestions = [] } = useQuery({
    queryKey: ['/api/exams', exam?.id, 'questions'],
    queryFn: async () => {
      if (!exam?.id) return [];
      const response = await apiRequest('GET', `/api/exams/${exam.id}/questions`);
      return await response.json();
    },
    enabled: !!exam?.id && isOpen,
  });

  // Fetch existing student results for this exam
  const { data: existingResult } = useQuery({
    queryKey: ['/api/exams', exam?.id, 'student-results', student?.id],
    queryFn: async () => {
      if (!exam?.id || !student?.id) return null;
      const response = await apiRequest('GET', `/api/exams/${exam.id}/student-results/${student.id}`);
      if (response.status === 404) return null;
      return await response.json();
    },
    enabled: !!exam?.id && !!student?.id && isOpen,
  });

  // Initialize student result when modal opens
  useEffect(() => {
    if (isOpen && examQuestions.length > 0 && student && exam) {
      if (existingResult) {
        // Load existing results
        setStudentResult(existingResult);
      } else {
        // Initialize new result
        const initialQuestions = examQuestions.map((question: any) => ({
          questionId: question.id,
          questionText: question.text,
          maxMarks: question.marks,
          marksObtained: 0,
          answerStatus: 'not_answered' as const,
        }));

        setStudentResult({
          studentId: student.id,
          totalMarks: 0,
          questions: initialQuestions,
        });
      }
    }
  }, [isOpen, examQuestions, student, exam, existingResult]);

  // Calculate total marks when individual question marks change
  useEffect(() => {
    if (studentResult) {
      const total = studentResult.questions.reduce((sum, q) => sum + q.marksObtained, 0);
      setStudentResult(prev => prev ? { ...prev, totalMarks: total } : null);
    }
  }, [studentResult?.questions]);

  // Save student result mutation
  const saveResultMutation = useMutation({
    mutationFn: async (resultData: StudentDetailedResult) => {
      if (!exam?.id) throw new Error('No exam selected');
      const response = await apiRequest('POST', `/api/exams/${exam.id}/student-results`, resultData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Marks Saved Successfully',
        description: `${student?.name}'s exam results have been saved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/exams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exams', exam?.id, 'student-results'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error Saving Marks',
        description: 'Failed to save student marks. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateQuestionResult = (questionId: string, field: keyof StudentQuestion, value: any) => {
    if (!studentResult) return;

    setStudentResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q =>
          q.questionId === questionId
            ? { ...q, [field]: value }
            : q
        ),
      };
    });
  };

  const addQuestion = () => {
    if (!studentResult || !examQuestions.length) return;

    // Find questions not yet added
    const availableQuestions = examQuestions.filter((q: any) => 
      !studentResult.questions.some(sq => sq.questionId === q.id)
    );

    if (availableQuestions.length > 0) {
      const newQuestion = availableQuestions[0];
      setStudentResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: [...prev.questions, {
            questionId: newQuestion.id,
            questionText: newQuestion.text,
            maxMarks: newQuestion.marks,
            marksObtained: 0,
            answerStatus: 'not_answered' as const,
          }],
        };
      });
    }
  };

  const removeQuestion = (questionId: string) => {
    if (!studentResult) return;

    setStudentResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.filter(q => q.questionId !== questionId),
      };
    });
  };

  const getStatusColor = (status: string) => {
    const option = answerStatusOptions.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const option = answerStatusOptions.find(opt => opt.value === status);
    return option?.icon || XCircle;
  };

  if (!student || !exam || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Individual Marks Entry - {student.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student and Exam Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">Student Name</Label>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Student ID</Label>
                  <p className="font-medium">{student.studentId}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Class</Label>
                  <p className="font-medium">{student.className}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Exam Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">Exam Title</Label>
                  <p className="font-medium">{exam.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Subject</Label>
                  <p className="font-medium">{exam.subjectName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Total Marks</Label>
                  <p className="font-medium">{exam.totalMarks}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Score Display */}
          {studentResult && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-blue-600">Total Marks Obtained</Label>
                    <p className="text-2xl font-bold text-blue-800">
                      {studentResult.totalMarks} / {exam.totalMarks}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-blue-600">Percentage</Label>
                    <p className="text-xl font-semibold text-blue-800">
                      {exam.totalMarks > 0 ? Math.round((studentResult.totalMarks / exam.totalMarks) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Question-wise Marks Entry</CardTitle>
              <Button
                onClick={addQuestion}
                size="sm"
                variant="outline"
                disabled={!studentResult || studentResult.questions.length >= examQuestions.length}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentResult?.questions.map((question, index) => {
                const StatusIcon = getStatusIcon(question.answerStatus);
                return (
                  <div key={question.questionId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-sm font-medium">Question {index + 1}</Label>
                          <Badge className={getStatusColor(question.answerStatus)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {answerStatusOptions.find(opt => opt.value === question.answerStatus)?.label}
                          </Badge>
                        </div>
                        
                        {/* Question Selection Dropdown */}
                        <div className="mb-3">
                          <Label className="text-xs text-gray-500">Select Question</Label>
                          <Select 
                            value={question.questionId} 
                            onValueChange={(value) => {
                              const selectedQuestion = examQuestions.find((q: any) => q.id === value);
                              if (selectedQuestion) {
                                updateQuestionResult(question.questionId, 'questionId', value);
                                updateQuestionResult(question.questionId, 'questionText', selectedQuestion.text);
                                updateQuestionResult(question.questionId, 'maxMarks', selectedQuestion.marks);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question" />
                            </SelectTrigger>
                            <SelectContent>
                              {examQuestions.map((q: any) => (
                                <SelectItem key={q.id} value={q.id}>
                                  Q{q.questionNumber}: {q.text.substring(0, 60)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{question.questionText}</p>
                      </div>

                      <Button
                        onClick={() => removeQuestion(question.questionId)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Marks Input */}
                      <div>
                        <Label className="text-sm">Marks Obtained</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            min="0"
                            max={question.maxMarks}
                            value={question.marksObtained}
                            onChange={(e) => updateQuestionResult(
                              question.questionId, 
                              'marksObtained', 
                              Math.min(parseInt(e.target.value) || 0, question.maxMarks)
                            )}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500">/ {question.maxMarks}</span>
                        </div>
                      </div>

                      {/* Answer Status */}
                      <div>
                        <Label className="text-sm">Answer Status</Label>
                        <Select 
                          value={question.answerStatus} 
                          onValueChange={(value) => updateQuestionResult(question.questionId, 'answerStatus', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {answerStatusOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {option.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })}

              {studentResult?.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No questions added yet. Click "Add Question" to start entering marks.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => studentResult && saveResultMutation.mutate(studentResult)}
              disabled={!studentResult || saveResultMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveResultMutation.isPending ? 'Saving...' : 'Save Marks'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}