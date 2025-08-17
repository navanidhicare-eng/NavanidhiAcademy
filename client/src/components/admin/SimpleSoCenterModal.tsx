import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, MapPin, Building2, Phone, Users, Home } from "lucide-react";

interface SimpleSoCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Center name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  capacity: z.string().min(1, "Capacity is required"),
  villageId: z.string().min(1, "Village selection is required"),
  address: z.string().min(1, "Address is required"),
  admissionFeeApplicable: z.enum(["applicable", "not_applicable"]),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().min(10, "Owner phone is required"),
  roomSize: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function SimpleSoCenterModal({ isOpen, onClose, onSuccess }: SimpleSoCenterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hardcoded center ID for now to bypass database issues
  const [nextCenterId, setNextCenterId] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Generate a simple sequential ID
      const timestamp = Date.now().toString().slice(-5);
      setNextCenterId(`NNASOC${timestamp}`);
    }
  }, [isOpen]);

  // Location data
  const { data: states = [] } = useQuery({ queryKey: ['/api/admin/addresses/states'] });
  const { data: districts = [] } = useQuery({ queryKey: ['/api/admin/addresses/districts'] });
  const { data: mandals = [] } = useQuery({ queryKey: ['/api/admin/addresses/mandals'] });
  const { data: villages = [] } = useQuery({ queryKey: ['/api/admin/addresses/villages'] });

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      capacity: '',
      villageId: '',
      address: '',
      admissionFeeApplicable: 'applicable',
      ownerName: '',
      ownerPhone: '',
      roomSize: '',
    },
  });

  const createSoCenterMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const soCenterData = {
        ...data,
        centerId: nextCenterId,
        email: `${nextCenterId.toLowerCase()}@navanidhi.org`,
        admissionFeeApplicable: data.admissionFeeApplicable === 'applicable',
      };

      return apiRequest('POST', '/api/admin/so-centers', soCenterData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "SO Center created successfully!",
      });

      // Invalidate all relevant queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers/next-id'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error('SO Center creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create SO Center",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createSoCenterMutation.mutate(data);
  };

  // Filter locations based on selections
  const filteredDistricts = districts.filter((d: any) => d.stateId === selectedState);
  const filteredMandals = mandals.filter((m: any) => m.districtId === selectedDistrict);
  const filteredVillages = villages.filter((v: any) => v.mandalId === selectedMandal);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-xl font-bold text-green-800 flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            New SO Center
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Center ID Display */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg border border-green-200 text-center">
              <p className="text-sm text-green-700 mb-1">Generated Center ID</p>
              <p className="text-lg font-bold text-green-800">{nextCenterId || 'Loading...'}</p>
              <p className="text-xs text-green-600">Email: {nextCenterId ? `${nextCenterId.toLowerCase()}@navanidhi.org` : ''}</p>
            </div>

            {/* Admission Fee Policy */}
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <FormField
                control={form.control}
                name="admissionFeeApplicable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-green-800 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Admission Fee Policy
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 border-green-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applicable">✅ Applicable</SelectItem>
                        <SelectItem value="not_applicable">❌ Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700">Center Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Center name" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
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
                    <FormLabel className="text-sm text-green-700 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Phone number" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Capacity
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roomSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700 flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      Room Size
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="20x15 feet" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Owner Information */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700">Owner Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Owner full name" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-green-700">Owner Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Owner phone" 
                        className="h-9 border-green-200 focus:border-green-400 text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-green-700 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select onValueChange={setSelectedState} value={selectedState}>
                    <SelectTrigger className="h-9 border-green-200 text-xs">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedState}>
                    <SelectTrigger className="h-9 border-green-200 text-xs">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDistricts.map((district: any) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Select onValueChange={setSelectedMandal} value={selectedMandal} disabled={!selectedDistrict}>
                    <SelectTrigger className="h-9 border-green-200 text-xs">
                      <SelectValue placeholder="Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMandals.map((mandal: any) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
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
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedMandal}>
                          <SelectTrigger className="h-9 border-green-200 text-xs">
                            <SelectValue placeholder="Village" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredVillages.map((village: any) => (
                              <SelectItem key={village.id} value={village.id}>
                                {village.name}
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

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-green-700">Full Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Complete address with landmarks" 
                      className="h-9 border-green-200 focus:border-green-400 text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
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
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {createSoCenterMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Creating...
                  </div>
                ) : (
                  'Create SO Center'
                )}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}