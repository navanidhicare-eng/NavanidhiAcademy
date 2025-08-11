import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  QrCode,
  MapPin,
  School,
  Phone,
  Calendar,
  User
} from 'lucide-react';

export default function AdminAllStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMandal, setSelectedMandal] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Fetch students data from real API
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/admin/students'],
  });

  // Fetch filter options
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
    
    // Use the joined location data from the center
    const stateMatch = selectedState === 'all' || center.stateName === (states as any[]).find(s => s.id === selectedState)?.name;
    const districtMatch = selectedDistrict === 'all' || center.districtName === (districts as any[]).find(d => d.id === selectedDistrict)?.name;
    const mandalMatch = selectedMandal === 'all' || center.mandalName === (mandals as any[]).find(m => m.id === selectedMandal)?.name;
    const villageMatch = selectedVillage === 'all' || center.villageName === (villages as any[]).find(v => v.id === selectedVillage)?.name;

    return stateMatch && districtMatch && mandalMatch && villageMatch;
  });

  // Filter students based on all criteria including location
  const filteredStudents = (students as any[]).filter((student: any) => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherMobile?.includes(searchTerm) ||
      student.motherMobile?.includes(searchTerm) ||
      student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCenter = centerFilter === 'all' || student.soCenterId === centerFilter;
    const matchesClass = classFilter === 'all' || student.classId === classFilter;
    const matchesStatus = statusFilter === 'all' || student.paymentStatus === statusFilter;

    // Location-based filtering through student's SO center
    let matchesLocation = true;
    if (selectedState !== 'all' || selectedDistrict !== 'all' || selectedMandal !== 'all' || selectedVillage !== 'all') {
      const studentCenter = (soCenters as any[]).find(c => c.id === student.soCenterId);
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

    return matchesSearch && matchesCenter && matchesClass && matchesStatus && matchesLocation;
  });

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setCenterFilter('all');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedMandal('all');
    setSelectedVillage('all');
    setCenterFilter('all');
  };

  const handleMandalChange = (mandalId: string) => {
    setSelectedMandal(mandalId);
    setSelectedVillage('all');
    setCenterFilter('all');
  };

  const handleVillageChange = (villageId: string) => {
    setSelectedVillage(villageId);
    setCenterFilter('all');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setClassFilter('all');
    setCenterFilter('all');
    setStatusFilter('all');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (isLoading) {
    return (
      <DashboardLayout 
        title="Student Management"
        subtitle="Loading students data..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const handleExport = () => {
    toast({ 
      title: 'Export Students', 
      description: 'Student data export functionality coming soon!' 
    });
  };

  return (
    <DashboardLayout title="All Students Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage all students across the system</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Add Student
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Student Management ({filteredStudents.length} students)</span>
              <Badge variant="secondary">{filteredStudents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{(students as any[]).length}</div>
                <p className="text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(students as any[]).filter((s: any) => (s.totalAmount - s.paidAmount) <= 0).length}
                </div>
                <p className="text-gray-600">Paid Students</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(students as any[]).filter((s: any) => (s.totalAmount - s.paidAmount) > 0).length}
                </div>
                <p className="text-gray-600">Pending Payments</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(soCenters as any[]).length}
                </div>
                <p className="text-gray-600">SO Centers</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {(classes as any[]).length}
                </div>
                <p className="text-gray-600">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Student Management ({filteredStudents.length} students)</span>
              <Badge variant="secondary">{filteredStudents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Location Filters Section */}
            <div className="border-b pb-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Location Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* State Filter */}
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

                {/* District Filter */}
                <Select 
                  onValueChange={handleDistrictChange} 
                  value={selectedDistrict}
                  disabled={selectedState === 'all'}
                >
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

                {/* Mandal Filter */}
                <Select 
                  onValueChange={handleMandalChange} 
                  value={selectedMandal}
                  disabled={selectedDistrict === 'all'}
                >
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

                {/* Village Filter */}
                <Select 
                  onValueChange={handleVillageChange} 
                  value={selectedVillage}
                  disabled={selectedMandal === 'all'}
                >
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

                {/* Clear Filters Button */}
                <Button variant="outline" onClick={clearAllFilters} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Search and Other Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, student ID, phone, or father's name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select onValueChange={setClassFilter} value={classFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
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
              <Select onValueChange={setCenterFilter} value={centerFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All SO Centers" />
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
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
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
                      Amount
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
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                            <div className="text-sm text-gray-500">{student.fatherMobile || student.motherMobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-blue-800 border-blue-200">
                          {student.className}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">{student.courseType?.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.soCenterName}</div>
                        <div className="text-xs text-gray-500">
                          Enrolled: {formatDate(student.enrollmentDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={(student.totalAmount - student.paidAmount) <= 0 ? 'default' : 'secondary'}
                          className={(student.totalAmount - student.paidAmount) <= 0
                            ? 'bg-green-500 text-white' 
                            : 'bg-orange-500 text-white'
                          }
                        >
                          {(student.totalAmount - student.paidAmount) <= 0 ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-green-600 font-medium">₹{student.paidAmount || 0}</div>
                          <div className="text-orange-600">₹{(student.totalAmount - student.paidAmount) || 0} pending</div>
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