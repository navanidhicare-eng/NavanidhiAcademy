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

  // Mock chapters data - replace with actual API call
  const mockChapters = [
    { id: '1', name: 'Quadratic Equations - Mathematics' },
    { id: '2', name: 'Arithmetic Progressions - Mathematics' },
    { id: '3', name: 'Light - Reflection and Refraction - Physics' },
    { id: '4', name: 'Acids, Bases and Salts - Chemistry' }
  ];

  const form = useForm<AddTopicFormData>({
    resolver: zodResolver(addTopicSchema),
    defaultValues: {
      name: '',
      chapterId: '',
      orderIndex: '',
    },
  });

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockChapters.map((chapter) => (
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
                <strong>Note:</strong> The order determines the sequence in which topics appear in the chapter.
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