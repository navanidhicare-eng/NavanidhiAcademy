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

const addChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
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

  // Mock subjects data - replace with actual API call
  const mockSubjects = [
    { id: '1', name: 'Mathematics - Class 10' },
    { id: '2', name: 'Physics - Class 10' },
    { id: '3', name: 'Chemistry - Class 10' },
    { id: '4', name: 'Mathematics - Navodaya' }
  ];

  const form = useForm<AddChapterFormData>({
    resolver: zodResolver(addChapterSchema),
    defaultValues: {
      name: '',
      subjectId: '',
    },
  });

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
                    <Input placeholder="e.g. Quadratic Equations, Light - Reflection and Refraction" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSubjects.map((subject) => (
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