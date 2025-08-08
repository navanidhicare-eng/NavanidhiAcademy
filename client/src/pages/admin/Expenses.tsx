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
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, IndianRupee, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

const expenseSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  centerId: z.string().optional(),
  approvalStatus: z.string().default('pending'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const salarySchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  basicSalary: z.string().min(1, 'Basic salary is required'),
  allowances: z.string().default('0'),
  deductions: z.string().default('0'),
  month: z.string().min(1, 'Month is required'),
  year: z.string().min(1, 'Year is required'),
  status: z.string().default('pending'),
});

type SalaryFormData = z.infer<typeof salarySchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExpense?: any;
}

function AddExpenseModal({ isOpen, onClose, editingExpense }: AddExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: editingExpense?.type || 'expense',
      category: editingExpense?.category || '',
      amount: editingExpense?.amount?.toString() || '',
      description: editingExpense?.description || '',
      date: editingExpense?.date || new Date().toISOString().split('T')[0],
      centerId: editingExpense?.centerId || '',
      approvalStatus: editingExpense?.approvalStatus || 'pending',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const submitData = {
        ...data,
        amount: parseFloat(data.amount),
      };
      const endpoint = editingExpense ? `/api/admin/expenses/${editingExpense.id}` : '/api/admin/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
    },
    onSuccess: () => {
      toast({
        title: editingExpense ? 'Expense Updated' : 'Expense Created',
        description: `Expense has been successfully ${editingExpense ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expenses'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingExpense ? 'update' : 'create'} expense.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="petty_cash">Petty Cash</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office_supplies">Office Supplies</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="internet">Internet</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
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
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5000"
                        min="0"
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the expense details"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
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
                disabled={mutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {mutation.isPending 
                  ? (editingExpense ? 'Updating...' : 'Creating...') 
                  : (editingExpense ? 'Update Expense' : 'Create Expense')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Expenses() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with actual API calls
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/admin/expenses'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          type: 'expense',
          category: 'office_supplies',
          amount: 2500,
          description: 'Whiteboard markers and erasers for classrooms',
          date: '2025-01-05',
          centerId: '1',
          centerName: 'Main Center',
          approvalStatus: 'approved',
          approvedBy: 'Admin',
        },
        {
          id: '2',
          type: 'utilities',
          category: 'utilities',
          amount: 4500,
          description: 'Monthly electricity bill',
          date: '2025-01-03',
          centerId: '1',
          centerName: 'Main Center',
          approvalStatus: 'pending',
        },
        {
          id: '3',
          type: 'travel',
          category: 'transport',
          amount: 1200,
          description: 'Teacher travel allowance',
          date: '2025-01-02',
          centerId: '2',
          centerName: 'Branch Center',
          approvalStatus: 'approved',
          approvedBy: 'Manager',
        },
      ];
    },
  });

  const { data: salaries = [], isLoading: salariesLoading } = useQuery({
    queryKey: ['/api/admin/salaries'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'Rajesh Kumar',
          role: 'Teacher',
          basicSalary: 25000,
          allowances: 5000,
          deductions: 2000,
          netSalary: 28000,
          month: '01',
          year: '2025',
          status: 'paid',
        },
        {
          id: '2',
          employeeId: '2',
          employeeName: 'Priya Sharma',
          role: 'SO Manager',
          basicSalary: 30000,
          allowances: 3000,
          deductions: 1000,
          netSalary: 32000,
          month: '01',
          year: '2025',
          status: 'pending',
        },
        {
          id: '3',
          employeeId: '3',
          employeeName: 'Amit Patel',
          role: 'Teacher',
          basicSalary: 22000,
          allowances: 4000,
          deductions: 1500,
          netSalary: 24500,
          month: '01',
          year: '2025',
          status: 'pending',
        },
      ];
    },
  });

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalSalaries = salaries.reduce((sum, sal) => sum + sal.netSalary, 0);
  const pendingApprovals = expenses.filter(exp => exp.approvalStatus === 'pending').length;

  if (expensesLoading || salariesLoading) {
    return <div className="flex justify-center items-center h-64">Loading expenses and salaries...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense & Salary Management</h1>
          <p className="text-gray-600 mt-1">Track expenses and manage payroll</p>
        </div>
        <Button 
          onClick={() => setIsExpenseModalOpen(true)}
          className="bg-primary text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalaries)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Expenses awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Outflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalExpenses + totalSalaries)}
            </div>
            <p className="text-xs text-muted-foreground">Total monthly cost</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="salaries">Salaries</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
              <p className="text-sm text-gray-600">Track and manage organizational expenses</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{expense.category.replace('_', ' ')}</TableCell>
                    <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{expense.centerName || 'All Centers'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={expense.approvalStatus === 'approved' ? 'default' : 
                               expense.approvalStatus === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {expense.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditExpense(expense)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="salaries">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Salary Management</h2>
              <p className="text-sm text-gray-600">Employee salary processing and payroll</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary: any) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">{salary.employeeName}</TableCell>
                    <TableCell>{salary.role}</TableCell>
                    <TableCell>{formatCurrency(salary.basicSalary)}</TableCell>
                    <TableCell className="text-green-600">+{formatCurrency(salary.allowances)}</TableCell>
                    <TableCell className="text-red-600">-{formatCurrency(salary.deductions)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(salary.netSalary)}</TableCell>
                    <TableCell>{salary.month}/{salary.year}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={salary.status === 'paid' ? 'default' : 'secondary'}
                      >
                        {salary.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AddExpenseModal 
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        editingExpense={editingExpense}
      />
    </div>
  );
}