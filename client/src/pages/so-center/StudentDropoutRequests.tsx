
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, UserMinus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  className: string;
  totalFeeAmount?: string;
  paidAmount?: string;
  pendingAmount?: string;
  isActive?: boolean;
  paymentStatus?: string;
  progress?: number;
  // Additional properties that might be present in the API response
  [key: string]: any;
}

interface Class {
  id: string;
  name: string;
  description?: string;
}

export default function StudentDropoutRequests() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dropout requests
  const { data: requestsResponse = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/dropout-requests"],
    queryFn: () => apiRequest("GET", "/api/dropout-requests"),
  });
  
  // Ensure requests is always an array
  const requests = Array.isArray(requestsResponse) ? requestsResponse : [];

  // Fetch classes for dropdown - use manual fetch to avoid caching issues
  const { data: classesResponse = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes", "dropout-manual"],
    queryFn: async () => {
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  // Ensure classes is always an array
  const classes: Class[] = Array.isArray(classesResponse) ? classesResponse : [];

  // Fetch students for dropdown - use manual fetch to avoid caching issues
  const { data: studentsResponse = [], isLoading: isLoadingStudents, error: studentsError } = useQuery({
    queryKey: ["/api/students", "dropout-manual"],
    queryFn: async () => {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 0,
  });
  
  // Ensure students is always an array and filter out invalid entries
  const allStudents = useMemo(() => {
    if (!studentsResponse || !Array.isArray(studentsResponse)) {
      return [];
    }
    
    return studentsResponse.filter((student: any) => 
      student && 
      typeof student === 'object' && 
      student.id && 
      student.name && 
      student.studentId &&
      student.isActive !== false
    );
  }, [studentsResponse]);

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return allStudents;
    return allStudents.filter((student: any) => student.classId === selectedClassId);
  }, [allStudents, selectedClassId]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/dropout-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropout-requests"] });
      toast({
        title: "Success",
        description: "Dropout request submitted successfully",
      });
      handleDialogClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit dropout request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!selectedStudentId || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a student and provide a reason",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      studentId: selectedStudentId,
      reason: reason.trim(),
    });
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setSelectedClassId("");
    setSelectedStudentId("");
    setReason("");
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

  const pendingCount = requests.filter((r: DropoutRequest) => r.status === 'pending').length;
  const approvedCount = requests.filter((r: DropoutRequest) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r: DropoutRequest) => r.status === 'rejected').length;

  if (isLoadingRequests) {
    return (
      <DashboardLayout title="Student Dropout Requests" subtitle="Manage student dropout requests and track their status">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dropout requests...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Student Dropout Requests" 
      subtitle="Manage student dropout requests and track their status"
      showAddButton={true}
      onAddClick={() => setIsCreateDialogOpen(true)}
    >
      <div className="space-y-6">
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
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

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dropout Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead>Admin Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: DropoutRequest) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.studentName}
                      </TableCell>
                      <TableCell>{request.studentStudentId}</TableCell>
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
                        {request.processedDate 
                          ? new Date(request.processedDate).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {request.adminNotes ? (
                          <div className="max-w-xs truncate" title={request.adminNotes}>
                            {request.adminNotes}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {requests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserMinus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No dropout requests found.</p>
                <p className="text-sm">Submit your first dropout request to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Request Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          if (!open) handleDialogClose();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Dropout Request</DialogTitle>
              <DialogDescription>
                Submit a request to drop out a student from the SO Center
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Class Selection */}
              <div className="space-y-2">
                <Label htmlFor="class">Select Class *</Label>
                <Select 
                  value={selectedClassId} 
                  onValueChange={(value) => {
                    console.log("🎯 Class selected:", value);
                    setSelectedClassId(value);
                    setSelectedStudentId(""); // Reset student selection when class changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class first" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClasses ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading classes...
                      </SelectItem>
                    ) : classes.length === 0 ? (
                      <SelectItem value="no-classes" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classes.map((classItem: Class) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student">Select Student *</Label>
                <Select 
                  value={selectedStudentId} 
                  onValueChange={(value) => {
                    console.log("👨‍🎓 Student selected:", value);
                    setSelectedStudentId(value);
                  }}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClassId 
                        ? "Please select a class first" 
                        : isLoadingStudents 
                        ? "Loading students..." 
                        : "Choose a student"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingStudents ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading students...
                      </SelectItem>
                    ) : studentsError ? (
                      <SelectItem value="error" disabled>
                        Error loading students
                      </SelectItem>
                    ) : !selectedClassId ? (
                      <SelectItem value="no-class" disabled>
                        Please select a class first
                      </SelectItem>
                    ) : filteredStudents.length === 0 ? (
                      <SelectItem value="no-students" disabled>
                        No students found in this class
                      </SelectItem>
                    ) : (
                      filteredStudents.map((student: Student) => {
                        const totalAmount = parseFloat(student.totalFeeAmount || '0');
                        const paidAmount = parseFloat(student.paidAmount || '0');
                        const pendingAmount = totalAmount - paidAmount;
                        const hasBalance = pendingAmount > 0;
                        
                        return (
                          <SelectItem 
                            key={student.id} 
                            value={student.id}
                            disabled={hasBalance}
                          >
                            <div className="flex flex-col w-full">
                              <div className="font-medium">
                                {student.name} ({student.studentId})
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Class: {student.className}
                              </div>
                              {hasBalance && (
                                <div className="text-xs text-red-500 font-medium">
                                  ₹{pendingAmount.toFixed(2)} pending - Clear dues first
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
                
                {/* Student Balance Warning/Success */}
                {selectedStudentId && filteredStudents.length > 0 && (() => {
                  const selectedStudent = filteredStudents.find((s: Student) => s.id === selectedStudentId);
                  if (selectedStudent) {
                    const totalAmount = parseFloat(selectedStudent.totalFeeAmount || '0');
                    const paidAmount = parseFloat(selectedStudent.paidAmount || '0');
                    const pendingAmount = totalAmount - paidAmount;
                    
                    if (pendingAmount > 0) {
                      return (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-red-700 text-sm font-medium">
                            ⚠️ This student has a pending balance of ₹{pendingAmount.toFixed(2)}
                          </p>
                          <p className="text-red-600 text-xs mt-1">
                            Please clear all dues before submitting a dropout request.
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-green-700 text-sm font-medium">
                            ✅ This student has no pending balance and is eligible for dropout.
                          </p>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              
              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Dropout *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for the dropout request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={createRequestMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={createRequestMutation.isPending || !selectedStudentId || !reason.trim()}
              >
                {createRequestMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
