import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  IndianRupee, 
  Download,
  Calendar,
  TrendingUp,
  Filter,
  Users,
  Building2,
  UserCheck
} from 'lucide-react';

export default function AdminAllPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('student-fees');
  const { toast } = useToast();

  // Fetch real student fee payment histories
  const { data: studentPayments = [], isLoading: isLoadingStudentPayments } = useQuery({
    queryKey: ['/api/admin/payments/student-fees'],
  });

  // Fetch real SO Center wallet transaction histories
  const { data: soWalletTransactions = [], isLoading: isLoadingSoWallet } = useQuery({
    queryKey: ['/api/admin/payments/so-wallet-histories'],
  });

  // Fetch real Agent wallet transaction histories  
  const { data: agentWalletTransactions = [], isLoading: isLoadingAgentWallet } = useQuery({
    queryKey: ['/api/admin/payments/agent-wallet-histories'],
  });

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'online': return 'bg-blue-100 text-blue-800';
      case 'bank_transfer': return 'bg-purple-100 text-purple-800';
      case 'cheque': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-green-100 text-green-800';
      case 'debit': return 'bg-red-100 text-red-800';
      case 'commission': return 'bg-blue-100 text-blue-800';
      case 'withdrawal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter functions for each tab
  const filteredStudentPayments = studentPayments.filter((payment: any) => {
    const matchesSearch = payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.soCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const filteredSoWalletTransactions = soWalletTransactions.filter((transaction: any) => {
    const matchesSearch = transaction.soCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.collectionAgentName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredAgentWalletTransactions = agentWalletTransactions.filter((transaction: any) => {
    const matchesSearch = transaction.soCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExport = () => {
    toast({ 
      title: 'Export Payments', 
      description: 'Payment data export functionality coming soon!' 
    });
  };

  // Calculate statistics based on active tab
  const getTabStatistics = () => {
    switch (activeTab) {
      case 'student-fees':
        const totalStudentAmount = filteredStudentPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0);
        return {
          totalAmount: totalStudentAmount,
          totalCount: filteredStudentPayments.length,
          label: 'Student Payments'
        };
      case 'so-wallet':
        const totalSoAmount = filteredSoWalletTransactions.reduce((sum: number, transaction: any) => {
          const amount = parseFloat(transaction.amount || 0);
          return sum + (transaction.type === 'credit' ? amount : -amount);
        }, 0);
        return {
          totalAmount: totalSoAmount,
          totalCount: filteredSoWalletTransactions.length,
          label: 'SO Center Transactions'
        };
      case 'agent-wallet':
        const totalAgentAmount = filteredAgentWalletTransactions.reduce((sum: number, transaction: any) => {
          const amount = parseFloat(transaction.amount || 0);
          return sum + (transaction.type === 'commission' ? amount : -amount);
        }, 0);
        return {
          totalAmount: totalAgentAmount,
          totalCount: filteredAgentWalletTransactions.length,
          label: 'Agent Transactions'
        };
      default:
        return { totalAmount: 0, totalCount: 0, label: 'Transactions' };
    }
  };

  const stats = getTabStatistics();

  return (
    <DashboardLayout
      title="All Payments"
      subtitle="System-wide payment tracking and management"
    >
      <div className="space-y-6">
        {/* Payment Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{stats.totalAmount.toLocaleString()}</div>
                <p className="text-gray-600">Total Amount</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalCount}</div>
                <p className="text-gray-600">Total Records</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{stats.totalCount > 0 ? Math.round(stats.totalAmount / stats.totalCount).toLocaleString() : 0}
                </div>
                <p className="text-gray-600">Avg Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Three-Tab Payment System */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Payment Management</CardTitle>
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Payment Method Filter (only for student fees tab) */}
                {activeTab === 'student-fees' && (
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2" size={16} />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student-fees" className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>Student Fee Histories</span>
                </TabsTrigger>
                <TabsTrigger value="so-wallet" className="flex items-center space-x-2">
                  <Building2 size={16} />
                  <span>SO Wallet Histories</span>
                </TabsTrigger>
                <TabsTrigger value="agent-wallet" className="flex items-center space-x-2">
                  <UserCheck size={16} />
                  <span>Agent Wallet Histories</span>
                </TabsTrigger>
              </TabsList>

              {/* Student Fee Histories Tab */}
              <TabsContent value="student-fees" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Student & Center
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingStudentPayments ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Loading student payments...
                          </td>
                        </tr>
                      ) : filteredStudentPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No student payments found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudentPayments.map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                                <div className="text-sm text-gray-500">{payment.studentClass}</div>
                                <div className="text-xs text-gray-400">{payment.soCenterName}</div>
                                <div className="text-xs text-gray-400">By: {payment.recordedByName || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm font-bold text-secondary">
                                <IndianRupee size={14} className="mr-1" />
                                {parseFloat(payment.amount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getMethodBadgeColor(payment.paymentMethod)}>
                                {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{payment.description || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar size={14} className="mr-1" />
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{payment.receiptNumber || 'N/A'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* SO Center Wallet Histories Tab */}
              <TabsContent value="so-wallet" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          SO Center
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Agent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingSoWallet ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Loading SO wallet transactions...
                          </td>
                        </tr>
                      ) : filteredSoWalletTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No SO wallet transactions found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredSoWalletTransactions.map((transaction: any) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{transaction.soCenterName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm font-bold text-secondary">
                                <IndianRupee size={14} className="mr-1" />
                                {parseFloat(transaction.amount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getTypeBadgeColor(transaction.type)}>
                                {transaction.type?.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{transaction.description || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar size={14} className="mr-1" />
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{transaction.collectionAgentName || 'N/A'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Agent Wallet Histories Tab */}
              <TabsContent value="agent-wallet" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          SO Center
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Wallet Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingAgentWallet ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Loading agent wallet transactions...
                          </td>
                        </tr>
                      ) : filteredAgentWalletTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No agent wallet transactions found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAgentWalletTransactions.map((transaction: any) => (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{transaction.soCenterName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm font-bold text-secondary">
                                <IndianRupee size={14} className="mr-1" />
                                {parseFloat(transaction.amount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getTypeBadgeColor(transaction.type)}>
                                {transaction.type?.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{transaction.description || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar size={14} className="mr-1" />
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                ₹{parseFloat(transaction.walletAvailableBalance || 0).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>

            {/* Summary Statistics */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{stats.totalCount}</span> {stats.label.toLowerCase()}
              </p>
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900">₹{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}