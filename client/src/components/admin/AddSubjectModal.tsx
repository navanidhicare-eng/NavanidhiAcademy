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

const addSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  classId: z.string().min(1, 'Class selection is required'),
});

type AddSubjectFormData = z.infer<typeof addSubjectSchema>;

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock classes data - replace with actual API call
  const mockClasses = [
    { id: '1', name: 'Class 10' },
    { id: '2', name: 'Class 12' },
    { id: '3', name: 'Navodaya' },
    { id: '4', name: 'POLYCET' }
  ];

  const form = useForm<AddSubjectFormData>({
    resolver: zodResolver(addSubjectSchema),
    defaultValues: {
      name: '',
      classId: '',
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (data: AddSubjectFormData) => {
      return apiRequest('POST', '/api/admin/subjects', data);
    },
    onSuccess: () => {
      toast({
        title: 'Subject Created',
        description: 'Subject has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create subject. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddSubjectFormData) => {
    createSubjectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mathematics, Physics, Chemistry" {...field} />
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSubjectMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}