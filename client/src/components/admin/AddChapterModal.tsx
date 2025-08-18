import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const addChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  classId: z.string().min(1, 'Class selection is required'),
  subjectId: z.string().min(1, 'Subject selection is required'),
});

type AddChapterFormData = z.infer<typeof addChapterSchema>;

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddChapterModal({ isOpen, onClose }: AddChapterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real classes and subjects data from API
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: allSubjects = [] } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  const form = useForm<AddChapterFormData>({
    resolver: zodResolver(addChapterSchema),
    defaultValues: {
      name: '',
      classId: '',
      subjectId: '',
    },
  });

  const selectedClassId = form.watch('classId');
  
  // Filter subjects based on selected class
  const filteredSubjects = (allSubjects as any[]).filter((subject: any) => 
    selectedClassId ? subject.classId === selectedClassId : false
  );

  const handleClassChange = (value: string) => {
    form.setValue('classId', value);
    form.setValue('subjectId', ''); // Reset subject when class changes
  };

  const createChapterMutation = useMutation({
    mutationFn: async (data: AddChapterFormData) => {
      return apiRequest('POST', '/api/admin/chapters', data);
    },
    onSuccess: () => {
      toast({
        title: 'Chapter Created',
        description: 'Chapter has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chapter. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddChapterFormData) => {
    createChapterMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Chapter</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        {classes.map((cls: any) => (
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId}>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createChapterMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createChapterMutation.isPending ? 'Creating...' : 'Create Chapter'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}