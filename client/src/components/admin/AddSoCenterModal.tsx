import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const addSoCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  address: z.string().min(1, 'Complete address is required'),
  villageId: z.string().min(1, 'Village selection is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  managerId: z.string().optional().transform(val => val === 'none' ? undefined : val),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerLastName: z.string().min(1, 'Owner last name is required'),
  ownerFatherName: z.string().min(1, 'Owner father name is required'),
  ownerMotherName: z.string().min(1, 'Owner mother name is required'),
  ownerPhone: z.string().min(10, 'Owner phone number is required'),
  landmarks: z.string().optional(),
  roomSize: z.string().min(1, 'Room size is required'),
  electricalServiceProvider: z.string().min(1, 'Electrical service provider is required'),
  internetServiceProvider: z.string().min(1, 'Internet service provider is required'),
  rentAmount: z.string().min(1, 'Rent amount is required'),
  rentalAdvance: z.string().min(1, 'Rental advance is required'),
  dateOfHouseTaken: z.string().min(1, 'Date of house taken is required'),
  monthlyRentDate: z.string().min(1, 'Monthly rent date is required'),
  electricityAmount: z.string().min(1, 'Electricity amount is required'),
  monthlyElectricityDate: z.string().min(1, 'Monthly electricity date is required'),
  internetAmount: z.string().min(1, 'Internet amount is required'),
  monthlyInternetDate: z.string().min(1, 'Monthly internet date is required'),
  capacity: z.string().min(1, 'Center capacity is required'),
  facilities: z.array(z.string()).min(1, 'At least one facility must be selected'),
});

type AddSoCenterFormData = z.infer<typeof addSoCenterSchema>;

interface AddSoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSoCenterModal({ isOpen, onClose }: AddSoCenterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [generatedCenterId, setGeneratedCenterId] = useState('');
  const [nearbySchools, setNearbySchools] = useState<{schoolName: string; studentStrength: string; schoolType: string}[]>([]);
  const [nearbyTuitions, setNearbyTuitions] = useState<{tuitionName: string; studentStrength: string}[]>([]);

  // Generate next Center ID when modal opens
  const { data: nextCenterId = '' } = useQuery({
    queryKey: ['/api/admin/so-centers/next-id'],
    queryFn: async () => {
      // Mock implementation - in real app, this would fetch from database
      // For now, generate NNASOC00001 format
      const existingCenters = 0; // This would come from database count
      const nextNumber = (existingCenters + 1).toString().padStart(5, '0');
      return `NNASOC${nextNumber}`;
    },
    enabled: isOpen,
  });

  // Fetch available managers (users with so_center role or admins)
  const { data: availableManagers = [] } = useQuery({
    queryKey: ['/api/admin/users', 'managers'],
    queryFn: async () => {
      // Mock managers data
      return [
        { id: '1', name: 'Rajesh Kumar', email: 'rajesh@navanidhi.com' },
        { id: '2', name: 'Priya Sharma', email: 'priya@navanidhi.com' },
        { id: '3', name: 'Amit Patel', email: 'amit@navanidhi.com' },
      ];
    },
    enabled: isOpen,
  });

  // Fetch address hierarchy data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
    queryFn: async () => {
      return [
        { id: '1', name: 'Telangana', code: 'TS' },
        { id: '2', name: 'Andhra Pradesh', code: 'AP' },
        { id: '3', name: 'Karnataka', code: 'KA' },
      ];
    },
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      return [
        { id: '1', name: 'Hyderabad', code: 'HYD', stateId: selectedState },
        { id: '2', name: 'Warangal', code: 'WGL', stateId: selectedState },
        { id: '3', name: 'Nizamabad', code: 'NZB', stateId: selectedState },
      ];
    },
    enabled: !!selectedState,
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      return [
        { id: '1', name: 'Secunderabad', code: 'SEC', districtId: selectedDistrict },
        { id: '2', name: 'Kukatpally', code: 'KKP', districtId: selectedDistrict },
        { id: '3', name: 'Uppal', code: 'UPL', districtId: selectedDistrict },
      ];
    },
    enabled: !!selectedDistrict,
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      return [
        { id: '1', name: 'Alwal', code: 'ALW', mandalId: selectedMandal },
        { id: '2', name: 'Bollarum', code: 'BLR', mandalId: selectedMandal },
        { id: '3', name: 'Kompally', code: 'KMP', mandalId: selectedMandal },
      ];
    },
    enabled: !!selectedMandal,
  });

  const form = useForm<AddSoCenterFormData>({
    resolver: zodResolver(addSoCenterSchema),
    defaultValues: {
      name: '',
      address: '',
      villageId: '',
      phone: '',
      managerId: 'none',
      ownerName: '',
      ownerLastName: '',
      ownerFatherName: '',
      ownerMotherName: '',
      ownerPhone: '',
      landmarks: '',
      roomSize: '',
      electricalServiceProvider: '',
      internetServiceProvider: '',
      rentAmount: '',
      rentalAdvance: '',
      dateOfHouseTaken: '',
      monthlyRentDate: '',
      electricityAmount: '',
      monthlyElectricityDate: '',
      internetAmount: '',
      monthlyInternetDate: '',
      capacity: '',
      facilities: [],
    },
  });

  const availableFacilities = [
    { id: 'ac', label: 'Air Conditioning' },
    { id: 'wifi', label: 'Wi-Fi Internet' },
    { id: 'projector', label: 'Projector' },
    { id: 'whiteboard', label: 'Whiteboard' },
    { id: 'library', label: 'Library' },
    { id: 'parking', label: 'Parking' },
    { id: 'canteen', label: 'Canteen' },
    { id: 'playground', label: 'Playground' },
    { id: 'laboratory', label: 'Laboratory' },
    { id: 'sports', label: 'Sports Facilities' },
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

  const handleFacilityToggle = (facilityId: string) => {
    const updatedFacilities = selectedFacilities.includes(facilityId)
      ? selectedFacilities.filter(id => id !== facilityId)
      : [...selectedFacilities, facilityId];
    setSelectedFacilities(updatedFacilities);
    form.setValue('facilities', updatedFacilities);
  };

  const createSoCenterMutation = useMutation({
    mutationFn: async (data: AddSoCenterFormData) => {
      const processedData = {
        ...data,
        centerId: nextCenterId,
        password: '12345678', // Default password as requested
        rentAmount: parseFloat(data.rentAmount),
        rentalAdvance: parseFloat(data.rentalAdvance),
        monthlyRentDate: parseInt(data.monthlyRentDate),
        electricityAmount: parseFloat(data.electricityAmount),
        monthlyElectricityDate: parseInt(data.monthlyElectricityDate),
        internetAmount: parseFloat(data.internetAmount),
        monthlyInternetDate: parseInt(data.monthlyInternetDate),
        electricalServiceProvider: data.electricalServiceProvider,
        internetServiceProvider: data.internetServiceProvider,
        roomSize: data.roomSize,
        capacity: parseInt(data.capacity),
        facilities: selectedFacilities,
        nearbySchools: nearbySchools,
        nearbyTuitions: nearbyTuitions,
      };
      return apiRequest('POST', '/api/admin/so-centers', processedData);
    },
    onSuccess: () => {
      toast({
        title: 'SO Center Created',
        description: 'SO Center has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/so-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create SO Center. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddSoCenterFormData) => {
    createSoCenterMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New SO Center</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Center ID Display */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Center ID</h3>
                  <p className="text-2xl font-bold text-blue-700">{nextCenterId || 'Generating...'}</p>
                  <p className="text-sm text-blue-600">Default Password: 12345678</p>
                </div>
                <div className="text-sm text-blue-700">
                  <p>📧 Center can login with:</p>
                  <p>• Center ID: <strong>{nextCenterId}</strong></p>
                  <p>• Password: <strong>12345678</strong></p>
                </div>
              </div>
            </div>

            {/* Basic Center Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter center name (e.g., Navanidhi SO Center - Kukatpally)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 87654 32109" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="roomSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 20x15 feet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location Details</h3>
              
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
                      <Textarea 
                        placeholder="Enter complete address with street, landmarks, building details"
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="landmarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landmarks</FormLabel>
                    <FormControl>
                      <Input placeholder="Nearby landmarks or reference points" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Owner Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerFatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner father name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerMotherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner mother name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Owner Name & Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="25000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rentalAdvance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rental Advance (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfHouseTaken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of House Taken for Rent</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyRentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent Date (Day of Month)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="electricityAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Electricity Bill (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="3000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyElectricityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Electricity Bill Date (Day of Month)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="electricalServiceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electrical Service Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TSSPDCL, APSPDCL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="internetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Internet Bill (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyInternetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Internet Bill Date (Day of Month)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="31" placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="internetServiceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internet Service Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Airtel, Jio, BSNL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Center Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Center Management</h3>
              
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Manager (Optional)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager or assign later" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Assign Later</SelectItem>
                          {availableManagers.map((manager: any) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-600">Manager can be reassigned later if needed</p>
                  </FormItem>
                )}
              />
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Available Facilities</h3>
              <p className="text-sm text-gray-600">Select the facilities available at this center</p>
              
              <div className="grid grid-cols-2 gap-3">
                {availableFacilities.map((facility) => (
                  <div key={facility.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={facility.id}
                      checked={selectedFacilities.includes(facility.id)}
                      onCheckedChange={() => handleFacilityToggle(facility.id)}
                    />
                    <Label htmlFor={facility.id} className="font-medium text-sm cursor-pointer">
                      {facility.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {form.formState.errors.facilities && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.facilities.message}
                </p>
              )}
            </div>

            {/* Nearby Schools Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Nearby School Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNearbySchools([...nearbySchools, {schoolName: '', studentStrength: '', schoolType: ''}])}
                >
                  Add School
                </Button>
              </div>
              
              {nearbySchools.map((school, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>School Name</Label>
                    <Input 
                      placeholder="Enter school name"
                      value={school.schoolName}
                      onChange={(e) => {
                        const updated = [...nearbySchools];
                        updated[index].schoolName = e.target.value;
                        setNearbySchools(updated);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Student Strength</Label>
                    <Input 
                      type="number"
                      placeholder="e.g., 500"
                      value={school.studentStrength}
                      onChange={(e) => {
                        const updated = [...nearbySchools];
                        updated[index].studentStrength = e.target.value;
                        setNearbySchools(updated);
                      }}
                    />
                  </div>
                  <div>
                    <Label>School Type</Label>
                    <Select 
                      value={school.schoolType} 
                      onValueChange={(value) => {
                        const updated = [...nearbySchools];
                        updated[index].schoolType = value;
                        setNearbySchools(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="aided">Aided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Nearby Tuitions Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Nearby Tuition Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNearbyTuitions([...nearbyTuitions, {tuitionName: '', studentStrength: ''}])}
                >
                  Add Tuition
                </Button>
              </div>
              
              {nearbyTuitions.map((tuition, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Tuition Name</Label>
                    <Input 
                      placeholder="Enter tuition name"
                      value={tuition.tuitionName}
                      onChange={(e) => {
                        const updated = [...nearbyTuitions];
                        updated[index].tuitionName = e.target.value;
                        setNearbyTuitions(updated);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Student Strength</Label>
                    <Input 
                      type="number"
                      placeholder="e.g., 100"
                      value={tuition.studentStrength}
                      onChange={(e) => {
                        const updated = [...nearbyTuitions];
                        updated[index].studentStrength = e.target.value;
                        setNearbyTuitions(updated);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Important:</strong> 
                • The center will be created with ID <strong>{nextCenterId}</strong> and default password <strong>12345678</strong><br/>
                • The center will be required to change password on first login<br/>
                • Manager can be assigned now or later and can be reassigned if needed<br/>
                • All selected facilities will be displayed to students and parents
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSoCenterMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createSoCenterMutation.isPending ? 'Creating...' : 'Create SO Center'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}