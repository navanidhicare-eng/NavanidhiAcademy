import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Plus, Edit, Trash2, Users } from 'lucide-react';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().min(1, 'Description is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  isActive: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

const availablePermissions = [
  { id: 'users_read', name: 'View Users', category: 'Users' },
  { id: 'users_write', name: 'Manage Users', category: 'Users' },
  { id: 'students_read', name: 'View Students', category: 'Students' },
  { id: 'students_write', name: 'Manage Students', category: 'Students' },
  { id: 'payments_read', name: 'View Payments', category: 'Payments' },
  { id: 'payments_write', name: 'Manage Payments', category: 'Payments' },
  { id: 'academic_read', name: 'View Academic Data', category: 'Academic' },
  { id: 'academic_write', name: 'Manage Academic Structure', category: 'Academic' },
  { id: 'centers_read', name: 'View SO Centers', category: 'Centers' },
  { id: 'centers_write', name: 'Manage SO Centers', category: 'Centers' },
  { id: 'reports_read', name: 'View Reports', category: 'Reports' },
  { id: 'reports_write', name: 'Generate Reports', category: 'Reports' },
  { id: 'system_admin', name: 'System Administration', category: 'System' },
];

interface AddEditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole?: any;
}

function AddEditRoleModal({ isOpen, onClose, editingRole }: AddEditRoleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: editingRole?.name || '',
      description: editingRole?.description || '',
      permissions: editingRole?.permissions || [],
      isActive: editingRole?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const endpoint = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingRole ? 'Role Updated' : 'Role Created',
        description: `Role has been successfully ${editingRole ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingRole ? 'update' : 'create'} role.`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RoleFormData) => {
    mutation.mutate(data);
  };

  const selectedPermissions = form.watch('permissions');

  const togglePermission = (permissionId: string) => {
    const current = selectedPermissions || [];
    const updated = current.includes(permissionId)
      ? current.filter(p => p !== permissionId)
      : [...current, permissionId];
    form.setValue('permissions', updated);
  };

  const permissionsByCategory = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Branch Manager, Senior Teacher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'active')}
                        value={field.value ? 'active' : 'inactive'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the role and its responsibilities"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base font-medium">Permissions</FormLabel>
              <div className="mt-3 space-y-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="border rounded-lg p-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className={`cursor-pointer rounded-md border p-2 text-sm transition-colors ${
                            selectedPermissions?.includes(permission.id)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => togglePermission(permission.id)}
                        >
                          {permission.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.permissions && (
                <p className="text-sm text-red-600 mt-2">
                  {form.formState.errors.permissions.message}
                </p>
              )}
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
                  ? (editingRole ? 'Updating...' : 'Creating...') 
                  : (editingRole ? 'Update Role' : 'Create Role')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Roles() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with actual API call
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/roles'],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access and control',
          permissions: ['system_admin', 'users_write', 'students_write', 'payments_write', 'academic_write', 'centers_write', 'reports_write'],
          isActive: true,
          userCount: 2,
        },
        {
          id: '2',
          name: 'SO Center Manager',
          description: 'Manages SO center operations and students',
          permissions: ['students_read', 'students_write', 'payments_read', 'payments_write'],
          isActive: true,
          userCount: 8,
        },
        {
          id: '3',
          name: 'Teacher',
          description: 'Handles student progress and topic updates',
          permissions: ['students_read', 'academic_read'],
          isActive: true,
          userCount: 15,
        },
        {
          id: '4',
          name: 'Academic Admin',
          description: 'Manages academic structure and oversight',
          permissions: ['academic_read', 'academic_write', 'reports_read'],
          isActive: true,
          userCount: 3,
        },
      ];
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest('DELETE', `/api/admin/roles/${roleId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Role Deleted',
        description: 'Role has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete role.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setIsAddModalOpen(true);
  };

  const handleDelete = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingRole(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading roles...</div>;
  }

  return (
    <DashboardLayout 
      title="Role Management" 
      subtitle="Manage user roles and permissions"
      showAddButton={true}
      onAddClick={() => setIsAddModalOpen(true)}
    >
      <div className="space-y-6">

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Roles</h2>
          <p className="text-sm text-gray-600">Configure roles and their permissions</p>
        </div>

        <div className="divide-y divide-gray-200">
          {roles.map((role: any) => (
            <div key={role.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mt-1">{role.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{role.userCount} users</span>
                    </div>
                    <span>•</span>
                    <span>{role.permissions.length} permissions</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map((permission: string) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {availablePermissions.find(p => p.id === permission)?.name || permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(role)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(role.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

        <AddEditRoleModal 
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          editingRole={editingRole}
        />
      </div>
    </DashboardLayout>
  );
}