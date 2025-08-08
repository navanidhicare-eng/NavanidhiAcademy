import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MapPin, 
  Map, 
  Building2, 
  Home,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

// Form schemas
const stateSchema = z.object({
  name: z.string().min(1, 'State name is required'),
  code: z.string().min(2, 'State code is required').max(3, 'State code should be 2-3 characters'),
});

const districtSchema = z.object({
  name: z.string().min(1, 'District name is required'),
  code: z.string().min(2, 'District code is required').max(5, 'District code should be 2-5 characters'),
  stateId: z.string().min(1, 'State selection is required'),
});

const mandalSchema = z.object({
  name: z.string().min(1, 'Mandal name is required'),
  code: z.string().min(2, 'Mandal code is required').max(5, 'Mandal code should be 2-5 characters'),
  districtId: z.string().min(1, 'District selection is required'),
});

const villageSchema = z.object({
  name: z.string().min(1, 'Village name is required'),
  code: z.string().min(2, 'Village code is required').max(5, 'Village code should be 2-5 characters'),
  mandalId: z.string().min(1, 'Mandal selection is required'),
});

type StateFormData = z.infer<typeof stateSchema>;
type DistrictFormData = z.infer<typeof districtSchema>;
type MandalFormData = z.infer<typeof mandalSchema>;
type VillageFormData = z.infer<typeof villageSchema>;

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'state' | 'district' | 'mandal' | 'village';
  editing?: any;
}

function AddAddressModal({ isOpen, onClose, type, editing }: AddModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine schema and default values based on type
  const getSchema = () => {
    switch (type) {
      case 'state': return stateSchema;
      case 'district': return districtSchema;
      case 'mandal': return mandalSchema;
      case 'village': return villageSchema;
      default: return stateSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: editing || {},
  });

  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
    enabled: type === 'district',
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts'],
    enabled: type === 'mandal',
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals'],
    enabled: type === 'village',
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editing 
        ? `/api/admin/addresses/${type}s/${editing.id}` 
        : `/api/admin/addresses/${type}s`;
      const method = editing ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${editing ? 'Updated' : 'Created'}`,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been successfully ${editing ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/addresses/${type}s`] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editing ? 'update' : 'create'} ${type}.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit' : 'Add'} {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type.charAt(0).toUpperCase() + type.slice(1)} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${type} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type.charAt(0).toUpperCase() + type.slice(1)} Code</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${type} code`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'district' && (
              <FormField
                control={form.control}
                name="stateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'mandal' && (
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === 'village' && (
              <FormField
                control={form.control}
                name="mandalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mandal</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {mutation.isPending 
                  ? (editing ? 'Updating...' : 'Creating...') 
                  : (editing ? `Update ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`)
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Addresses() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('states');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'state' | 'district' | 'mandal' | 'village'>('state');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Fetch real data from Supabase database
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages'],
  });

  const handleAdd = (type: 'state' | 'district' | 'mandal' | 'village') => {
    setModalType(type);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type: 'state' | 'district' | 'mandal' | 'village', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <DashboardLayout
      title="Address Management"
      subtitle="Manage states, districts, mandals, and villages hierarchy"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="mandals">Mandals</TabsTrigger>
          <TabsTrigger value="villages">Villages</TabsTrigger>
        </TabsList>

        <TabsContent value="states">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin size={20} />
                  <span>States</span>
                </CardTitle>
                <Button onClick={() => handleAdd('state')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add State
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {states.map((state: any) => (
                  <div key={state.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{state.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{state.code}</Badge>
                        <span className="text-xs text-gray-500">{state.districtCount} districts</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit('state', state)}>
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Map size={20} />
                  <span>Districts</span>
                </CardTitle>
                <Button onClick={() => handleAdd('district')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add District
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {districts.map((district: any) => (
                  <div key={district.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{district.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{district.code}</Badge>
                        <Badge variant="secondary">{district.stateName}</Badge>
                        <span className="text-xs text-gray-500">{district.mandalCount} mandals</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit('district', district)}>
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mandals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 size={20} />
                  <span>Mandals</span>
                </CardTitle>
                <Button onClick={() => handleAdd('mandal')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Mandal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mandals.map((mandal: any) => (
                  <div key={mandal.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{mandal.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{mandal.code}</Badge>
                        <Badge variant="secondary">{mandal.districtName}</Badge>
                        <span className="text-xs text-gray-500">{mandal.villageCount} villages</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit('mandal', mandal)}>
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="villages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Home size={20} />
                  <span>Villages</span>
                </CardTitle>
                <Button onClick={() => handleAdd('village')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Village
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {villages.map((village: any) => (
                  <div key={village.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{village.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{village.code}</Badge>
                        <Badge variant="secondary">{village.mandalName}</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit('village', village)}>
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AddAddressModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        type={modalType}
        editing={editingItem}
      />
    </DashboardLayout>
  );
}