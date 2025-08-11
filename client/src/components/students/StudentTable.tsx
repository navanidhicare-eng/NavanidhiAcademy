import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QRModal } from '@/components/qr/QRModal';
import { 
  Search, 
  QrCode, 
  Edit, 
  TrendingUp, 
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Student {
  id: string;
  name: string;
  classId: string;
  parentPhone: string;
  qrCode: string;
}

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
}

export function StudentTable({ students, isLoading }: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  // Fetch all classes dynamically
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
    queryFn: async () => {
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter students based on search and class filter
  const filteredStudents = (students || []).filter((student: any) => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentPhone?.includes(searchTerm);
    
    // Class filtering logic - use actual class IDs from database
    const matchesClass = classFilter === 'all' || student.classId === classFilter;
    
    return matchesSearch && matchesClass;
  });

  console.log('Students received:', students);
  console.log('Filtered students:', filteredStudents);

  // Mock additional data for students that might not come from API
  const displayStudents = filteredStudents.map((student: any) => ({
    ...student,
    paymentStatus: student.paymentStatus || 'pending', // Use real payment status
    progress: student.progress || 0, // Initial progress is 0
    qrCode: student.qrCode || `student_${student.id}` // Ensure QR code exists
  }));

  const handleShowQR = (student: any) => {
    setSelectedStudent(student);
    setIsQRModalOpen(true);
  };

  const handleShowPaymentHistory = async (student: any) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/students/${student.id}/payments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const history = await response.json();
      setPaymentHistory(Array.isArray(history) ? history : []);
      setSelectedStudent(student);
      setIsPaymentHistoryOpen(true);
    } catch (error) {
      console.error('Payment history error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Students</CardTitle>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Filter */}
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            {displayStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {getInitials(student.name)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.parentPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-blue-800 border-blue-200">
                        {student.className || student.classId}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={student.paymentStatus === 'paid' ? 'default' : 'secondary'}
                        className={student.paymentStatus === 'paid' 
                          ? 'bg-success text-white' 
                          : 'bg-warning text-white'
                        }
                      >
                        {student.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-success h-2 rounded-full" 
                            style={{width: `${student.progress}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowQR(student)}
                        className="text-gray-700 hover:bg-gray-100"
                      >
                        <QrCode className="mr-2" size={16} />
                        View QR
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleShowPaymentHistory(student)}
                          disabled={loadingHistory}
                          title="View Payment History"
                        >
                          <Eye className="text-blue-500" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <TrendingUp className="text-accent" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <IndianRupee className="text-secondary" size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">2</span> of{' '}
              <span className="font-medium">156</span> students
            </p>
            <nav className="flex space-x-2">
              <Button variant="outline" size="sm">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-white">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight size={16} />
              </Button>
            </nav>
          </div>
        </CardContent>
      </Card>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        student={selectedStudent}
      />

      {/* Payment History Modal */}
      <Dialog open={isPaymentHistoryOpen} onOpenChange={setIsPaymentHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment History - {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {paymentHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payment history found</p>
            ) : (
              paymentHistory.map((payment: any, index: number) => (
                <div key={payment.id || index} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold text-lg">₹{parseFloat(payment.amount || '0').toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{payment.description || 'Payment'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()} - {new Date(payment.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize font-medium">{payment.paymentMethod || 'Cash'}</p>
                    {payment.month && <p className="text-xs text-gray-500">{payment.month} {payment.year}</p>}
                    <Badge variant="outline" className="mt-1">
                      {payment.paymentMethod === 'wallet' ? 'Wallet' : 'Cash'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
