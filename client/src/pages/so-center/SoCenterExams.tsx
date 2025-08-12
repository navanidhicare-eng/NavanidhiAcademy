import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Calendar, Clock, Users, BookOpen, FileText, ArrowRight, Edit, Save, X } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  title: string;
  className: string;
  date: string;
  totalQuestions: number;
  totalMarks: number;
  status: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  fatherName: string;
  parentPhone: string;
}

interface ExamQuestion {
  id: string;
  questionNumber: number;
  text: string;
  marks: number;
  type: string;
}

interface StudentMarks {
  studentId: string;
  marks: Array<{
    questionNo: number;
    score: number;
    maxMarks: number;
  }>;
  performance: string[];
  totalScore: number;
}

export default function SoCenterExams() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [studentMarks, setStudentMarks] = useState<Record<string, StudentMarks>>({});

  // Fetch SO Center's exams
  const { data: examsData, isLoading, error } = useQuery({
    queryKey: ["/api/so-center/exams"],
    queryFn: () => apiRequest("GET", "/api/so-center/exams"),
  });

  // Ensure exams is always an array
  const exams = Array.isArray(examsData) ? examsData : [];

  // Fetch students and questions for modal
  const fetchExamData = async (examId: string) => {
    try {
      console.log('🔍 Fetching exam data for:', examId);
      
      const [studentsResponse, questionsResponse] = await Promise.all([
        apiRequest("GET", `/api/so-center/exams/${examId}/students`),
        apiRequest("GET", `/api/exams/${examId}/questions`)
      ]);
      
      console.log('📊 Students response:', studentsResponse);
      console.log('📊 Questions response:', questionsResponse);
      
      const studentsData = Array.isArray(studentsResponse) ? studentsResponse : [];
      const questionsData = Array.isArray(questionsResponse) ? questionsResponse : [];
      
      console.log('📊 Processed students:', studentsData.length);
      console.log('📊 Processed questions:', questionsData.length);
      
      setStudents(studentsData);
      setExamQuestions(questionsData);
      
      // Initialize marks for each student
      const initialMarks: Record<string, StudentMarks> = {};
      studentsData.forEach((student: Student) => {
        initialMarks[student.id] = {
          studentId: student.id,
          marks: questionsData.map((q: ExamQuestion, index: number) => ({
            questionNo: q.questionNumber || (index + 1),
            score: 0,
            maxMarks: q.marks || 1
          })),
          performance: questionsData.map(() => 'not_attempted'),
          totalScore: 0
        };
      });
      setStudentMarks(initialMarks);
      
      console.log('✅ Exam data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching exam data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exam data",
        variant: "destructive",
      });
    }
  };

  const handleUpdateResults = async (exam: Exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
    await fetchExamData(exam.id);
  };

  // Update student marks
  const updateStudentMark = (studentId: string, questionIndex: number, score: number) => {
    setStudentMarks(prev => {
      const updated = { ...prev };
      if (updated[studentId]) {
        updated[studentId].marks[questionIndex].score = score;
        // Auto-calculate total
        updated[studentId].totalScore = updated[studentId].marks.reduce((sum, mark) => sum + mark.score, 0);
      }
      return updated;
    });
  };

  // Update performance level
  const updatePerformance = (studentId: string, questionIndex: number, performance: string) => {
    setStudentMarks(prev => {
      const updated = { ...prev };
      if (updated[studentId]) {
        updated[studentId].performance[questionIndex] = performance;
        
        // Auto-calculate score based on performance
        const maxMarks = updated[studentId].marks[questionIndex].maxMarks;
        let score = 0;
        switch (performance) {
          case 'not_attempted':
            score = 0;
            break;
          case 'poor':
            score = Math.ceil(maxMarks * 0.3); // 30% of max marks
            break;
          case 'good':
            score = maxMarks; // Full marks
            break;
        }
        updated[studentId].marks[questionIndex].score = score;
        updated[studentId].totalScore = updated[studentId].marks.reduce((sum, mark) => sum + mark.score, 0);
      }
      return updated;
    });
  };

  // Save results mutation
  const saveResultsMutation = useMutation({
    mutationFn: async (data: { examId: string; students: StudentMarks[] }) => {
      return apiRequest("POST", `/api/exams/${data.examId}/results/update`, { students: data.students });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam results updated successfully",
      });
      setIsModalOpen(false);
      setSelectedExam(null);
      queryClient.invalidateQueries({ queryKey: ["/api/so-center/exams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update exam results",
        variant: "destructive",
      });
    },
  });

  const handleSaveResults = () => {
    if (!selectedExam) return;
    
    const studentsData = Object.values(studentMarks);
    saveResultsMutation.mutate({
      examId: selectedExam.id,
      students: studentsData
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">Error loading exams. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Exams</h1>
          <p className="text-muted-foreground">View and manage exam results</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Exams</p>
                <p className="text-2xl font-bold">{exams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">
                  {exams.filter((exam: Exam) => exam.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Ongoing</p>
                <p className="text-2xl font-bold">
                  {exams.filter((exam: Exam) => exam.status === 'ongoing' || exam.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold">
                  {exams.filter((exam: Exam) => {
                    const examDate = new Date(exam.date);
                    const now = new Date();
                    return examDate.getMonth() === now.getMonth() && examDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Exam List
          </CardTitle>
          <CardDescription>View and update exam results</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam: Exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.title || exam.name}</p>
                        {exam.description && (
                          <p className="text-sm text-muted-foreground">{exam.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exam.className}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(exam.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {exam.totalQuestions}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{exam.totalMarks}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(exam.status)}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateResults(exam)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Update Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No exams found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Exams will appear here once they are assigned to your SO Center
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Update Exam Results: {selectedExam?.title || selectedExam?.name}
            </DialogTitle>
            <DialogDescription>
              Enter marks and performance levels for each student. Auto-calculation is enabled.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] w-full">
            <div className="space-y-6 p-4">
              {students.length > 0 && examQuestions.length > 0 ? (
                students.map((student) => {
                  const marks = studentMarks[student.id];
                  if (!marks) return null;
                  
                  return (
                    <Card key={student.id} className="p-4">
                      <div className="space-y-4">
                        {/* Student Header */}
                        <div className="flex justify-between items-center border-b pb-2">
                          <div>
                            <h4 className="font-semibold">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">ID: {student.studentId} | Father: {student.fatherName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">Total: {marks.totalScore}/{selectedExam?.totalMarks}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedExam?.totalMarks ? Math.round((marks.totalScore / selectedExam.totalMarks) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                        
                        {/* Questions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {examQuestions.map((question, qIndex) => (
                            <div key={question.id} className="border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="font-medium">Q{question.questionNumber}</Label>
                                <Badge variant="outline">{question.marks} marks</Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <Label htmlFor={`score-${student.id}-${qIndex}`} className="text-xs">Score</Label>
                                  <Input
                                    id={`score-${student.id}-${qIndex}`}
                                    type="number"
                                    min="0"
                                    max={question.marks}
                                    value={marks.marks[qIndex]?.score || 0}
                                    onChange={(e) => {
                                      const score = Math.min(Number(e.target.value), question.marks);
                                      updateStudentMark(student.id, qIndex, score);
                                    }}
                                    className="h-8"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`performance-${student.id}-${qIndex}`} className="text-xs">Performance</Label>
                                  <Select
                                    value={marks.performance[qIndex] || 'not_attempted'}
                                    onValueChange={(value) => updatePerformance(student.id, qIndex, value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="not_attempted">Not Attempted</SelectItem>
                                      <SelectItem value="poor">Poor</SelectItem>
                                      <SelectItem value="good">Good</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading exam data...</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveResults}
              disabled={saveResultsMutation.isPending}
            >
              {saveResultsMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}