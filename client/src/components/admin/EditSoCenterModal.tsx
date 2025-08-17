import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

const editSoCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().min(1, 'Complete address is required'),
  villageId: z.string().min(1, 'Village selection is required'),
  managerId: z.string().optional().transform(val => val === 'none' || val === '' ? null : val),
  ownerName: z.string().optional(),
  ownerLastName: z.string().optional(),
  ownerPhone: z.string().optional(),
  landmarks: z.string().optional(),
  roomSize: z.string().optional(),
  rentAmount: z.string().optional(),
  rentalAdvance: z.string().optional(),
  dateOfHouseTaken: z.string().optional(),
  monthlyRentDate: z.string().optional(),
  monthlyInternetDate: z.string().optional(),
  electricBillAccountNumber: z.string().optional(),
  internetBillAccountNumber: z.string().optional(),
  internetServiceProvider: z.string().optional(),
  capacity: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean(),
  admissionFeeApplicable: z.string().min(1, 'Admission fee applicability must be selected'),
});

type EditSoCenterFormData = z.infer<typeof editSoCenterSchema>;

interface EditSoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: any;
}

export function EditSoCenterModal({ isOpen, onClose, center }: EditSoCenterModalProps) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [facilities, setFacilities] = useState([{facilityName: ''}]);
  const [nearbySchools, setNearbySchools] = useState<{schoolName: string; studentStrength: string; schoolType: string}[]>([]);
  const [nearbyTuitions, setNearbyTuitions] = useState<{tuitionName: string; studentStrength: string}[]>([]);
  const [equipment, setEquipment] = useState([{itemName: '', serialNumber: '', warrantyYears: '', purchaseDate: '', brandName: ''}]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditSoCenterFormData>({
    resolver: zodResolver(editSoCenterSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      villageId: '',
      managerId: '',
      ownerName: '',
      ownerLastName: '',
      ownerPhone: '',
      landmarks: '',
      roomSize: '',
      rentAmount: '',
      rentalAdvance: '',
      dateOfHouseTaken: '',
      monthlyRentDate: '',
      monthlyInternetDate: '',
      electricBillAccountNumber: '',
      internetBillAccountNumber: '',
      internetServiceProvider: '',
      capacity: '',
      facilities: [],
      isActive: true,
      admissionFeeApplicable: 'applicable',
    },
  });

  // Fetch address hierarchy data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
    enabled: isOpen,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/districts/${selectedState}`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedState && isOpen,
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/mandals/${selectedDistrict}`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedDistrict && isOpen,
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      const response = await apiRequest('GET', `/api/admin/addresses/villages/${selectedMandal}`);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedMandal && isOpen,
  });

  // Get available managers for editing (includes current manager)
  const { data: managers = [] } = useQuery<any[]>({
    queryKey: [`/api/admin/users/available-managers/${center?.id}`],
    enabled: isOpen && !!center?.id,
  });

  // Update form when center changes
  useEffect(() => {
    if (center && isOpen) {
      console.log('🔄 Loading SO Center data for editing:', center);

      // Set facilities from center data
      const centerFacilities = center.facilities || [];
      if (centerFacilities.length > 0) {
        setFacilities(centerFacilities.map((f: string) => ({facilityName: f})));
      } else {
        setFacilities([{facilityName: ''}]);
      }

      // Set nearby schools and tuitions if available
      if (center.nearbySchools && Array.isArray(center.nearbySchools)) {
        setNearbySchools(center.nearbySchools);
      }
      if (center.nearbyTuitions && Array.isArray(center.nearbyTuitions)) {
        setNearbyTuitions(center.nearbyTuitions);
      }
      if (center.equipment && Array.isArray(center.equipment)) {
        setEquipment(center.equipment);
      }

      // Pre-populate location selections first, then set form values
      const villageId = center.villageId || center.village_id;
      if (villageId && villages.length > 0) {
        const village = villages.find((v: any) => v.id === villageId);
        if (village && mandals.length > 0) {
          const mandal = mandals.find((m: any) => m.id === village.mandalId);
          if (mandal && districts.length > 0) {
            const district = districts.find((d: any) => d.id === mandal.districtId);
            if (district && states.length > 0) {
              const state = states.find((s: any) => s.id === district.stateId);
              if (state) {
                setSelectedState(state.id);
                setSelectedDistrict(district.id);
                setSelectedMandal(mandal.id);
              }
            }
          }
        }
      }

      // Set form values with proper handling of empty/null values
      form.reset({
        name: center.name || '',
        phone: center.phone || '',
        address: center.address || '',
        villageId: villageId || '',
        managerId: center.managerId || center.manager_id || 'none',
        ownerName: center.ownerName || center.owner_name || '',
        ownerLastName: center.ownerLastName || center.owner_last_name || '',
        ownerPhone: center.ownerPhone || center.owner_phone || '',
        landmarks: center.landmarks || '',
        roomSize: center.roomSize || center.room_size || '',
        rentAmount: center.rentAmount ? center.rentAmount.toString() : '',
        rentalAdvance: center.rentalAdvance ? center.rentalAdvance.toString() : '',
        dateOfHouseTaken: center.dateOfHouseTaken || center.date_of_house_taken || '',
        monthlyRentDate: center.monthlyRentDate ? center.monthlyRentDate.toString() : '',
        monthlyInternetDate: center.monthlyInternetDate ? center.monthlyInternetDate.toString() : '',
        electricBillAccountNumber: center.electricBillAccountNumber || center.electric_bill_account_number || '',
        internetBillAccountNumber: center.internetBillAccountNumber || center.internet_bill_account_number || '',
        internetServiceProvider: center.internetServiceProvider || center.internet_service_provider || '',
        capacity: center.capacity ? center.capacity.toString() : '',
        facilities: centerFacilities,
        isActive: center.isActive !== false && center.is_active !== false,
        admissionFeeApplicable: center.admissionFeeApplicable ? 'applicable' : 'not_applicable',
      });
    }
  }, [center, isOpen, states, districts, mandals, villages]);

  // Handle location changes
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

  // Update SO Center mutation
  const updateCenterMutation = useMutation({
    mutationFn: async (data: EditSoCenterFormData) => {
      console.log('🔄 Updating SO Center with data:', data);

      const updateData = {
        ...data,
        // Handle numeric fields properly - convert empty strings to null
        capacity: data.capacity && data.capacity.trim() !== '' ? parseInt(data.capacity) : null,
        monthlyRentDate: data.monthlyRentDate && data.monthlyRentDate.trim() !== '' ? parseInt(data.monthlyRentDate) : null,
        monthlyInternetDate: data.monthlyInternetDate && data.monthlyInternetDate.trim() !== '' ? parseInt(data.monthlyInternetDate) : null,
        rentAmount: data.rentAmount && data.rentAmount.trim() !== '' ? data.rentAmount : null,
        rentalAdvance: data.rentalAdvance && data.rentalAdvance.trim() !== '' ? data.rentalAdvance : null,
        // Handle arrays
        facilities: facilities.map(f => f.facilityName).filter(name => name && name.trim() !== ''),
        nearbySchools: nearbySchools,
        nearbyTuitions: nearbyTuitions,
        equipment: equipment.filter(e => e.itemName.trim() !== '' && e.serialNumber.trim() !== ''),
        // Handle boolean
        admissionFeeApplicable: data.admissionFeeApplicable === 'applicable',
        // Handle managerId
        managerId: data.managerId === 'none' || data.managerId === '' || data.managerId === null ? null : data.managerId,
      };

      console.log('🔄 Processed update data:', updateData);
      return apiRequest('PUT', `/api/admin/so-centers/${center.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: 'SO Center Updated',
        description: 'SO Center details have been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('❌ SO Center update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update SO center.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditSoCenterFormData) => {
    console.log('📝 Form submitted with data:', data);
    
    // Process the data to handle empty strings for numeric fields
    const processedData = {
      ...data,
      // Convert empty strings to null for numeric fields
      rentAmount: data.rentAmount?.trim() === '' ? null : data.rentAmount,
      rentalAdvance: data.rentalAdvance?.trim() === '' ? null : data.rentalAdvance,
      monthlyRentDate: data.monthlyRentDate?.trim() === '' ? null : data.monthlyRentDate,
      monthlyInternetDate: data.monthlyInternetDate?.trim() === '' ? null : data.monthlyInternetDate,
      capacity: data.capacity?.trim() === '' ? null : data.capacity,
      // Handle managerId properly
      managerId: data.managerId === 'none' || data.managerId === '' ? null : data.managerId,
    };
    
    console.log('📝 Processed form data:', processedData);
    updateCenterMutation.mutate(processedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <DialogHeader className="border-b border-green-200 pb-4">
          <DialogTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            Edit SO Center
          </DialogTitle>
          <DialogDescription>
            Update SO Center information. Center ID, Email, and Wallet Balance cannot be modified.
          </DialogDescription>
        </DialogHeader>

        {center && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Center ID:</span>
                <p className="font-semibold">{center.centerId || center.center_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="font-semibold">{center.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Wallet Balance:</span>
                <p className="font-semibold text-green-600">₹{(parseFloat(center.walletBalance || center.wallet_balance) || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ADMISSION FEE POLICY */}
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

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Center Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter center name" {...field} />
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
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
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
                        <Input 
                          type="number" 
                          placeholder="Maximum students"
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
                    <FormLabel>Room Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 20x15 feet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SO Study Organizer</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select SO Study Organizer" />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((manager: any) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} ({manager.email})
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

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location Information</h3>

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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address *</FormLabel>
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
              <h3 className="text-lg font-medium text-gray-900">Property Owner Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner First Name</FormLabel>
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
                      <FormLabel>Owner Last Name</FormLabel>
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
                    <FormLabel>Owner Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property & Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property & Financial Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter monthly rent" {...field} />
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
                      <FormLabel>Rental Advance Paid</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter advance amount" {...field} />
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
                      <FormLabel>House Taken Date</FormLabel>
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
                      <FormLabel>Monthly Rent Due Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="31" 
                          placeholder="Day of month (1-31)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="electricBillAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electric Bill Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter electric bill account number" {...field} />
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

                <FormField
                  control={form.control}
                  name="internetBillAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internet Bill Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter internet bill account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="monthlyInternetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Internet Bill Date (Day of Month)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="31" 
                        placeholder="Day of month (1-31)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                        // Update form value for validation
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
                        // Update form value for validation
                        const facilityNames = updated.map(f => f.facilityName).filter(name => name && name.trim() !== '');
                        form.setValue('facilities', facilityNames);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
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
                </div>
              ))}
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

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>SO Center is Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={updateCenterMutation.isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
              >
                {updateCenterMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Updating...
                  </div>
                ) : (
                  'Update SO Center'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}