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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, BookOpen, FileText, Target } from 'lucide-react';

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
  subjectName: string;
  className: string;
  isImportant: boolean;
  isModerate: boolean;
  order?: number;
}

interface Subject {
  id: string;
  name: string;
  classId: string;
  className: string;
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

  React.useEffect(() => {
    if (editingChapter) {
      form.reset({
        name: editingChapter.name,
        description: editingChapter.description || '',
        subjectId: editingChapter.subjectId,
        order: editingChapter.order?.toString() || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        subjectId: '',
        order: '',
      });
    }
  }, [editingChapter, form]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-700">
            {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.className} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter chapter name" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter chapter description"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Chapter order" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Add Chapter'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Add Topic Modal
function AddTopicModal({ 
  isOpen, 
  onClose, 
  editingTopic,
  onTopicAdded 
}: {
  isOpen: boolean;
  onClose: () => void;
  editingTopic?: Topic;
  onTopicAdded: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    } else {
      form.reset({
        name: '',
        description: '',
        chapterId: '',
        isImportant: false,
        isModerate: false,
        order: '',
      });
    }
  }, [editingTopic, form]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-700">
            {editingTopic ? 'Edit Topic' : 'Add New Topic'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chapterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.className} - {chapter.subjectName} - {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter topic name" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter topic description"
                      className="min-h-[80px]"
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
                name="isImportant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Important Topic</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isModerate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Moderate Topic</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Topic order" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : editingTopic ? 'Update Topic' : 'Add Topic'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AdminStructure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('chapters');
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | undefined>();
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>();

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['/api/admin/chapters'],
  });

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/admin/topics'],
  });

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      return apiRequest('DELETE', `/api/admin/chapters/${chapterId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Chapter Deleted',
        description: 'Chapter has been successfully deleted.',
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

  return (
    <DashboardLayout
      title="Chapters and Topics Managing"
      subtitle="Manage academic structure - chapters and topics"
    >
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>

        {/* Chapters Tab */}
        <TabsContent value="chapters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapters ({chapters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chaptersLoading ? (
                <div className="text-center py-8">Loading chapters...</div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No chapters found</p>
                  <p className="text-sm">Add your first chapter to get started</p>
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
                    {chapters.map((chapter) => (
                      <TableRow key={chapter.id}>
                        <TableCell className="font-medium">{chapter.name}</TableCell>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Topics ({topics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="text-center py-8">Loading topics...</div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No topics found</p>
                  <p className="text-sm">Add your first topic to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic Name</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-medium">{topic.name}</TableCell>
                        <TableCell>{topic.chapterName}</TableCell>
                        <TableCell>{topic.subjectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{topic.className}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {topic.isImportant && (
                              <Badge variant="destructive" className="text-xs">Important</Badge>
                            )}
                            {topic.isModerate && (
                              <Badge variant="secondary" className="text-xs">Moderate</Badge>
                            )}
                            {!topic.isImportant && !topic.isModerate && (
                              <Badge variant="outline" className="text-xs">Normal</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{topic.order || '-'}</TableCell>
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
      />
    </DashboardLayout>
  );
}

export default AdminStructure;