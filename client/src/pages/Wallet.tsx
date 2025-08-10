import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet as WalletIcon, DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, CreditCard, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface WalletData {
  id: string;
  user_id: string;
  course_wallet_balance: string;
  commission_wallet_balance: string;
  total_earnings: string;
  total_withdrawals: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  transaction_id: string;
  type: 'course_purchase' | 'commission_earned' | 'withdrawal_request';
  amount: string;
  description: string;
  created_at: string;
  status: string;
}

const withdrawalFormSchema = z.object({
  amount: z.number().min(1000, "Minimum withdrawal amount is ₹1000"),
});

type WithdrawalFormData = z.infer<typeof withdrawalFormSchema>;

function Wallet() {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 1000,
    },
  });

  // Fetch wallet balance
  const { data: wallet, isLoading: isWalletLoading } = useQuery<WalletData>({
    queryKey: ['/api/wallet/balance'],
  });

  // Fetch transaction history
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
  });

  // Withdrawal request mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const response = await apiRequest('POST', '/api/wallet/withdraw', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted for admin approval.",
      });
      form.reset();
      setShowWithdrawalForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleWithdrawal = (data: WithdrawalFormData) => {
    withdrawalMutation.mutate(data);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'course_purchase':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
      case 'commission_earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'withdrawal_request':
        return <ArrowDownLeft className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'course_purchase':
        return 'bg-blue-50 border-blue-200';
      case 'commission_earned':
        return 'bg-green-50 border-green-200';
      case 'withdrawal_request':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isWalletLoading) {
    return (
      <DashboardLayout title="Wallet" subtitle="Manage your earnings and withdrawals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wallet" subtitle="Manage your earnings and withdrawals">
      <div className="space-y-6">
        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Wallet</CardTitle>
              <WalletIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {wallet ? formatCurrency(wallet.course_wallet_balance) : '₹0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Total course sales amount</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Wallet</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {wallet ? formatCurrency(wallet.commission_wallet_balance) : '₹0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Available for withdrawal</p>
              <Button 
                className="mt-2 w-full bg-green-600 hover:bg-green-700"
                onClick={() => setShowWithdrawalForm(true)}
                disabled={!wallet || parseFloat(wallet.commission_wallet_balance) < 1000}
              >
                Request Withdrawal
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {wallet ? formatCurrency(wallet.total_earnings) : '₹0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings • Withdrawn: {wallet ? formatCurrency(wallet.total_withdrawals) : '₹0.00'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className={`flex items-center gap-3 p-3 border rounded-lg ${getTransactionColor(transaction.type)}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{transaction.description}</div>
                      <div className="text-xs text-gray-600">
                        {formatDate(transaction.created_at)} • ID: {transaction.transaction_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form Dialog */}
      <Dialog open={showWithdrawalForm} onOpenChange={setShowWithdrawalForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleWithdrawal)} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Available Balance</div>
                  <div className="text-lg font-bold text-blue-900">
                    {wallet ? formatCurrency(wallet.commission_wallet_balance) : '₹0.00'}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdrawal Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount (min ₹1000)" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                Note: Withdrawal requests require admin approval and will be processed within 2-3 business days.
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowWithdrawalForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={withdrawalMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {withdrawalMutation.isPending ? 'Processing...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default Wallet;