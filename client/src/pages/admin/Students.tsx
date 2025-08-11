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
  FileText
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

  // Filter students based on all criteria including location
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

    const matchesCenter = selectedCenter === 'all' || student.soCenterId === selectedCenter;
    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;

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

    return matchesSearch && matchesCenter && matchesClass && matchesLocation;
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

          {/* Top Location Filters */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Location Filters</h2>
            <p className="text-sm text-gray-600 mb-4">
              Filter by location hierarchy: State → District → Mandal → Village. Search includes all student details and location names.
            </p>
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
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, student ID, phone, parent name, SO center, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* SO Center Filter */}
            <Select onValueChange={setSelectedCenter} value={selectedCenter}>
              <SelectTrigger>
                <SelectValue placeholder="All SO Centers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SO Centers</SelectItem>
                {filteredSoCenters.map((center: any) => (
                  <SelectItem key={center.id} value={center.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{center.name}</span>
                      <span className="text-xs text-gray-500">
                        {center.villageName}, {center.mandalName}, {center.districtName}, {center.stateName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select onValueChange={setSelectedClass} value={selectedClass}>
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
          </div>
        </Card>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student: any) => (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Student Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                    </div>
                  </div>
                  <Badge 
                    className={student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {student.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </Badge>
                </div>

                {/* Quick Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <School className="h-4 w-4 mr-2" />
                    <span>{(classes as any[]).find((c: any) => c.id === student.classId)?.name || 'Unknown Class'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{(soCenters as any[]).find((c: any) => c.id === student.soCenterId)?.name || 'Unknown Center'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{student.fatherMobile || student.motherMobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Enrolled: {formatDate(student.enrollmentDate)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={() => handleViewStudent(student)}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Complete Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

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