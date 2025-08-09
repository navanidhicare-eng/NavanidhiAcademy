import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  CalendarDays
} from 'lucide-react';
import { CreateTeacherForm } from '@/components/admin/CreateTeacherForm';
import { TeacherDetailView } from '@/components/admin/TeacherDetailView';
import { AddTeachingRecordForm } from '@/components/admin/AddTeachingRecordForm';
import type { Teacher } from '@shared/schema';

export default function AdminTeachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<{id: string, name: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch teachers from API
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/teachers'],
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
  };

  const filteredTeachers = (teachers as Teacher[]).filter((teacher: Teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.fatherName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && teacher.isActive;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading teachers...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
                          <div className="text-sm text-gray-500">Father: {teacher.fatherName}</div>
                          <div className="text-sm text-gray-500">DOB: {new Date(teacher.dateOfBirth).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.mobile}</div>
                      <div className="text-sm text-gray-500">{teacher.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{parseFloat(teacher.salary).toLocaleString()}</div>
                      <Badge variant="outline" className="mt-1">
                        {teacher.salaryType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTeacher(teacher)}
                        >
                          <Eye className="text-blue-600" size={16} />
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
          <CreateTeacherForm 
            onSuccess={() => {
              setIsCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Teaching Record Modal */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Daily Teaching Record</DialogTitle>
          </DialogHeader>
          <AddTeachingRecordForm 
            onSuccess={() => {
              setIsRecordModalOpen(false);
              if (selectedTeacher) {
                queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers', selectedTeacher.id, 'records'] });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Teacher Detail View Modal */}
      {selectedTeacher && (
        <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTeacher.name} - Teaching Profile</DialogTitle>
            </DialogHeader>
            <TeacherDetailView teacher={selectedTeacher} />
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
    </DashboardLayout>
  );
}