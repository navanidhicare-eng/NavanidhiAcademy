
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
import { Plus, BookOpen, FileText } from 'lucide-react';

export default function ClassSubjectManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for adding class
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  
  // States for adding subject
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassForSubject, setSelectedClassForSubject] = useState('');
  const [selectedClassForView, setSelectedClassForView] = useState('');

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
    mutationFn: async (subjectData: { name: string; classId: string }) => {
      return apiRequest('POST', '/api/admin/subjects', subjectData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
      setNewSubjectName('');
      setSelectedClassForSubject('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subject',
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
    if (!newSubjectName.trim() || !selectedClassForSubject) {
      toast({
        title: 'Error',
        description: 'Please enter subject name and select a class',
        variant: 'destructive',
      });
      return;
    }

    addSubjectMutation.mutate({
      name: newSubjectName.trim(),
      classId: selectedClassForSubject,
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
                  <Label htmlFor="classSelect">Select Class *</Label>
                  <Select value={selectedClassForSubject} onValueChange={setSelectedClassForSubject}>
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredSubjects.map((subject: any) => (
                      <div key={subject.id} className="p-3 border rounded-lg">
                        <h3 className="font-semibold">{subject.name}</h3>
                        <p className="text-sm text-blue-600">
                          Class: {getClassName(subject.classId)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
