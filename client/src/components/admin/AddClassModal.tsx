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
const addClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
});

type AddClassFormData = z.infer<typeof addClassSchema>;

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddClassFormData>({
    resolver: zodResolver(addClassSchema),
    defaultValues: {
      name: '',
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: AddClassFormData) => {
      return apiRequest('POST', '/api/admin/classes', data);
    },
    onSuccess: () => {
      toast({
        title: 'Class Created',
        description: 'Class has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create class. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddClassFormData) => {
    createClassMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Class 10, Navodaya, POLYCET" {...field} />
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
                disabled={createClassMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}