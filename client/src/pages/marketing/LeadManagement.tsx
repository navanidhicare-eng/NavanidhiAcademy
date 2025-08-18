import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Phone, Mail, MapPin, Calendar, TrendingUp, Target, UserPlus, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Lead form schema
const leadFormSchema = z.object({
  studentName: z.string().min(2, 'Student name must be at least 2 characters'),
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  villageId: z.string().min(1, 'Village is required'),
  interestedClass: z.string().min(1, 'Interested class is required'),
  leadSource: z.string().min(1, 'Lead source is required'),
  priority: z.enum(['high', 'medium', 'low']),
  expectedJoinDate: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface Lead {
  id: string;
  studentName: string;
  parentName: string;
  mobileNumber: string;
  whatsappNumber?: string;
  email?: string;
  address: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  interestedClass: string;
  leadSource: string;
  priority: string;
  expectedJoinDate?: string;
  notes?: string;
  status: string;
  createdAt: string;
  assignedTo?: string;
  assignedToName?: string;
}

interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export default function LeadManagement() {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isViewLeadOpen, setIsViewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      studentName: '',
      parentName: '',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      address: '',
      villageId: '',
      interestedClass: '',
      leadSource: '',
      priority: 'medium',
      expectedJoinDate: '',
      notes: '',
    },
  });

  // Fetch lead data
  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/marketing/leads'],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<LeadMetrics>({
    queryKey: ['/api/marketing/lead-metrics'],
  });

  // Fetch dropdown data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: officeStaff = [] } = useQuery({
    queryKey: ['/api/users/office-staff'],
  });

  // Location state management
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');

  // Fetch districts based on selected state
  const { data: districts = [] } = useQuery({
    queryKey: ['/api/admin/addresses/districts', selectedState],
    enabled: !!selectedState,
  });

  // Fetch mandals based on selected district
  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/admin/addresses/mandals', selectedDistrict],
    enabled: !!selectedDistrict,
  });

  // Fetch villages based on selected mandal
  const { data: villages = [] } = useQuery({
    queryKey: ['/api/admin/addresses/villages', selectedMandal],
    enabled: !!selectedMandal,
  });

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

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: LeadFormData) => apiRequest('POST', '/api/marketing/leads', data),
    onSuccess: () => {
      toast({
        title: 'Lead Created',
        description: 'New lead has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/lead-metrics'] });
      form.reset();
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedMandal('');
      setIsAddLeadOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create lead.',
        variant: 'destructive',
      });
    },
  });

  // Assign lead mutation
  const assignLeadMutation = useMutation({
    mutationFn: ({ leadId, assignedTo }: { leadId: string; assignedTo: string }) =>
      apiRequest('PUT', `/api/marketing/leads/${leadId}/assign`, { assignedTo }),
    onSuccess: () => {
      toast({
        title: 'Lead Assigned',
        description: 'Lead has been assigned successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/leads'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to assign lead.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      interested: 'bg-green-100 text-green-800',
      visit_scheduled: 'bg-purple-100 text-purple-800',
      joined: 'bg-emerald-100 text-emerald-800',
      converted: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleAssignLead = (leadId: string, assignedTo: string) => {
    assignLeadMutation.mutate({ leadId, assignedTo });
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewLeadOpen(true);
  };

  if (leadsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Track and manage potential student leads</p>
        </div>

        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter student name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter parent name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter WhatsApp number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Selection - Cascading Dropdowns */}
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium mb-3">Location Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Select onValueChange={handleStateChange} value={selectedState}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states?.map((state: any) => (
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
                            {districts?.map((district: any) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name} ({district.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="mandal">Mandal *</Label>
                        <Select onValueChange={handleMandalChange} value={selectedMandal} disabled={!selectedDistrict}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mandal" />
                          </SelectTrigger>
                          <SelectContent>
                            {mandals?.map((mandal: any) => (
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
                                  {villages?.map((village: any) => (
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
                  </div>

                  <FormField
                    control={form.control}
                    name="interestedClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interested Class *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes?.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="walk_in">Walk-in</SelectItem>
                            <SelectItem value="marketing_campaign">Marketing Campaign</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedJoinDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Join Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes/Comments</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddLeadOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLeadMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Lead Dialog */}
      <Dialog open={isViewLeadOpen} onOpenChange={setIsViewLeadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Student Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Student Name</Label>
                      <p className="text-sm">{selectedLead.studentName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Parent Name</Label>
                      <p className="text-sm">{selectedLead.parentName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Interested Class</Label>
                      <Badge variant="outline" className="ml-2">
                        {classes?.find(cls => cls.id === selectedLead.interestedClass)?.name || selectedLead.interestedClass}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expected Join Date</Label>
                      <p className="text-sm">{selectedLead.expectedJoinDate ? new Date(selectedLead.expectedJoinDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Mobile Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <p className="text-sm">{selectedLead.mobileNumber}</p>
                      </div>
                    </div>
                    {selectedLead.whatsappNumber && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">WhatsApp Number</Label>
                        <p className="text-sm">{selectedLead.whatsappNumber}</p>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          <p className="text-sm">{selectedLead.email}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">{selectedLead.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm"><span className="font-medium">Village:</span> {selectedLead.village}</p>
                        <p className="text-sm"><span className="font-medium">Mandal:</span> {selectedLead.mandal}</p>
                        <p className="text-sm"><span className="font-medium">District:</span> {selectedLead.district}</p>
                        <p className="text-sm"><span className="font-medium">State:</span> {selectedLead.state}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Lead Source</Label>
                      <Badge variant="secondary" className="ml-2">
                        {selectedLead.leadSource.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Priority</Label>
                      <Badge className={`ml-2 ${getPriorityColor(selectedLead.priority)}`}>
                        {selectedLead.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge className={`ml-2 ${getStatusColor(selectedLead.status)}`}>
                        {selectedLead.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Assigned To</Label>
                      <p className="text-sm">{selectedLead.assignedToName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <p className="text-sm">{new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedLead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes/Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewLeadOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.totalLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.newLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.contactedLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics?.convertedLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.conversionRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads ({leads?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{lead.studentName || lead.student_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">Parent: {lead.parentName || lead.parent_name || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone size={12} />
                          {lead.mobileNumber || lead.mobile_number || 'N/A'}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail size={12} />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {classes?.find((cls: any) => cls.id === (lead.interestedClass || lead.interested_class))?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(lead.leadSource || lead.lead_source || 'unknown').replace(/[_-]/g, ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(lead.priority || 'medium')}>
                        {(lead.priority || 'medium').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status || 'new')}>
                        {(lead.status || 'new').replace(/[_-]/g, ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(lead.assignedToName || lead.assigned_to_name) ? (
                        <span className="text-sm">{lead.assignedToName || lead.assigned_to_name}</span>
                      ) : (
                        <Select onValueChange={(value) => handleAssignLead(lead.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {officeStaff?.map((staff: any) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={12} />
                        {lead.createdAt || lead.created_at ? 
                          new Date(lead.createdAt || lead.created_at).toLocaleDateString() : 
                          'N/A'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewLead(lead)}
                      >
                        <Eye size={14} />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!leads || leads.length === 0) && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding your first lead.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}