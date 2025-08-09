import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [selectedFeeType, setSelectedFeeType] = useState<'monthly' | 'yearly'>('monthly');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<PaymentHistory[]>([]);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students']
  });

  // Fetch class fees
  const { data: classFees = [] } = useQuery({
    queryKey: ['/api/class-fees']
  });

  // Calculate fee amount and pending amount
  const calculateFeeAmount = () => {
    if (!selectedStudent) return { feeAmount: 0, pendingAmount: 0 };
    
    const classFee = classFees.find((fee: ClassFee) => 
      fee.classId === (selectedStudent as any).classId && fee.courseType === selectedFeeType
    );
    
    if (!classFee) return { feeAmount: 0, pendingAmount: 0 };
    
    const feeAmount = selectedFeeType === 'monthly' 
      ? parseFloat(classFee.monthlyFee || '0')
      : parseFloat(classFee.yearlyFee || '0');
    
    const paidAmount = parseFloat(paymentAmount || '0');
    const pendingAmount = Math.max(0, feeAmount - paidAmount);
    
    return { feeAmount, pendingAmount };
  };

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('/api/payments/process', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
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
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      
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
      const response = await apiRequest(`/api/students/${studentId}/payments`);
      setSelectedStudentHistory(response);
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

    const { feeAmount } = calculateFeeAmount();
    
    processPaymentMutation.mutate({
      studentId: selectedStudent.id,
      amount: parseFloat(paymentAmount),
      feeType: selectedFeeType,
      receiptNumber,
      expectedFeeAmount: feeAmount
    });
  };

  // Send WhatsApp invoice
  const sendWhatsAppInvoice = () => {
    if (!invoiceData || !selectedStudent) return;

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
    const whatsappUrl = `https://wa.me/${selectedStudent.parentPhone}?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: "Invoice details ready to send",
      variant: "default"
    });
  };

  const { feeAmount, pendingAmount } = calculateFeeAmount();

  return (
    <DashboardLayout>
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
            {/* Student Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Student</Label>
                <Select onValueChange={(studentId) => {
                  const student = students.find((s: Student) => s.id === studentId);
                  setSelectedStudent(student);
                  setSelectedFeeType(student?.courseType || 'monthly');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.studentId}) - {student.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fee Type</Label>
                <Select 
                  value={selectedFeeType} 
                  onValueChange={(value: 'monthly' | 'yearly') => setSelectedFeeType(value)}
                  disabled={!selectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Fee</SelectItem>
                    <SelectItem value="yearly">Yearly Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee Details */}
            {selectedStudent && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Fee Details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Expected Fee</p>
                    <p className="font-bold text-lg">₹{feeAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount Paying</p>
                    <p className="font-bold text-lg">₹{parseFloat(paymentAmount || '0').toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pending Amount</p>
                    <p className={`font-bold text-lg ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{pendingAmount.toLocaleString()}
                    </p>
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