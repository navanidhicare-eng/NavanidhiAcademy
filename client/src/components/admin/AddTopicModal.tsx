import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const addTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  classId: z.string().min(1, 'Class selection is required'),
  subjectId: z.string().min(1, 'Subject selection is required'),
  chapterId: z.string().min(1, 'Chapter selection is required'),
  orderIndex: z.string().min(1, 'Order is required'),
});

type AddTopicFormData = z.infer<typeof addTopicSchema>;

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTopicModal({ isOpen, onClose }: AddTopicModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with actual API calls
  const mockClasses = [
    { id: '1', name: 'Class 10' },
    { id: '2', name: 'Class 12' },
    { id: '3', name: 'Navodaya' },
    { id: '4', name: 'POLYCET' }
  ];

  const mockSubjects = [
    { id: '1', name: 'Mathematics', classId: '1' },
    { id: '2', name: 'Physics', classId: '1' },
    { id: '3', name: 'Chemistry', classId: '1' },
    { id: '4', name: 'Mathematics', classId: '3' },
    { id: '5', name: 'English', classId: '3' },
    { id: '6', name: 'Science', classId: '3' }
  ];

  const mockChapters = [
    { id: '1', name: 'Quadratic Equations', subjectId: '1' },
    { id: '2', name: 'Arithmetic Progressions', subjectId: '1' },
    { id: '3', name: 'Light - Reflection and Refraction', subjectId: '2' },
    { id: '4', name: 'Acids, Bases and Salts', subjectId: '3' },
    { id: '5', name: 'Grammar Basics', subjectId: '5' },
    { id: '6', name: 'Plant Kingdom', subjectId: '6' }
  ];

  const form = useForm<AddTopicFormData>({
    resolver: zodResolver(addTopicSchema),
    defaultValues: {
      name: '',
      classId: '',
      subjectId: '',
      chapterId: '',
      orderIndex: '',
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedSubjectId = form.watch('subjectId');
  
  // Filter subjects based on selected class
  const filteredSubjects = mockSubjects.filter(subject => 
    selectedClassId ? subject.classId === selectedClassId : false
  );

  // Filter chapters based on selected subject
  const filteredChapters = mockChapters.filter(chapter => 
    selectedSubjectId ? chapter.subjectId === selectedSubjectId : false
  );

  // Reset dependent fields when parent changes
  const handleClassChange = (classId: string) => {
    form.setValue('classId', classId);
    form.setValue('subjectId', '');
    form.setValue('chapterId', '');
  };

  const handleSubjectChange = (subjectId: string) => {
    form.setValue('subjectId', subjectId);
    form.setValue('chapterId', '');
  };

  const createTopicMutation = useMutation({
    mutationFn: async (data: AddTopicFormData) => {
      const submitData = {
        ...data,
        orderIndex: parseInt(data.orderIndex)
      };
      return apiRequest('POST', '/api/admin/topics', submitData);
    },
    onSuccess: () => {
      toast({
        title: 'Topic Created',
        description: 'Topic has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create topic. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddTopicFormData) => {
    createTopicMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Topic</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Introduction to Quadratic Equations" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Select onValueChange={handleClassChange} value={field.value}>
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
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Select onValueChange={handleSubjectChange} value={field.value} disabled={!selectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClassId ? "Select subject" : "Select class first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSubjectId ? "Select chapter" : "Select subject first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredChapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
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
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Follow the sequence: Class → Subject → Chapter → Topic. The order determines the sequence in which topics appear in the chapter.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTopicMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}