import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Eye, 
  Filter,
  MapPin,
  School,
  Users,
  Phone,
  Calendar,
  User,
  CreditCard,
  GraduationCap,
  Home,
  FileText,
  Plus,
  Download
} from 'lucide-react';

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMandal, setSelectedMandal] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const { toast } = useToast();

  // Fetch students data
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

  // Filter students based on search and class
  const filteredStudents = (students as any[]).filter((student: any) => {
    // Enhanced search including SO Center and location information
    const studentCenter = (soCenters as any[]).find(c => c.id === student.soCenterId);
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherMobile?.includes(searchTerm) ||
      student.motherMobile?.includes(searchTerm) ||
      student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.centerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.villageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.mandalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.districtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentCenter?.stateName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;

    return matchesSearch && matchesClass;
  });

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

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
    setSelectedClass('all');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: any) => {
    return `₹${(parseFloat(amount) || 0).toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600 mt-2">Manage all students across the system</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredStudents.length} Students
            </Badge>
          </div>
        </div>

        {/* Location Filters Section */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Location Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* State Filter */}
              <Select onValueChange={handleStateChange} value={selectedState}>
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏛️ Select State" />
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
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏘️ Select District" />
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
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏛️ Select Mandal" />
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
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏘️ Select Village" />
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

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Search and Actions Bar */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Left side - Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, phone, or father's name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Right side - Filters and Actions */}
            <div className="flex gap-3 items-center">
              {/* Class Filter */}
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger className="w-[150px]">
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

              {/* Add Student Button */}
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>

              {/* Export CSV Button */}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card>

        {/* Students Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student: any) => {
                  const studentClass = (classes as any[]).find(c => c.id === student.classId);
                  const studentCenter = (soCenters as any[]).find(c => c.id === student.soCenterId);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.fatherName || student.motherName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.fatherMobile || student.motherMobile || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{studentClass?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {student.feeType === 'monthly' ? 'monthly' : 'yearly'} •
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewStudent(student)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredStudents.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </Card>
        )}
      </div>

      {/* Detailed Student View Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="student-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Complete Student Profile
            </DialogTitle>
            <DialogDescription id="student-dialog-description">
              Comprehensive information for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Student ID - Non-editable */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Student ID (Non-editable)</p>
                    <p className="text-lg font-bold text-gray-900">{selectedStudent.studentId}</p>
                  </div>
                  <Badge variant="secondary">Read Only</Badge>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-600">Full Name</p>
                      <p className="text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Date of Birth</p>
                      <p className="text-gray-900">{formatDate(selectedStudent.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Gender</p>
                      <p className="text-gray-900">{selectedStudent.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Aadhar Number</p>
                      <p className="text-gray-900">{selectedStudent.aadharNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-600">Enrollment Date</p>
                      <p className="text-gray-900">{formatDate(selectedStudent.enrollmentDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Course Type</p>
                      <p className="text-gray-900">{selectedStudent.courseType?.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Class</p>
                      <p className="text-gray-900">{(classes as any[]).find((c: any) => c.id === selectedStudent.classId)?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">SO Center</p>
                      <p className="text-gray-900">{(soCenters as any[]).find((c: any) => c.id === selectedStudent.soCenterId)?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Parent Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-600">Father Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-600">Name</p>
                        <p className="text-gray-900">{selectedStudent.fatherName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Mobile</p>
                        <p className="text-gray-900">{selectedStudent.fatherMobile}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Occupation</p>
                        <p className="text-gray-900">{selectedStudent.fatherOccupation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-pink-600">Mother Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-600">Name</p>
                        <p className="text-gray-900">{selectedStudent.motherName}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Mobile</p>
                        <p className="text-gray-900">{selectedStudent.motherMobile}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Occupation</p>
                        <p className="text-gray-900">{selectedStudent.motherOccupation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Address Information
                </h3>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="font-medium text-gray-600">Complete Address</p>
                    <p className="text-gray-900">{selectedStudent.address}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium text-gray-600">Village</p>
                      <p className="text-gray-900">{selectedStudent.villageName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Mandal</p>
                      <p className="text-gray-900">{selectedStudent.mandalName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">District</p>
                      <p className="text-gray-900">{selectedStudent.districtName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Fee Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-600">Total Fee Amount</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedStudent.totalFeeAmount)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-600">Paid Amount</p>
                    <p className="text-lg font-bold text-green-900">{formatCurrency(selectedStudent.paidAmount)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="font-medium text-red-600">Pending Amount</p>
                    <p className="text-lg font-bold text-red-900">{formatCurrency(selectedStudent.pendingAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Sibling Information */}
              {selectedStudent.siblings && selectedStudent.siblings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Sibling Information
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.siblings.map((sibling: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-600">Name</p>
                            <p className="text-gray-900">{sibling.name}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Age</p>
                            <p className="text-gray-900">{sibling.age}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">School/Class</p>
                            <p className="text-gray-900">{sibling.school || sibling.class || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedStudent.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Notes
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                    <p className="text-gray-900">{selectedStudent.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}