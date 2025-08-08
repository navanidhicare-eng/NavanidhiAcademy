import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Users 
} from 'lucide-react';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock users data - replace with actual API call
  const mockUsers = [
    {
      id: 'demo-admin-1',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      phone: '+91 98765 43210',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: 'demo-so-1',
      name: 'SO Center Manager',
      email: 'so@demo.com',
      role: 'so_center',
      phone: '+91 87654 32109',
      status: 'active',
      createdAt: '2024-02-10'
    },
    {
      id: 'demo-teacher-1',
      name: 'Math Teacher',
      email: 'teacher@demo.com',
      role: 'teacher',
      phone: '+91 76543 21098',
      status: 'active',
      createdAt: '2024-03-05'
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'so_center': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'academic_admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout
      title="Manage Users"
      subtitle="Manage system users and their roles"
      showAddButton={true}
      onAddClick={() => toast({ title: 'Add User', description: 'Add user functionality coming soon!' })}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">System Users</CardTitle>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="so_center">SO Center</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="academic_admin">Academic Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {getInitials(user.name)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default" className="bg-success text-white">
                        Active
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="text-primary" size={16} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{mockUsers.filter(u => u.role === 'admin').length}</div>
                <p className="text-gray-600">Admins</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockUsers.filter(u => u.role === 'so_center').length}</div>
                <p className="text-gray-600">SO Centers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mockUsers.filter(u => u.role === 'teacher').length}</div>
                <p className="text-gray-600">Teachers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{mockUsers.length}</div>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}