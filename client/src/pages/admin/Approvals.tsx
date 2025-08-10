import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  IndianRupee,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Wallet,
  CreditCard
} from 'lucide-react';

// Form schemas
const paymentFormSchema = z.object({
  paymentMode: z.enum(['upi', 'voucher'], {
    required_error: 'Please select a payment mode',
  }),
  paymentDetails: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Only require payment details for UPI transactions
  if (data.paymentMode === 'upi' && (!data.paymentDetails || data.paymentDetails.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "UPI Transaction ID is required for UPI payments",
  path: ["paymentDetails"],
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface WithdrawalApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: any;
}

function WithdrawalApprovalModal({ isOpen, onClose, withdrawal }: WithdrawalApprovalModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMode: undefined,
      paymentDetails: '',
      notes: '',
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      return apiRequest('POST', `/api/admin/withdrawal-requests/${withdrawal.id}/approve`, data);
    },
    onSuccess: (response) => {
      toast({
        title: 'Withdrawal Approved',
        description: `Payment issued successfully. Transaction ID: ${response.transactionId}`,
      });
      
      // Set invoice data for payment
      setInvoiceData({
        transactionId: response.transactionId,
        withdrawalId: withdrawal.withdrawal_id,
        amount: parseFloat(withdrawal.amount),
        paymentMode: response.paymentMode,
        paymentDetails: form.getValues('paymentDetails'),
        userEmail: withdrawal.user_email,
        userName: `${withdrawal.first_name || ''} ${withdrawal.last_name || ''}`.trim(),
        processedAt: new Date().toISOString(),
        type: 'withdrawal'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
      setShowPaymentForm(false);
      onClose();
      setShowInvoice(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve withdrawal request.',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest('POST', `/api/admin/withdrawal-requests/${withdrawal.id}/reject`, { notes });
    },
    onSuccess: () => {
      toast({
        title: 'Withdrawal Rejected',
        description: 'The withdrawal request has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawal-requests'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject withdrawal request.',
        variant: 'destructive',
      });
    },
  });

  if (!withdrawal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = (data: PaymentFormData) => {
    // For voucher payments, set a default payment details message
    if (data.paymentMode === 'voucher' && !data.paymentDetails) {
      data.paymentDetails = 'Voucher payment processed';
    }
    approveMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Withdrawal Request Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Request Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Withdrawal ID</label>
                <p className="text-sm font-mono font-medium">#{withdrawal.id.slice(-8)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge 
                  variant={withdrawal.status === 'pending' ? 'secondary' : 
                          withdrawal.status === 'approved' ? 'default' : 'destructive'}
                >
                  {withdrawal.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Requested By</label>
                <p className="text-sm">{withdrawal.user_email}</p>
                <p className="text-xs text-gray-500 capitalize">{withdrawal.user_role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className="text-sm font-medium text-green-600 flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {parseFloat(withdrawal.amount).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date Requested</label>
                <p className="text-sm">{new Date(withdrawal.request_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User Name</label>
                <p className="text-sm">{withdrawal.user_name || 'N/A'}</p>
              </div>
            </div>

            {/* Payment Form */}
            {showPaymentForm && withdrawal.status === 'pending' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Mode
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upi">UPI Payment</SelectItem>
                            <SelectItem value="voucher">Bank Voucher</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('paymentMode') === 'voucher' ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Voucher Payment Selected</p>
                          <p className="text-sm text-blue-700">Ready to process voucher payment for ₹{parseFloat(withdrawal.amount).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="paymentDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            UPI Transaction ID
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter UPI transaction ID"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional notes..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {approveMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {/* Action Buttons */}
            {!showPaymentForm && withdrawal.status === 'pending' && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => rejectMutation.mutate('Request rejected by admin')}
                  variant="outline"
                  disabled={rejectMutation.isPending}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Request
                </Button>
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Issue Payment
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Generator */}
      <InvoiceGenerator 
        invoiceData={invoiceData}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
      />
    </>
  );
}

export default function Approvals() {
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch real withdrawal requests from API
  const { data: withdrawalRequests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/withdrawal-requests'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/withdrawal-requests');
      const result = await response.json();
      return result;
    },
  });

  // Filter withdrawal requests based on status and search
  const filteredRequests = (Array.isArray(withdrawalRequests) ? withdrawalRequests : []).filter((request: any) => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleViewDetails = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedWithdrawal(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading withdrawal requests...</div>;
  }

  const pendingCount = filteredRequests.filter(w => w.status === 'pending').length;
  const approvedCount = filteredRequests.filter(w => w.status === 'approved').length;
  const rejectedCount = filteredRequests.filter(w => w.status === 'rejected').length;
  const totalAmount = filteredRequests.filter(w => w.amount && w.status === 'approved').reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

  return (
    <DashboardLayout title="Withdrawal Approvals" subtitle="Review and approve agent withdrawal requests">
      <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
            <Input
              placeholder="Search by email, withdrawal ID, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedStatus('pending');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h2>
          <p className="text-sm text-gray-600">Review and process agent withdrawal requests</p>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawal requests</h3>
            <p className="text-gray-600">There are no withdrawal requests to display.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Withdrawal ID</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request: any) => {
                const StatusIcon = getStatusIcon(request.status);
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">#{request.id.slice(-8)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user_email}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {request.user_name || 'N/A'} 
                          {request.user_role && ` • ${request.user_role}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {parseFloat(request.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(request.request_date).toLocaleDateString('en-IN')}</div>
                        <div className="text-gray-600">{new Date(request.request_date).toLocaleTimeString('en-IN')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4" />
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {request.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

        <WithdrawalApprovalModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          withdrawal={selectedWithdrawal}
        />
      </div>
    </DashboardLayout>
  );
}