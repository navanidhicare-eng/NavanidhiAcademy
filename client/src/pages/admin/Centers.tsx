import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Building, 
  Plus,
  Edit,
  Eye,
  MapPin,
  Phone,
  Users
} from 'lucide-react';

export default function AdminCenters() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock SO Centers data
  const mockCenters = [
    {
      id: '1',
      name: 'Main SO Center',
      address: '123 Education Street, Hyderabad, Telangana',
      phone: '+91 87654 32109',
      managerName: 'Rajesh Kumar',
      managerEmail: 'rajesh@navanidhi.com',
      studentCount: 45,
      status: 'active',
      walletBalance: 15000,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Branch SO Center - Kukatpally',
      address: '456 Learning Lane, Kukatpally, Hyderabad',
      phone: '+91 76543 21098',
      managerName: 'Priya Sharma',
      managerEmail: 'priya@navanidhi.com',
      studentCount: 32,
      status: 'active',
      walletBalance: 8500,
      createdAt: '2024-02-10'
    },
    {
      id: '3',
      name: 'SO Center - Secunderabad',
      address: '789 Knowledge Road, Secunderabad',
      phone: '+91 65432 10987',
      managerName: 'Amit Patel',
      managerEmail: 'amit@navanidhi.com',
      studentCount: 28,
      status: 'active',
      walletBalance: 12300,
      createdAt: '2024-03-05'
    }
  ];

  const filteredCenters = mockCenters.filter(center => 
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.managerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddCenter = () => {
    toast({ 
      title: 'Add SO Center', 
      description: 'Add SO Center functionality coming soon!' 
    });
  };

  return (
    <DashboardLayout
      title="SO Centers"
      subtitle="Manage satellite office centers and their operations"
      showAddButton={true}
      onAddClick={handleAddCenter}
    >
      <div className="space-y-6">
        {/* Search and Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">SO Centers Overview</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <Input
                  placeholder="Search centers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{mockCenters.length}</div>
                <p className="text-gray-600">Total Centers</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mockCenters.reduce((sum, center) => sum + center.studentCount, 0)}
                </div>
                <p className="text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{mockCenters.reduce((sum, center) => sum + center.walletBalance, 0).toLocaleString()}
                </div>
                <p className="text-gray-600">Total Wallet Balance</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {mockCenters.filter(c => c.status === 'active').length}
                </div>
                <p className="text-gray-600">Active Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Centers List */}
        <div className="grid gap-6">
          {filteredCenters.map((center) => (
            <Card key={center.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <Building className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                        <Badge className="bg-success text-white">
                          {center.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{center.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone size={16} className="text-gray-400" />
                          <span>{center.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {getInitials(center.managerName)}
                            </span>
                          </div>
                          <span>{center.managerName} - {center.managerEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-gray-400" />
                          <span>{center.studentCount} students</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500">Wallet Balance: </span>
                          <span className="font-semibold text-green-600">₹{center.walletBalance.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created: </span>
                          <span className="font-medium">{new Date(center.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="text-primary" size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="text-secondary" size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No SO centers found matching your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}