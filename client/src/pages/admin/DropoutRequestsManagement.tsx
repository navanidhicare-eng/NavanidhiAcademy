import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DropoutRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentStudentId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  adminNotes?: string;
  soCenterName: string;
}

export default function DropoutRequestsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<DropoutRequest | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [processingStatus, setProcessingStatus] = useState<'approved' | 'rejected'>('approved');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requestsResponse = [], isLoading } = useQuery({
    queryKey: ["/api/dropout-requests"],
    queryFn: () => apiRequest("GET", "/api/dropout-requests"),
  });
  
  // Ensure requests is always an array
  const requests = Array.isArray(requestsResponse) ? requestsResponse : [];

  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNotes }: { 
      requestId: string; 
      status: 'approved' | 'rejected'; 
      adminNotes?: string; 
    }) => {
      return apiRequest("PATCH", `/api/dropout-requests/${requestId}`, { status, adminNotes });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropout-requests"] });
      toast({
        title: "Success",
        description: `Dropout request ${variables.status} successfully`,
      });
      setIsProcessDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process dropout request",
        variant: "destructive",
      });
    },
  });

  const handleProcessRequest = () => {
    if (!selectedRequest) return;

    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      status: processingStatus,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  const openProcessDialog = (request: DropoutRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setProcessingStatus(status);
    setAdminNotes("");
    setIsProcessDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.length > 0 ? requests.filter((request: DropoutRequest) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.studentName.toLowerCase().includes(searchLower) ||
      request.studentStudentId.toLowerCase().includes(searchLower) ||
      request.soCenterName.toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower)
    );
  }) : [];

  const pendingCount = requests.length > 0 ? requests.filter((r: DropoutRequest) => r.status === 'pending').length : 0;
  const approvedCount = requests.length > 0 ? requests.filter((r: DropoutRequest) => r.status === 'approved').length : 0;
  const rejectedCount = requests.length > 0 ? requests.filter((r: DropoutRequest) => r.status === 'rejected').length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dropout requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dropout Requests Management</h1>
          <p className="text-muted-foreground">
            Review and process student dropout requests from SO Centers
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, ID, SO Center, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dropout Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>SO Center</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: DropoutRequest) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.studentName}
                    </TableCell>
                    <TableCell>{request.studentStudentId}</TableCell>
                    <TableCell>{request.soCenterName}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.reason}>
                        {request.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openProcessDialog(request, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openProcessDialog(request, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {request.processedDate && (
                            <div>Processed: {new Date(request.processedDate).toLocaleDateString()}</div>
                          )}
                          {request.adminNotes && (
                            <div className="mt-1 max-w-xs truncate" title={request.adminNotes}>
                              Notes: {request.adminNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No dropout requests found.</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Request Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingStatus === 'approved' ? 'Approve' : 'Reject'} Dropout Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Student: {selectedRequest.studentName} ({selectedRequest.studentStudentId})
                  <br />
                  SO Center: {selectedRequest.soCenterName}
                  <br />
                  Reason: {selectedRequest.reason}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add any additional notes about this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProcessDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={processingStatus === 'approved' ? 'default' : 'destructive'}
              onClick={handleProcessRequest}
              disabled={processRequestMutation.isPending}
            >
              {processRequestMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {processingStatus === 'approved' ? 'Approve Request' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}