import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, QrCode, X } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export function QRModal({ isOpen, onClose, student }: QRModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!student) return null;

  const progressUrl = `${window.location.origin}/progress/${student.qrCode}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // In a real implementation, this would generate and download the QR code
      // For now, we'll simulate the download
      toast({
        title: 'QR Code Downloaded',
        description: 'QR code has been saved to your device.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download QR code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${student.name} - Progress Tracker`,
          text: `View ${student.name}'s academic progress in real-time`,
          url: progressUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(progressUrl);
        toast({
          title: 'Link Copied',
          description: 'Progress link has been copied to clipboard.',
        });
      }
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Failed to share QR code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full mx-4 p-0" onClick={(e) => e.stopPropagation()}>
        <Card className="border-0 shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Student Progress QR Code</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Student Info */}
            <div className="text-center mb-6">
              <p className="text-gray-600 font-medium">
                {student.name} - {student.classId}
              </p>
            </div>
            
            {/* QR Code Display Area */}
            <div className="w-48 h-48 mx-auto mb-6 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <QrCode className="text-gray-400 mx-auto mb-2" size={48} />
                <p className="text-sm text-gray-500 font-medium">QR Code</p>
                <p className="text-xs text-gray-400 mt-2 max-w-[180px] break-all">
                  {progressUrl}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-6 text-center">
              Parents can scan this QR code to view real-time progress updates without needing to log in
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Download className="mr-2" size={16} />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                onClick={handleShare}
                className="flex items-center justify-center bg-primary text-white hover:bg-blue-700"
              >
                <Share2 className="mr-2" size={16} />
                Share
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 text-center">
                💡 Tip: Print this QR code and give it to parents for easy access to progress updates
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
