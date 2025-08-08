import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, GraduationCap, MapPin, Users } from 'lucide-react';
import type { Student } from '@shared/schema';

// Edit student schema - simplified version of the main schema
const editStudentSchema = z.object({
  name: z.string().min(1, 'Student name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  motherName: z.string().min(1, 'Mother name is required'),
  fatherMobile: z.string().min(10, 'Valid father mobile number required'),
  motherMobile: z.string().optional(),
  fatherQualification: z.string().optional(),
  motherQualification: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  presentSchoolName: z.string().min(1, 'Present school name is required'),
  schoolType: z.enum(['government', 'private']),
  villageId: z.string().min(1, 'Village selection is required'),
  address: z.string().min(1, 'Complete address is required'),
  landmark: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  courseType: z.enum(['monthly', 'yearly']),
  parentPhone: z.string().min(10, 'Parent phone is required'),
  parentName: z.string().optional(),
});

type EditStudentFormData = z.infer<typeof editStudentSchema>;

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function EditStudentModal({ isOpen, onClose, student }: EditStudentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');

  // Fetch data for dropdowns
  const { data: classesData = [] } = useQuery({
    queryKey: ['/api/classes'],
    enabled: isOpen,
  });
  
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
    enabled: isOpen,
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/districts/${selectedState}`);
      return await response.json();
    },
    enabled: !!selectedState && isOpen,
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/mandals/${selectedDistrict}`);
      return await response.json();
    },
    enabled: !!selectedDistrict && isOpen,
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/villages/${selectedMandal}`);
      return await response.json();
    },
    enabled: !!selectedMandal && isOpen,
  });

  const form = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      name: '',
      fatherName: '',
      motherName: '',
      fatherMobile: '',
      motherMobile: '',
      fatherQualification: '',
      motherQualification: '',
      gender: 'male',
      dateOfBirth: '',
      presentSchoolName: '',
      schoolType: 'government',
      villageId: '',
      address: '',
      landmark: '',
      classId: '',
      courseType: 'monthly',
      parentPhone: '',
      parentName: '',
    },
  });

  // Populate form when student data changes
  useEffect(() => {
    if (student && isOpen) {
      form.reset({
        name: student.name || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        fatherMobile: student.fatherMobile || '',
        motherMobile: student.motherMobile || '',
        fatherQualification: student.fatherQualification || '',
        motherQualification: student.motherQualification || '',
        gender: student.gender || 'male',
        dateOfBirth: student.dateOfBirth || '',
        presentSchoolName: student.presentSchoolName || '',
        schoolType: student.schoolType || 'government',
        villageId: student.villageId || '',
        address: student.address || '',
        landmark: student.landmark || '',
        classId: student.classId || '',
        courseType: student.courseType || 'monthly',
        parentPhone: student.parentPhone || '',
        parentName: student.parentName || '',
      });
    }
  }, [student, isOpen, form]);

  const updateStudentMutation = useMutation({
    mutationFn: (data: EditStudentFormData) => {
      return apiRequest('PUT', `/api/students/${student?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: 'Student Updated Successfully',
        description: 'Student information has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditStudentFormData) => {
    updateStudentMutation.mutate(data);
  };

  const classes = Array.isArray(classesData) && classesData.length > 0 ? classesData.map((cls: any) => ({
    value: cls.id,
    label: cls.name
  })) : [];
  
  const qualificationOptions = [
    'Illiterate',
    'Primary School',
    'Middle School', 
    '10th Class',
    '12th Class',
    'Diploma',
    'Graduation',
    'Post Graduation',
    'PhD',
    'Other'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Student Information
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female">Female</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other">Other</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Family Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Family Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter father's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mother's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fatherMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Mobile Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="motherMobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210 (Optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.value} value={cls.value}>
                                  {cls.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Type *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly Fee</SelectItem>
                              <SelectItem value="yearly">Yearly Fee</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="presentSchoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Present School Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter current school name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="schoolType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="government" id="government" />
                              <Label htmlFor="government">Government</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="private" id="private" />
                              <Label htmlFor="private">Private</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateStudentMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {updateStudentMutation.isPending ? (
                  'Updating...'
                ) : (
                  'Update Student'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}