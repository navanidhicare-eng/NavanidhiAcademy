import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, IndianRupee, Calendar } from 'lucide-react';

const feeSchema = z.object({
  classId: z.string().min(1, 'Class selection is required'),
  monthlyFee: z.string().min(1, 'Monthly fee is required'),
  yearlyFee: z.string().min(1, 'Yearly fee is required'),
  admissionFee: z.string().min(1, 'Admission fee is required'),
  isActive: z.boolean().default(true),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface AddEditFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFee?: any;
}

function AddEditFeeModal({ isOpen, onClose, editingFee }: AddEditFeeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock classes data - replace with actual API call
  const mockClasses = [
    { id: '1', name: 'Class 10' },
    { id: '2', name: 'Class 12' },
    { id: '3', name: 'Navodaya' },
    { id: '4', name: 'POLYCET' },
    { id: '5', name: 'EAMCET' },
  ];

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      classId: editingFee?.classId || '',
      monthlyFee: editingFee?.monthlyFee?.toString() || '',
      yearlyFee: editingFee?.yearlyFee?.toString() || '',
      admissionFee: editingFee?.admissionFee?.toString() || '',
      isActive: editingFee?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FeeFormData) => {
      const submitData = {
        ...data,
        monthlyFee: parseInt(data.monthlyFee),
        yearlyFee: parseInt(data.yearlyFee),
        admissionFee: parseInt(data.admissionFee),
      };
      const endpoint = editingFee ? `/api/admin/fees/${editingFee.id}` : '/api/admin/fees';
      const method = editingFee ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
    },
    onSuccess: () => {
      toast({
        title: editingFee ? 'Fee Updated' : 'Fee Created',
        description: `Fee structure has been successfully ${editingFee ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingFee ? 'update' : 'create'} fee structure.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FeeFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'active')}
                        value={field.value ? 'active' : 'inactive'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="admissionFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Fee (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="5000"
                      min="0"
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
                name="monthlyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Fee (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2000"
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearlyFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Fee (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="20000"
                        min="0"
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
                <strong>Note:</strong> When a student is added to an SO center and selects this class, 
                these fees will be automatically applicable. The admission fee is charged once during enrollment.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {mutation.isPending 
                  ? (editingFee ? 'Updating...' : 'Creating...') 
                  : (editingFee ? 'Update Fee' : 'Create Fee')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Fees() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with actual API call
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['/api/admin/fees'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: '1',
          classId: '1',
          className: 'Class 10',
          monthlyFee: 3000,
          yearlyFee: 30000,
          admissionFee: 5000,
          isActive: true,
          studentsEnrolled: 25,
        },
        {
          id: '2',
          classId: '2',
          className: 'Class 12',
          monthlyFee: 3500,
          yearlyFee: 35000,
          admissionFee: 6000,
          isActive: true,
          studentsEnrolled: 18,
        },
        {
          id: '3',
          classId: '3',
          className: 'Navodaya',
          monthlyFee: 4000,
          yearlyFee: 40000,
          admissionFee: 7000,
          isActive: true,
          studentsEnrolled: 12,
        },
        {
          id: '4',
          classId: '4',
          className: 'POLYCET',
          monthlyFee: 2500,
          yearlyFee: 25000,
          admissionFee: 4000,
          isActive: false,
          studentsEnrolled: 8,
        },
      ];
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: string) => {
      return apiRequest('DELETE', `/api/admin/fees/${feeId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Fee Deleted',
        description: 'Fee structure has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fees'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete fee structure.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (fee: any) => {
    setEditingFee(fee);
    setIsAddModalOpen(true);
  };

  const handleDelete = (feeId: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      deleteFeeMutation.mutate(feeId);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingFee(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading fee structures...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-1">Manage class-wise fee structures</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Fee Structure
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Fee Structures</h2>
          <p className="text-sm text-gray-600">Class-wise monthly, yearly, and admission fees</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Admission Fee</TableHead>
              <TableHead>Monthly Fee</TableHead>
              <TableHead>Yearly Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((fee: any) => (
              <TableRow key={fee.id}>
                <TableCell className="font-medium">{fee.className}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <IndianRupee className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(fee.admissionFee).replace('₹', '')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{formatCurrency(fee.monthlyFee).replace('₹', '')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>{formatCurrency(fee.yearlyFee).replace('₹', '')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={fee.isActive ? "default" : "secondary"}>
                    {fee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{fee.studentsEnrolled} enrolled</span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(fee)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(fee.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(fees.reduce((sum, fee) => sum + (fee.monthlyFee * fee.studentsEnrolled), 0))}
              </p>
            </div>
            <IndianRupee className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active Fee Structures</p>
              <p className="text-2xl font-bold text-blue-800">
                {fees.filter(fee => fee.isActive).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Students</p>
              <p className="text-2xl font-bold text-purple-800">
                {fees.reduce((sum, fee) => sum + fee.studentsEnrolled, 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <AddEditFeeModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editingFee={editingFee}
      />
    </div>
  );
}