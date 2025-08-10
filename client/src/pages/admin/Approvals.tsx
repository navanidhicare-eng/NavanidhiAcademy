import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  IndianRupee,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface ApprovalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: any;
}

function ApprovalDetailsModal({ isOpen, onClose, approval }: ApprovalDetailsModalProps) {
  const [comments, setComments] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'approve' | 'reject' }) => {
      return apiRequest('POST', `/api/admin/approvals/${id}/${action}`, { comments });
    },
    onSuccess: (_, variables) => {
      toast({
        title: `Request ${variables.action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `The request has been successfully ${variables.action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/approvals'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process the request.',
        variant: 'destructive',
      });
    },
  });

  const handleAction = (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comments.trim()) {
      toast({
        title: 'Comments Required',
        description: 'Please provide comments when rejecting a request.',
        variant: 'destructive',
      });
      return;
    }
    approveMutation.mutate({ id: approval?.id, action });
  };

  if (!approval) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Request Type</label>
              <p className="text-sm text-gray-900">{approval.requestType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Requested By</label>
              <p className="text-sm text-gray-900">{approval.requestedBy}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount</label>
              <p className="text-sm text-gray-900 font-medium">
                ₹{approval.amount?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <Badge variant={approval.priority === 'high' ? 'destructive' : 'secondary'}>
                {approval.priority}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {approval.description}
            </p>
          </div>

          {approval.attachments && approval.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">Attachments</label>
              <div className="space-y-2">
                {approval.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{attachment.name}</span>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Comments (Optional for Approval, Required for Rejection)</label>
            <Textarea
              placeholder="Add your comments here..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleAction('reject')}
              disabled={approveMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button 
              onClick={() => handleAction('approve')}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Approvals() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Mock data - replace with actual API calls
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['/api/admin/approvals', selectedType, selectedStatus, searchTerm],
    queryFn: async () => {
      return [
        {
          id: '1',
          requestType: 'Expense Request',
          title: 'Office Supplies Purchase',
          description: 'Need to purchase whiteboard markers, erasers, and notebooks for the new batch of students.',
          amount: 5500,
          requestedBy: 'Priya Sharma',
          requestedById: '2',
          requestedDate: '2025-01-08T10:30:00',
          center: 'Branch Center',
          priority: 'medium',
          status: 'pending',
          attachments: [
            { name: 'purchase_quotation.pdf', size: '245 KB' },
            { name: 'supplier_details.jpg', size: '128 KB' }
          ]
        },
        {
          id: '2',
          requestType: 'Leave Request',
          title: 'Medical Leave Application',
          description: 'Requesting 3 days leave for medical treatment. Have doctor appointment on 15th January.',
          amount: null,
          requestedBy: 'Rajesh Kumar',
          requestedById: '1',
          requestedDate: '2025-01-07T14:20:00',
          center: 'Main Center',
          priority: 'high',
          status: 'pending',
          attachments: [
            { name: 'medical_certificate.pdf', size: '180 KB' }
          ]
        },
        {
          id: '3',
          requestType: 'Budget Approval',
          title: 'Marketing Campaign Budget',
          description: 'Request approval for Q1 marketing campaign budget including digital ads, flyers, and promotional materials.',
          amount: 25000,
          requestedBy: 'Admin User',
          requestedById: '3',
          requestedDate: '2025-01-06T09:15:00',
          center: 'All Centers',
          priority: 'low',
          status: 'approved',
          approvedBy: 'Super Admin',
          approvedDate: '2025-01-07T11:30:00',
          attachments: []
        },
        {
          id: '4',
          requestType: 'Equipment Request',
          title: 'New Projector for Classroom',
          description: 'The current projector in classroom B is not working properly. Students are having difficulty seeing the presentations clearly.',
          amount: 35000,
          requestedBy: 'Amit Patel',
          requestedById: '4',
          requestedDate: '2025-01-05T16:45:00',
          center: 'Main Center',
          priority: 'high',
          status: 'rejected',
          rejectedBy: 'Admin',
          rejectedDate: '2025-01-06T10:00:00',
          rejectionReason: 'Budget constraints for this quarter. Please re-submit next quarter.',
          attachments: [
            { name: 'projector_specs.pdf', size: '320 KB' },
            { name: 'classroom_photo.jpg', size: '450 KB' }
          ]
        }
      ];
    },
  });

  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    const matchesType = selectedType === 'all' || approval.requestType === selectedType;
    const matchesStatus = selectedStatus === 'all' || approval.status === selectedStatus;
    const matchesSearch = approval.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleViewDetails = (approval: any) => {
    setSelectedApproval(approval);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedApproval(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading approval requests...</div>;
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;
  const totalAmount = approvals.filter(a => a.amount && a.status === 'approved').reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <DashboardLayout title="Approvals" subtitle="Review and approve various requests">
      <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Request Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Expense Request">Expense Request</SelectItem>
                <SelectItem value="Leave Request">Leave Request</SelectItem>
                <SelectItem value="Budget Approval">Budget Approval</SelectItem>
                <SelectItem value="Equipment Request">Equipment Request</SelectItem>
                <SelectItem value="Salary Advance">Salary Advance</SelectItem>
                <SelectItem value="Policy Change">Policy Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedType('all');
                setSelectedStatus('pending');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Approval Requests</h2>
          <p className="text-sm text-gray-600">Review and process approval requests</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApprovals.map((approval: any) => {
              const StatusIcon = getStatusIcon(approval.status);
              return (
                <TableRow key={approval.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{approval.title}</div>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {approval.description}
                      </div>
                      {approval.attachments.length > 0 && (
                        <div className="flex items-center text-xs text-blue-600 mt-1">
                          <FileText className="w-3 h-3 mr-1" />
                          <span>{approval.attachments.length} attachment(s)</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{approval.requestType}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{approval.requestedBy}</div>
                      <div className="text-sm text-gray-600">{approval.center}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {approval.amount ? (
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="font-medium">
                          {approval.amount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(approval.priority)}>
                      {approval.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(approval.requestedDate).toLocaleDateString()}</div>
                      <div className="text-gray-600">{new Date(approval.requestedDate).toLocaleTimeString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4" />
                      <Badge variant={getStatusColor(approval.status)}>
                        {approval.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(approval)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {approval.status === 'pending' ? 'Review' : 'View'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

        <ApprovalDetailsModal 
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          approval={selectedApproval}
        />
      </div>
    </DashboardLayout>
  );
}