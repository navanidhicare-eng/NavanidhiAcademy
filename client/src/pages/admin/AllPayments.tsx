import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  IndianRupee, 
  Download,
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';

export default function AdminAllPayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  // Mock payments data from all SO centers
  const mockPayments = [
    {
      id: '1',
      studentName: 'Arjun Reddy',
      studentClass: 'Class 10',
      amount: 2500,
      paymentMethod: 'cash',
      description: 'December 2024 fees',
      soCenterName: 'Main SO Center',
      recordedBy: 'Rajesh Kumar',
      date: '2024-12-15',
      status: 'completed'
    },
    {
      id: '2',
      studentName: 'Sneha Patel',
      studentClass: 'Navodaya',
      amount: 3000,
      paymentMethod: 'online',
      description: 'November 2024 fees',
      soCenterName: 'Branch SO Center - Kukatpally',
      recordedBy: 'Priya Sharma',
      date: '2024-12-14',
      status: 'completed'
    },
    {
      id: '3',
      studentName: 'Rahul Kumar',
      studentClass: 'Class 12',
      amount: 2800,
      paymentMethod: 'bank_transfer',
      description: 'December 2024 fees',
      soCenterName: 'SO Center - Secunderabad',
      recordedBy: 'Amit Patel',
      date: '2024-12-13',
      status: 'completed'
    },
    {
      id: '4',
      studentName: 'Priya Sharma',
      studentClass: 'POLYCET',
      amount: 4000,
      paymentMethod: 'cheque',
      description: 'Course completion fee',
      soCenterName: 'Main SO Center',
      recordedBy: 'Rajesh Kumar',
      date: '2024-12-12',
      status: 'pending'
    },
    {
      id: '5',
      studentName: 'Vikram Singh',
      studentClass: 'Class 10',
      amount: 2500,
      paymentMethod: 'cash',
      description: 'December 2024 fees',
      soCenterName: 'Branch SO Center - Kukatpally',
      recordedBy: 'Priya Sharma',
      date: '2024-12-11',
      status: 'completed'
    }
  ];

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'online': return 'bg-blue-100 text-blue-800';
      case 'bank_transfer': return 'bg-purple-100 text-purple-800';
      case 'cheque': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.soCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'completed');
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');

  const handleExport = () => {
    toast({ 
      title: 'Export Payments', 
      description: 'Payment data export functionality coming soon!' 
    });
  };

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</div>
                <p className="text-gray-600">Total Amount</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedPayments.length}</div>
                <p className="text-gray-600">Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
                <p className="text-gray-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{Math.round(totalAmount / filteredPayments.length).toLocaleString()}
                </div>
                <p className="text-gray-600">Avg Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Payment Records</CardTitle>
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                {/* Filters */}
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

                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2" size={16} />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                          <div className="text-sm text-gray-500">{payment.studentClass}</div>
                          <div className="text-xs text-gray-400">{payment.soCenterName}</div>
                          <div className="text-xs text-gray-400">By: {payment.recordedBy}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-bold text-secondary">
                          <IndianRupee size={14} className="mr-1" />
                          {payment.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getMethodBadgeColor(payment.paymentMethod)}>
                          {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={payment.status === 'completed' ? 'default' : 'secondary'}
                          className={payment.status === 'completed' 
                            ? 'bg-success text-white' 
                            : 'bg-warning text-white'
                          }
                        >
                          {payment.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-8">
                <IndianRupee className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No payments found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredPayments.length}</span> of{' '}
                <span className="font-medium">{mockPayments.length}</span> payments
              </p>
              <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}