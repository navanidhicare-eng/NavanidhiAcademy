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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { PlusCircle, Receipt, Wallet, Calendar, Filter, DollarSign, Clock } from 'lucide-react';

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
  transactionId?: string;
  paymentMethod?: string;
  paymentReference?: string;
}

interface ExpenseWallet {
  totalExpenses: string;
  remainingBalance: string;
  lastUpdated: string;
}

interface SOCenterData {
  id: string;
  centerId: string;
  name: string;
  ownerName?: string;
  ownerPhone?: string;
  rentAmount?: string;
  electricBillAccountNumber?: string;
  internetBillAccountNumber?: string;
  internetServiceProvider?: string;
}

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);

  // Fetch SO Center data for autofill
  const { data: soCenterData } = useQuery({
    queryKey: ['/api/so-center/profile'],
  }) as { data: SOCenterData };

  // Fetch expense requests
  const { data: expenseRequests = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['/api/so-center/expenses'],
  }) as { data: ExpenseRequest[] };

  // Fetch expense wallet
  const { data: expenseWallet } = useQuery({
    queryKey: ['/api/so-center/expense-wallet'],
  }) as { data: ExpenseWallet };

  // Create expense request mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/so-center/expenses', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense Request Submitted",
        description: "Your expense request has been sent for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/expenses'] });
      setShowAddExpense(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit expense request",
        variant: "destructive",
      });
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (data: { expenseId: string; paymentMethod: string; paymentReference?: string }) => {
      const response = await apiRequest('POST', `/api/so-center/expenses/${data.expenseId}/pay`, {
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Recorded",
        description: `Payment recorded successfully. Transaction ID: ${data.transactionId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/so-center/expense-wallet'] });
      setShowPaymentModal(false);
      setSelectedExpense(null);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedExpenseType('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      approved: { label: 'Approved', variant: 'default' as const },
      rejected: { label: 'Rejected', variant: 'destructive' as const },
      paid: { label: 'Paid', variant: 'success' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  const filteredExpenses = expenseRequests.filter(expense => {
    if (selectedFilter === 'all') return true;
    return expense.status === selectedFilter;
  });

  const ExpenseForm = () => {
    const [formData, setFormData] = useState<any>({});

    React.useEffect(() => {
      // Autofill based on expense type
      if (selectedExpenseType && soCenterData) {
        const autofillData: any = { expenseType: selectedExpenseType };
        
        switch (selectedExpenseType) {
          case 'rent':
            if (soCenterData.rentAmount) {
              autofillData.amount = soCenterData.rentAmount;
              autofillData.description = `Monthly rent for ${soCenterData.name}`;
            }
            break;
          case 'electric_bill':
            if (soCenterData.electricBillAccountNumber) {
              autofillData.electricBillNumber = soCenterData.electricBillAccountNumber;
              autofillData.description = 'Monthly electricity bill';
            }
            break;
          case 'internet_bill':
            if (soCenterData.internetBillAccountNumber) {
              autofillData.internetBillNumber = soCenterData.internetBillAccountNumber;
              autofillData.internetServiceProvider = soCenterData.internetServiceProvider || '';
              autofillData.description = 'Monthly internet bill';
            }
            break;
          case 'so_salary':
            autofillData.description = `Salary request for ${soCenterData.centerId} - ${soCenterData.name}`;
            break;
        }
        
        setFormData(autofillData);
      }
    }, [selectedExpenseType, soCenterData]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createExpenseMutation.mutate(formData);
    };

    const handleInputChange = (field: string, value: string) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="expenseType">Expense Type</Label>
            <Select value={selectedExpenseType} onValueChange={(value) => {
              setSelectedExpenseType(value);
              setFormData({ expenseType: value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="electric_bill">Electric Bill</SelectItem>
                <SelectItem value="internet_bill">Internet Bill</SelectItem>
                <SelectItem value="so_salary">SO Salary</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedExpenseType === 'electric_bill' && (
            <>
              <div>
                <Label htmlFor="electricBillNumber">Bill Number</Label>
                <Input
                  id="electricBillNumber"
                  value={formData.electricBillNumber || ''}
                  onChange={(e) => handleInputChange('electricBillNumber', e.target.value)}
                  placeholder="Enter bill number"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </>
          )}

          {selectedExpenseType === 'internet_bill' && (
            <>
              <div>
                <Label htmlFor="internetBillNumber">Bill Number</Label>
                <Input
                  id="internetBillNumber"
                  value={formData.internetBillNumber || ''}
                  onChange={(e) => handleInputChange('internetBillNumber', e.target.value)}
                  placeholder="Enter bill number"
                />
              </div>
              <div>
                <Label htmlFor="internetServiceProvider">Service Provider</Label>
                <Input
                  id="internetServiceProvider"
                  value={formData.internetServiceProvider || ''}
                  onChange={(e) => handleInputChange('internetServiceProvider', e.target.value)}
                  placeholder="Enter service provider"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </>
          )}

          {selectedExpenseType === 'rent' && (
            <>
              <div>
                <Label>House Owner</Label>
                <Input
                  value={soCenterData?.ownerName || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Owner Phone</Label>
                <Input
                  value={soCenterData?.ownerPhone || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="amount">Rent Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter rent amount"
                  required
                />
              </div>
            </>
          )}

          {selectedExpenseType === 'so_salary' && (
            <>
              <div>
                <Label>SO Center ID</Label>
                <Input
                  value={soCenterData?.centerId || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>SO Center Name</Label>
                <Input
                  value={soCenterData?.name || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="amount">Salary Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter salary amount"
                  required
                />
              </div>
            </>
          )}

          {selectedExpenseType === 'others' && (
            <>
              <div>
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  value={formData.serviceName || ''}
                  onChange={(e) => handleInputChange('serviceName', e.target.value)}
                  placeholder="Enter service name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="serviceDescription">What is the Service</Label>
                <Textarea
                  id="serviceDescription"
                  value={formData.serviceDescription || ''}
                  onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                  placeholder="Describe the service"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Service Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter service amount"
                  required
                />
              </div>
              <div>
                <Label htmlFor="servicePhone">Phone Number</Label>
                <Input
                  id="servicePhone"
                  value={formData.servicePhone || ''}
                  onChange={(e) => handleInputChange('servicePhone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional notes"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddExpense(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createExpenseMutation.isPending}>
            {createExpenseMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    );
  };

  const PaymentModal = () => {
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [paymentReference, setPaymentReference] = useState<string>('');

    const handlePayment = () => {
      if (!selectedExpense) return;
      
      markPaidMutation.mutate({
        expenseId: selectedExpense.id,
        paymentMethod,
        paymentReference: paymentReference || undefined,
      });
    };

    return (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill">Bill</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'bill' && (
              <div>
                <Label>Bill Number</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter bill number"
                />
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div>
                <Label>UPI Transaction ID</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter UPI transaction ID"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={markPaidMutation.isPending || !paymentMethod}
              >
                {markPaidMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your SO Center expenses and track payments</p>
        </div>
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense Request</DialogTitle>
            </DialogHeader>
            <ExpenseForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense Wallet Summary */}
      {expenseWallet && (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">₹{parseFloat(expenseWallet.totalExpenses).toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${parseFloat(expenseWallet.remainingBalance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{parseFloat(expenseWallet.remainingBalance).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(expenseWallet.lastUpdated).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expense Requests */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Expense Requests</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No expense requests found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{getExpenseTypeLabel(expense.expenseType)}</h3>
                        {getStatusBadge(expense.status)}
                      </div>
                      <p className="text-2xl font-bold text-green-600">₹{parseFloat(expense.amount).toFixed(2)}</p>
                      {expense.description && (
                        <p className="text-sm text-gray-600">{expense.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Requested: {new Date(expense.requestedAt).toLocaleString()}
                        {expense.approvedAt && (
                          <span className="ml-4">
                            Approved: {new Date(expense.approvedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {expense.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Mark as Paid
                        </Button>
                      )}
                      {expense.status === 'paid' && expense.transactionId && (
                        <div className="text-xs text-right">
                          <div>Transaction ID:</div>
                          <div className="font-mono">{expense.transactionId}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentModal />
    </div>
  );
}