import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  motherName: string;
  motherMobile: string;
  email: string;
  phone: string;
  parentPhone: string;
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
    queryKey: ['/api/student-balance-dues'],
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

  // Make phone call functionality
  const makePhoneCall = (phoneNumber: string, contactName: string) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      alert(`No phone number available for ${contactName}`);
    }
  };

  // Prepare chart data
  const statusChartData = [
    { name: 'Fully Paid', value: studentsFullyPaid, color: '#22c55e' },
    { name: 'Outstanding', value: studentsWithDues, color: '#ef4444' },
    { name: 'No Fees', value: totalStudents - studentsFullyPaid - studentsWithDues, color: '#6b7280' }
  ].filter(item => item.value > 0);

  return (
    <DashboardLayout title="Student Balance & Dues" subtitle="Track student payments, dues, and contact information for follow-ups">
      <div className="space-y-6">
        {/* Export Actions */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalPaidAmount)}</p>
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding Dues</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-2">
                <Phone className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{studentsWithDues}</p>
                  <p className="text-xs text-muted-foreground">Students with Dues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* State Filter */}
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
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

              {/* District Filter */}
              <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Districts" />
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

              {/* Class Filter */}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
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

              {/* Payment Status Filter */}
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="due">Outstanding Dues</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Student</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Class</th>
                      <th className="text-left p-2">SO Center</th>
                      <th className="text-left p-2">Paid Amount</th>
                      <th className="text-left p-2">Due Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            {student.fatherMobile && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">Father:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => makePhoneCall(student.fatherMobile, `${student.fatherName} (Father)`)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {student.fatherMobile}
                                </Button>
                              </div>
                            )}
                            {student.motherMobile && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">Mother:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => makePhoneCall(student.motherMobile, `${student.motherName} (Mother)`)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {student.motherMobile}
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{student.className}</td>
                        <td className="p-2">{student.soCenterName}</td>
                        <td className="p-2">{formatCurrency(parseFloat(student.paidAmount || '0'))}</td>
                        <td className="p-2">{formatCurrency(parseFloat(student.pendingAmount || '0'))}</td>
                        <td className="p-2">{getPaymentStatusBadge(student)}</td>
                        <td className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Details Modal */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details - {selectedStudent?.name}</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact Details</TabsTrigger>
                  <TabsTrigger value="payments">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Student Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Name:</strong> {selectedStudent.name}</div>
                        <div><strong>Student ID:</strong> {selectedStudent.studentId}</div>
                        <div><strong>Class:</strong> {selectedStudent.className}</div>
                        <div><strong>SO Center:</strong> {selectedStudent.soCenterName}</div>
                        <div><strong>Enrollment Date:</strong> {formatDate(selectedStudent.enrollmentDate)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Financial Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Total Fee:</strong> {formatCurrency(parseFloat(selectedStudent.totalFeeAmount || '0'))}</div>
                        <div><strong>Paid Amount:</strong> {formatCurrency(parseFloat(selectedStudent.paidAmount || '0'))}</div>
                        <div><strong>Pending Amount:</strong> {formatCurrency(parseFloat(selectedStudent.pendingAmount || '0'))}</div>
                        <div><strong>Status:</strong> {getPaymentStatusBadge(selectedStudent)}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedStudent.fatherName && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Father: {selectedStudent.fatherName}</div>
                            <div className="text-sm text-gray-500">{selectedStudent.fatherMobile}</div>
                          </div>
                          {selectedStudent.fatherMobile && (
                            <Button
                              onClick={() => makePhoneCall(selectedStudent.fatherMobile, `${selectedStudent.fatherName} (Father)`)}
                              size="sm"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                          )}
                        </div>
                      )}

                      {selectedStudent.motherName && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Mother: {selectedStudent.motherName}</div>
                            <div className="text-sm text-gray-500">{selectedStudent.motherMobile}</div>
                          </div>
                          {selectedStudent.motherMobile && (
                            <Button
                              onClick={() => makePhoneCall(selectedStudent.motherMobile, `${selectedStudent.motherName} (Mother)`)}
                              size="sm"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                          )}
                        </div>
                      )}

                      {selectedStudent.email && (
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium">Email</div>
                          <div className="text-sm text-gray-500">{selectedStudent.email}</div>
                        </div>
                      )}

                      <div className="p-3 border rounded-lg">
                        <div className="font-medium">Location</div>
                        <div className="text-sm text-gray-500">
                          {selectedStudent.villageName}, {selectedStudent.mandalName}, {selectedStudent.districtName}, {selectedStudent.stateName}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studentPayments.length > 0 ? (
                        <div className="space-y-2">
                          {studentPayments.map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <div className="font-medium">{formatCurrency(parseFloat(payment.amount))}</div>
                                <div className="text-sm text-gray-500">{payment.paymentMethod} - {formatDate(payment.createdAt)}</div>
                              </div>
                              <div className="text-sm text-gray-500">{payment.description}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">No payment history available</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}