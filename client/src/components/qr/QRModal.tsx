import { useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Share2, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import navanidhiLogoPath from '@assets/navanidhi_1755015761485.png';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export function QRModal({ isOpen, onClose, student }: QRModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<any>(null);

  if (!student) return null;

  const progressUrl = `${window.location.origin}/progress/${student.qrCode}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (qrRef.current) {
        const svg = qrRef.current.querySelector('svg');
        if (svg) {
          // Convert SVG to canvas for download
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          img.onload = () => {
            canvas.width = 200;
            canvas.height = 200;
            ctx?.drawImage(img, 0, 0);
            
            const downloadUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${student.name}-QR-Code.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: 'QR Code Downloaded',
              description: 'QR code has been saved to your device.',
            });
          };
          
          img.src = url;
        }
      }
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
      <DialogContent className="max-w-lg w-full mx-4 p-0 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <Card className="border-0 shadow-2xl green-glow">
          <div className="p-8">
            {/* Header with Navanidhi Branding */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <img 
                    src={navanidhiLogoPath} 
                    alt="Navanidhi Academy" 
                    className="h-12 w-12 object-contain"
                  />
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-green-800">Navanidhi Academy</h3>
                    <p className="text-sm text-green-600">Student Progress QR Code</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-green-50"
                >
                  <X size={16} className="text-green-600" />
                </Button>
              </div>
              
              {/* Student Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                <p className="text-green-800 font-semibold text-lg">
                  {student.name}
                </p>
                <p className="text-green-600 text-sm">
                  Class ID: {student.classId}
                </p>
              </div>
            </div>
            
            {/* QR Code Display Area with Green Theme */}
            <div className="relative">
              <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-xl flex items-center justify-center border-2 border-green-200 green-pulse shadow-lg">
                <div ref={qrRef} className="p-4">
                  <QRCodeSVG
                    value={progressUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#16a34a"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              
              {/* QR Code Info Footer */}
              <div className="text-center mb-4">
                <p className="text-green-700 font-medium text-sm">Scan for Real-time Progress</p>
                <p className="text-green-600 text-xs">High Quality QR Code</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-green-700 mb-6 text-center bg-green-50 p-3 rounded-lg">
              Parents can scan this QR code to view real-time progress updates without needing to log in
            </p>

            {/* Action Buttons with Green Theme */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center border-green-300 text-green-700 hover:bg-green-50 hover-lift"
              >
                <Download className="mr-2" size={16} />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                onClick={handleShare}
                className="flex items-center justify-center green-gradient text-white hover:opacity-90 hover-lift"
              >
                <Share2 className="mr-2" size={16} />
                Share
              </Button>
            </div>

            {/* Additional Info with Green Theme */}
            <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 text-center font-medium">
                💡 Tip: Print this QR code and give it to parents for easy access to progress updates
              </p>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
