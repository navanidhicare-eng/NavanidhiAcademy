import { useState } from 'react';
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
import { Phone, Mail, Calendar, MessageSquare, UserCheck, Eye, Edit, Plus, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const followUpFormSchema = z.object({
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  action: z.string().min(3, 'Action must be at least 3 characters'),
  remarks: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'interested', 'visit_scheduled', 'joined', 'converted']),
  notes: z.string().optional(),
});

type FollowUpFormData = z.infer<typeof followUpFormSchema>;
type StatusUpdateData = z.infer<typeof statusUpdateSchema>;

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
  interestedClass: string;
  leadSource: string;
  priority: string;
  status: string;
  createdAt: string;
  createdByName: string;
  expectedJoinDate?: string;
  notes?: string;
  lastFollowUp?: string;
  followUpHistory: {
    id: string;
    followUpDate: string;
    action: string;
    remarks?: string;
    performedByName: string;
    createdAt: string;
  }[];
}

interface LeadAnalytics {
  totalAssignedLeads: number;
  pendingFollowUps: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number; // in days
  statusDistribution: {
    status: string;
    count: number;
  }[];
}

export default function LeadFollowup() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const followUpForm = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      followUpDate: new Date().toISOString().split('T')[0],
      action: '',
      remarks: '',
      nextFollowUpDate: '',
    },
  });

  const statusForm = useForm<StatusUpdateData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: 'new',
      notes: '',
    },
  });

  // Fetch leads assigned to current office staff
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/office/leads', selectedStatus, searchTerm],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<LeadAnalytics>({
    queryKey: ['/api/office/lead-analytics'],
  });

  // Add follow-up mutation
  const addFollowUpMutation = useMutation({
    mutationFn: (data: FollowUpFormData & { leadId: string }) =>
      apiRequest('POST', `/api/office/leads/${data.leadId}/followup`, data),
    onSuccess: () => {
      toast({
        title: 'Follow-up Added',
        description: 'Follow-up record has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/office/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/office/lead-analytics'] });
      followUpForm.reset();
      setIsFollowUpOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add follow-up.',
        variant: 'destructive',
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: StatusUpdateData & { leadId: string }) =>
      apiRequest('PUT', `/api/office/leads/${data.leadId}/status`, data),
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Lead status has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/office/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/office/lead-analytics'] });
      statusForm.reset();
      setIsStatusUpdateOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update status.',
        variant: 'destructive',
      });
    },
  });

  const onFollowUpSubmit = (data: FollowUpFormData) => {
    if (selectedLead) {
      addFollowUpMutation.mutate({ ...data, leadId: selectedLead.id });
    }
  };

  const onStatusSubmit = (data: StatusUpdateData) => {
    if (selectedLead) {
      updateStatusMutation.mutate({ ...data, leadId: selectedLead.id });
    }
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

  // Filter leads based on search and status
  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.mobileNumber.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead follow-up dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Follow-up Management</h1>
          <p className="text-gray-600">Track and manage assigned leads with follow-up actions</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics?.totalAssignedLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analytics?.pendingFollowUps || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics?.convertedLeads || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics?.conversionRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{analytics?.avgResponseTime?.toFixed(1) || 0} days</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      {analytics?.statusDistribution && analytics.statusDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {analytics.statusDistribution.map((item, index) => (
                <div key={index} className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Leads</Label>
              <Input
                id="search"
                placeholder="Search by student name, parent name, or mobile number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="visit_scheduled">Visit Scheduled</SelectItem>
                  <SelectItem value="joined">Joined</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Class & Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Last Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{lead.studentName}</p>
                        <p className="text-sm text-gray-500">Parent: {lead.parentName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone size={12} />
                          {lead.mobileNumber}
                        </div>
                        {lead.whatsappNumber && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <MessageSquare size={12} />
                            WhatsApp
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail size={12} />
                            Email
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">{lead.interestedClass}</Badge>
                        <p className="text-xs text-gray-500">
                          {lead.leadSource.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(lead.priority)}>
                        {lead.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{lead.createdByName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.lastFollowUp ? (
                        <p className="text-sm">{new Date(lead.lastFollowUp).toLocaleDateString()}</p>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsFollowUpOpen(true);
                          }}
                        >
                          <Plus size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead);
                            statusForm.setValue('status', lead.status as any);
                            setIsStatusUpdateOpen(true);
                          }}
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or status filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      {selectedLead && !isFollowUpOpen && !isStatusUpdateOpen && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Details - {selectedLead.studentName}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Lead Details</TabsTrigger>
                <TabsTrigger value="history">Follow-up History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Student Information</h3>
                    <div className="space-y-2">
                      <p><strong>Student Name:</strong> {selectedLead.studentName}</p>
                      <p><strong>Parent Name:</strong> {selectedLead.parentName}</p>
                      <p><strong>Interested Class:</strong> {selectedLead.interestedClass}</p>
                      <p><strong>Expected Join Date:</strong> {selectedLead.expectedJoinDate ? new Date(selectedLead.expectedJoinDate).toLocaleDateString() : 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    <div className="space-y-2">
                      <p><strong>Mobile:</strong> {selectedLead.mobileNumber}</p>
                      {selectedLead.whatsappNumber && <p><strong>WhatsApp:</strong> {selectedLead.whatsappNumber}</p>}
                      {selectedLead.email && <p><strong>Email:</strong> {selectedLead.email}</p>}
                      <p><strong>Address:</strong> {selectedLead.address}</p>
                      <p><strong>Location:</strong> {selectedLead.village}, {selectedLead.mandal}, {selectedLead.district}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Lead Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Source:</strong> {selectedLead.leadSource.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Priority:</strong> <Badge className={getPriorityColor(selectedLead.priority)}>{selectedLead.priority.toUpperCase()}</Badge></p>
                    <p><strong>Status:</strong> <Badge className={getStatusColor(selectedLead.status)}>{selectedLead.status.replace('_', ' ').toUpperCase()}</Badge></p>
                    <p><strong>Created By:</strong> {selectedLead.createdByName}</p>
                  </div>
                </div>
                
                {selectedLead.notes && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Notes</h3>
                    <p className="text-gray-600">{selectedLead.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Follow-up History</h3>
                  {selectedLead.followUpHistory && selectedLead.followUpHistory.length > 0 ? (
                    <div className="space-y-4">
                      {selectedLead.followUpHistory.map((followUp) => (
                        <div key={followUp.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{followUp.action}</p>
                              <p className="text-sm text-gray-500">
                                Follow-up Date: {new Date(followUp.followUpDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">By: {followUp.performedByName}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(followUp.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {followUp.remarks && (
                            <p className="text-gray-600 mt-2">{followUp.remarks}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No follow-up history available.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Follow-up Dialog */}
      <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Follow-up for {selectedLead?.studentName}</DialogTitle>
          </DialogHeader>
          <Form {...followUpForm}>
            <form onSubmit={followUpForm.handleSubmit(onFollowUpSubmit)} className="space-y-4">
              <FormField
                control={followUpForm.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={followUpForm.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Taken *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Called">Called</SelectItem>
                        <SelectItem value="WhatsApp Message">WhatsApp Message</SelectItem>
                        <SelectItem value="Email Sent">Email Sent</SelectItem>
                        <SelectItem value="Home Visit">Home Visit</SelectItem>
                        <SelectItem value="Center Visit Scheduled">Center Visit Scheduled</SelectItem>
                        <SelectItem value="Meeting Arranged">Meeting Arranged</SelectItem>
                        <SelectItem value="Follow-up Call">Follow-up Call</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={followUpForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter remarks about the follow-up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={followUpForm.control}
                name="nextFollowUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Follow-up Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFollowUpOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addFollowUpMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addFollowUpMutation.isPending ? 'Adding...' : 'Add Follow-up'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedLead?.studentName}</DialogTitle>
          </DialogHeader>
          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4">
              <FormField
                control={statusForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="visit_scheduled">Visit Scheduled</SelectItem>
                        <SelectItem value="joined">Joined</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={statusForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
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
                  onClick={() => setIsStatusUpdateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}