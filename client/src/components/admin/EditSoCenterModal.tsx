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

const editSoCenterSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(1, 'Address is required'),
  villageId: z.string().min(1, 'Village selection is required'),
  managerId: z.string().optional(),
  ownerName: z.string().optional(),
  ownerLastName: z.string().optional(),
  ownerFatherName: z.string().optional(),
  ownerMotherName: z.string().optional(),
  ownerPhone: z.string().optional(),
  landmarks: z.string().optional(),
  roomSize: z.string().optional(),
  rentAmount: z.string().optional(),
  rentalAdvance: z.string().optional(),
  dateOfHouseTaken: z.string().optional(),
  monthlyRentDate: z.number().min(1).max(31).optional(),
  electricBillAccountNumber: z.string().optional(),
  internetBillAccountNumber: z.string().optional(),
  capacity: z.number().min(1).optional(),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

type EditSoCenterFormData = z.infer<typeof editSoCenterSchema>;

interface EditSoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  center: any;
}

const facilityOptions = [
  'Air Conditioning',
  'WiFi Internet',
  'Backup Power',
  'Water Supply',
  'Parking',
  'Security',
  'Furniture',
  'Whiteboard',
  'Projector',
  'Library'
];

export function EditSoCenterModal({ isOpen, onClose, center }: EditSoCenterModalProps) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
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
      ownerFatherName: '',
      ownerMotherName: '',
      ownerPhone: '',
      landmarks: '',
      roomSize: '',
      rentAmount: '',
      rentalAdvance: '',
      dateOfHouseTaken: '',
      monthlyRentDate: undefined,
      electricBillAccountNumber: '',
      internetBillAccountNumber: '',
      capacity: undefined,
      facilities: [],
      isActive: true,
    },
  });

  // Fetch location data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Filter managers (users with 'manager' role)
  const managers = users.filter((user: any) => user.role === 'manager' || user.role === 'so_center');

  // Filter location data based on selections
  const filteredDistricts = districts.filter((district: any) => district.stateId === selectedState);
  const filteredMandals = mandals.filter((mandal: any) => mandal.districtId === selectedDistrict);
  const filteredVillages = villages.filter((village: any) => village.mandalId === selectedMandal);

  // Update form when center changes
  useEffect(() => {
    if (center && isOpen) {
      form.reset({
        name: center.name || '',
        phone: center.phone || '',
        address: center.address || '',
        villageId: center.villageId || center.village_id || '',
        managerId: center.managerId || center.manager_id || '',
        ownerName: center.ownerName || center.owner_name || '',
        ownerLastName: center.ownerLastName || center.owner_last_name || '',
        ownerFatherName: center.ownerFatherName || center.owner_father_name || '',
        ownerMotherName: center.ownerMotherName || center.owner_mother_name || '',
        ownerPhone: center.ownerPhone || center.owner_phone || '',
        landmarks: center.landmarks || '',
        roomSize: center.roomSize || center.room_size || '',
        rentAmount: center.rentAmount || center.rent_amount || '',
        rentalAdvance: center.rentalAdvance || center.rental_advance || '',
        dateOfHouseTaken: center.dateOfHouseTaken || center.date_of_house_taken || '',
        monthlyRentDate: center.monthlyRentDate || center.monthly_rent_date || undefined,
        electricBillAccountNumber: center.electricBillAccountNumber || center.electric_bill_account_number || '',
        internetBillAccountNumber: center.internetBillAccountNumber || center.internet_bill_account_number || '',
        capacity: center.capacity || undefined,
        facilities: center.facilities || [],
        isActive: center.isActive !== false && center.is_active !== false,
      });

      // Set location selections based on village
      if (center.villageId || center.village_id) {
        const village = villages.find((v: any) => v.id === (center.villageId || center.village_id));
        if (village) {
          const mandal = mandals.find((m: any) => m.id === village.mandalId);
          if (mandal) {
            const district = districts.find((d: any) => d.id === mandal.districtId);
            if (district) {
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
    }
  }, [center, isOpen, form, villages, mandals, districts, states]);

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
      return apiRequest('PUT', `/api/admin/so-centers/${center.id}`, data);
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to update SO center.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditSoCenterFormData) => {
    updateCenterMutation.mutate(data);
  };

  const handleFacilityChange = (facility: string, checked: boolean) => {
    const currentFacilities = form.getValues('facilities') || [];
    if (checked) {
      form.setValue('facilities', [...currentFacilities, facility]);
    } else {
      form.setValue('facilities', currentFacilities.filter(f => f !== facility));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit SO Center</DialogTitle>
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
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
                  <label className="text-sm font-medium text-gray-700">State *</label>
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
                  <label className="text-sm font-medium text-gray-700">District *</label>
                  <Select onValueChange={handleDistrictChange} value={selectedDistrict} disabled={!selectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDistricts.map((district: any) => (
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
                  <label className="text-sm font-medium text-gray-700">Mandal *</label>
                  <Select onValueChange={handleMandalChange} value={selectedMandal} disabled={!selectedDistrict}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMandals.map((mandal: any) => (
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
                            {filteredVillages.map((village: any) => (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerFatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner's Father Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner's father name" {...field} />
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
                      <FormLabel>Owner's Mother Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter owner's mother name" {...field} />
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

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Property & Financial Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Maximum students"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter monthly rent" {...field} />
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
                        <Input placeholder="Enter advance amount" {...field} />
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
                        <Input 
                          type="date" 
                          {...field}
                        />
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
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
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
                        <Input placeholder="Enter electric bill account number" {...field} />
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
            </div>

            {/* Facilities */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Facilities Available</h3>
              <div className="grid grid-cols-3 gap-3">
                {facilityOptions.map((facility) => (
                  <div key={facility} className="flex items-center space-x-2">
                    <Checkbox
                      checked={(form.watch('facilities') || []).includes(facility)}
                      onCheckedChange={(checked) => handleFacilityChange(facility, checked as boolean)}
                    />
                    <label className="text-sm">{facility}</label>
                  </div>
                ))}
              </div>
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCenterMutation.isPending}>
                {updateCenterMutation.isPending ? 'Updating...' : 'Update SO Center'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}