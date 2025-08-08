import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, User, CreditCard, Building2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationResult {
  studentId: string;
  name: string;
  transactionId?: string;
  admissionFeePaid?: boolean;
  amount?: number;
}

interface SuccessScreenProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: RegistrationResult | null;
}

export function SuccessScreen({ isOpen, onClose, studentData }: SuccessScreenProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen && studentData) {
      // Trigger confetti animation
      setShowCelebration(true);
      
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Play success sound (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,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');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      } catch (error) {
        // Ignore audio errors
      }

      // Stop celebration after animation completes
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    }
  }, [isOpen, studentData]);

  const handleDownloadReceipt = () => {
    if (!studentData) return;

    // Create receipt content
    const receiptContent = `
NAVANIDHI ACADEMY
Student Registration Receipt

Registration Successful!
------------------------
Student Name: ${studentData.name}
Student ID: ${studentData.studentId}
Registration Date: ${new Date().toLocaleDateString()}
${studentData.admissionFeePaid ? `Transaction ID: ${studentData.transactionId}` : ''}
${studentData.admissionFeePaid ? `Admission Fee: ₹${studentData.amount}` : ''}

Thank you for choosing Navanidhi Academy!
Contact: support@navanidhi.com
    `.trim();

    // Create and download text file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${studentData.studentId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!studentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            {showCelebration && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping w-20 h-20 bg-green-200 rounded-full opacity-75"></div>
              </div>
            )}
          </div>

          {/* Success Message */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600">
              Student has been successfully registered with Navanidhi Academy
            </p>
          </div>

          {/* Student Details */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">Navanidhi Academy</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Student Name:
                  </span>
                  <span className="font-medium text-gray-900">{studentData.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Student ID:</span>
                  <span className="font-medium text-gray-900">{studentData.studentId}</span>
                </div>
                
                {studentData.admissionFeePaid && studentData.transactionId && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Transaction ID:
                    </span>
                    <span className="font-medium text-gray-900">{studentData.transactionId}</span>
                  </div>
                )}
                
                {studentData.admissionFeePaid && studentData.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Admission Fee:</span>
                    <span className="font-medium text-green-600">₹{studentData.amount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleDownloadReceipt}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button 
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500">
            A QR code has been generated for this student to track academic progress
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}