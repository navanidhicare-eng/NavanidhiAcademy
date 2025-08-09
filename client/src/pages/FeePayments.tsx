import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CreditCard, Send, Receipt, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import confetti from "canvas-confetti";

interface Student {
  id: string;
  name: string;
  studentId: string;
  className: string;
  classId: string;
  courseType: 'monthly' | 'yearly';
  parentPhone: string;
  paymentStatus: string;
  totalFeeAmount: string;
  paidAmount: string;
  pendingAmount: string;
  previousBalance: string;
  admissionFeePaid: boolean;
  enrollmentDate: string;
  progress: number;
}

interface ClassFee {
  id: string;
  classId: string;
  courseType: 'monthly' | 'yearly';
  admissionFee: string;
  monthlyFee: string;
  yearlyFee: string;
}

interface PaymentHistory {
  id: string;
  amount: string;
  paymentMethod: string;
  description: string;
  month?: string;
  year?: number;
  createdAt: string;
}

export function FeePayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [selectedFeeType, setSelectedFeeType] = useState<'monthly' | 'yearly'>('monthly');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<PaymentHistory[]>([]);

  // Get user context
  const { user } = useAuth();

  // Fetch all students for this SO center
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students', user?.id],
    queryFn: async () => {
      const soCenterId = user?.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : user?.id;
      console.log('Fetching students for fee payments SO Center:', soCenterId);
      const response = await fetch('/api/students?soCenterId=' + soCenterId, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      console.log('Fee payments response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      console.log('Fee payments students data:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data for payment tracking
  });

  // Get unique classes from students
  const availableClasses = Array.from(new Set(allStudents.map((student: Student) => student.className))).filter(Boolean);

  // Filter students by selected class
  const students = selectedClass ? allStudents.filter((student: Student) => student.className === selectedClass) : [];

  // Fetch class fees
  const { data: classFees = [] } = useQuery({
    queryKey: ['/api/class-fees']
  });

  // Calculate total due balance and fee info - using REAL DATA from Supabase
  const calculateStudentBalance = () => {
    if (!selectedStudent) return { 
      totalDue: 0, 
      admissionFee: 0, 
      previousBalance: 0, 
      monthlyFee: 0, 
      paidAmount: 0, 
      pendingAmount: 0 
    };
    
    const classFee = (classFees as ClassFee[]).find((fee: ClassFee) => 
      fee.classId === selectedStudent.classId && fee.courseType === selectedStudent.courseType
    );
    
    const admissionFee = parseFloat(classFee?.admissionFee || '0');
    const previousBalance = 0; // Removed previous balance feature
    const monthlyFee = parseFloat(classFee?.monthlyFee || '0');
    const paidAmount = parseFloat(selectedStudent.paidAmount || '0');
    const pendingAmount = parseFloat(selectedStudent.pendingAmount || '0');
    
    // Total Due = Admission Fee (if not paid)
    const totalDue = selectedStudent.admissionFeePaid ? 0 : admissionFee;
    
    return { 
      totalDue, 
      admissionFee, 
      previousBalance, 
      monthlyFee, 
      paidAmount, 
      pendingAmount: Math.max(totalDue - paidAmount, 0)
    };
  };

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest('POST', '/api/payments/process', paymentData);
      return await response.json();
    },
    onSuccess: (data) => {
      // Show confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Play PhonePe success sound
      try {
        const audio = new Audio('/phone_pe_notification_1754708520112.mp3');
        audio.play().catch(console.error);
      } catch (error) {
        console.log('PhonePe audio not available');
      }

      // Show invoice
      setInvoiceData(data);
      setShowInvoice(true);
      
      // Reset form
      setSelectedStudent(null);
      setPaymentAmount("");
      setReceiptNumber("");
      
      // Refresh data - force refetch to get updated pending amounts  
      queryClient.invalidateQueries({ queryKey: ['/api/students', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      
      // Force immediate refetch with a small delay to ensure DB has been updated
      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['/api/students', user?.id] });
        console.log('Students data refreshed after payment');
      }, 500);
      
      toast({
        title: "Payment Processed Successfully!",
        description: `₹${data.amount} added to wallet. Transaction ID: ${data.transactionId}`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing the payment",
        variant: "destructive"
      });
    }
  });

  // Fetch payment history
  const fetchPaymentHistory = async (studentId: string) => {
    try {
      const response = await apiRequest('GET', `/api/students/${studentId}/payments`);
      const data = await response.json();
      setSelectedStudentHistory(data);
      setShowPaymentHistory(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive"
      });
    }
  };

  // Handle payment submission
  const handlePayment = () => {
    if (!selectedStudent || !paymentAmount || !receiptNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const { totalDue } = calculateStudentBalance();
    
    processPaymentMutation.mutate({
      studentId: selectedStudent.id,
      amount: parseFloat(paymentAmount),
      feeType: selectedFeeType,
      receiptNumber,
      expectedFeeAmount: totalDue
    });
  };

  // Send WhatsApp invoice
  const sendWhatsAppInvoice = () => {
    if (!invoiceData) return;

    const invoiceText = `
*NAVANIDHI ACADEMY - PAYMENT RECEIPT*

Student: ${invoiceData.studentName}
Student ID: ${invoiceData.studentId}
Class: ${invoiceData.className}

Payment Details:
Amount Paid: ₹${invoiceData.amount}
Fee Type: ${invoiceData.feeType}
Receipt No: ${invoiceData.receiptNumber}
Transaction ID: ${invoiceData.transactionId}

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Thank you for your payment!
    `.trim();

    const encodedText = encodeURIComponent(invoiceText);
    
    // Get phone number from invoice data or student data - use father's mobile
    const student = students.find(s => s.studentId === invoiceData.studentId);
    const phoneNumber = invoiceData.fatherMobile || student?.fatherMobile || student?.parentPhone;
    
    console.log('WhatsApp Debug:', {
      studentId: invoiceData.studentId,
      invoiceFatherMobile: invoiceData.fatherMobile,
      studentFatherMobile: student?.fatherMobile,
      studentParentPhone: student?.parentPhone,
      finalPhoneNumber: phoneNumber
    });
    
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "WhatsApp Opened",
        description: "Invoice sent to WhatsApp successfully!",
        variant: "default"
      });
    } else {
      toast({
        title: "Phone Number Missing", 
        description: "Cannot send WhatsApp message - phone number not available",
        variant: "destructive"
      });
    }
  };

  const { totalDue, admissionFee, previousBalance, monthlyFee, paidAmount, pendingAmount } = calculateStudentBalance();

  return (
    <DashboardLayout title="Fee Payments">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Fee Payments</h1>
        </div>

        {/* Student Selection and Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Process Student Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class and Student Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Select Class</Label>
                <Select 
                  value={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value);
                    setSelectedStudent(null); // Reset student selection
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class first" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!studentsLoading && availableClasses.length > 0 && (
                  <div className="text-sm text-blue-600 mt-2">
                    {availableClasses.length} classes available
                  </div>
                )}
              </div>

              <div>
                <Label>Select Student</Label>
                <Select 
                  disabled={!selectedClass || studentsLoading || students.length === 0}
                  onValueChange={(studentId) => {
                    const student = students.find((s: Student) => s.id === studentId);
                    setSelectedStudent(student || null);
                    // Automatically set fee type based on student's registration
                    if (student) {
                      setSelectedFeeType(student.courseType);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedClass 
                        ? "Select class first" 
                        : studentsLoading 
                        ? "Loading students..." 
                        : students.length === 0 
                        ? "No students in this class" 
                        : "Choose a student"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.studentId}) - {student.courseType.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClass && !studentsLoading && students.length > 0 && (
                  <div className="text-sm text-green-600 mt-2">
                    ✓ {students.length} students in {selectedClass}
                  </div>
                )}
                {selectedClass && !studentsLoading && students.length === 0 && (
                  <div className="text-sm text-orange-600 mt-2">
                    No students found in {selectedClass}
                  </div>
                )}
              </div>

              <div>
                <Label>Fee Type</Label>
                <div className="p-3 border rounded-md bg-gray-50">
                  {selectedStudent ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {selectedStudent.courseType.charAt(0).toUpperCase() + selectedStudent.courseType.slice(1)} Fee
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Registered Type
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select student to see fee type</span>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Payment Progress Section */}
            {selectedStudent && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-2xl mb-6 text-blue-900">📊 Payment Progress Overview</h3>
                
                {/* Large Payment Progress Display */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                  <div className="text-center mb-6">
                    <h4 className="text-3xl font-bold text-gray-800 mb-2">Current Payment Status</h4>
                    <p className="text-gray-600">Student: {selectedStudent.name}</p>
                  </div>
                  
                  {/* Simplified Payment Stats - Only Paid and Pending */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                      <h5 className="text-xl font-semibold text-green-800 mb-3">Amount Paid</h5>
                      <p className="text-5xl font-bold text-green-600">₹{paidAmount.toLocaleString()}</p>
                      <p className="text-sm text-green-500 mt-2">Total payments received</p>
                    </div>
                    
                    <div className={`text-center p-8 rounded-lg border ${pendingAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <h5 className={`text-xl font-semibold mb-3 ${pendingAmount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                        Pending Amount
                      </h5>
                      <p className={`text-5xl font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString()}` : '₹0'}
                      </p>
                      <p className={`text-sm mt-2 ${pendingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {pendingAmount > 0 ? 'Outstanding balance' : 'All fees paid'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Simple Progress Bar - Paid vs Pending */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Payment Status</span>
                      <span className="text-sm font-medium text-gray-700">
                        {pendingAmount === 0 ? '100% Paid' : `₹${pendingAmount.toLocaleString()} Pending`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${
                          pendingAmount === 0 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((paidAmount / Math.max(paidAmount + pendingAmount, 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Fee Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-semibold text-gray-800 mb-3">Fee Summary</h6>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Student ID:</span>
                        <span className="font-medium">{selectedStudent.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Course Type:</span>
                        <span className="font-medium">{selectedStudent.courseType.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Paid:</span>
                        <span className="font-medium text-green-600">₹{paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Pending:</span>
                        <span className={`font-medium ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{pendingAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        📅 New monthly fees are automatically added to pending amount every month at midnight
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={!selectedStudent}
                />
              </div>
              <div>
                <Label>Receipt Number *</Label>
                <Input
                  placeholder="Enter receipt number"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  disabled={!selectedStudent}
                />
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={!selectedStudent || !paymentAmount || !receiptNumber || processPaymentMutation.isPending}
              className="w-full"
            >
              {processPaymentMutation.isPending ? "Processing..." : "Process Payment"}
            </Button>
          </CardContent>
        </Card>

        {/* Student List with Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Students & Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student: Student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.studentId} - {student.className}</p>
                    <p className="text-sm text-gray-600">Phone: {student.parentPhone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      student.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {student.paymentStatus}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchPaymentHistory(student.id)}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Modal */}
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Invoice</DialogTitle>
            </DialogHeader>
            {invoiceData && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-lg font-bold">NAVANIDHI ACADEMY</h2>
                  <p className="text-sm text-gray-600">Payment Receipt</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span className="font-semibold">{invoiceData.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student ID:</span>
                    <span>{invoiceData.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class:</span>
                    <span>{invoiceData.className}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold">₹{invoiceData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span>{invoiceData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="text-sm">{invoiceData.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={sendWhatsAppInvoice} className="flex-1">
                    <Send size={16} className="mr-2" />
                    Send WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => setShowInvoice(false)} className="flex-1">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment History Modal */}
        <Dialog open={showPaymentHistory} onOpenChange={setShowPaymentHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedStudentHistory.length === 0 ? (
                <p className="text-center text-gray-500">No payment history found</p>
              ) : (
                selectedStudentHistory.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-semibold">₹{parseFloat(payment.amount).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm capitalize">{payment.paymentMethod}</p>
                      {payment.month && <p className="text-xs text-gray-500">{payment.month} {payment.year}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}