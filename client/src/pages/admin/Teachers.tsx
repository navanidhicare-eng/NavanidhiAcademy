import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AddTeachingRecordForm } from '@/components/admin/AddTeachingRecordForm';
import { TeacherRecordsModal } from '@/components/admin/TeacherRecordsModal';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
import { 
  Search, 
  UserPlus, 
  Eye, 
  Trash2, 
  Users,
  BookOpen,
  Clock,
  CalendarDays,
  UserCheck,
  Settings
} from 'lucide-react';
// Import components inline to avoid missing module errors
import type { Teacher } from '@shared/schema';

export default function AdminTeachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewRecordsModalOpen, setIsViewRecordsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<{id: string, name: string} | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers from API
  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch all subjects for assignment
  const { data: allSubjects = [] } = useQuery({
    queryKey: ['/api/admin/academic/subjects'],
  });

  // Fetch all classes for assignment
  const { data: allClasses = [] } = useQuery({
    queryKey: ['/api/admin/academic/classes'],
  });

  // Fetch teacher's current assignments
  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ['/api/admin/teachers', selectedTeacher?.id, 'subjects'],
    enabled: !!selectedTeacher?.id && isAssignModalOpen,
  });

  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['/api/admin/teachers', selectedTeacher?.id, 'classes'],
    enabled: !!selectedTeacher?.id && isAssignModalOpen,
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/teachers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Teacher Deleted',
        description: 'Teacher has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      setTeacherToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete teacher.',
        variant: 'destructive',
      });
      setTeacherToDelete(null);
    },
  });

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete({ id: teacher.id, name: teacher.name });
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      deleteTeacherMutation.mutate(teacherToDelete.id);
    }
  };

  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewRecordsModalOpen(true);
  };

  const handleAssignTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsAssignModalOpen(true);
  };

  // Update assignments mutation
  const updateAssignmentsMutation = useMutation({
    mutationFn: async ({ teacherId, subjectIds, classIds }: { teacherId: string, subjectIds: string[], classIds: string[] }) => {
      // Update subjects
      await apiRequest('PUT', `/api/admin/teachers/${teacherId}/subjects`, { subjectIds });
      // Update classes  
      await apiRequest('PUT', `/api/admin/teachers/${teacherId}/classes`, { classIds });
    },
    onSuccess: () => {
      toast({
        title: 'Assignments Updated',
        description: 'Teacher assignments have been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      setIsAssignModalOpen(false);
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assignments.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveAssignments = () => {
    if (!selectedTeacher) return;
    updateAssignmentsMutation.mutate({
      teacherId: selectedTeacher.id,
      subjectIds: selectedSubjects,
      classIds: selectedClasses
    });
  };

  const openAssignModal = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsAssignModalOpen(true);
  };

  // Load current assignments when modal opens
  useEffect(() => {
    if (isAssignModalOpen && teacherSubjects && teacherClasses) {
      const currentSubjects = Array.isArray(teacherSubjects) ? teacherSubjects.map((s: any) => s.id) : [];
      const currentClasses = Array.isArray(teacherClasses) ? teacherClasses.map((c: any) => c.id) : [];
      setSelectedSubjects(currentSubjects);
      setSelectedClasses(currentClasses);
    }
  }, [isAssignModalOpen, teacherSubjects, teacherClasses]);

  const filteredTeachers = (teachers as any[]).filter((teacher: any) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (teacher.phone && teacher.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (teacher.fatherName && teacher.fatherName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && teacher.isActive;
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Teacher Management" subtitle="Loading teachers...">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading teachers...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Management" subtitle="Manage teachers, assignments, and daily records">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Teacher Management
              </CardTitle>
              <p className="text-gray-600 mt-1">Manage teachers, assign subjects and classes, track daily teaching records</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsRecordModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Add Teaching Record
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Teacher
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teachers by name, mobile, or father name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Teacher Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher: Teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">Father: {teacher.fatherName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">DOB: {teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.mobile || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{teacher.address || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{teacher.salary ? parseFloat(teacher.salary).toLocaleString() : '0'}</div>
                      <Badge variant="outline" className="mt-1">
                        {teacher.salaryType ? teacher.salaryType.toUpperCase() : 'FIXED'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTeacher(teacher)}
                          title="View Teaching Records"
                          className="hover:bg-blue-50"
                        >
                          <Eye className="text-blue-600" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openAssignModal(teacher)}
                          title="Assign Classes & Subjects"
                        >
                          <Settings className="text-green-600" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick(teacher)}
                          disabled={deleteTeacherMutation.isPending}
                        >
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first teacher.'}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{teachers.filter((t: Teacher) => t.isActive).length}</div>
                <p className="text-gray-600">Active Teachers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{teachers.filter((t: Teacher) => t.salaryType === 'fixed').length}</div>
                <p className="text-gray-600">Fixed Salary</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{teachers.filter((t: Teacher) => t.salaryType === 'hourly').length}</div>
                <p className="text-gray-600">Hourly Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Teacher Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Teacher</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Teacher creation form will be available soon.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Teaching Record Modal */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Daily Teaching Record</DialogTitle>
            <DialogDescription>
              Create a new teaching record with details about the session, including class, subject, and topics covered.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <AddTeachingRecordForm
              onSuccess={() => setIsRecordModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Teacher Detail View Modal */}
      {selectedTeacher && (
        <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTeacher.name} - Teaching Profile</DialogTitle>
              <DialogDescription>
                View complete teacher information including contact details, salary, and personal data.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4">
              <h3 className="font-medium">Teacher Details</h3>
              <div className="mt-2 space-y-2">
                <p><strong>Name:</strong> {selectedTeacher.name}</p>
                <p><strong>Father Name:</strong> {selectedTeacher.fatherName}</p>
                <p><strong>Mobile:</strong> {selectedTeacher.mobile}</p>
                <p><strong>Salary:</strong> ₹{selectedTeacher.salary} ({selectedTeacher.salaryType})</p>
                <p><strong>Date of Birth:</strong> {selectedTeacher.dateOfBirth}</p>
                <p><strong>Status:</strong> {selectedTeacher.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!teacherToDelete} onOpenChange={() => setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher 
              <strong> {teacherToDelete?.name}</strong> and remove all their teaching records from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTeacherMutation.isPending}
            >
              {deleteTeacherMutation.isPending ? 'Deleting...' : 'Delete Teacher'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Classes & Subjects - {selectedTeacher?.name}</DialogTitle>
            <DialogDescription>
              Select subjects and classes to assign to this teacher. You can select multiple items from each section.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 p-4">
            {/* Subjects Section */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Assign Subjects
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {Array.isArray(allSubjects) && allSubjects.length > 0 ? allSubjects.map((subject: any) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSubjects([...selectedSubjects, subject.id]);
                        } else {
                          setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                        }
                      }}
                    />
                    <label htmlFor={`subject-${subject.id}`} className="text-sm">
                      {subject.name}
                    </label>
                  </div>
                )) : <div className="text-sm text-gray-500">No subjects available</div>}
              </div>
            </div>

            {/* Classes Section */}
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign Classes
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {Array.isArray(allClasses) && allClasses.length > 0 ? allClasses.map((classItem: any) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={selectedClasses.includes(classItem.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClasses([...selectedClasses, classItem.id]);
                        } else {
                          setSelectedClasses(selectedClasses.filter(id => id !== classItem.id));
                        }
                      }}
                    />
                    <label htmlFor={`class-${classItem.id}`} className="text-sm">
                      {classItem.name}
                    </label>
                  </div>
                )) : <div className="text-sm text-gray-500">No classes available</div>}
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 py-3">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAssignments}
              disabled={updateAssignmentsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateAssignmentsMutation.isPending ? 'Saving...' : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Records Modal */}
      {selectedTeacher && (
        <TeacherRecordsModal
          isOpen={isViewRecordsModalOpen}
          onClose={() => {
            setIsViewRecordsModalOpen(false);
            setSelectedTeacher(null);
          }}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
        />
      )}
    </DashboardLayout>
  );
}