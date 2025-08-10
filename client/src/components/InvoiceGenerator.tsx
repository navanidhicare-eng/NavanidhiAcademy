import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Receipt, Copy, Share, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseInvoiceData {
  transactionId: string;
  productName: string;
  studentName: string;
  coursePrice: number;
  commissionAmount: number;
  purchaseDate: string;
  agentEmail: string;
}

interface WithdrawalInvoiceData {
  transactionId: string;
  withdrawalId: string;
  amount: number;
  paymentMode: string;
  paymentDetails: string;
  userEmail: string;
  userName: string;
  processedAt: string;
  type: 'withdrawal';
}

type InvoiceData = CourseInvoiceData | WithdrawalInvoiceData;

interface InvoiceGeneratorProps {
  invoiceData: InvoiceData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceGenerator({ invoiceData, isOpen, onClose }: InvoiceGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!invoiceData) return null;

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '₹0';
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateInvoiceText = () => {
    if ('type' in invoiceData && invoiceData.type === 'withdrawal') {
      return `
🧾 NAVANIDHI ACADEMY WITHDRAWAL RECEIPT
=====================================

📋 TRANSACTION DETAILS
Transaction ID: ${invoiceData.transactionId}
Withdrawal ID: ${invoiceData.withdrawalId}
Date & Time: ${formatDate(invoiceData.processedAt)}

💰 PAYMENT INFORMATION
Amount: ${formatCurrency(invoiceData.amount)}
Payment Mode: ${invoiceData.paymentMode.toUpperCase()}
Payment Details: ${invoiceData.paymentDetails}

👤 RECIPIENT DETAILS
Name: ${invoiceData.userName}
Email: ${invoiceData.userEmail}

✅ STATUS: APPROVED & PROCESSED
`;
    } else {
      const courseData = invoiceData as CourseInvoiceData;
      return `
🧾 NAVANIDHI ACADEMY INVOICE
================================

📋 TRANSACTION DETAILS
Transaction ID: ${courseData.transactionId}
Date & Time: ${formatDate(courseData.purchaseDate)}

👨‍🎓 COURSE INFORMATION
Course Name: ${courseData.productName}
Student Name: ${courseData.studentName}
Course Fee: ${formatCurrency(courseData.coursePrice)}

💰 COMMISSION DETAILS
Agent Email: ${courseData.agentEmail}
Commission Rate: ${((courseData.commissionAmount / courseData.coursePrice) * 100).toFixed(1)}%
Commission Amount: ${formatCurrency(courseData.commissionAmount)}

📊 PAYMENT SUMMARY
Total Course Fee: ${formatCurrency(courseData.coursePrice)}
Commission Earned: ${formatCurrency(courseData.commissionAmount)}

================================
Thank you for your business!
Navanidhi Academy Management System
`;
    }
  };

  const handleCopyInvoice = async () => {
    try {
      const invoiceText = generateInvoiceText();
      await navigator.clipboard.writeText(invoiceText);
      toast({
        title: "Invoice Copied!",
        description: "Invoice details have been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy invoice to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShareInvoice = async () => {
    try {
      const invoiceText = generateInvoiceText();
      if (navigator.share) {
        await navigator.share({
          title: 'Course Purchase Invoice',
          text: invoiceText,
        });
      } else {
        // Fallback to copy
        await navigator.clipboard.writeText(invoiceText);
        toast({
          title: "Invoice Copied!",
          description: "Invoice details copied to clipboard (sharing not supported).",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Failed to share invoice.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = () => {
    setIsGenerating(true);
    try {
      const invoiceText = generateInvoiceText();
      const blob = new Blob([invoiceText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceData.transactionId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Invoice Downloaded!",
        description: "Invoice has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download invoice.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Course Purchase Invoice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap text-gray-800">
              {generateInvoiceText()}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={handleCopyInvoice}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShareInvoice}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
            
            <Button
              onClick={handleDownloadInvoice}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Saving...' : 'Download'}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}