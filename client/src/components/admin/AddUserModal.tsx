import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

const addUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fatherName: z.string().min(1, 'Father name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  villageId: z.string().min(1, 'Village selection is required'),
  address: z.string().min(1, 'Address is required'),
  salary: z.string().optional(),
  salaryType: z.string().optional(),
  commissionProducts: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'agent') {
    return data.salary && data.salaryType;
  }
  return true;
}, {
  message: "Salary and salary type are required for agents",
  path: ["salary"],
});

type AddUserFormData = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      fatherName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      phone: '',
      dateOfBirth: '',
      maritalStatus: '',
      villageId: '',
      address: '',
      salary: '',
      salaryType: 'fixed',
      commissionProducts: [],
    },
  });

  const selectedRole = form.watch('role');
  const selectedSalaryType = form.watch('salaryType');

  // Fetch address hierarchy data from database
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/districts/${selectedState}`);
      return await response.json();
    },
    enabled: !!selectedState,
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/mandals/${selectedDistrict}`);
      return await response.json();
    },
    enabled: !!selectedDistrict,
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/villages/${selectedMandal}`);
      return await response.json();
    },
    enabled: !!selectedMandal,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/products'],
    enabled: selectedRole === 'agent' && selectedSalaryType === 'commission',
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const { confirmPassword, commissionProducts, ...userData } = data;
      // Convert salary to decimal if provided
      const processedData = {
        ...userData,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        commissionProducts: selectedRole === 'agent' && selectedSalaryType === 'commission' ? selectedProducts : undefined,
      };
      return apiRequest('POST', '/api/admin/users', processedData);
    },
    onSuccess: (response) => {
      const userData = form.getValues();
      toast({
        title: 'User Created Successfully! 🎉',
        description: `Login Credentials Created:\n📧 Email: ${userData.email}\n🔒 Password: ${userData.password}\n👤 Role: ${userData.role}\n\nPlease share these credentials with the user securely.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddUserFormData) => {
    createUserMutation.mutate(data);
  };

  const userRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'so_center', label: 'SO Center Manager' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'academic_admin', label: 'Academic Admin' },
    { value: 'agent', label: 'Agent' },
    { value: 'office_staff', label: 'Office Staff' },
    { value: 'collection_agent', label: 'Collection Agent' },
    { value: 'marketing_staff', label: 'Marketing Staff' },
    { value: 'marketing_head', label: 'Marketing Head' },
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
  ];

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

  const handleProductToggle = (productId: string) => {
    const updatedProducts = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    setSelectedProducts(updatedProducts);
    form.setValue('commissionProducts', updatedProducts);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            {maritalStatusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
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
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
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
                  <Label htmlFor="district">District</Label>
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
                  <Label htmlFor="mandal">Mandal</Label>
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
                      <FormLabel>Village</FormLabel>
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter complete address (street, landmark, etc.)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Authentication Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Role and Salary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Role & Compensation</h3>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole && selectedRole !== 'admin' && (
                <div className="space-y-4">
                  {selectedRole === 'agent' && (
                    <FormField
                      control={form.control}
                      name="salaryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex space-x-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" id="fixed" />
                                <Label htmlFor="fixed">Fixed Salary</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="commission" id="commission" />
                                <Label htmlFor="commission">Commission Based</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedRole === 'agent' && selectedSalaryType === 'fixed' 
                            ? 'Fixed Salary (₹)' 
                            : selectedRole === 'agent' && selectedSalaryType === 'commission'
                            ? 'Base Salary (₹)'
                            : 'Salary (₹)'
                          }
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={selectedRole === 'agent' && selectedSalaryType === 'commission' ? 'Enter base salary' : 'Enter salary amount'} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRole === 'agent' && selectedSalaryType === 'commission' && (
                    <div>
                      <Label className="text-base font-medium">Commission Products</Label>
                      <p className="text-sm text-gray-600 mb-3">Select products for which this agent will earn commission</p>
                      <div className="space-y-3">
                        {products.map((product: any) => (
                          <div key={product.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={product.id}
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={product.id} className="font-medium text-sm cursor-pointer">
                                {product.name}
                              </Label>
                              <p className="text-xs text-gray-600">{product.commissionPercentage}% commission</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-6">
              <p className="text-sm text-blue-800">
                <strong>📌 Important:</strong> After creating the user, you will receive their login credentials. Please share the following information with them:
              </p>
              <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                <li><strong>Login with:</strong> Email address (not name)</li>
                <li><strong>Website:</strong> This admin portal URL</li>
                <li><strong>Role:</strong> They must select their correct role during login</li>
                <li><strong>Security:</strong> Ask them to change password after first login</li>
              </ul>
              {selectedRole === 'agent' && selectedSalaryType === 'commission' && (
                <p className="text-sm text-blue-800 mt-2">
                  <strong>💰 Commission:</strong> Will be calculated based on selected products and their respective percentages.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}