
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
  Users,
  School,
  Heart,
  IdCard,
  Home
} from 'lucide-react';
import { QRModal } from '../qr/QRModal';

interface ViewStudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export function ViewStudentDetailsModal({ isOpen, onClose, student }: ViewStudentDetailsModalProps) {
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch detailed student data including siblings
  const { data: studentDetails, isLoading } = useQuery({
    queryKey: ['/api/admin/students', student?.id, 'details'],
    queryFn: async () => {
      if (!student?.id) return null;
      const response = await apiRequest('GET', `/api/admin/students/${student.id}/details`);
      return response.json();
    },
    enabled: !!student?.id && isOpen,
  });

  // Fetch siblings separately
  const { data: siblings = [] } = useQuery({
    queryKey: ['/api/students', student?.id, 'siblings'],
    queryFn: async () => {
      if (!student?.id) return [];
      const response = await apiRequest('GET', `/api/students/${student.id}/siblings`);
      return response.json();
    },
    enabled: !!student?.id && isOpen,
  });

  if (!student) return null;

  const handleDownloadQR = () => {
    setShowQRModal(true);
  };

  // Use detailed student data with fallback to original student data
  const combinedStudent = {
    ...student,
    ...(studentDetails?.student || {})
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Student Details - {combinedStudent.name}
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
                    <p className="font-medium">{combinedStudent.name}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span>Student ID</span>
                    </div>
                    <p className="font-medium">{combinedStudent.studentId}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <IdCard className="h-4 w-4" />
                      <span>Aadhar Number</span>
                    </div>
                    <p className="font-medium">{combinedStudent.aadharNumber || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span>Class</span>
                    </div>
                    <Badge variant="outline">{combinedStudent.className}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Date of Birth</span>
                    </div>
                    <p className="font-medium">{combinedStudent.dateOfBirth ? new Date(combinedStudent.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Gender</span>
                    </div>
                    <p className="font-medium capitalize">{combinedStudent.gender || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Family Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Family Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>Father's Name</span>
                    </div>
                    <p className="font-medium">{combinedStudent.fatherName || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Heart className="h-4 w-4" />
                      <span>Mother's Name</span>
                    </div>
                    <p className="font-medium">{combinedStudent.motherName || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Father's Mobile</span>
                    </div>
                    <p className="font-medium">{combinedStudent.fatherMobile || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Mother's Mobile</span>
                    </div>
                    <p className="font-medium">{combinedStudent.motherMobile || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>Father's Qualification</span>
                    </div>
                    <p className="font-medium">{combinedStudent.fatherQualification || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>Mother's Qualification</span>
                    </div>
                    <p className="font-medium">{combinedStudent.motherQualification || 'Not provided'}</p>
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
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </div>
                    <p className="font-medium">{combinedStudent.parentPhone || combinedStudent.fatherMobile || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Home className="h-4 w-4" />
                      <span>Address</span>
                    </div>
                    <p className="font-medium">{combinedStudent.address || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <p className="font-medium">
                      {combinedStudent.villageName || 'Village not provided'}, {' '}
                      {combinedStudent.mandalName || 'Mandal not provided'}, {' '}
                      {combinedStudent.districtName || 'District not provided'}, {' '}
                      {combinedStudent.stateName || 'State not provided'}
                    </p>
                  </div>

                  {combinedStudent.landmark && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Landmark</span>
                      </div>
                      <p className="font-medium">{combinedStudent.landmark}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* School Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    School Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <School className="h-4 w-4" />
                      <span>Present School Name</span>
                    </div>
                    <p className="font-medium">{combinedStudent.presentSchoolName || 'Not provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>School Type</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {combinedStudent.schoolType || 'Not provided'}
                    </Badge>
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
                    <p className="font-medium">
                      {combinedStudent.soCenterName || 'Not assigned'}
                      {combinedStudent.soCenterCode && (
                        <span className="text-sm text-gray-500 ml-2">({combinedStudent.soCenterCode})</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Enrollment Date</span>
                    </div>
                    <p className="font-medium">
                      {combinedStudent.enrollmentDate 
                        ? new Date(combinedStudent.enrollmentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })
                        : 'Not provided'
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>Course Type</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {combinedStudent.courseType === 'monthly' ? 'Monthly' : 
                       combinedStudent.courseType === 'yearly' ? 'Yearly' : 
                       combinedStudent.courseType || 'Monthly'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <Badge variant={combinedStudent.isActive ? "default" : "secondary"}>
                      {combinedStudent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span>Admission Fee</span>
                    </div>
                    <Badge variant={combinedStudent.admissionFeePaid ? "default" : "destructive"}>
                      {combinedStudent.admissionFeePaid ? "Paid" : "Not Paid"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Siblings Information */}
              {siblings && siblings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Siblings Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {siblings.map((sibling: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <h4 className="font-medium text-gray-800 mb-3">Sibling {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <span className="text-sm text-gray-600">Name:</span>
                              <p className="font-medium">{sibling.name}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Class:</span>
                              <p className="font-medium">{sibling.className}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">School:</span>
                              <p className="font-medium">{sibling.schoolName}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">School Type:</span>
                              <Badge variant="outline" className="capitalize">
                                {sibling.schoolType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Summary */}
              {(studentDetails?.student?.progressSummary || combinedStudent.progressSummary) && (
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
                          {(studentDetails?.student?.progressSummary?.totalTopics || combinedStudent.progressSummary?.totalTopics) || 0}
                        </div>
                        <div className="text-sm text-green-600">Total Topics</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(studentDetails?.student?.progressSummary?.completedTopics || combinedStudent.progressSummary?.completedTopics) || 0}
                        </div>
                        <div className="text-sm text-blue-600">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {(studentDetails?.student?.progressSummary?.pendingTopics || combinedStudent.progressSummary?.pendingTopics) || 0}
                        </div>
                        <div className="text-sm text-orange-600">Pending</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(studentDetails?.student?.progressSummary?.completionPercentage || combinedStudent.progressSummary?.completionPercentage) || 0}%
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
                        QR Code: {combinedStudent.qrCode || 'Not generated'}
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
          student={combinedStudent}
        />
      )}
    </>
  );
}
