import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, FileText, Edit2, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ClassSubjectManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States for adding class
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');

  // States for adding subject
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassesForSubject, setSelectedClassesForSubject] = useState<string[]>([]);
  const [selectedClassForView, setSelectedClassForView] = useState('');

  // States for editing subject
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSelectedClass, setEditSelectedClass] = useState('');

  // Fetch classes and subjects
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: allSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  // Filter subjects based on selected class for viewing
  const filteredSubjects = selectedClassForView && selectedClassForView !== 'all'
    ? allSubjects.filter((subject: any) => subject.classId === selectedClassForView)
    : allSubjects;

  // Add class mutation
  const addClassMutation = useMutation({
    mutationFn: async (classData: { name: string; description: string }) => {
      return apiRequest('POST', '/api/admin/classes', classData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Class added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setNewClassName('');
      setNewClassDescription('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add class',
        variant: 'destructive',
      });
    },
  });

  // Add subject mutation
  const addSubjectMutation = useMutation({
    mutationFn: async (subjectData: { name: string; classIds: string[] }) => {
      return apiRequest('POST', '/api/admin/subjects', subjectData);
    },
    onSuccess: () => {
      const classNames = selectedClassesForSubject.map(classId => getClassName(classId)).join(', ');
      toast({
        title: 'Success',
        description: `Subject "${newSubjectName}" successfully connected to: ${classNames}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
      setNewSubjectName('');
      setSelectedClassesForSubject([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subject',
        variant: 'destructive',
      });
    },
  });

  // Edit subject mutation
  const editSubjectMutation = useMutation({
    mutationFn: async (subjectData: { id: string; name: string; classId: string }) => {
      return apiRequest('PUT', `/api/admin/subjects/${subjectData.id}`, {
        name: subjectData.name,
        classId: subjectData.classId
      });
    },
    onSuccess: () => {
      const className = getClassName(editSelectedClass);
      toast({
        title: 'Success',
        description: `Subject "${editSubjectName}" successfully reassigned to ${className}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
      setIsEditModalOpen(false);
      setEditingSubject(null);
      setEditSubjectName('');
      setEditSelectedClass('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subject',
        variant: 'destructive',
      });
    },
  });

  const handleAddClass = () => {
    if (!newClassName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a class name',
        variant: 'destructive',
      });
      return;
    }

    addClassMutation.mutate({
      name: newClassName.trim(),
      description: newClassDescription.trim(),
    });
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim() || selectedClassesForSubject.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter subject name and select at least one class',
        variant: 'destructive',
      });
      return;
    }

    addSubjectMutation.mutate({
      name: newSubjectName.trim(),
      classIds: selectedClassesForSubject,
    });
  };

  const handleEditSubject = (subject: any) => {
    setEditingSubject(subject);
    setEditSubjectName(subject.name);
    setEditSelectedClass(subject.classId);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubject = () => {
    if (!editSubjectName.trim() || !editSelectedClass) {
      toast({
        title: 'Error',
        description: 'Please enter subject name and select a class',
        variant: 'destructive',
      });
      return;
    }

    editSubjectMutation.mutate({
      id: editingSubject.id,
      name: editSubjectName.trim(),
      classId: editSelectedClass,
    });
  };

  const getClassName = (classId: string) => {
    return classes.find((c: any) => c.id === classId)?.name || 'Unknown';
  };

  return (
    <DashboardLayout
      title="Class & Subject Management"
      subtitle="Add new classes and subjects to the academic structure"
    >
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classes">Add Classes</TabsTrigger>
          <TabsTrigger value="subjects">Add Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Add Class Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen size={20} />
                  <span>Add New Class</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="className">Class Name *</Label>
                  <Input
                    id="className"
                    placeholder="e.g., Class 10, Grade 5"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="classDescription">Description</Label>
                  <Input
                    id="classDescription"
                    placeholder="Optional description"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddClass}
                  disabled={addClassMutation.isPending}
                  className="w-full"
                >
                  <Plus className="mr-2" size={16} />
                  {addClassMutation.isPending ? 'Adding...' : 'Add Class'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Classes List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Classes</CardTitle>
              </CardHeader>
              <CardContent>
                {classesLoading ? (
                  <div className="text-center py-4">Loading classes...</div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No classes found. Add your first class!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="p-3 border rounded-lg">
                        <h3 className="font-semibold">{cls.name}</h3>
                        {cls.description && (
                          <p className="text-sm text-gray-600">{cls.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Add Subject Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText size={20} />
                  <span>Add New Subject</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subjectName">Subject Name *</Label>
                  <Input
                    id="subjectName"
                    placeholder="e.g., Mathematics, Science"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Select Classes * (Choose multiple classes for this subject)</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {classes.map((cls: any) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`class-${cls.id}`}
                          checked={selectedClassesForSubject.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassesForSubject([...selectedClassesForSubject, cls.id]);
                            } else {
                              setSelectedClassesForSubject(selectedClassesForSubject.filter(id => id !== cls.id));
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`class-${cls.id}`} className="text-sm">
                          {cls.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Selected: {selectedClassesForSubject.length} class{selectedClassesForSubject.length !== 1 ? 'es' : ''}
                  </div>
                </div>
                <Button
                  onClick={handleAddSubject}
                  disabled={addSubjectMutation.isPending || classes.length === 0}
                  className="w-full"
                >
                  <Plus className="mr-2" size={16} />
                  {addSubjectMutation.isPending ? 'Adding...' : 'Add Subject'}
                </Button>
                {classes.length === 0 && (
                  <p className="text-sm text-amber-600 text-center">
                    Please add classes first before adding subjects
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Existing Subjects List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Existing Subjects</span>
                  <Select value={selectedClassForView} onValueChange={setSelectedClassForView}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select class to filter" />
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <div className="text-center py-4">Loading subjects...</div>
                ) : filteredSubjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>
                      {selectedClassForView && selectedClassForView !== 'all'
                        ? `No subjects found for ${getClassName(selectedClassForView)}`
                        : "No subjects found. Add your first subject!"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredSubjects.map((subject: any) => (
                      <div key={subject.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => handleEditSubject(subject)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800">{subject.name}</h3>
                            <div className="flex items-start mt-2">
                              <BookOpen className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(subject.connectedClasses) ? 
                                  subject.connectedClasses.map((className: string, index: number) => (
                                    <span key={index} className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                      {className}
                                    </span>
                                  )) :
                                  <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                    Connected to: {getClassName(subject.classId)}
                                  </span>
                                }
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-green-600">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-gray-500 hover:text-blue-600">
                              <Edit2 className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded flex items-center">
                          <ArrowRightLeft className="w-3 h-3 mr-1" />
                          Click to modify class connections
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Subject Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject: {editingSubject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="editSubjectName">Subject Name *</Label>
              <Input
                id="editSubjectName"
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editClassSelect">Select Class *</Label>
              <Select value={editSelectedClass} onValueChange={setEditSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSubject} disabled={editSubjectMutation.isPending}>
              {editSubjectMutation.isPending ? 'Updating...' : 'Update Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}