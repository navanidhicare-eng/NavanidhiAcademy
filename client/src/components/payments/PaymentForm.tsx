import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, IndianRupee } from 'lucide-react';

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student selection is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be a positive number'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  description: z.string().min(1, 'Payment description is required'),
  courseType: z.enum(['monthly_tuition', 'fixed_fee']),
  month: z.string().optional(),
  year: z.number().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function PaymentForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: '',
      amount: '',
      paymentMethod: 'cash',
      description: '',
      courseType: 'monthly_tuition',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
    },
  });

  // Fetch students for the SO center
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students?soCenterId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!user && user.role === 'so_center',
  });

  // Mock recent payments for display
  const recentPayments = [
    {
      id: '1',
      studentName: 'Arjun Reddy',
      amount: 2500,
      description: 'December 2024 fees',
      paymentMethod: 'Cash',
      date: 'Dec 15, 2024'
    },
    {
      id: '2',
      studentName: 'Sneha Patel',
      amount: 3000,
      description: 'November 2024 fees',
      paymentMethod: 'Online',
      date: 'Dec 14, 2024'
    },
    {
      id: '3',
      studentName: 'Rahul Kumar',
      amount: 2500,
      description: 'December 2024 fees',
      paymentMethod: 'Cash',
      date: 'Dec 13, 2024'
    }
  ];

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const token = localStorage.getItem('auth_token');
      return apiRequest('POST', '/api/payments', {
        ...data,
        amount: Number(data.amount),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Payment Recorded',
        description: 'Payment has been successfully recorded.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
  ];

  const courseTypes = [
    { value: 'monthly_tuition', label: 'Monthly Tuition' },
    { value: 'fixed_fee', label: 'Fixed Fee Course' },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <p className="text-gray-600 mt-1">Record and track student fee payments</p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Record New Payment</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student..." />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.name}
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
                      name="courseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {courseTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {method.label}
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment For</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., December 2024 fees"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-secondary text-white hover:bg-green-600"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? (
                      'Recording...'
                    ) : (
                      <>
                        <Plus className="mr-2" size={16} />
                        Record Payment
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Recent Payments */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Payments</h3>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{payment.studentName}</span>
                      <span className="font-bold text-secondary flex items-center">
                        <IndianRupee size={14} className="mr-1" />
                        {payment.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{payment.description}</span>
                      <span>{payment.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {payment.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
