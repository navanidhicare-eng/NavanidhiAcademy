import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SimpleSoCenterModal } from '@/components/admin/SimpleSoCenterModal';
import { EditSoCenterModal } from '@/components/admin/EditSoCenterModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  Building, 
  Plus,
  Edit,
  Eye,
  MapPin,
  Phone,
  Users,
  Trash2
} from 'lucide-react';

export default function AdminCenters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real SO Centers data from API
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/so-centers'],
  });

  // Delete center mutation
  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/so-centers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Center Deleted',
        description: 'SO Center has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete SO center.',
        variant: 'destructive',
      });
    },
  });

  const filteredCenters = (centers as any[]).filter(center => 
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (center.managerName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddCenter = () => {
    setIsAddModalOpen(true);
  };

  const handleEditCenter = (center: any) => {
    setEditingCenter(center);
  };

  const handleDeleteCenter = (center: any) => {
    const confirmation = prompt('Please type "Navanidhi Academy" to confirm deletion:');
    if (confirmation === 'Navanidhi Academy') {
      deleteCenterMutation.mutate(center.id);
    } else if (confirmation !== null) {
      toast({
        title: 'Deletion Cancelled',
        description: 'Incorrect confirmation text. Deletion cancelled.',
        variant: 'destructive',
      });
    }
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
                <div className="text-2xl font-bold text-blue-600">{(centers as any[]).length}</div>
                <p className="text-gray-600">Total Centers</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(centers as any[]).reduce((sum, center) => sum + (center.studentCount || 0), 0)}
                </div>
                <p className="text-gray-600">Total Students</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{(centers as any[]).reduce((sum, center) => sum + (parseInt(center.walletBalance) || 0), 0).toLocaleString()}
                </div>
                <p className="text-gray-600">Total Wallet Balance</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(centers as any[]).filter(c => c.isActive).length}
                </div>
                <p className="text-gray-600">Active Centers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Centers List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading SO centers...</p>
          </div>
        ) : (
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
                          <Badge className={center.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {center.isActive ? 'ACTIVE' : 'INACTIVE'}
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
                                {getInitials(center.managerName || 'Unknown')}
                              </span>
                            </div>
                            <span>{center.managerName || 'Unknown'} - {center.managerEmail || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users size={16} className="text-gray-400" />
                            <span>{center.studentCount || 0} students</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center space-x-6 text-sm">
                          <div>
                            <span className="text-gray-500">Wallet Balance: </span>
                            <span className="font-semibold text-green-600">₹{(parseInt(center.walletBalance) || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created: </span>
                            <span className="font-medium">{new Date(center.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedCenter(center)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="text-blue-600" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditCenter(center)}
                        className="hover:bg-green-50"
                      >
                        <Edit className="text-green-600" size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteCenter(center)}
                        disabled={deleteCenterMutation.isPending}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="text-red-600" size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredCenters.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">No SO centers found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      
      <SimpleSoCenterModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/so-centers'] });
        }}
      />

      <EditSoCenterModal
        isOpen={!!editingCenter}
        onClose={() => setEditingCenter(null)}
        center={editingCenter}
      />

      {/* View Details Dialog */}
      <Dialog open={!!selectedCenter} onOpenChange={() => setSelectedCenter(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SO Center Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedCenter?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCenter && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Center ID:</span> {selectedCenter.centerId || selectedCenter.center_id || 'N/A'}</p>
                    <p><span className="font-medium">Name:</span> {selectedCenter.name || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedCenter.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCenter.phone || 'N/A'}</p>
                    <p><span className="font-medium">Address:</span> {selectedCenter.address || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Financial Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Wallet Balance:</span> ₹{(parseFloat(selectedCenter.walletBalance || selectedCenter.wallet_balance) || 0).toLocaleString()}</p>
                    {selectedCenter.rentAmount && (
                      <p><span className="font-medium">Rent Amount:</span> ₹{(parseFloat(selectedCenter.rentAmount || selectedCenter.rent_amount) || 0).toLocaleString()}</p>
                    )}
                    {selectedCenter.electricBillAccountNumber && (
                      <p><span className="font-medium">Electric Bill Account:</span> {selectedCenter.electricBillAccountNumber || selectedCenter.electric_bill_account_number || 'N/A'}</p>
                    )}
                    {selectedCenter.internetBillAccountNumber && (
                      <p><span className="font-medium">Internet Bill Account:</span> {selectedCenter.internetBillAccountNumber || selectedCenter.internet_bill_account_number || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {(selectedCenter.ownerName || selectedCenter.owner_name) && (
                <div>
                  <h3 className="font-semibold mb-3">Property Owner Information</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <p><span className="font-medium">Owner Name:</span> {(selectedCenter.ownerName || selectedCenter.owner_name || '')} {(selectedCenter.ownerLastName || selectedCenter.owner_last_name || '')}</p>
                      {selectedCenter.ownerFatherName && (
                        <p><span className="font-medium">Father's Name:</span> {selectedCenter.ownerFatherName || selectedCenter.owner_father_name}</p>
                      )}
                      {selectedCenter.ownerMotherName && (
                        <p><span className="font-medium">Mother's Name:</span> {selectedCenter.ownerMotherName || selectedCenter.owner_mother_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedCenter.ownerPhone && (
                        <p><span className="font-medium">Owner Phone:</span> {selectedCenter.ownerPhone || selectedCenter.owner_phone}</p>
                      )}
                      {selectedCenter.roomSize && (
                        <p><span className="font-medium">Room Size:</span> {selectedCenter.roomSize || selectedCenter.room_size}</p>
                      )}
                      {selectedCenter.landmarks && (
                        <p><span className="font-medium">Landmarks:</span> {selectedCenter.landmarks}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">Status & Statistics</h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status:</span> 
                      <Badge className={(selectedCenter.isActive !== false && selectedCenter.is_active !== false) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {(selectedCenter.isActive !== false && selectedCenter.is_active !== false) ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <p><span className="font-medium">Students:</span> {selectedCenter.studentCount || selectedCenter.student_count || 0}</p>
                  </div>
                  <div className="space-y-2">
                    {selectedCenter.capacity && (
                      <p><span className="font-medium">Capacity:</span> {selectedCenter.capacity || 'N/A'}</p>
                    )}
                    <p><span className="font-medium">Created:</span> {new Date(selectedCenter.createdAt || selectedCenter.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}