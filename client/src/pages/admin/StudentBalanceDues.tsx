
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter,
  Download,
  Eye,
  MapPin,
  Building,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  User,
  Phone,
  Calendar,
  IndianRupee,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Student {
  id: string;
  name: string;
  studentId: string;
  fatherName: string;
  fatherMobile: string;
  className: string;
  soCenterName: string;
  paidAmount: string;
  pendingAmount: string;
  totalFeeAmount: string;
  enrollmentDate: string;
  stateName?: string;
  districtName?: string;
  mandalName?: string;
  villageName?: string;
}

interface Payment {
  id: string;
  amount: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  month?: string;
  year?: number;
  receiptNumber?: string;
}

export default function StudentBalanceDues() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMandal, setSelectedMandal] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'paid', 'due', 'partial'
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch all required data
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/admin/students'],
  });

  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages'],
  });

  const { data: soCenters = [] } = useQuery({
    queryKey: ['/api/admin/so-centers'],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  // Fetch payment history for selected student
  const { data: studentPayments = [] } = useQuery<Payment[]>({
    queryKey: [`/api/students/${selectedStudent?.id}/payments`],
    enabled: !!selectedStudent?.id,
  });

  // Filter location data based on selections
  const filteredDistricts = (districts as any[]).filter((district: any) => 
    selectedState === 'all' || district.stateId === selectedState
  );

  const filteredMandals = (mandals as any[]).filter((mandal: any) => 
    selectedDistrict === 'all' || mandal.districtId === selectedDistrict
  );

  const filteredVillages = (villages as any[]).filter((village: any) => 
    selectedMandal === 'all' || village.mandalId === selectedMandal
  );

  const filteredSoCenters = (soCenters as any[]).filter((center: any) => {
    if (selectedState === 'all' && selectedDistrict === 'all' && selectedMandal === 'all' && selectedVillage === 'all') {
      return true;
    }
    const stateMatch = selectedState === 'all' || center.stateName === (states as any[]).find(s => s.id === selectedState)?.name;
    const districtMatch = selectedDistrict === 'all' || center.districtName === (districts as any[]).find(d => d.id === selectedDistrict)?.name;
    const mandalMatch = selectedMandal === 'all' || center.mandalName === (mandals as any[]).find(m => m.id === selectedMandal)?.name;
    const villageMatch = selectedVillage === 'all' || center.villageName === (villages as any[]).find(v => v.id === selectedVillage)?.name;
    return stateMatch && districtMatch && mandalMatch && villageMatch;
  });

  // Filter students based on all criteria
  const filteredStudents = students.filter((student: Student) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherMobile?.includes(searchTerm);

    // Class filter
    const matchesClass = selectedClass === 'all' || student.className === (classes as any[]).find(c => c.id === selectedClass)?.name;

    // SO Center filter
    const matchesCenter = selectedCenter === 'all' || student.soCenterName === (soCenters as any[]).find(c => c.id === selectedCenter)?.name;

    // Payment status filter
    const paidAmount = parseFloat(student.paidAmount || '0');
    const totalAmount = parseFloat(student.totalFeeAmount || '0');
    const pendingAmount = parseFloat(student.pendingAmount || '0');
    
    let matchesPaymentStatus = true;
    if (paymentStatus === 'paid') {
      matchesPaymentStatus = pendingAmount <= 0 && paidAmount > 0;
    } else if (paymentStatus === 'due') {
      matchesPaymentStatus = pendingAmount > 0;
    } else if (paymentStatus === 'partial') {
      matchesPaymentStatus = paidAmount > 0 && pendingAmount > 0;
    }

    // Location filter through SO center
    let matchesLocation = true;
    if (selectedState !== 'all' || selectedDistrict !== 'all' || selectedMandal !== 'all' || selectedVillage !== 'all') {
      const studentCenter = (soCenters as any[]).find(c => c.name === student.soCenterName);
      if (studentCenter) {
        const stateMatch = selectedState === 'all' || studentCenter.stateName === (states as any[]).find(s => s.id === selectedState)?.name;
        const districtMatch = selectedDistrict === 'all' || studentCenter.districtName === (districts as any[]).find(d => d.id === selectedDistrict)?.name;
        const mandalMatch = selectedMandal === 'all' || studentCenter.mandalName === (mandals as any[]).find(m => m.id === selectedMandal)?.name;
        const villageMatch = selectedVillage === 'all' || studentCenter.villageName === (villages as any[]).find(v => v.id === selectedVillage)?.name;
        matchesLocation = stateMatch && districtMatch && mandalMatch && villageMatch;
      } else {
        matchesLocation = false;
      }
    }

    return matchesSearch && matchesClass && matchesCenter && matchesPaymentStatus && matchesLocation;
  });

  // Reset cascading filters
  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleMandalChange = (mandalId: string) => {
    setSelectedMandal(mandalId);
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleVillageChange = (villageId: string) => {
    setSelectedVillage(villageId);
    setSelectedCenter('all');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
    setSelectedClass('all');
    setPaymentStatus('all');
  };

  // Calculate summary statistics
  const totalStudents = filteredStudents.length;
  const totalPaidAmount = filteredStudents.reduce((sum, student) => sum + parseFloat(student.paidAmount || '0'), 0);
  const totalPendingAmount = filteredStudents.reduce((sum, student) => sum + parseFloat(student.pendingAmount || '0'), 0);
  const studentsWithDues = filteredStudents.filter(s => parseFloat(s.pendingAmount || '0') > 0).length;
  const studentsFullyPaid = filteredStudents.filter(s => parseFloat(s.pendingAmount || '0') <= 0 && parseFloat(s.paidAmount || '0') > 0).length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get payment status badge
  const getPaymentStatusBadge = (student: Student) => {
    const paidAmount = parseFloat(student.paidAmount || '0');
    const pendingAmount = parseFloat(student.pendingAmount || '0');

    if (pendingAmount <= 0 && paidAmount > 0) {
      return <Badge variant="default" className="bg-green-600">Fully Paid</Badge>;
    } else if (paidAmount > 0 && pendingAmount > 0) {
      return <Badge variant="secondary" className="bg-yellow-600 text-white">Partial</Badge>;
    } else if (pendingAmount > 0) {
      return <Badge variant="destructive">Outstanding</Badge>;
    } else {
      return <Badge variant="outline">No Fees</Badge>;
    }
  };

  // Prepare chart data
  const statusChartData = [
    { name: 'Fully Paid', value: studentsFullyPaid, color: '#22c55e' },
    { name: 'Outstanding', value: studentsWithDues, color: '#ef4444' },
    { name: 'No Fees', value: totalStudents - studentsFullyPaid - studentsWithDues, color: '#6b7280' }
  ].filter(item => item.value > 0);

  if (studentsLoading) {
    return (
      <DashboardLayout title="Student Balance & Dues" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Student Balance & Dues" 
      subtitle="Comprehensive view of student payment status and outstanding balances"
    >
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidAmount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPendingAmount)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students with Dues</p>
                  <p className="text-2xl font-bold text-orange-600">{studentsWithDues}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Chart */}
        {statusChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, father's name, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Location Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select onValueChange={handleStateChange} value={selectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {(states as any[]).map((state: any) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={handleDistrictChange} value={selectedDistrict} disabled={selectedState === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {filteredDistricts.map((district: any) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={handleMandalChange} value={selectedMandal} disabled={selectedDistrict === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mandals</SelectItem>
                  {filteredMandals.map((mandal: any) => (
                    <SelectItem key={mandal.id} value={mandal.id}>
                      {mandal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={handleVillageChange} value={selectedVillage} disabled={selectedMandal === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Village" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  {filteredVillages.map((village: any) => (
                    <SelectItem key={village.id} value={village.id}>
                      {village.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select onValueChange={setSelectedCenter} value={selectedCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SO Center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SO Centers</SelectItem>
                  {filteredSoCenters.map((center: any) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(classes as any[]).map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setPaymentStatus} value={paymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="due">Outstanding</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Student Balance Details ({filteredStudents.length} students)</CardTitle>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Student Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contact & Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Academic Info</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Payment Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Balance Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const paidAmount = parseFloat(student.paidAmount || '0');
                    const pendingAmount = parseFloat(student.pendingAmount || '0');
                    const totalAmount = parseFloat(student.totalFeeAmount || '0');
                    
                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{student.fatherName}</div>
                            <div className="text-gray-500">{student.fatherMobile}</div>
                            <div className="text-xs text-gray-400">
                              {student.stateName && `${student.stateName}, ${student.districtName}`}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{student.className}</div>
                            <div className="text-gray-500">{student.soCenterName}</div>
                            <div className="text-xs text-gray-400">
                              Enrolled: {formatDate(student.enrollmentDate)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getPaymentStatusBadge(student)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm space-y-1">
                            <div className="text-green-600 font-medium">
                              Paid: {formatCurrency(paidAmount)}
                            </div>
                            {pendingAmount > 0 && (
                              <div className="text-red-600 font-medium">
                                Due: {formatCurrency(pendingAmount)}
                              </div>
                            )}
                            <div className="text-gray-500 text-xs">
                              Total: {formatCurrency(totalAmount)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View History
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                  <p className="text-gray-600">Try adjusting your filters to see student balance data.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Payment History Modal */}
      {selectedStudent && (
        <Dialog open={true} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment History - {selectedStudent.name}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{selectedStudent.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Student ID</label>
                        <p className="text-gray-900">{selectedStudent.studentId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Father's Name</label>
                        <p className="text-gray-900">{selectedStudent.fatherName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Mobile</label>
                        <p className="text-gray-900">{selectedStudent.fatherMobile}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Class</label>
                        <p className="text-gray-900">{selectedStudent.className}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">SO Center</label>
                        <p className="text-gray-900">{selectedStudent.soCenterName}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Balance Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Balance Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm font-medium text-green-700">Amount Paid</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(parseFloat(selectedStudent.paidAmount || '0'))}
                          </div>
                        </div>
                        
                        {parseFloat(selectedStudent.pendingAmount || '0') > 0 && (
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm font-medium text-red-700">Outstanding Amount</div>
                            <div className="text-2xl font-bold text-red-600">
                              {formatCurrency(parseFloat(selectedStudent.pendingAmount || '0'))}
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-700">Total Fee Amount</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(parseFloat(selectedStudent.totalFeeAmount || '0'))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Payment Status:</span>
                          {getPaymentStatusBadge(selectedStudent)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {studentPayments.length > 0 ? (
                      <div className="space-y-4">
                        {studentPayments.map((payment) => (
                          <div key={payment.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(parseFloat(payment.amount))}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {payment.description || 'Fee Payment'}
                                </div>
                                {payment.receiptNumber && (
                                  <div className="text-xs text-gray-500">
                                    Receipt: {payment.receiptNumber}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {payment.paymentMethod}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(payment.createdAt)}
                                </div>
                                {payment.month && payment.year && (
                                  <div className="text-xs text-blue-600">
                                    {payment.month} {payment.year}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                        <p className="text-gray-600">No payments have been recorded for this student yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
