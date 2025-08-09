import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { insertTeacherSchema, type InsertTeacher } from '@shared/schema';
import { z } from 'zod';

const teacherFormSchema = insertTeacherSchema.extend({
  subjectIds: z.array(z.string()).min(1, 'At least one subject must be selected'),
  classIds: z.array(z.string()).min(1, 'At least one class must be assigned'),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface CreateTeacherFormProps {
  onSuccess: () => void;
}

export function CreateTeacherForm({ onSuccess }: CreateTeacherFormProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      salaryType: 'fixed',
      subjectIds: [],
      classIds: [],
    },
  });

  // Fetch required data
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages'],
  });

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      return apiRequest('POST', '/api/admin/teachers', data);
    },
    onSuccess: () => {
      toast({
        title: 'Teacher Created',
        description: 'Teacher has been successfully created with subject and class assignments.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create teacher.',
        variant: 'destructive',
      });
    },
  });

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const newSubjects = checked
      ? [...selectedSubjects, subjectId]
      : selectedSubjects.filter(id => id !== subjectId);
    
    setSelectedSubjects(newSubjects);
    setValue('subjectIds', newSubjects);
  };

  const handleClassChange = (classId: string, checked: boolean) => {
    const newClasses = checked
      ? [...selectedClasses, classId]
      : selectedClasses.filter(id => id !== classId);
    
    setSelectedClasses(newClasses);
    setValue('classIds', newClasses);
  };

  const onSubmit = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter teacher's full name"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="fatherName">Father's Name *</Label>
              <Input
                id="fatherName"
                {...register('fatherName')}
                placeholder="Enter father's name"
              />
              {errors.fatherName && <p className="text-sm text-red-600">{errors.fatherName.message}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                {...register('mobile')}
                placeholder="Enter 10-digit mobile number"
              />
              {errors.mobile && <p className="text-sm text-red-600">{errors.mobile.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Address & Salary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address & Salary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Residential Address *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="Enter complete residential address"
                rows={3}
              />
              {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
            </div>

            <div>
              <Label htmlFor="villageId">Village</Label>
              <Select onValueChange={(value) => setValue('villageId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((village: any) => (
                    <SelectItem key={village.id} value={village.id}>
                      {village.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary">Salary Amount *</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  {...register('salary')}
                  placeholder="Enter amount"
                />
                {errors.salary && <p className="text-sm text-red-600">{errors.salary.message}</p>}
              </div>

              <div>
                <Label htmlFor="salaryType">Salary Type *</Label>
                <Select onValueChange={(value) => setValue('salaryType', value as 'fixed' | 'hourly')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Monthly</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
                {errors.salaryType && <p className="text-sm text-red-600">{errors.salaryType.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Assignments *</CardTitle>
            <p className="text-sm text-gray-600">Select subjects this teacher will teach</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {subjects.map((subject: any) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={selectedSubjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectChange(subject.id, checked as boolean)}
                  />
                  <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                    {subject.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.subjectIds && <p className="text-sm text-red-600 mt-2">{errors.subjectIds.message}</p>}
          </CardContent>
        </Card>

        {/* Class Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class Assignments *</CardTitle>
            <p className="text-sm text-gray-600">Assign classes this teacher will handle</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {classes.map((classItem: any) => (
                <div key={classItem.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`class-${classItem.id}`}
                    checked={selectedClasses.includes(classItem.id)}
                    onCheckedChange={(checked) => handleClassChange(classItem.id, checked as boolean)}
                  />
                  <Label htmlFor={`class-${classItem.id}`} className="text-sm">
                    {classItem.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.classIds && <p className="text-sm text-red-600 mt-2">{errors.classIds.message}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button 
          type="submit" 
          disabled={createTeacherMutation.isPending}
          className="min-w-32"
        >
          {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
        </Button>
      </div>
    </form>
  );
}