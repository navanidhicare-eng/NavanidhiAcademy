import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Wallet as WalletIcon, ArrowDown, ArrowUp } from 'lucide-react';

export default function Wallet() {
  const { user } = useAuth();

  // Fetch wallet balance and transactions for Pothanapudi SO Center
  const { data: walletData } = useQuery({
    queryKey: ['/api/wallet', '84bf6d19-8830-4abd-8374-2c29faecaa24'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/wallet/84bf6d19-8830-4abd-8374-2c29faecaa24`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'so_center',
  });

  const walletBalance = walletData?.balance || 0;
  const recentTransactions = walletData?.transactions || [];

  return (
    <DashboardLayout
      title="Wallet"
      subtitle="View wallet balance and transaction history"
    >
      <div className="space-y-8">
        {/* Wallet Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <WalletIcon size={24} />
              <span>Wallet Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  ₹{walletBalance.toLocaleString()}
                </div>
                <p className="text-gray-600 mt-1">Current balance (non-cash)</p>
              </div>
              <Button className="bg-secondary text-white hover:bg-green-600">
                <ArrowDown className="mr-2" size={16} />
                Request Collection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold flex items-center justify-end ${
                      transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <ArrowUp size={16} className="mr-1" />
                      ) : (
                        <ArrowDown size={16} className="mr-1" />
                      )}
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{transaction.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
