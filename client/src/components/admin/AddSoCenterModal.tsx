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
import { Textarea } from '@/components/ui/textarea';

const addSoCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  managerId: z.string().min(1, 'Manager selection is required'),
});

type AddSoCenterFormData = z.infer<typeof addSoCenterSchema>;

interface AddSoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSoCenterModal({ isOpen, onClose }: AddSoCenterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available managers (users with so_center role or admins)
  const { data: availableManagers = [] } = useQuery({
    queryKey: ['/api/admin/users', 'managers'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/users?role=so_center,admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen,
  });

  const form = useForm<AddSoCenterFormData>({
    resolver: zodResolver(addSoCenterSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      managerId: '',
    },
  });

  const createSoCenterMutation = useMutation({
    mutationFn: async (data: AddSoCenterFormData) => {
      const token = localStorage.getItem('auth_token');
      return apiRequest('POST', '/api/admin/so-centers', data);
    },
    onSuccess: () => {
      toast({
        title: 'SO Center Created',
        description: 'SO Center has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create SO Center. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddSoCenterFormData) => {
    createSoCenterMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New SO Center</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Center Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter center name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete address"
                      className="resize-none"
                      rows={3}
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 87654 32109" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Manager</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableManagers.map((manager: any) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The selected manager will be able to manage this SO center, 
                add students, record payments, and track progress.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSoCenterMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createSoCenterMutation.isPending ? 'Creating...' : 'Create SO Center'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}