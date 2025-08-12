import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, FileText, Users, Calculator } from "lucide-react";
import { useLocation } from "wouter";

interface Exam {
  id: string;
  name: string;
  className: string;
  date: string;
  totalQuestions: number;
  totalMarks: number;
  status: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  fatherName: string;
  parentPhone: string;
}

interface ExamQuestion {
  questionNumber: number;
  marks: number;
}

interface StudentResult {
  studentId: string;
  questionResults: {
    questionNumber: number;
    marks: number;
    status: 'not_written' | 'poorly_written' | 'well_written';
  }[];
  totalMarks: number;
  percentage: number;
  remarks?: string;
}

export default function ExamResults() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [studentResults, setStudentResults] = useState<Record<string, StudentResult>>({});
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);

  // Fetch SO Center's exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ["/api/so-center/exams"],
    queryFn: () => apiRequest("GET", "/api/so-center/exams"),
  });

  // Ensure exams is always an array
  const exams = Array.isArray(examsData) ? examsData : [];

  // Fetch students for selected exam
  const fetchStudentsForExam = async (examId: string) => {
    try {
      const response = await apiRequest("GET", `/api/so-center/exams/${examId}/students`);
      setStudents(response || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students for exam",
        variant: "destructive",
      });
    }
  };

  // Fetch exam questions
  const fetchExamQuestions = async (examId: string) => {
    try {
      const response = await apiRequest("GET", `/api/so-center/exams/${examId}/questions`);
      // Handle the new API response format
      const questions = response?.questions || response || [];
      setExamQuestions(questions);
    } catch (error) {
      console.error("Error fetching exam questions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch exam questions",
        variant: "destructive",
      });
    }
  };

  // Handle exam selection
  const handleExamSelect = async (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams.find((e: Exam) => e.id === examId);
    setSelectedExam(exam || null);
    
    if (examId) {
      await Promise.all([
        fetchStudentsForExam(examId),
        fetchExamQuestions(examId)
      ]);
      
      // Initialize results for all students
      const initialResults: Record<string, StudentResult> = {};
      const studentsArray = Array.isArray(students) ? students : [];
      studentsArray.forEach(student => {
        initialResults[student.id] = {
          studentId: student.id,
          questionResults: examQuestions.map(q => ({
            questionNumber: q.questionNumber,
            marks: 0,
            status: 'not_written' as const
          })),
          totalMarks: 0,
          percentage: 0,
          remarks: ''
        };
      });
      setStudentResults(initialResults);
    }
  };

  // Update question result
  const updateQuestionResult = (
    studentId: string, 
    questionNumber: number, 
    status: 'not_written' | 'poorly_written' | 'well_written'
  ) => {
    setStudentResults(prev => {
      const updated = { ...prev };
      if (!updated[studentId]) {
        updated[studentId] = {
          studentId,
          questionResults: [],
          totalMarks: 0,
          percentage: 0
        };
      }

      const questionIndex = updated[studentId].questionResults.findIndex(
        qr => qr.questionNumber === questionNumber
      );
      
      if (questionIndex >= 0) {
        updated[studentId].questionResults[questionIndex].status = status;
        
        // Calculate marks based on status
        const question = examQuestions.find(q => q.questionNumber === questionNumber);
        const maxMarks = question?.marks || 0;
        
        let marks = 0;
        switch (status) {
          case 'not_written':
            marks = 0;
            break;
          case 'poorly_written':
            marks = Math.floor(maxMarks * 0.3); // 30% marks
            break;
          case 'well_written':
            marks = maxMarks; // Full marks
            break;
        }
        
        updated[studentId].questionResults[questionIndex].marks = marks;
        
        // Recalculate total
        const totalMarks = updated[studentId].questionResults.reduce((sum, qr) => sum + qr.marks, 0);
        const maxTotalMarks = examQuestions.reduce((sum, q) => sum + q.marks, 0);
        const percentage = maxTotalMarks > 0 ? Math.round((totalMarks / maxTotalMarks) * 100) : 0;
        
        updated[studentId].totalMarks = totalMarks;
        updated[studentId].percentage = percentage;
      }

      return updated;
    });
  };

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (data: { examId: string; results: StudentResult[] }) => {
      return apiRequest("POST", "/api/so-center/exam-results", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam results saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/so-center/exams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save exam results",
        variant: "destructive",
      });
    },
  });

  // Save all results
  const handleSaveResults = () => {
    if (!selectedExamId || !selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam first",
        variant: "destructive",
      });
      return;
    }

    const results = Object.values(studentResults);
    saveResultsMutation.mutate({
      examId: selectedExamId,
      results
    });
  };

  // Get current student and result
  const studentsArray = Array.isArray(students) ? students : [];
  const currentStudent = studentsArray[currentStudentIndex];
  const currentResult = currentStudent ? studentResults[currentStudent.id] : null;

  if (examsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation("/so-center/exams")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Exam Results Update</h1>
            <p className="text-muted-foreground">Update student marks for exam questions</p>
          </div>
        </div>
        
        {selectedExam && (
          <Button onClick={handleSaveResults} disabled={saveResultsMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveResultsMutation.isPending ? "Saving..." : "Save All Results"}
          </Button>
        )}
      </div>

      {/* Exam Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Exam
          </CardTitle>
          <CardDescription>Choose an exam to update results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="exam-select">Exam</Label>
              <Select value={selectedExamId} onValueChange={handleExamSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam: Exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} - {exam.className} ({new Date(exam.date).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedExam && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Total Questions</Label>
                  <p className="font-semibold">{selectedExam.totalQuestions}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total Marks</Label>
                  <p className="font-semibold">{selectedExam.totalMarks}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Students</Label>
                  <p className="font-semibold">{students.length}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p className="font-semibold">{new Date(selectedExam.date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Results Entry */}
      {selectedExam && students.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students ({Array.isArray(students) ? students.length : 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.isArray(students) ? students.map((student, index) => (
                <div
                  key={student.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === currentStudentIndex
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCurrentStudentIndex(index)}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm opacity-70">{student.studentId}</p>
                  {studentResults[student.id] && (
                    <div className="flex justify-between items-center mt-1">
                      <Badge variant={index === currentStudentIndex ? "secondary" : "outline"}>
                        {studentResults[student.id].totalMarks}/{selectedExam.totalMarks}
                      </Badge>
                      <span className="text-sm">
                        {studentResults[student.id].percentage}%
                      </span>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-center text-muted-foreground">No students found</p>
              )}
            </CardContent>
          </Card>

          {/* Question Results Entry */}
          {currentStudent && currentResult && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {currentStudent.name} - Results Entry
                </CardTitle>
                <CardDescription>
                  Student ID: {currentStudent.studentId} | Father: {currentStudent.fatherName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Questions */}
                <div className="space-y-4">
                  <h4 className="font-medium">Questions</h4>
                  {examQuestions.map((question) => {
                    const questionResult = currentResult.questionResults.find(
                      qr => qr.questionNumber === question.questionNumber
                    );
                    
                    return (
                      <div key={question.questionNumber} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="font-medium">
                            Question {question.questionNumber}
                          </Label>
                          <Badge variant="outline">
                            {questionResult?.marks || 0}/{question.marks} marks
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {(['not_written', 'poorly_written', 'well_written'] as const).map((status) => (
                            <Button
                              key={status}
                              variant={questionResult?.status === status ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateQuestionResult(
                                currentStudent.id,
                                question.questionNumber,
                                status
                              )}
                              className="text-xs"
                            >
                              {status === 'not_written' && "Not Written (0%)"}
                              {status === 'poorly_written' && "Poorly Written (30%)"}
                              {status === 'well_written' && "Well Written (100%)"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Total Marks</Label>
                      <p className="font-semibold text-lg">
                        {currentResult.totalMarks}/{selectedExam.totalMarks}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Percentage</Label>
                      <p className="font-semibold text-lg">
                        {currentResult.percentage}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    value={currentResult.remarks || ""}
                    onChange={(e) => {
                      setStudentResults(prev => ({
                        ...prev,
                        [currentStudent.id]: {
                          ...prev[currentStudent.id],
                          remarks: e.target.value
                        }
                      }));
                    }}
                    placeholder="Add any remarks about the student's performance..."
                    rows={3}
                  />
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStudentIndex(Math.max(0, currentStudentIndex - 1))}
                    disabled={currentStudentIndex === 0}
                  >
                    Previous Student
                  </Button>
                  <Button
                    onClick={() => setCurrentStudentIndex(Math.min(Array.isArray(students) ? students.length - 1 : 0, currentStudentIndex + 1))}
                    disabled={currentStudentIndex === (Array.isArray(students) ? students.length - 1 : 0)}
                  >
                    Next Student
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedExam && (!Array.isArray(students) || students.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No students found for this exam.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}