import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet as WalletIcon, ArrowDown } from 'lucide-react';

export default function Wallet() {
  // Mock wallet data
  const walletBalance = 12450;
  const recentTransactions = [
    { id: 1, type: 'credit', amount: 2500, description: 'Payment from Arjun Reddy', date: 'Dec 15, 2024' },
    { id: 2, type: 'credit', amount: 3000, description: 'Payment from Sneha Patel', date: 'Dec 14, 2024' },
    { id: 3, type: 'debit', amount: 5000, description: 'Collection by Agent', date: 'Dec 12, 2024' },
  ];

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
                    <div className={`font-bold ${
                      transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                    }`}>
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
