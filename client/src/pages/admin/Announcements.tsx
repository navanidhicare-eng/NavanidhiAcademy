import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Megaphone, Users, Eye, LinkIcon, Calendar, Send, QrCode } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().optional(),
  targetAudience: z.enum(['students', 'teachers', 'so_centers', 'admin', 'all'], {
    required_error: 'Target audience is required'
  }),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  isActive: z.boolean().default(true),
  showOnQrCode: z.boolean().default(false),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const targetAudienceOptions = [
  { id: 'students', name: 'Students', description: 'Students and parents (via QR code)' },
  { id: 'teachers', name: 'Teachers', description: 'All teaching staff' },
  { id: 'so_centers', name: 'SO Centers', description: 'SO center managers and staff' },
  { id: 'admin', name: 'Administrators', description: 'System administrators' },
  { id: 'all', name: 'Everyone', description: 'All users in the system' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAnnouncement?: any;
}

function AddAnnouncementModal({ isOpen, onClose, editingAnnouncement }: AddAnnouncementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      targetAudience: 'students',
      priority: 'normal',
      imageUrl: '',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      showOnQrCode: false,
    },
  });

  // Reset form when editing announcement changes
  useEffect(() => {
    if (editingAnnouncement) {
      form.reset({
        title: editingAnnouncement.title || '',
        description: editingAnnouncement.description || '',
        content: editingAnnouncement.content || '',
        targetAudience: editingAnnouncement.targetAudience || 'students',
        priority: editingAnnouncement.priority || 'normal',
        imageUrl: editingAnnouncement.imageUrl || '',
        fromDate: editingAnnouncement.fromDate || new Date().toISOString().split('T')[0],
        toDate: editingAnnouncement.toDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: editingAnnouncement.isActive ?? true,
        showOnQrCode: editingAnnouncement.showOnQrCode ?? false,
      });
    }
  }, [editingAnnouncement, form]);

  const mutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const endpoint = editingAnnouncement ? `/api/admin/announcements/${editingAnnouncement.id}` : '/api/admin/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingAnnouncement ? 'Announcement Updated' : 'Announcement Created',
        description: `Announcement has been successfully ${editingAnnouncement ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. System Maintenance Notice, Holiday Announcement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your announcement message here..."
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details, instructions, or rich text content..."
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/banner-image.jpg"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetAudienceOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-gray-600">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={`px-2 py-1 rounded text-xs ${option.color}`}>
                                {option.label}
                              </span>
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
                name="fromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Date</FormLabel>
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
                name="toDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Date</FormLabel>
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
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Announcement</FormLabel>
                      <FormDescription>
                        This announcement will be visible to target users when active
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showOnQrCode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Show on QR Code Scan
                      </FormLabel>
                      <FormDescription>
                        Display this announcement when students scan QR codes
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Announcements will be displayed based on the selected dates and target audience. 
                QR code announcements are shown when students scan their progress QR codes.
              </p>
            </div>

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
                  ? (editingAnnouncement ? 'Updating...' : 'Creating...') 
                  : (editingAnnouncement ? 'Update Announcement' : 'Create Announcement')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Announcements() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real announcements from Supabase database
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['/api/admin/announcements'],
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return apiRequest('DELETE', `/api/admin/announcements/${announcementId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Announcement Deleted',
        description: 'Announcement has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete announcement.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setIsAddModalOpen(true);
  };

  const handleDelete = (announcementId: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncementMutation.mutate(announcementId);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingAnnouncement(null);
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? option.color : 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading announcements...</div>;
  }

  const activeAnnouncements = announcements.filter((a: any) => a.isActive).length;
  const qrCodeAnnouncements = announcements.filter((a: any) => a.showOnQrCode).length;

  return (
    <DashboardLayout 
      title="Announcements" 
      subtitle="Create and manage system-wide announcements"
      showAddButton={true}
      onAddClick={() => setIsAddModalOpen(true)}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
              <p className="text-xs text-muted-foreground">{activeAnnouncements} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAnnouncements}</div>
              <p className="text-xs text-muted-foreground">Currently visible</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Code Enabled</CardTitle>
              <QrCode className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrCodeAnnouncements}</div>
              <p className="text-xs text-muted-foreground">Shown on QR scans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Audiences</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{targetAudienceOptions.length}</div>
              <p className="text-xs text-muted-foreground">Available audiences</p>
            </CardContent>
          </Card>
        </div>

        {/* Announcements Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Announcements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.length > 0 ? announcements.map((announcement: any) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                        <div className="text-sm text-gray-500">{announcement.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <Badge variant="outline">
                          {targetAudienceOptions.find(opt => opt.id === announcement.targetAudience)?.name || announcement.targetAudience}
                        </Badge>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div>From: {announcement.fromDate}</div>
                        <div>To: {announcement.toDate}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <Badge variant={announcement.isActive ? "default" : "secondary"}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {announcement.showOnQrCode && (
                          <Badge variant="outline" className="text-purple-600">
                            <QrCode className="h-3 w-3 mr-1" />
                            QR Enabled
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(announcement)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(announcement.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Megaphone className="h-8 w-8 text-gray-300" />
                        <p>No announcements found</p>
                        <Button onClick={() => setIsAddModalOpen(true)} variant="outline" size="sm">
                          Create First Announcement
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddAnnouncementModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editingAnnouncement={editingAnnouncement}
      />
    </DashboardLayout>
  );
}