
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AddUserModal } from '@/components/admin/AddUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { 
  Search, 
  Users as UsersIcon, 
  Building, 
  MapPin,
  Map,
  Building2,
  Home,
  Plus,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users data with proper error handling
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      console.log('🔄 Fetching users from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/users');
        console.log('👥 Raw API response:', response);
        
        if (Array.isArray(response)) {
          console.log('✅ Users fetched successfully:', response.length, 'users');
          return response;
        } else {
          console.log('⚠️ Unexpected response format:', response);
          return [];
        }
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch states data
  const { data: states = [], isLoading: statesLoading, error: statesError } = useQuery({
    queryKey: ['/api/admin/addresses/states'],
    queryFn: async () => {
      console.log('🔄 Fetching states from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/addresses/states');
        console.log('🗺️ States API response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Error fetching states:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch districts data
  const { data: districts = [], isLoading: districtsLoading, error: districtsError } = useQuery({
    queryKey: ['/api/admin/addresses/districts'],
    queryFn: async () => {
      console.log('🔄 Fetching districts from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/addresses/districts');
        console.log('🏘️ Districts API response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Error fetching districts:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch mandals data
  const { data: mandals = [], isLoading: mandalsLoading, error: mandalsError } = useQuery({
    queryKey: ['/api/admin/addresses/mandals'],
    queryFn: async () => {
      console.log('🔄 Fetching mandals from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/addresses/mandals');
        console.log('🏛️ Mandals API response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Error fetching mandals:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch villages data
  const { data: villages = [], isLoading: villagesLoading, error: villagesError } = useQuery({
    queryKey: ['/api/admin/addresses/villages'],
    queryFn: async () => {
      console.log('🔄 Fetching villages from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/addresses/villages');
        console.log('🏘️ Villages API response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Error fetching villages:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch SO Centers data
  const { data: soCenters = [], isLoading: soCentersLoading, error: soCentersError } = useQuery({
    queryKey: ['/api/admin/so-centers'],
    queryFn: async () => {
      console.log('🔄 Fetching SO Centers from API...');
      try {
        const response = await apiRequest('GET', '/api/admin/so-centers');
        console.log('🏢 SO Centers API response:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Error fetching SO Centers:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Log component state for debugging
  useEffect(() => {
    console.log('👥 Users component state:', {
      usersCount: users.length,
      isLoading: usersLoading,
      hasError: !!usersError,
      errorMessage: usersError?.message || null,
      actualUsersData: users
    });
    
    console.log('📊 All data counts:', {
      users: users.length,
      states: states.length,
      districts: districts.length,
      mandals: mandals.length,
      villages: villages.length,
      soCenters: soCenters.length
    });
  }, [users, states, districts, mandals, villages, soCenters, usersLoading, usersError]);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest('PUT', `/api/admin/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: 'User Status Updated',
        description: 'User status has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status.',
        variant: 'destructive',
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const adminUsers = users.filter(user => user.role === 'admin').length;
  const soCenterUsers = users.filter(user => user.role === 'so_center').length;
  const teacherUsers = users.filter(user => user.role === 'teacher').length;
  const agentUsers = users.filter(user => user.role === 'agent').length;

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleUserStatus = (user: any) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} "${user.name}"?`)) {
      toggleUserStatusMutation.mutate({ userId: user.id, isActive: !user.isActive });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'so_center': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'agent': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout
      title="Users Management"
      subtitle="Manage system users, roles, and permissions"
      showAddButton={true}
      onAddClick={handleAddUser}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">States</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{states.length}</div>
              <p className="text-xs text-muted-foreground">
                {statesLoading ? 'Loading...' : 'Total states'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Districts</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{districts.length}</div>
              <p className="text-xs text-muted-foreground">
                {districtsLoading ? 'Loading...' : 'Total districts'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mandals</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{mandals.length}</div>
              <p className="text-xs text-muted-foreground">
                {mandalsLoading ? 'Loading...' : 'Total mandals'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Villages</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{villages.length}</div>
              <p className="text-xs text-muted-foreground">
                {villagesLoading ? 'Loading...' : 'Total villages'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SO Centers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{soCenters.length}</div>
              <p className="text-xs text-muted-foreground">
                {soCentersLoading ? 'Loading...' : 'Active centers'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Admins</p>
                  <p className="text-2xl font-bold">{adminUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">SO Centers</p>
                  <p className="text-2xl font-bold">{soCenterUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Teachers</p>
                  <p className="text-2xl font-bold">{teacherUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Agents</p>
                  <p className="text-2xl font-bold">{agentUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Users List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">All Users ({filteredUsers.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : usersError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading users: {usersError.message}</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {getInitials(user.name)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{user.email}</p>
                          {user.phone && <p>Phone: {user.phone}</p>}
                          <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedUser(user)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="text-blue-600" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-green-50"
                      >
                        <Edit className="text-green-600" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                        className={user.isActive ? "hover:bg-orange-50" : "hover:bg-green-50"}
                      >
                        {user.isActive ? (
                          <UserX className="text-orange-600" size={16} />
                        ) : (
                          <UserCheck className="text-green-600" size={16} />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleteUserMutation.isPending}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="text-red-600" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <UsersIcon className="mx-auto text-gray-400 mb-4" size={48} />
                    <p>No users found matching your search.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        }}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
          setEditingUser(null);
        }}
      />

      {/* View Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
                    <p><span className="font-medium">Phone:</span> {selectedUser.phone || 'Not provided'}</p>
                    <p><span className="font-medium">Father's Name:</span> {selectedUser.fatherName || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Account Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status:</span> 
                      <Badge className={selectedUser.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <p><span className="font-medium">Password Changed:</span> {selectedUser.isPasswordChanged ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    {selectedUser.dateOfBirth && (
                      <p><span className="font-medium">Date of Birth:</span> {new Date(selectedUser.dateOfBirth).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {(selectedUser.address || selectedUser.maritalStatus || selectedUser.salary) && (
                <div>
                  <h3 className="font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    {selectedUser.address && (
                      <p><span className="font-medium">Address:</span> {selectedUser.address}</p>
                    )}
                    {selectedUser.maritalStatus && (
                      <p><span className="font-medium">Marital Status:</span> {selectedUser.maritalStatus}</p>
                    )}
                    {selectedUser.salary && (
                      <p><span className="font-medium">Salary:</span> ₹{selectedUser.salary} ({selectedUser.salaryType})</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
