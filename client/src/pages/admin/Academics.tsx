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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Eye, FileText, Award, TrendingUp, Users, Calendar, BookOpen, School, Building } from 'lucide-react';

// Updated schema removing examType and adding multi-selection support
const examSchema = z.object({
  title: z.string().min(1, 'Exam title is required'),
  description: z.string().min(1, 'Description is required'),
  classId: z.string().min(1, 'Class selection is required'),
  subjectId: z.string().min(1, 'Subject selection is required'),
  chapterIds: z.array(z.string()).min(1, 'At least one chapter must be selected'),
  soCenterIds: z.array(z.string()).min(1, 'At least one SO Center must be selected'),
  examDate: z.string().min(1, 'Exam date is required'),
  duration: z.string().min(1, 'Duration is required'),
  totalMarks: z.string().min(1, 'Total marks is required'),
  passingMarks: z.string().min(1, 'Passing marks is required'),
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
      title: editingExam?.title || '',
      description: editingExam?.description || '',
      classId: editingExam?.classId || '',
      subjectId: editingExam?.subjectId || '',
      chapterIds: editingExam?.chapterIds || [],
      soCenterIds: editingExam?.soCenterIds || [],
      examDate: editingExam?.examDate || '',
      duration: editingExam?.duration?.toString() || '',
      totalMarks: editingExam?.totalMarks?.toString() || '',
      passingMarks: editingExam?.passingMarks?.toString() || '',
      status: editingExam?.status || 'scheduled',
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedSubjectId = form.watch('subjectId');
  const selectedChapterIds = form.watch('chapterIds');
  const selectedSoCenterIds = form.watch('soCenterIds');
  
  // Filter subjects by selected class
  const filteredSubjects = subjects.filter((subject: any) => 
    selectedClassId ? subject.classId === selectedClassId : false
  );

  // Filter chapters by selected subject
  const filteredChapters = chapters.filter((chapter: any) => 
    selectedSubjectId ? chapter.subjectId === selectedSubjectId : false
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

                <div className="grid grid-cols-2 gap-4">
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
                      <FormLabel>SO Centers (Select Multiple)</FormLabel>
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

  // Fetch real exams data from Supabase
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['/api/admin/exams'],
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
              Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
                <span className="ml-2 text-gray-600">Loading exams...</span>
              </div>
            ) : exams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Chapters</TableHead>
                    <TableHead>SO Centers</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.className || 'N/A'}</TableCell>
                      <TableCell>{exam.subjectName || 'N/A'}</TableCell>
                      <TableCell>
                        {exam.chapterIds ? (
                          <Badge variant="outline">
                            {exam.chapterIds.length} chapters
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {exam.soCenterIds ? (
                          <Badge variant="outline">
                            {exam.soCenterIds.length} centers
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{exam.examDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={exam.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            exam.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExam(exam)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
                <p className="text-gray-500">Create your first exam to get started.</p>
                <Button
                  onClick={handleCreateExam}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Exam Modal */}
        <AddExamModal
          isOpen={showExamModal}
          onClose={closeModal}
          editingExam={editingExam}
        />
      </div>
    </DashboardLayout>
  );
}