import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Clock, Filter, Search, Calendar, DollarSign, FileText, Eye } from 'lucide-react';

interface ExpenseRequest {
  id: string;
  expenseType: 'rent' | 'electric_bill' | 'internet_bill' | 'so_salary' | 'others';
  amount: string;
  description?: string;
  electricBillNumber?: string;
  internetBillNumber?: string;
  internetServiceProvider?: string;
  serviceName?: string;
  serviceDescription?: string;
  servicePhone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  soCenterId: string;
  soCenterName: string;
  centerCode: string;
  adminNotes?: string;
}

interface ExpenseStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  totalAmount: string;
}

export default function AdminExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Fetch expense requests
  const { data: expenseRequests = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['/api/admin/expenses', { status: statusFilter, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiRequest('GET', `/api/admin/expenses?${params}`);
      return response.json();
    },
  }) as { data: ExpenseRequest[], isLoading: boolean };

  // Fetch expense statistics
  const { data: expenseStats } = useQuery({
    queryKey: ['/api/admin/expense-stats'],
    queryFn: async () => {
      // Calculate stats from expenses data
      const totalPending = expenseRequests.filter(e => e.status === 'pending').length;
      const totalApproved = expenseRequests.filter(e => e.status === 'approved').length;
      const totalPaid = expenseRequests.filter(e => e.status === 'paid').length;
      const totalAmount = expenseRequests
        .filter(e => e.status === 'paid')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      return {
        totalPending,
        totalApproved,
        totalPaid,
        totalAmount: totalAmount.toString()
      };
    },
    enabled: expenseRequests.length > 0
  }) as { data: ExpenseStats };

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ expenseId, action, adminNotes }: { expenseId: string; action: 'approve' | 'reject'; adminNotes?: string }) => {
      const response = await apiRequest('POST', `/api/admin/expenses/${expenseId}/approval`, {
        action,
        adminNotes,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expenses'] });
      setShowApprovalModal(false);
      setSelectedExpense(null);
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process expense approval",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      paid: { label: 'Paid', variant: 'success' as const, icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <IconComponent className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels = {
      rent: 'Rent',
      electric_bill: 'Electric Bill',
      internet_bill: 'Internet Bill',
      so_salary: 'SO Salary',
      others: 'Others',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const ApprovalModal = () => {
    const [action, setAction] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');

    const handleSubmit = () => {
      if (!selectedExpense) return;
      
      approvalMutation.mutate({
        expenseId: selectedExpense.id,
        action,
        adminNotes: adminNotes || undefined,
      });
    };

    return (
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Expense Request</DialogTitle>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-6">
              {/* Expense Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>SO Center</Label>
                  <p className="font-semibold">{selectedExpense.soCenterName}</p>
                  <p className="text-sm text-gray-600">{selectedExpense.centerCode}</p>
                </div>
                <div>
                  <Label>Expense Type</Label>
                  <p className="font-semibold">{getExpenseTypeLabel(selectedExpense.expenseType)}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-semibold text-green-600">₹{parseFloat(selectedExpense.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Requested Date</Label>
                  <p>{new Date(selectedExpense.requestedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Additional Details */}
              {selectedExpense.description && (
                <div>
                  <Label>Description</Label>
                  <p className="bg-gray-50 p-2 rounded">{selectedExpense.description}</p>
                </div>
              )}

              {selectedExpense.expenseType === 'electric_bill' && selectedExpense.electricBillNumber && (
                <div>
                  <Label>Electric Bill Number</Label>
                  <p>{selectedExpense.electricBillNumber}</p>
                </div>
              )}

              {selectedExpense.expenseType === 'internet_bill' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedExpense.internetBillNumber && (
                    <div>
                      <Label>Internet Bill Number</Label>
                      <p>{selectedExpense.internetBillNumber}</p>
                    </div>
                  )}
                  {selectedExpense.internetServiceProvider && (
                    <div>
                      <Label>Service Provider</Label>
                      <p>{selectedExpense.internetServiceProvider}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedExpense.expenseType === 'others' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedExpense.serviceName && (
                    <div>
                      <Label>Service Name</Label>
                      <p>{selectedExpense.serviceName}</p>
                    </div>
                  )}
                  {selectedExpense.servicePhone && (
                    <div>
                      <Label>Service Phone</Label>
                      <p>{selectedExpense.servicePhone}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Selection */}
              <div>
                <Label>Action</Label>
                <Select value={action} onValueChange={(value: 'approve' | 'reject') => setAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div>
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes for this decision..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={approvalMutation.isPending}
                  className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {approvalMutation.isPending ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Request`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses & Salary Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage SO Center expense requests and approvals</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {expenseStats && (
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expenseStats.totalPending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{expenseStats.totalApproved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{expenseStats.totalPaid}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{parseFloat(expenseStats.totalAmount).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Search SO Centers</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by center name or code..."
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : expenseRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No expense requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Center</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseRequests.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{expense.soCenterName}</div>
                          <div className="text-sm text-gray-600">{expense.centerCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getExpenseTypeLabel(expense.expenseType)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{parseFloat(expense.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>
                        {new Date(expense.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setShowApprovalModal(true);
                            }}
                            className="flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          {expense.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  approvalMutation.mutate({
                                    expenseId: expense.id,
                                    action: 'approve'
                                  });
                                }}
                                disabled={approvalMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  approvalMutation.mutate({
                                    expenseId: expense.id,
                                    action: 'reject'
                                  });
                                }}
                                disabled={approvalMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalModal />
    </div>
  );
}