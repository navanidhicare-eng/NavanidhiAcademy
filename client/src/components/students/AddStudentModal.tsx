import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, User, GraduationCap, MapPin, Users, CreditCard } from 'lucide-react';

// Sibling schema
const siblingSchema = z.object({
  name: z.string().min(1, 'Sibling name is required'),
  className: z.string().min(1, 'Class is required'),
  schoolName: z.string().min(1, 'School name is required'),
  schoolType: z.enum(['government', 'private']),
});

// Comprehensive student registration schema
const addStudentSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Student name is required'),
  aadharNumber: z.string().min(12, 'Valid Aadhar number required').max(12, 'Aadhar number must be 12 digits'),
  
  // Family Information
  fatherName: z.string().min(1, 'Father name is required'),
  motherName: z.string().min(1, 'Mother name is required'),
  fatherMobile: z.string().min(10, 'Valid father mobile number required'),
  motherMobile: z.string().optional(),
  fatherQualification: z.string().optional(),
  motherQualification: z.string().optional(),
  
  // Personal Details
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  
  // School Information
  presentSchoolName: z.string().min(1, 'Present school name is required'),
  schoolType: z.enum(['government', 'private']),
  
  // Address Information
  villageId: z.string().min(1, 'Village selection is required'),
  address: z.string().min(1, 'Complete address is required'),
  landmark: z.string().optional(),
  
  // Academic Information
  classId: z.string().min(1, 'Class is required'),
  courseType: z.enum(['fixed_fee', 'monthly_tuition']),
  
  // System fields
  soCenterId: z.string().min(1, 'SO Center is required'),
  parentPhone: z.string().min(10, 'Parent phone is required'), // For compatibility
  parentName: z.string().optional(), // For compatibility
  
  // Siblings
  siblings: z.array(siblingSchema).optional(),
  
  // Admission Fee
  admissionFeePaid: z.boolean().default(false),
  receiptNumber: z.string().optional(),
}).refine((data) => {
  // If admission fee is paid, receipt number is required
  if (data.admissionFeePaid && !data.receiptNumber) {
    return false;
  }
  return true;
}, {
  message: "Receipt number is required when admission fee is paid",
  path: ["receiptNumber"],
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [classFeesData, setClassFeesData] = useState<any>(null);
  const [aadharValidation, setAadharValidation] = useState<{ isChecking: boolean; isValid: boolean | null }>({ isChecking: false, isValid: null });

  // Fetch available classes from API
  const { data: classesData = [] } = useQuery({
    queryKey: ['/api/classes'],
    enabled: isOpen,
  });
  
  // Fetch address hierarchy data
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

  // Fetch class fees when class and course type are selected
  const { data: classFees } = useQuery({
    queryKey: ['/api/class-fees', selectedClass, selectedCourseType],
    queryFn: async () => {
      if (!selectedClass || !selectedCourseType) return null;
      const response = await apiRequest('GET', `/api/class-fees?classId=${selectedClass}&courseType=${selectedCourseType}`);
      return await response.json();
    },
    enabled: !!selectedClass && !!selectedCourseType && isOpen,
  });

  // Update class fees data when it changes
  useEffect(() => {
    setClassFeesData(classFees);
  }, [classFees]);

  const form = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      name: '',
      aadharNumber: '',
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
      courseType: 'monthly_tuition',
      soCenterId: user?.role === 'so_center' ? user.id : '',
      parentPhone: '',
      parentName: '',
      siblings: [],
      admissionFeePaid: false,
      receiptNumber: '',
    },
  });
  
  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({
    control: form.control,
    name: 'siblings'
  });

  // Aadhar validation mutation
  const validateAadharMutation = useMutation({
    mutationFn: (aadharNumber: string) => 
      apiRequest('POST', '/api/students/validate-aadhar', { aadharNumber }),
    onSuccess: (response: any) => {
      setAadharValidation({ isChecking: false, isValid: response.isUnique });
      if (!response.isUnique) {
        toast({
          title: 'Aadhar Already Registered',
          description: 'This Aadhar number is already registered. Contact admin if this is an error.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      setAadharValidation({ isChecking: false, isValid: null });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: AddStudentFormData) => {
      const { siblings, admissionFeePaid, receiptNumber, ...studentData } = data;
      return apiRequest('POST', '/api/students/comprehensive', {
        studentData,
        siblings,
        admissionFeePaid,
        receiptNumber
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: 'Student Registered Successfully! 🎉',
        description: response.message || 'Student has been successfully registered with unique ID.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      form.reset();
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedMandal('');
      setSelectedClass('');
      setSelectedCourseType('');
      setClassFeesData(null);
      setAadharValidation({ isChecking: false, isValid: null });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register student. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddStudentFormData) => {
    // Final Aadhar validation before submission
    if (aadharValidation.isValid === false) {
      toast({
        title: 'Invalid Aadhar Number',
        description: 'Please use a unique Aadhar number.',
        variant: 'destructive',
      });
      return;
    }
    
    // Set parent phone for compatibility (using father's mobile)
    data.parentPhone = data.fatherMobile;
    data.parentName = data.fatherName;
    
    createStudentMutation.mutate(data);
  };
  
  // Handle Aadhar number validation
  const handleAadharValidation = async (aadharNumber: string) => {
    if (aadharNumber.length === 12) {
      setAadharValidation({ isChecking: true, isValid: null });
      validateAadharMutation.mutate(aadharNumber);
    } else {
      setAadharValidation({ isChecking: false, isValid: null });
    }
  };
  
  // Handle address cascade changes
  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('');
    setSelectedMandal('');
    form.setValue('villageId', '');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedMandal('');
    form.setValue('villageId', '');
  };

  const handleMandalChange = (mandalId: string) => {
    setSelectedMandal(mandalId);
    form.setValue('villageId', '');
  };
  
  // Handle class and course type changes for fee display
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    form.setValue('classId', classId);
  };
  
  const handleCourseTypeChange = (courseType: string) => {
    setSelectedCourseType(courseType);
    form.setValue('courseType', courseType as 'fixed_fee' | 'monthly_tuition');
  };
  
  // Add new sibling
  const addSibling = () => {
    appendSibling({
      name: '',
      className: '',
      schoolName: '',
      schoolType: 'government'
    });
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Comprehensive Student Registration
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Student Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student Personal Information
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
                    name="aadharNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter 12-digit Aadhar number" 
                            maxLength={12}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleAadharValidation(e.target.value);
                            }}
                          />
                        </FormControl>
                        {aadharValidation.isChecking && (
                          <p className="text-sm text-blue-600">Validating Aadhar number...</p>
                        )}
                        {aadharValidation.isValid === false && (
                          <p className="text-sm text-red-600">❌ Aadhar number already registered</p>
                        )}
                        {aadharValidation.isValid === true && (
                          <p className="text-sm text-green-600">✅ Aadhar number is available</p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
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
                </div>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fatherQualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Qualification</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              {qualificationOptions.map((qual) => (
                                <SelectItem key={qual} value={qual}>
                                  {qual}
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
                    name="motherQualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Qualification</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              {qualificationOptions.map((qual) => (
                                <SelectItem key={qual} value={qual}>
                                  {qual}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
            
            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select onValueChange={handleStateChange} value={selectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state: any) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name} ({state.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="district">District *</Label>
                    <Select onValueChange={handleDistrictChange} value={selectedDistrict} disabled={!selectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district: any) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name} ({district.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mandal">Mandal *</Label>
                    <Select onValueChange={handleMandalChange} value={selectedMandal} disabled={!selectedDistrict}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mandal" />
                      </SelectTrigger>
                      <SelectContent>
                        {mandals.map((mandal: any) => (
                          <SelectItem key={mandal.id} value={mandal.id}>
                            {mandal.name} ({mandal.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="villageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedMandal}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select village" />
                            </SelectTrigger>
                            <SelectContent>
                              {villages.map((village: any) => (
                                <SelectItem key={village.id} value={village.id}>
                                  {village.name} ({village.code})
                                </SelectItem>
                              ))}
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complete Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="House number, street, area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="landmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Landmark</FormLabel>
                        <FormControl>
                          <Input placeholder="Near temple, hospital, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Academic Information & Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academic Information & Fees
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
                          <Select onValueChange={(value) => { field.onChange(value); handleClassChange(value); }} value={field.value}>
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
                          <Select onValueChange={(value) => { field.onChange(value); handleCourseTypeChange(value); }} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly_tuition">Monthly Tuition</SelectItem>
                              <SelectItem value="fixed_fee">Fixed Fee Course</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Fee Display */}
                {classFeesData && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">📊 Fee Structure</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Admission Fee:</span>
                        <span className="font-semibold text-green-600 ml-2">₹{classFeesData.admissionFee}</span>
                      </div>
                      {classFeesData.monthlyFee && (
                        <div>
                          <span className="text-gray-600">Monthly Fee:</span>
                          <span className="font-semibold text-blue-600 ml-2">₹{classFeesData.monthlyFee}</span>
                        </div>
                      )}
                    </div>
                    {classFeesData.description && (
                      <p className="text-xs text-gray-600 mt-2">{classFeesData.description}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Siblings Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Siblings Information
                  <Button type="button" onClick={addSibling} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sibling
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {siblingFields.length === 0 ? (
                  <p className="text-gray-500 text-sm">No siblings added. Click "Add Sibling" to add sibling information.</p>
                ) : (
                  siblingFields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-800">Sibling {index + 1}</h5>
                        <Button 
                          type="button" 
                          onClick={() => removeSibling(index)}
                          size="sm" 
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`siblings.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sibling Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter sibling name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`siblings.${index}.className`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 5th Class, 8th Class" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <FormField
                          control={form.control}
                          name={`siblings.${index}.schoolName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter school name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`siblings.${index}.schoolType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex space-x-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="government" id={`gov-${index}`} />
                                    <Label htmlFor={`gov-${index}`}>Government</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id={`pvt-${index}`} />
                                    <Label htmlFor={`pvt-${index}`}>Private</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            
            {/* Admission Fee Handling */}
            {classFeesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Admission Fee Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="admissionFeePaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium">
                            Admission Fee Paid (₹{classFeesData.admissionFee})
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Check this if the admission fee has been paid. The amount will be added to SO Center wallet.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('admissionFeePaid') && (
                    <FormField
                      control={form.control}
                      name="receiptNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter receipt/invoice number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createStudentMutation.isPending || aadharValidation.isValid === false}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createStudentMutation.isPending ? (
                  'Registering Student...'
                ) : (
                  'Register Student'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
