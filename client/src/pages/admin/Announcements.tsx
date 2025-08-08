import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Megaphone, Users, Eye, Link as LinkIcon, Calendar, Send } from 'lucide-react';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  link: z.string().url().optional().or(z.literal('')),
  targetRoles: z.array(z.string()).min(1, 'At least one role must be selected'),
  priority: z.string().min(1, 'Priority is required'),
  displayDuration: z.string().min(1, 'Display duration is required'),
  isActive: z.boolean().default(true),
  scheduledFor: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const availableRoles = [
  { id: 'admin', name: 'Administrators', description: 'System administrators' },
  { id: 'so_center', name: 'SO Center Managers', description: 'Center managers and staff' },
  { id: 'teacher', name: 'Teachers', description: 'All teaching staff' },
  { id: 'academic_admin', name: 'Academic Admins', description: 'Academic administrators' },
  { id: 'agent', name: 'Agents', description: 'Field agents and representatives' },
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
      title: editingAnnouncement?.title || '',
      description: editingAnnouncement?.description || '',
      link: editingAnnouncement?.link || '',
      targetRoles: editingAnnouncement?.targetRoles || [],
      priority: editingAnnouncement?.priority || 'medium',
      displayDuration: editingAnnouncement?.displayDuration?.toString() || '10',
      isActive: editingAnnouncement?.isActive ?? true,
      scheduledFor: editingAnnouncement?.scheduledFor || '',
    },
  });

  const selectedRoles = form.watch('targetRoles');

  const mutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => {
      const submitData = {
        ...data,
        displayDuration: parseInt(data.displayDuration),
        scheduledFor: data.scheduledFor || null,
      };
      const endpoint = editingAnnouncement ? `/api/admin/announcements/${editingAnnouncement.id}` : '/api/admin/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, submitData);
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

  const toggleRole = (roleId: string) => {
    const current = selectedRoles || [];
    const updated = current.includes(roleId)
      ? current.filter(id => id !== roleId)
      : [...current, roleId];
    form.setValue('targetRoles', updated);
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
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://example.com/more-details"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base font-medium">Target Roles</FormLabel>
              <p className="text-sm text-gray-600 mb-3">Select which user roles should see this announcement</p>
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={role.id}
                      checked={selectedRoles?.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <div className="flex-1">
                      <label htmlFor={role.id} className="font-medium text-sm cursor-pointer">
                        {role.name}
                      </label>
                      <p className="text-xs text-gray-600">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.targetRoles && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.targetRoles.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10"
                        min="5"
                        max="30"
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
              name="scheduledFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule For (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The announcement will appear as an overlay popup for the selected duration 
                after users log in. It will also remain in their notification panel for reference.
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

  // Mock data - replace with actual API calls
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['/api/admin/announcements'],
    queryFn: async () => {
      return [
        {
          id: '1',
          title: 'System Maintenance Notice',
          description: 'The system will be under maintenance on January 15th from 2 AM to 4 AM. During this time, the platform will be temporarily unavailable.',
          link: 'https://navanidhi.com/maintenance-info',
          targetRoles: ['admin', 'so_center', 'teacher'],
          priority: 'high',
          displayDuration: 10,
          isActive: true,
          scheduledFor: '2025-01-15T02:00:00',
          createdAt: '2025-01-08T10:00:00',
          createdBy: 'Super Admin',
          viewCount: 45,
          status: 'scheduled'
        },
        {
          id: '2',
          title: 'Holiday Announcement',
          description: 'All centers will remain closed on January 26th (Republic Day). Regular classes will resume on January 27th.',
          link: null,
          targetRoles: ['so_center', 'teacher', 'agent'],
          priority: 'medium',
          displayDuration: 8,
          isActive: true,
          scheduledFor: null,
          createdAt: '2025-01-05T14:30:00',
          createdBy: 'Admin',
          viewCount: 78,
          status: 'active'
        },
        {
          id: '3',
          title: 'New Feature: QR Code Tracking',
          description: 'We have launched a new QR code tracking system for students. Parents can now scan QR codes to view their child\'s progress.',
          link: 'https://navanidhi.com/qr-tracking-guide',
          targetRoles: ['so_center', 'teacher'],
          priority: 'low',
          displayDuration: 12,
          isActive: false,
          scheduledFor: null,
          createdAt: '2025-01-01T09:00:00',
          createdBy: 'System Admin',
          viewCount: 125,
          status: 'completed'
        }
      ];
    },
  });

  const publishAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return apiRequest('POST', `/api/admin/announcements/${announcementId}/publish`);
    },
    onSuccess: () => {
      toast({
        title: 'Announcement Published',
        description: 'The announcement is now live and visible to target users.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish announcement.',
        variant: 'destructive',
      });
    },
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

  const handlePublish = (announcementId: string) => {
    publishAnnouncementMutation.mutate(announcementId);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingAnnouncement(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading announcements...</div>;
  }

  const activeAnnouncements = announcements.filter(a => a.isActive).length;
  const totalViews = announcements.reduce((sum, a) => sum + a.viewCount, 0);
  const scheduledAnnouncements = announcements.filter(a => a.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Create and manage system-wide announcements</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Across all announcements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Future announcements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.length > 0 ? Math.round(totalViews / announcements.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per announcement</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Announcements</h2>
          <p className="text-sm text-gray-600">Manage system-wide notifications and alerts</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Target Roles</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((announcement: any) => (
              <TableRow key={announcement.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{announcement.title}</div>
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {announcement.description}
                    </div>
                    {announcement.link && (
                      <div className="flex items-center text-xs text-blue-600 mt-1">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        <span>Has link</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {announcement.targetRoles.map((roleId: string) => (
                      <Badge key={roleId} variant="outline" className="text-xs">
                        {availableRoles.find(r => r.id === roleId)?.name.split(' ')[0] || roleId}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(announcement.status)}>
                    {announcement.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span>{announcement.viewCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(announcement.createdAt).toLocaleDateString()}</div>
                    <div className="text-gray-600">{announcement.createdBy}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {announcement.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(announcement.id)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddAnnouncementModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        editingAnnouncement={editingAnnouncement}
      />
    </div>
  );
}