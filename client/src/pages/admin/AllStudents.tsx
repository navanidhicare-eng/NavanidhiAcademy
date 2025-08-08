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
  Users, 
  Download,
  Filter,
  Eye,
  QrCode
} from 'lucide-react';

export default function AdminAllStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Mock students data from all SO centers
  const mockStudents = [
    {
      id: '1',
      name: 'Arjun Reddy',
      classId: 'Class 10',
      parentPhone: '+91 98765 43210',
      parentName: 'Rajesh Reddy',
      soCenterName: 'Main SO Center',
      courseType: 'monthly_tuition',
      paymentStatus: 'paid',
      progress: 78,
      qrCode: 'student_123',
      enrolledDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sneha Patel',
      classId: 'Navodaya',
      parentPhone: '+91 87654 32109',
      parentName: 'Suresh Patel',
      soCenterName: 'Branch SO Center - Kukatpally',
      courseType: 'fixed_fee',
      paymentStatus: 'pending',
      progress: 45,
      qrCode: 'student_124',
      enrolledDate: '2024-02-10'
    },
    {
      id: '3',
      name: 'Rahul Kumar',
      classId: 'Class 12',
      parentPhone: '+91 76543 21098',
      parentName: 'Ankit Kumar',
      soCenterName: 'SO Center - Secunderabad',
      courseType: 'monthly_tuition',
      paymentStatus: 'paid',
      progress: 92,
      qrCode: 'student_125',
      enrolledDate: '2024-01-20'
    },
    {
      id: '4',
      name: 'Priya Sharma',
      classId: 'POLYCET',
      parentPhone: '+91 65432 10987',
      parentName: 'Vikram Sharma',
      soCenterName: 'Main SO Center',
      courseType: 'fixed_fee',
      paymentStatus: 'paid',
      progress: 67,
      qrCode: 'student_126',
      enrolledDate: '2024-03-05'
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredStudents = mockStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentPhone.includes(searchTerm) ||
                         student.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.classId.toLowerCase().includes(classFilter.replace('-', ' '));
    const matchesCenter = centerFilter === 'all' || student.soCenterName.toLowerCase().includes(centerFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.paymentStatus === statusFilter;
    
    return matchesSearch && matchesClass && matchesCenter && matchesStatus;
  });

  const handleExport = () => {
    toast({ 
      title: 'Export Students', 
      description: 'Student data export functionality coming soon!' 
    });
  };

  return (
    <DashboardLayout
      title="All Students"
      subtitle="System-wide student management and overview"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Student Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{mockStudents.length}</div>
                <p className="text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mockStudents.filter(s => s.paymentStatus === 'paid').length}
                </div>
                <p className="text-gray-600">Paid Students</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {mockStudents.filter(s => s.paymentStatus === 'pending').length}
                </div>
                <p className="text-gray-600">Pending Payments</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(mockStudents.reduce((sum, s) => sum + s.progress, 0) / mockStudents.length)}%
                </div>
                <p className="text-gray-600">Avg Progress</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {new Set(mockStudents.map(s => s.soCenterName)).size}
                </div>
                <p className="text-gray-600">SO Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">All Students</CardTitle>
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
                
                {/* Filters */}
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="class-10">Class 10</SelectItem>
                    <SelectItem value="class-12">Class 12</SelectItem>
                    <SelectItem value="navodaya">Navodaya</SelectItem>
                    <SelectItem value="polycet">POLYCET</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      SO Center
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
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
                            <div className="text-sm text-gray-500">{student.parentName}</div>
                            <div className="text-sm text-gray-500">{student.parentPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-blue-800 border-blue-200">
                          {student.classId}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">{student.courseType.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.soCenterName}</div>
                        <div className="text-xs text-gray-500">
                          Enrolled: {new Date(student.enrolledDate).toLocaleDateString()}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="text-primary" size={16} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <QrCode className="text-secondary" size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No students found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}