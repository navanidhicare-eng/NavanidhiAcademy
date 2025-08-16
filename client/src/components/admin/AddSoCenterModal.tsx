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
// Removed Checkbox import - now using dynamic inputs instead of checkboxes
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const addSoCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  email: z.string().email('Valid email address is required'),
  address: z.string().min(1, 'Complete address is required'),
  villageId: z.string().min(1, 'Village selection is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  managerId: z.string().optional().transform(val => val === 'none' ? undefined : val),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerLastName: z.string().min(1, 'Owner last name is required'),
  ownerPhone: z.string().min(10, 'Owner phone number is required'),
  landmarks: z.string().optional(),
  roomSize: z.string().min(1, 'Room size is required'),
  electricBillAccountNumber: z.string().min(1, 'Electric bill account number is required'),
  internetServiceProvider: z.string().min(1, 'Internet service provider is required'),
  internetBillAccountNumber: z.string().min(1, 'Internet bill account number is required'),
  rentAmount: z.string().min(1, 'Rent amount is required'),
  rentalAdvance: z.string().min(1, 'Rental advance is required'),
  dateOfHouseTaken: z.string().min(1, 'Date of house taken is required'),
  monthlyRentDate: z.string().min(1, 'Monthly rent date is required'),

  monthlyInternetDate: z.string().min(1, 'Monthly internet date is required'),
  capacity: z.string().min(1, 'Center capacity is required'),
  facilities: z.array(z.string()).min(1, 'At least one facility must be added'),
  admissionFeeApplicable: z.string().min(1, 'Admission fee applicability must be selected'),
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
  // Remove selectedFacilities state - now using dynamic facilities array
  const [generatedCenterId, setGeneratedCenterId] = useState('');
  const [nearbySchools, setNearbySchools] = useState<{schoolName: string; studentStrength: string; schoolType: string}[]>([]);
  const [nearbyTuitions, setNearbyTuitions] = useState<{tuitionName: string; studentStrength: string}[]>([]);
  const [facilities, setFacilities] = useState([{facilityName: ''}]);
  const [equipment, setEquipment] = useState([{itemName: '', serialNumber: '', warrantyYears: '', purchaseDate: '', brandName: ''}]);

  // Generate next Center ID when modal opens - PRODUCTION READY
  const { data: nextCenterIdResponse, isLoading: centerIdLoading } = useQuery({
    queryKey: ['/api/admin/so-centers/next-id'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/so-centers/next-id');
      console.log('🔧 Center ID API Response:', response);
      return response;
    },
    enabled: isOpen,
  });

  // Debug the response structure
  console.log('🔧 nextCenterIdResponse:', nextCenterIdResponse);
  
  const nextCenterId = nextCenterIdResponse?.centerId || nextCenterIdResponse?.centerCode || nextCenterIdResponse?.id || '';



  // Fetch unassigned managers only
  const { data: availableManagers = [], isLoading: managersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/users/unassigned-managers'],
    enabled: isOpen,
  });

  // Fetch address hierarchy data from database
  const { data: states = [], isLoading: statesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
    enabled: isOpen,
  });

  const { data: districts = [], isLoading: districtsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      return await apiRequest('GET', `/api/admin/addresses/districts/${selectedState}`);
    },
    enabled: !!selectedState && isOpen,
  });

  const { data: mandals = [], isLoading: mandalsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      return await apiRequest('GET', `/api/admin/addresses/mandals/${selectedDistrict}`);
    },
    enabled: !!selectedDistrict && isOpen,
  });

  const { data: villages = [], isLoading: villagesLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      return await apiRequest('GET', `/api/admin/addresses/villages/${selectedMandal}`);
    },
    enabled: !!selectedMandal && isOpen,
  });

  const form = useForm<AddSoCenterFormData>({
    resolver: zodResolver(addSoCenterSchema),
    defaultValues: {
      name: '',
      email: '',
      address: '',
      villageId: '',
      phone: '',
      managerId: 'none',
      ownerName: '',
      ownerLastName: '',
      ownerPhone: '',
      landmarks: '',
      roomSize: '',
      electricBillAccountNumber: '',
      internetServiceProvider: '',
      internetBillAccountNumber: '',
      rentAmount: '',
      rentalAdvance: '',
      dateOfHouseTaken: '',
      monthlyRentDate: '',
      monthlyInternetDate: '',
      capacity: '',
      facilities: [],
      admissionFeeApplicable: 'applicable',
    },
  });

  // Auto-fill email when center ID is generated
  useEffect(() => {
    if (nextCenterId) {
      const autoEmail = `${nextCenterId.toLowerCase()}@navanidhi.org`;
      form.setValue('email', autoEmail);
    }
  }, [nextCenterId, form]);

  // Remove the static facilities array - now using dynamic input

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

  // Remove old facility toggle function - now using dynamic input

  const createSoCenterMutation = useMutation({
    mutationFn: async (data: AddSoCenterFormData) => {
      const processedData = {
        ...data,
        centerId: nextCenterId,
        password: '12345678', // Default password as requested
        rentAmount: parseFloat(data.rentAmount),
        rentalAdvance: parseFloat(data.rentalAdvance),
        monthlyRentDate: parseInt(data.monthlyRentDate),
        electricBillAccountNumber: data.electricBillAccountNumber,
        monthlyInternetDate: parseInt(data.monthlyInternetDate),
        internetServiceProvider: data.internetServiceProvider,
        roomSize: data.roomSize,
        capacity: parseInt(data.capacity),
        facilities: facilities.map(f => f.facilityName).filter(name => name && name.trim() !== ''),
        nearbySchools: nearbySchools,
        nearbyTuitions: nearbyTuitions,
        equipment: equipment.filter(e => e.itemName.trim() !== '' && e.serialNumber.trim() !== ''),
        admissionFeeApplicable: data.admissionFeeApplicable === 'applicable',
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

  // Check if essential data is still loading
  const isLoading = centerIdLoading || statesLoading || managersLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <DialogHeader className="border-b border-green-200 pb-4">
          <DialogTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            Add New SO Center - Complete Registration
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-4"></div>
            <span className="text-green-700">Loading form data...</span>
          </div>
        ) : (

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Center ID Display - Compact */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl border border-green-200">
              <div className="text-center">
                <h3 className="text-sm font-medium text-green-700 mb-1">Generated Center ID</h3>
                <p className="text-xl font-bold text-green-800">{nextCenterId || 'Loading...'}</p>
                <p className="text-xs text-green-600 mt-1">Login Password: 12345678</p>
              </div>
            </div>

            {/* ADMISSION FEE POLICY - Compact */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-200 p-4 rounded-xl">
              <FormField
                control={form.control}
                name="admissionFeeApplicable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-green-800 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Admission Fee Policy
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-10 border-green-300 bg-white">
                          <SelectValue placeholder="Select policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applicable">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Applicable</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="not_applicable">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Not Applicable</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Center Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-800 border-b border-green-200 pb-2">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700">Center Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter center name (e.g., Navanidhi SO Center - Kukatpally)" 
                        className="border-green-200 focus:border-green-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-green-700">Center Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+91 87654 32109" 
                          className="border-green-200 focus:border-green-400"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm text-green-700">Student Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50" 
                          className="border-green-200 focus:border-green-400"
                          {...field} 
                        />
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
                    <FormLabel className="text-sm text-green-700">Room Size</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 20x15 feet" 
                        className="border-green-200 focus:border-green-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-800 border-b border-green-200 pb-2">Location Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-sm text-green-700">State</Label>
                  <Select onValueChange={handleStateChange} value={selectedState}>
                    <SelectTrigger className="border-green-200 focus:border-green-400">
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
                      <Input placeholder="Nearby reference points" {...field} />
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


              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Owner Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner phone number" {...field} />
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
                  name="electricBillAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electric Bill Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internetBillAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internet Bill Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

            </div>

            {/* Center Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Center Management</h3>

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SO Study Organizer</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select SO Study Organizer or assign later" />
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
                    <p className="text-sm text-gray-600">SO Study Organizer can be reassigned later if needed</p>
                  </FormItem>
                )}
              />
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Available Facilities</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFacilities([...facilities, {facilityName: ''}])}
                >
                  Add Facility
                </Button>
              </div>

              {facilities.map((facility, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>Facility Name</Label>
                    <Input 
                      placeholder="Enter facility name (e.g., Wi-Fi, AC, Parking)"
                      value={facility.facilityName}
                      onChange={(e) => {
                        const updated = [...facilities];
                        updated[index].facilityName = e.target.value;
                        setFacilities(updated);
                        // Update form value for validation - ensure no empty strings
                        const facilityNames = updated.map(f => f.facilityName).filter(name => name && name.trim() !== '');
                        form.setValue('facilities', facilityNames);
                      }}
                    />
                  </div>
                  {facilities.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updated = facilities.filter((_, i) => i !== index);
                        setFacilities(updated);
                        // Update form value for validation - ensure no empty strings
                        const facilityNames = updated.map(f => f.facilityName).filter(name => name && name.trim() !== '');
                        form.setValue('facilities', facilityNames);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}

              {facilities.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Click "Add Facility" to add facilities available at this center
                </div>
              )}

              {form.formState.errors.facilities && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.facilities.message}
                </p>
              )}
            </div>

            {/* Equipment Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Equipment Inventory</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipment([...equipment, {itemName: '', serialNumber: '', warrantyYears: '', purchaseDate: '', brandName: ''}])}
                >
                  Add Equipment
                </Button>
              </div>

              {equipment.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Equipment #{index + 1}</h4>
                    {equipment.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = equipment.filter((_, i) => i !== index);
                          setEquipment(updated);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Item Name</Label>
                      <Input 
                        placeholder="e.g., Computer, Projector, AC"
                        value={item.itemName}
                        onChange={(e) => {
                          const updated = [...equipment];
                          updated[index].itemName = e.target.value;
                          setEquipment(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Serial Number</Label>
                      <Input 
                        placeholder="e.g., ABC123XYZ789"
                        value={item.serialNumber}
                        onChange={(e) => {
                          const updated = [...equipment];
                          updated[index].serialNumber = e.target.value;
                          setEquipment(updated);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Warranty Years</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="10"
                        placeholder="e.g., 2"
                        value={item.warrantyYears}
                        onChange={(e) => {
                          const updated = [...equipment];
                          updated[index].warrantyYears = e.target.value;
                          setEquipment(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Purchase Date</Label>
                      <Input 
                        type="date"
                        value={item.purchaseDate}
                        onChange={(e) => {
                          const updated = [...equipment];
                          updated[index].purchaseDate = e.target.value;
                          setEquipment(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Brand Name</Label>
                      <Input 
                        placeholder="e.g., Dell, Samsung, LG"
                        value={item.brandName}
                        onChange={(e) => {
                          const updated = [...equipment];
                          updated[index].brandName = e.target.value;
                          setEquipment(updated);
                        }}
                      />
                    </div>
                  </div>

                  {item.purchaseDate && item.warrantyYears && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Warranty End Date:</strong> {
                          (() => {
                            try {
                              const purchaseDate = new Date(item.purchaseDate);
                              const warrantyEnd = new Date(purchaseDate);
                              warrantyEnd.setFullYear(warrantyEnd.getFullYear() + parseInt(item.warrantyYears || '0'));
                              return warrantyEnd.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric'
                              });
                            } catch {
                              return 'Invalid date';
                            }
                          })()
                        }
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {equipment.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Click "Add Equipment" to register equipment for this center
                </div>
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
                • The center will be created with ID <strong>{nextCenterId || 'Generating...'}</strong> and default password <strong>12345678</strong><br/>
                • The center will be required to change password on first login<br/>
                • Manager can be assigned now or later and can be reassigned if needed<br/>
                • All selected facilities will be displayed to students and parents
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-green-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSoCenterMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
              >
                {createSoCenterMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Create SO Center</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}