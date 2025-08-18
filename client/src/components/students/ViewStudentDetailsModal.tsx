import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Download,
  QrCode,
  Building2,
  CreditCard,
  BookOpen,
  Target,
  Users
} from 'lucide-react';
import { QRModal } from '../qr/QRModal';

interface ViewStudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export function ViewStudentDetailsModal({ isOpen, onClose, student }: ViewStudentDetailsModalProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch detailed student data
  const { data: studentDetails, isLoading } = useQuery({
    queryKey: ['/api/admin/students', student?.id, 'details'],
    queryFn: async () => {
      if (!student?.id) return null;
      const response = await apiRequest('GET', `/api/admin/students/${student.id}/details`);
      return response.json();
    },
    enabled: !!student?.id && isOpen,
  });

  if (!student) return null;

  const handleDownloadQR = () => {
    setShowQRModal(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Student Details - {student.name}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Student Name</span>
                    </div>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span>Student ID</span>
                    </div>
                    <p className="font-medium">{student.studentId}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span>Class</span>
                    </div>
                    <Badge variant="outline">{student.className}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </div>
                    <p className="font-medium">{student.fatherMobile || student.motherMobile || student.phone || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Date of Birth</span>
                    </div>
                    <p className="font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Father's Name</span>
                    </div>
                    <p className="font-medium">{student.fatherName || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Contact & Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{student.email || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>Address</span>
                    </div>
                    <p className="font-medium">
                      {student.address && student.address !== 'Not provided' 
                        ? student.address 
                        : studentDetails?.location 
                          ? `${studentDetails.location.village || ''}, ${studentDetails.location.mandal || ''}, ${studentDetails.location.district || ''}, ${studentDetails.location.state || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                          : 'Not provided'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>SO Center</span>
                    </div>
                    <p className="font-medium">{studentDetails?.soCenterName || student.soCenterName || 'Not assigned'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Enrollment Date</span>
                    </div>
                    <p className="font-medium">{studentDetails?.enrollmentDate ? new Date(studentDetails.enrollmentDate).toLocaleDateString() : student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary */}
              {studentDetails?.progressSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Progress Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {studentDetails.progressSummary.totalTopics || 0}
                        </div>
                        <div className="text-sm text-green-600">Total Topics</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {studentDetails.progressSummary.completedTopics || 0}
                        </div>
                        <div className="text-sm text-blue-600">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {studentDetails.progressSummary.pendingTopics || 0}
                        </div>
                        <div className="text-sm text-orange-600">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {studentDetails.progressSummary.completionPercentage || 0}%
                        </div>
                        <div className="text-sm text-purple-600">Progress</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* QR Code Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Generate and download QR code for student progress tracking
                      </p>
                      <p className="text-xs text-gray-500">
                        QR Code: {student.qrCode || 'Not generated'}
                      </p>
                    </div>
                    <Button onClick={handleDownloadQR} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      {showQRModal && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          student={student}
        />
      )}
    </>
  );
}