import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, BookOpen, FileText, Target, Flag, Star } from 'lucide-react';
import { MathJaxComponent } from '@/components/ui/MathJax';

// Schemas
const chapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject selection is required'),
  order: z.string().optional(),
});

const topicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().optional(),
  chapterId: z.string().min(1, 'Chapter selection is required'),
  isImportant: z.boolean().default(false),
  isModerate: z.boolean().default(false),
  order: z.string().optional(),
}).refine((data) => !(data.isImportant && data.isModerate), {
  message: "A topic cannot be both Important and Moderate",
  path: ["isImportant"],
});

type ChapterFormData = z.infer<typeof chapterSchema>;
type TopicFormData = z.infer<typeof topicSchema>;

// Interfaces
interface Chapter {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  className: string;
  order?: number;
  topicCount?: number;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  className: string;
  isImportant: boolean;
  isModerate: boolean;
  order?: number;
  isActive: boolean;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
  className: string;
}

interface Class {
  id: string;
  name: string;
}

// Add Chapter Modal
function AddChapterModal({ 
  isOpen, 
  onClose, 
  editingChapter,
  onChapterAdded 
}: {
  isOpen: boolean;
  onClose: () => void;
  editingChapter?: Chapter;
  onChapterAdded: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: isOpen,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/admin/subjects'],
    enabled: isOpen,
  });

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: editingChapter?.name || '',
      description: editingChapter?.description || '',
      subjectId: editingChapter?.subjectId || '',
      order: editingChapter?.order?.toString() || '',
    },
  });

  // Filter subjects based on selected class
  const filteredSubjects = subjects.filter(subject => 
    selectedClass ? subject.classId === selectedClass : true
  );

  React.useEffect(() => {
    if (editingChapter) {
      form.reset({
        name: editingChapter.name,
        description: editingChapter.description || '',
        subjectId: editingChapter.subjectId,
        order: editingChapter.order?.toString() || '',
      });
      // Find the class for this chapter's subject
      const subject = subjects.find(s => s.id === editingChapter.subjectId);
      if (subject) {
        setSelectedClass(subject.classId);
      }
    } else {
      form.reset({
        name: '',
        description: '',
        subjectId: '',
        order: '',
      });
      setSelectedClass('');
    }
  }, [editingChapter, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: ChapterFormData) => {
      const submitData = {
        ...data,
        order: data.order ? parseInt(data.order) : undefined,
      };
      const endpoint = editingChapter ? `/api/admin/chapters/${editingChapter.id}` : '/api/admin/chapters';
      const method = editingChapter ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
    },
    onSuccess: () => {
      toast({
        title: editingChapter ? 'Chapter Updated' : 'Chapter Added',
        description: `Chapter has been successfully ${editingChapter ? 'updated' : 'added'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      onChapterAdded();
      form.reset();
      setSelectedClass('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingChapter ? 'update' : 'add'} chapter.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ChapterFormData) => {
    mutation.mutate(data);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    form.setValue('subjectId', ''); // Reset subject when class changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {editingChapter ? 'Update chapter information' : 'Create a new chapter for your subject'}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-180px)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-4 pb-4">
              {/* Class and Subject Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-green-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Academic Classification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Class</label>
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Subject</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredSubjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                <MathJaxComponent inline={true}>{subject.name}</MathJaxComponent>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Chapter Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Chapter Details</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Chapter Name (LaTeX Math Support)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter chapter name with LaTeX: e.g., Algebra $x^2 + y^2 = z^2$" 
                          className="h-11" 
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        <strong>LaTeX Examples:</strong><br />
                        {'• Use $...$ for inline math: $E = mc^2$'}<br />
                        {'• Fractions: $\\frac{a}{b}$, Powers: $x^2$, Square roots: $\\sqrt{x}$'}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Description (Optional - LaTeX Math Support)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter chapter description with LaTeX math: e.g., This chapter covers $$f(x) = ax^2 + bx + c$$"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        <strong>LaTeX Examples:</strong><br />
                        {'• Inline: $\\sin(x) + \\cos(x)$ • Block: $$\\int_a^b f(x)dx$$ • Matrices: $\\begin{matrix} a & b \\\\ c & d \\end{matrix}$'}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Chapter Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter chapter order (1, 2, 3...)" 
                          className="h-11" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Optional: Set the sequence order for this chapter</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </ScrollArea>

        <Separator />
        <div className="flex justify-end gap-3 pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 bg-green-600 hover:bg-green-700"
            onClick={form.handleSubmit(onSubmit)}
          >
            {mutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                {editingChapter ? 'Update Chapter' : 'Add Chapter'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Topic Modal
function AddTopicModal({ 
  isOpen, 
  onClose, 
  editingTopic,
  onTopicAdded,
  selectedChapterId 
}: {
  isOpen: boolean;
  onClose: () => void;
  editingTopic?: Topic;
  onTopicAdded: () => void;
  selectedChapterId?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
    enabled: isOpen,
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/admin/subjects'],
    enabled: isOpen,
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ['/api/admin/chapters'],
    enabled: isOpen,
  });

  const form = useForm<TopicFormData>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: editingTopic?.name || '',
      description: editingTopic?.description || '',
      chapterId: editingTopic?.chapterId || '',
      isImportant: editingTopic?.isImportant || false,
      isModerate: editingTopic?.isModerate || false,
      order: editingTopic?.order?.toString() || '',
    },
  });

  // Filter subjects and chapters based on selections
  const filteredSubjects = subjects.filter(subject => 
    selectedClass ? subject.classId === selectedClass : true
  );

  const filteredChapters = chapters.filter(chapter => 
    selectedSubject ? chapter.subjectId === selectedSubject : true
  );

  React.useEffect(() => {
    if (editingTopic) {
      form.reset({
        name: editingTopic.name,
        description: editingTopic.description || '',
        chapterId: editingTopic.chapterId,
        isImportant: editingTopic.isImportant,
        isModerate: editingTopic.isModerate,
        order: editingTopic.order?.toString() || '',
      });
      // Find the class and subject for this topic's chapter
      const chapter = chapters.find(c => c.id === editingTopic.chapterId);
      if (chapter) {
        setSelectedSubject(chapter.subjectId);
        const subject = subjects.find(s => s.id === chapter.subjectId);
        if (subject) {
          setSelectedClass(subject.classId);
        }
      }
    } else if (selectedChapterId) {
      // Pre-populate with selected chapter
      const selectedChapter = chapters.find(c => c.id === selectedChapterId);
      if (selectedChapter) {
        form.reset({
          name: '',
          description: '',
          chapterId: selectedChapterId,
          isImportant: false,
          isModerate: false,
          order: '',
        });
        setSelectedSubject(selectedChapter.subjectId);
        const subject = subjects.find(s => s.id === selectedChapter.subjectId);
        if (subject) {
          setSelectedClass(subject.classId);
        }
      }
    } else {
      form.reset({
        name: '',
        description: '',
        chapterId: '',
        isImportant: false,
        isModerate: false,
        order: '',
      });
      setSelectedClass('');
      setSelectedSubject('');
    }
  }, [editingTopic, selectedChapterId, isOpen, chapters, subjects]);

  const mutation = useMutation({
    mutationFn: async (data: TopicFormData) => {
      const submitData = {
        ...data,
        order: data.order ? parseInt(data.order) : undefined,
      };
      const endpoint = editingTopic ? `/api/admin/topics/${editingTopic.id}` : '/api/admin/topics';
      const method = editingTopic ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
    },
    onSuccess: () => {
      toast({
        title: editingTopic ? 'Topic Updated' : 'Topic Added',
        description: `Topic has been successfully ${editingTopic ? 'updated' : 'added'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
      onTopicAdded();
      form.reset();
      setSelectedClass('');
      setSelectedSubject('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingTopic ? 'update' : 'add'} topic.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TopicFormData) => {
    mutation.mutate(data);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSubject(''); // Reset subject when class changes
    form.setValue('chapterId', ''); // Reset chapter when class changes
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    form.setValue('chapterId', ''); // Reset chapter when subject changes
  };

  // Handle mutual exclusivity for Important/Moderate flags
  const handleImportantChange = (checked: boolean) => {
    form.setValue('isImportant', checked);
    if (checked) {
      form.setValue('isModerate', false);
    }
  };

  const handleModerateChange = (checked: boolean) => {
    form.setValue('isModerate', checked);
    if (checked) {
      form.setValue('isImportant', false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editingTopic ? 'Edit Topic' : 'Add New Topic'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {editingTopic ? 'Update topic information and settings' : 'Create a new topic for your chapter'}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pr-4 pb-4">
              {/* Chapter Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-green-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Academic Classification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Class {selectedChapterId ? '(Auto-filled)' : ''}
                    </label>
                    <Select 
                      value={selectedClass} 
                      onValueChange={handleClassChange}
                      disabled={!!selectedChapterId && !editingTopic}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Subject {selectedChapterId ? '(Auto-filled)' : ''}
                    </label>
                    <Select 
                      value={selectedSubject} 
                      onValueChange={handleSubjectChange}
                      disabled={!!selectedChapterId && !editingTopic}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <MathJaxComponent inline={true}>{subject.name}</MathJaxComponent>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Chapter {selectedChapterId ? '(Pre-selected)' : ''}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!!selectedChapterId && !editingTopic}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select a chapter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredChapters.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                <MathJaxComponent inline={true}>{chapter.name}</MathJaxComponent>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedChapterId && !editingTopic && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded-md">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-green-700">
                              Chapter pre-selected from your selection
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Topic Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Topic Information</h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Topic Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter topic name" 
                          className="h-11" 
                          {...field} 
                        />
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
                      <FormLabel className="text-sm font-medium text-gray-700">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter topic description"
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Priority Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-orange-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Priority Settings</h3>
                  <Badge variant="outline" className="text-xs">Mutually Exclusive</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isImportant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-red-200 rounded-lg bg-red-50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={handleImportantChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-red-700 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Important Topic
                          </FormLabel>
                          <div className="text-xs text-red-600">
                            Shows red "IMP" badge - for critical topics
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isModerate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={handleModerateChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium text-orange-700 flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Moderate Topic
                          </FormLabel>
                          <div className="text-xs text-orange-600">
                            Shows orange "Moderate" badge - for medium priority
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Additional Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-purple-600 rounded-full"></div>
                  <h3 className="font-semibold text-gray-900">Additional Settings</h3>
                </div>

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Topic Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter topic order (1, 2, 3...)" 
                          className="h-11" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Optional: Set the sequence order for this topic within the chapter</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </form>
          </Form>
        </ScrollArea>

        <Separator />
        <div className="flex justify-end gap-3 pt-4 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 bg-blue-600 hover:bg-blue-700"
            onClick={form.handleSubmit(onSubmit)}
          >
            {mutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                {editingTopic ? 'Update Topic' : 'Add Topic'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TopicsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('chapters');
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | undefined>();
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>();

  // Filtering states
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('');

  // Chapter selection for topic creation
  const [selectedChapterForTopic, setSelectedChapterForTopic] = useState<string>('');

  // Fetch all data
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['/api/admin/subjects'],
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['/api/admin/chapters'],
  });

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/admin/topics'],
  });

  // Calculate statistics
  const totalChapters = chapters.length;
  const totalTopics = topics.length;
  const moderateTopics = topics.filter(topic => topic.isModerate).length;
  const importantTopics = topics.filter(topic => topic.isImportant).length;

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      return apiRequest('DELETE', `/api/admin/chapters/${chapterId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Chapter Deleted',
        description: 'Chapter and all its topics have been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chapter.',
        variant: 'destructive',
      });
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: string) => {
      return apiRequest('DELETE', `/api/admin/topics/${topicId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Topic Deleted',
        description: 'Topic has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete topic.',
        variant: 'destructive',
      });
    },
  });

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowAddChapterModal(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setShowAddTopicModal(true);
  };

  const handleCloseChapterModal = () => {
    setShowAddChapterModal(false);
    setEditingChapter(undefined);
  };

  const handleCloseTopicModal = () => {
    setShowAddTopicModal(false);
    setEditingTopic(undefined);
  };

  // Filtering logic
  const filteredSubjects = subjects.filter(subject => 
    selectedClassFilter ? subject.classId === selectedClassFilter : true
  );

  const filteredChapters = chapters.filter(chapter => {
    const subjectMatch = selectedSubjectFilter ? chapter.subjectId === selectedSubjectFilter : true;

    if (selectedClassFilter && !selectedSubjectFilter) {
      // If class selected but no subject, show chapters from subjects of that class
      const classSubjects = subjects.filter(s => s.classId === selectedClassFilter).map(s => s.id);
      return classSubjects.includes(chapter.subjectId);
    }

    return subjectMatch;
  });

  const filteredTopics = topics.filter(topic => {
    const chapterMatch = selectedChapterFilter ? topic.chapterId === selectedChapterFilter : true;

    if (selectedSubjectFilter && !selectedChapterFilter) {
      // If subject selected but no chapter, show topics from chapters of that subject
      const subjectChapters = chapters.filter(c => c.subjectId === selectedSubjectFilter).map(c => c.id);
      return subjectChapters.includes(topic.chapterId);
    }

    if (selectedClassFilter && !selectedSubjectFilter && !selectedChapterFilter) {
      // If only class selected, show topics from all chapters of that class
      const classSubjects = subjects.filter(s => s.classId === selectedClassFilter).map(s => s.id);
      const classChapters = chapters.filter(c => classSubjects.includes(c.subjectId)).map(c => c.id);
      return classChapters.includes(topic.chapterId);
    }

    return chapterMatch;
  });

  // Handle filter changes with cascade reset
  const handleClassFilterChange = (classId: string) => {
    const actualClassId = classId === 'all-classes' ? '' : classId;
    setSelectedClassFilter(actualClassId);
    setSelectedSubjectFilter(''); // Reset downstream filters
    setSelectedChapterFilter('');
    setSelectedChapterForTopic(''); // Reset chapter selection
  };

  const handleSubjectFilterChange = (subjectId: string) => {
    const actualSubjectId = subjectId === 'all-subjects' ? '' : subjectId;
    setSelectedSubjectFilter(actualSubjectId);
    setSelectedChapterFilter(''); // Reset downstream filter
    setSelectedChapterForTopic(''); // Reset chapter selection
  };

  const handleChapterFilterChange = (chapterId: string) => {
    const actualChapterId = chapterId === 'all-chapters' ? '' : chapterId;
    setSelectedChapterFilter(actualChapterId);
    setSelectedChapterForTopic(''); // Reset chapter selection
  };

  // Chapter selection for topic creation
  const handleChapterSelection = (chapterId: string) => {
    setSelectedChapterForTopic(chapterId);
  };

  // Check if Add Topic button should be enabled
  const addTopicButtonEnabled = selectedChapterForTopic !== '';

  // Get selected chapter details for topic modal
  const selectedChapterDetails = chapters.find(c => c.id === selectedChapterForTopic);

  const getPriorityBadge = (topic: Topic) => {
    if (topic.isImportant) {
      return (
        <Badge variant="destructive" className="bg-red-600">
          <Star className="h-3 w-3 mr-1" />
          IMP
        </Badge>
      );
    }
    if (topic.isModerate) {
      return (
        <Badge variant="secondary" className="bg-orange-500 text-white">
          <Flag className="h-3 w-3 mr-1" />
          Moderate
        </Badge>
      );
    }
    return null;
  };

  return (
    <DashboardLayout
      title="Topics Management"
      subtitle="Manage educational content hierarchy - Classes, Subjects, Chapters, and Topics"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChapters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTopics}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderate Topics</CardTitle>
            <Flag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{moderateTopics}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Important Topics</CardTitle>
            <Star className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{importantTopics}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Chapters
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Topics
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <Button 
              onClick={() => setShowAddChapterModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
            <Button 
              onClick={() => setShowAddTopicModal(true)}
              disabled={!addTopicButtonEnabled}
              className={addTopicButtonEnabled 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-gray-400 cursor-not-allowed"
              }
              title={!addTopicButtonEnabled ? "Select a chapter first to add a topic" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>

        {/* Chapters Tab */}
        <TabsContent value="chapters" className="space-y-6">
          {/* Chapter Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Filter Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClassFilter || 'all-classes'} onValueChange={handleClassFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-classes">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={selectedSubjectFilter || 'all-subjects'} onValueChange={handleSubjectFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-subjects">All Subjects</SelectItem>
                      {filteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <MathJaxComponent inline={true}>{subject.name}</MathJaxComponent>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapters ({filteredChapters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chaptersLoading ? (
                <div className="text-center py-8">Loading chapters...</div>
              ) : filteredChapters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No chapters found</p>
                  <p className="text-sm">{chapters.length === 0 ? "Add your first chapter to get started" : "Adjust filters to view chapters"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chapter Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Topics</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChapters.map((chapter) => (
                      <TableRow key={chapter.id}>
                        <TableCell className="font-medium">
                          <MathJaxComponent inline={true}>{chapter.name}</MathJaxComponent>
                        </TableCell>
                        <TableCell>{chapter.subjectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{chapter.className}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{chapter.topicCount || 0} topics</Badge>
                        </TableCell>
                        <TableCell>{chapter.order || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChapter(chapter)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteChapterMutation.mutate(chapter.id)}
                              disabled={deleteChapterMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          {/* Topic Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Filter Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select value={selectedClassFilter || 'all-classes'} onValueChange={handleClassFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-classes">All Classes</SelectItem>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={selectedSubjectFilter || 'all-subjects'} onValueChange={handleSubjectFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-subjects">All Subjects</SelectItem>
                      {filteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <MathJaxComponent inline={true}>{subject.name}</MathJaxComponent>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapter</label>
                  <Select value={selectedChapterFilter || 'all-chapters'} onValueChange={handleChapterFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Chapters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-chapters">All Chapters</SelectItem>
                      {filteredChapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          <MathJaxComponent inline={true}>{chapter.name}</MathJaxComponent>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapter Selection for Topic Creation */}
          {activeTab === 'topics' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Select Chapter for Topic Creation
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on a chapter below to enable topic creation for that chapter
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChapters.map((chapter) => (
                    <Card 
                      key={chapter.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedChapterForTopic === chapter.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleChapterSelection(chapter.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">
                              <MathJaxComponent inline={true}>{chapter.name}</MathJaxComponent>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {chapter.className} - {chapter.subjectName}
                            </p>
                          </div>
                          {selectedChapterForTopic === chapter.id && (
                            <div className="text-blue-600">
                              <Target className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedChapterForTopic && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Chapter "{selectedChapterDetails?.name}" selected. You can now add topics to this chapter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Topics ({filteredTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="text-center py-8">Loading topics...</div>
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No topics found</p>
                  <p className="text-sm">{topics.length === 0 ? "Add your first topic to get started" : "Adjust filters or select a chapter to view topics"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic Name</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-medium">
                          <MathJaxComponent inline={true}>{topic.name}</MathJaxComponent>
                        </TableCell>
                        <TableCell>{topic.chapterName || '-'}</TableCell>
                        <TableCell>{topic.subjectName || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{topic.className || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(topic) || (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{topic.order || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={topic.isActive ? "default" : "secondary"}>
                            {topic.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTopic(topic)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTopicMutation.mutate(topic.id)}
                              disabled={deleteTopicMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddChapterModal
        isOpen={showAddChapterModal}
        onClose={handleCloseChapterModal}
        editingChapter={editingChapter}
        onChapterAdded={() => {}}
      />

      <AddTopicModal
        isOpen={showAddTopicModal}
        onClose={handleCloseTopicModal}
        editingTopic={editingTopic}
        onTopicAdded={() => {}}
        selectedChapterId={selectedChapterForTopic}
      />
    </DashboardLayout>
  );
}