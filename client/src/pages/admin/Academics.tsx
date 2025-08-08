import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Eye, FileText, Award, TrendingUp, Users, Calendar, BookOpen } from 'lucide-react';

const examSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.string().min(1, 'Class selection is required'),
  subjectIds: z.array(z.string()).min(1, 'At least one subject is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  duration: z.string().min(1, 'Duration is required'),
  totalMarks: z.string().min(1, 'Total marks is required'),
  passingMarks: z.string().min(1, 'Passing marks is required'),
  examType: z.string().min(1, 'Exam type is required'),
  status: z.string().default('scheduled'),
});

type ExamFormData = z.infer<typeof examSchema>;

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExam?: any;
}

function AddExamModal({ isOpen, onClose, editingExam }: AddExamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock classes and subjects data
  const mockClasses = [
    { id: '1', name: 'Class 10' },
    { id: '2', name: 'Class 12' },
    { id: '3', name: 'Navodaya' },
    { id: '4', name: 'POLYCET' },
  ];

  const mockSubjects = [
    { id: '1', name: 'Mathematics', classId: '1' },
    { id: '2', name: 'Physics', classId: '1' },
    { id: '3', name: 'Chemistry', classId: '1' },
    { id: '4', name: 'Mathematics', classId: '3' },
    { id: '5', name: 'English', classId: '3' },
    { id: '6', name: 'Science', classId: '3' },
  ];

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: editingExam?.title || '',
      description: editingExam?.description || '',
      classId: editingExam?.classId || '',
      subjectIds: editingExam?.subjectIds || [],
      examDate: editingExam?.examDate || '',
      duration: editingExam?.duration?.toString() || '',
      totalMarks: editingExam?.totalMarks?.toString() || '',
      passingMarks: editingExam?.passingMarks?.toString() || '',
      examType: editingExam?.examType || '',
      status: editingExam?.status || 'scheduled',
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedSubjectIds = form.watch('subjectIds');
  
  const filteredSubjects = mockSubjects.filter(subject => 
    selectedClassId ? subject.classId === selectedClassId : false
  );

  const mutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const submitData = {
        ...data,
        duration: parseInt(data.duration),
        totalMarks: parseInt(data.totalMarks),
        passingMarks: parseInt(data.passingMarks),
      };
      const endpoint = editingExam ? `/api/admin/exams/${editingExam.id}` : '/api/admin/exams';
      const method = editingExam ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
    },
    onSuccess: () => {
      toast({
        title: editingExam ? 'Exam Updated' : 'Exam Created',
        description: `Exam has been successfully ${editingExam ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingExam ? 'update' : 'create'} exam.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ExamFormData) => {
    mutation.mutate(data);
  };

  const toggleSubject = (subjectId: string) => {
    const current = selectedSubjectIds || [];
    const updated = current.includes(subjectId)
      ? current.filter(id => id !== subjectId)
      : [...current, subjectId];
    form.setValue('subjectIds', updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingExam ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mid-term Mathematics Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the exam"
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit_test">Unit Test</SelectItem>
                          <SelectItem value="mid_term">Mid-term</SelectItem>
                          <SelectItem value="final_exam">Final Exam</SelectItem>
                          <SelectItem value="practice_test">Practice Test</SelectItem>
                          <SelectItem value="mock_exam">Mock Exam</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel className="text-base font-medium">Subjects</FormLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className={`cursor-pointer rounded-md border p-2 text-sm transition-colors ${
                      selectedSubjectIds?.includes(subject.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.name}
                  </div>
                ))}
              </div>
              {form.formState.errors.subjectIds && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.subjectIds.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="180"
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100"
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passingMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Marks</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="35"
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {mutation.isPending 
                  ? (editingExam ? 'Updating...' : 'Creating...') 
                  : (editingExam ? 'Update Exam' : 'Create Exam')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Academics() {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with actual API calls
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['/api/admin/exams'],
    queryFn: async () => {
      return [
        {
          id: '1',
          title: 'Mathematics Mid-term Exam',
          description: 'Mid-term examination for Class 10 Mathematics',
          classId: '1',
          className: 'Class 10',
          subjects: ['Mathematics'],
          examDate: '2025-02-15T10:00',
          duration: 180,
          totalMarks: 100,
          passingMarks: 35,
          examType: 'mid_term',
          status: 'scheduled',
          studentsEnrolled: 25,
          studentsAppeared: 0,
          averageScore: 0,
        },
        {
          id: '2',
          title: 'Science Unit Test',
          description: 'Unit test covering topics 1-3',
          classId: '3',
          className: 'Navodaya',
          subjects: ['Science'],
          examDate: '2025-01-20T14:00',
          duration: 120,
          totalMarks: 50,
          passingMarks: 18,
          examType: 'unit_test',
          status: 'completed',
          studentsEnrolled: 18,
          studentsAppeared: 16,
          averageScore: 42.5,
        },
      ];
    },
  });

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/admin/results'],
    queryFn: async () => {
      return [
        {
          id: '1',
          examId: '2',
          examTitle: 'Science Unit Test',
          studentId: '1',
          studentName: 'Ravi Kumar',
          rollNumber: 'NV001',
          marksObtained: 45,
          totalMarks: 50,
          percentage: 90,
          grade: 'A+',
          status: 'pass',
        },
        {
          id: '2',
          examId: '2',
          examTitle: 'Science Unit Test',
          studentId: '2',
          studentName: 'Priya Sharma',
          rollNumber: 'NV002',
          marksObtained: 38,
          totalMarks: 50,
          percentage: 76,
          grade: 'B+',
          status: 'pass',
        },
        {
          id: '3',
          examId: '2',
          examTitle: 'Science Unit Test',
          studentId: '3',
          studentName: 'Amit Patel',
          rollNumber: 'NV003',
          marksObtained: 15,
          totalMarks: 50,
          percentage: 30,
          grade: 'F',
          status: 'fail',
        },
      ];
    },
  });

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleCloseExamModal = () => {
    setIsExamModalOpen(false);
    setEditingExam(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'ongoing': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  if (examsLoading || resultsLoading) {
    return <div className="flex justify-center items-center h-64">Loading academic data...</div>;
  }

  const totalStudentsEnrolled = exams.reduce((sum, exam) => sum + exam.studentsEnrolled, 0);
  const completedExams = exams.filter(exam => exam.status === 'completed').length;
  const scheduledExams = exams.filter(exam => exam.status === 'scheduled').length;
  const passRate = results.length > 0 ? (results.filter(r => r.status === 'pass').length / results.length) * 100 : 0;

  return (
    <DashboardLayout 
      title="Academic Management" 
      subtitle="Create exams and manage academic results"
      showAddButton={true}
      onAddClick={() => setIsExamModalOpen(true)}
    >
      <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedExams} completed, {scheduledExams} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsEnrolled}</div>
            <p className="text-xs text-muted-foreground">Across all exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
            <Progress value={passRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Average score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="exams">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Exam Management</h2>
              <p className="text-sm text-gray-600">Create and manage examinations</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.title}</div>
                        <div className="text-sm text-gray-600">{exam.examType.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{exam.className}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(exam.examDate).toLocaleDateString()}</div>
                        <div className="text-gray-600">{new Date(exam.examDate).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>{exam.duration} min</TableCell>
                    <TableCell>{exam.totalMarks}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(exam.status)}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{exam.studentsEnrolled} enrolled</div>
                        <div className="text-gray-600">{exam.studentsAppeared} appeared</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExam(exam)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Exam Results</h2>
              <p className="text-sm text-gray-600">View and analyze student performance</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result: any) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell>{result.examTitle}</TableCell>
                    <TableCell>{result.rollNumber}</TableCell>
                    <TableCell>
                      {result.marksObtained} / {result.totalMarks}
                    </TableCell>
                    <TableCell>{result.percentage}%</TableCell>
                    <TableCell className={`font-medium ${getGradeColor(result.grade)}`}>
                      {result.grade}
                    </TableCell>
                    <TableCell>
                      <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

        <AddExamModal 
          isOpen={isExamModalOpen}
          onClose={handleCloseExamModal}
          editingExam={editingExam}
        />
      </div>
    </DashboardLayout>
  );
}