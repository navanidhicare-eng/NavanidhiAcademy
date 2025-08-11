import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  Download,
  Filter,
  MoreVertical,
  MapPin
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddStudentModal } from './AddStudentModal';
import { EditStudentModal } from './EditStudentModal';
// import { ViewStudentModal } from './ViewStudentModal';
import type { Student } from '@shared/schema';

export function AdminStudentsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Fetch students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Fetch classes for filter
  const { data: classesData = [] } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  // Location filter states
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedMandal, setSelectedMandal] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState('all');

  // Fetch location data for filters
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages'],
  });

  const { data: soCenters = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/so-centers'],
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => {
      return apiRequest('DELETE', `/api/students/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Student Deleted',
        description: 'Student has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete student. Please try again.',
        variant: 'destructive',
      });
    },
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

  // Filter students
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentPhone.includes(searchTerm) ||
                         student.fatherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || student.classId === classFilter;
    const matchesCenter = selectedCenter === 'all' || student.soCenterId === selectedCenter;

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

    return matchesSearch && matchesClass && matchesCenter && matchesLocation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
    }
  };

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

  const clearAllFilters = () => {
    setSearchTerm('');
    setClassFilter('all');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedMandal('all');
    setSelectedVillage('all');
    setSelectedCenter('all');
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Student ID', 'Name', 'Father Name', 'Phone', 'Class', 'School', 'Address', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        student.studentId || '',
        student.name,
        student.fatherName,
        student.parentPhone,
        student.classId,
        student.presentSchoolName,
        student.address,
        new Date(student.createdAt || '').toLocaleDateString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredStudents.length} students to CSV.`,
    });
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
            <CardTitle className="text-xl font-semibold text-gray-900">
              Student Management ({filteredStudents.length} students)
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={filteredStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Location Filters Section */}
          <div className="bg-gray-50 p-4 rounded-lg border-b pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Location Filters
              </h3>
              <Button variant="outline" onClick={clearAllFilters} size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              {/* SO Center Filter */}
              <Select 
                onValueChange={setSelectedCenter} 
                value={selectedCenter}
              >
                <SelectTrigger className="bg-white border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="🏢 Select SO Center" />
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
            </div>
          </div>

          {/* Basic Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                placeholder="Search by name, student ID, phone, or father's name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classesData.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            {paginatedStudents.length === 0 ? (
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
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Academic
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStudents.map((student: Student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {student.studentId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.fatherName}</div>
                        <div className="text-sm text-gray-500">{student.parentPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {classesData.find((c: any) => c.id === student.classId)?.name || 'Unknown Class'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.courseType} • {student.schoolType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={student.isActive ? "default" : "secondary"}
                          className={student.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(student)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(student)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStudentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <EditStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
      />
      
      {/* <ViewStudentModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        student={selectedStudent}
      /> */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
              All student data including progress and payment records will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}