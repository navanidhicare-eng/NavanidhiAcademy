import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Eye, FileText, Award, TrendingUp, Users, Calendar, BookOpen, School, Building, Trash2, Clock, Target, CheckCircle } from 'lucide-react';

// Question schema for individual questions
const questionSchema = z.object({
  questionNumber: z.number(),
  marks: z.number().min(1, 'Marks must be at least 1'),
  questionText: z.string().min(1, 'Question text is required'),
});

// Updated schema with questions support
const examSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.string().min(1, 'Class selection is required'),
  subjectId: z.string().min(1, 'Subject selection is required'),
  chapterIds: z.array(z.string()).min(1, 'At least one chapter must be selected'),
  soCenterIds: z.array(z.string()).min(1, 'At least one SO Center must be selected'),
  examDate: z.string().min(1, 'Exam date is required'),
  duration: z.string().min(1, 'Duration is required'),
  totalQuestions: z.string().min(1, 'Total questions is required'),
  totalMarks: z.string().min(1, 'Total marks is required'),
  passingMarks: z.string().min(1, 'Passing marks is required'),
  status: z.string().default('scheduled'),
  questions: z.array(questionSchema).optional().default([]),
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
  const [questions, setQuestions] = useState<Array<{questionNumber: number, marks: number, questionText: string}>>([]);

  // Helper functions for questions management
  const addQuestion = () => {
    const newQuestion = {
      questionNumber: questions.length + 1,
      marks: 1,
      questionText: '',
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setQuestions(updatedQuestions);
  };

  const updateQuestion = (index: number, field: keyof typeof questions[0], value: string | number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };



  // Fetch real data from Supabase
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    enabled: isOpen,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/subjects'],
    enabled: isOpen,
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/chapters'],
    enabled: isOpen,
  });

  const { data: soCenters = [], isLoading: soCentersLoading } = useQuery({
    queryKey: ['/api/admin/so-centers'],
    enabled: isOpen,
  });

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      description: '',
      classId: '',
      subjectId: '',
      chapterIds: [],
      soCenterIds: [],
      examDate: '',
      duration: '',
      totalQuestions: '',
      totalMarks: '',
      passingMarks: '',
      status: 'scheduled',
      questions: [],
    },
  });

  // Reset form when editingExam changes
  React.useEffect(() => {
    if (editingExam) {
      form.reset({
        title: editingExam.title || '',
        description: editingExam.description || '',
        classId: editingExam.classId || '',
        subjectId: editingExam.subjectId || '',
        chapterIds: editingExam.chapterIds || [],
        soCenterIds: editingExam.soCenterIds || [],
        examDate: editingExam.examDate ? new Date(editingExam.examDate).toISOString().split('T')[0] : '',
        duration: editingExam.duration?.toString() || '',
        totalQuestions: editingExam.totalQuestions?.toString() || '',
        totalMarks: editingExam.totalMarks?.toString() || '',
        passingMarks: editingExam.passingMarks?.toString() || '',
        status: editingExam.status || 'scheduled',
      });
      // Load existing questions if editing - safely parse and ensure array
      let parsedQuestions = [];
      if (editingExam.questions) {
        try {
          parsedQuestions = typeof editingExam.questions === 'string' 
            ? JSON.parse(editingExam.questions) 
            : editingExam.questions;
        } catch (error) {
          console.warn('Failed to parse exam questions:', error);
          parsedQuestions = [];
        }
      }
      setQuestions(Array.isArray(parsedQuestions) ? parsedQuestions : []);
    } else {
      form.reset({
        title: '',
        description: '',
        classId: '',
        subjectId: '',
        chapterIds: [],
        soCenterIds: [],
        examDate: '',
        duration: '',
        totalQuestions: '',
        totalMarks: '',
        passingMarks: '',
        status: 'scheduled',
        questions: [],
      });
      setQuestions([]);
    }
  }, [editingExam, form]);

  // Auto-calculate total marks from questions
  React.useEffect(() => {
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    if (totalMarks > 0) {
      form.setValue('totalMarks', totalMarks.toString());
      form.setValue('totalQuestions', questions.length.toString());
    }
  }, [questions, form]);

  const selectedClassId = form.watch('classId');
  const selectedSubjectId = form.watch('subjectId');
  const selectedChapterIds = form.watch('chapterIds');
  const selectedSoCenterIds = form.watch('soCenterIds');
  
  // Filter subjects by selected class
  const filteredSubjects = subjects.filter((subject: any) => {
    console.log('Subject:', subject, 'Selected Class ID:', selectedClassId);
    return selectedClassId ? subject.classId === selectedClassId : false;
  });

  // Filter chapters by selected subject
  const filteredChapters = chapters.filter((chapter: any) => 
    selectedSubjectId ? chapter.subjectId === selectedSubjectId : false
  );

  const mutation = useMutation({
    mutationFn: async (data: ExamFormData) => {
      const submitData = {
        ...data,
        duration: parseInt(data.duration),
        totalQuestions: parseInt(data.totalQuestions),
        totalMarks: parseInt(data.totalMarks),
        passingMarks: parseInt(data.passingMarks),
        questions: JSON.stringify(data.questions || []), // Convert questions array to JSON string
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
      setQuestions([]);
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
    const submitData = {
      ...data,
      questions: questions,
    };
    mutation.mutate(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-700">
            {editingExam ? 'Edit Exam' : 'Create New Exam'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter exam title" {...field} />
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
                          placeholder="Enter exam description"
                          className="min-h-[100px]"
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
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="number" placeholder="90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Questions</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
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
                          <Input type="number" placeholder="40" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Academic Structure */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Academic Structure</h3>
                
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classesLoading ? (
                            <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                          ) : classes.length > 0 ? (
                            classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-data" disabled>No classes available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjectsLoading ? (
                            <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                          ) : filteredSubjects.length > 0 ? (
                            filteredSubjects.map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-data" disabled>
                              {selectedClassId ? 'No subjects available for selected class' : 'Please select a class first'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-Chapter Selection */}
                <FormField
                  control={form.control}
                  name="chapterIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Chapters (Select Multiple)</FormLabel>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                        {chaptersLoading ? (
                          <div className="text-sm text-gray-500">Loading chapters...</div>
                        ) : filteredChapters.length > 0 ? (
                          filteredChapters.map((chapter: any) => (
                            <FormField
                              key={chapter.id}
                              control={form.control}
                              name="chapterIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={chapter.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(chapter.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, chapter.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== chapter.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {chapter.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">
                            {selectedSubjectId ? 'No chapters available for selected subject' : 'Please select a subject first'}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multi-SO Center Selection */}
                <FormField
                  control={form.control}
                  name="soCenterIds"
                  render={() => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>SO Centers (Select Multiple)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentIds = form.getValues('soCenterIds') || [];
                            const allIds = soCenters.map((center: any) => center.id);
                            
                            if (currentIds.length === allIds.length) {
                              // If all are selected, unselect all
                              form.setValue('soCenterIds', []);
                            } else {
                              // Select all
                              form.setValue('soCenterIds', allIds);
                            }
                          }}
                          className="text-xs"
                        >
                          {selectedSoCenterIds.length === soCenters.length ? 'Unselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                        {soCentersLoading ? (
                          <div className="text-sm text-gray-500">Loading SO Centers...</div>
                        ) : soCenters.length > 0 ? (
                          soCenters.map((center: any) => (
                            <FormField
                              key={center.id}
                              control={form.control}
                              name="soCenterIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={center.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(center.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, center.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== center.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4 text-green-600" />
                                        <span>{center.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {center.centerId}
                                        </Badge>
                                      </div>
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">No SO Centers available</div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Exam Questions</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {Array.isArray(questions) && questions.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-4">
                  {questions.map((question, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                          Q{question.questionNumber}:
                        </span>
                        <Input
                          placeholder="Enter question text"
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Marks:</span>
                        <Input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-md">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No questions added yet. Click "Add Question" to start.</p>
                </div>
              )}

              {questions.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm text-green-700">
                    <strong>Total Questions:</strong> {questions.length} | 
                    <strong> Total Marks:</strong> {questions.reduce((sum, q) => sum + q.marks, 0)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    {editingExam ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Academics() {
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const { toast } = useToast();

  // Fetch real exams data from Supabase
  const { data: exams = [], isLoading: examsLoading, refetch: refetchExams } = useQuery({
    queryKey: ['/api/admin/exams'],
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      await apiRequest('DELETE', `/api/admin/exams/${examId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      refetchExams();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      });
    },
  });

  // Fetch real stats from Supabase
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/chapters'],
  });

  const { data: soCenters = [] } = useQuery({
    queryKey: ['/api/admin/so-centers'],
  });

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    setShowExamModal(true);
  };

  const handleCreateExam = () => {
    setEditingExam(null);
    setShowExamModal(true);
  };

  const closeModal = () => {
    setShowExamModal(false);
    setEditingExam(null);
  };

  return (
    <DashboardLayout title="Academic Management">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
            <p className="text-gray-600">Manage exams, classes, subjects, and academic content</p>
          </div>
          <Button
            onClick={handleCreateExam}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <School className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{classes.length}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Available subjects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{chapters.length}</div>
              <p className="text-xs text-muted-foreground">Available chapters</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SO Centers</CardTitle>
              <Building className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{soCenters.length}</div>
              <p className="text-xs text-muted-foreground">Connected centers</p>
            </CardContent>
          </Card>
        </div>

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Exams ({exams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exams found. Create your first exam to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>
                        {classes.find((c: any) => c.id === exam.classId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {subjects.find((s: any) => s.id === exam.subjectId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {new Date(exam.examDate).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>{exam.duration} min</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={exam.status === 'completed' ? 'default' : 
                                  exam.status === 'ongoing' ? 'secondary' : 'outline'}
                          className={exam.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 
                                    exam.status === 'ongoing' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                                    'bg-yellow-100 text-yellow-800 border-yellow-200'}
                        >
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditExam(exam)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this exam?')) {
                                deleteExamMutation.mutate(exam.id);
                              }
                            }}
                            disabled={deleteExamMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleteExamMutation.isPending ? (
                              <div className="animate-spin w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Exam Modal */}
        <AddExamModal
          isOpen={showExamModal}
          onClose={closeModal}
          editingExam={editingExam}
        />
      </div>
    </DashboardLayout>
  );
}