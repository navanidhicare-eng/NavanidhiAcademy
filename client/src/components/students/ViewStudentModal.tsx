import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar,
  School,
  Users,
  CreditCard,
  QrCode,
  Edit
} from 'lucide-react';
import type { Student } from '@shared/schema';

interface ViewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export function ViewStudentModal({ isOpen, onClose, student }: ViewStudentModalProps) {
  // Fetch class name
  const { data: classData } = useQuery({
    queryKey: ['/api/classes', student?.classId],
    queryFn: async () => {
      if (!student?.classId) return null;
      const response = await fetch(`/api/classes/${student.classId}`);
      return response.json();
    },
    enabled: !!student?.classId && isOpen,
  });

  // Fetch village/address info
  const { data: villageData } = useQuery({
    queryKey: ['/api/admin/addresses/village', student?.villageId],
    queryFn: async () => {
      if (!student?.villageId) return null;
      const response = await fetch(`/api/admin/addresses/village/${student.villageId}`);
      return response.json();
    },
    enabled: !!student?.villageId && isOpen,
  });

  if (!student) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Details - {student.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {student.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{student.name}</h2>
              <p className="text-sm text-gray-600">Student ID: {student.studentId || 'Not assigned'}</p>
              <div className="flex items-center space-x-3 mt-2">
                <Badge variant={student.isActive ? "default" : "secondary"}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {student.gender}
                </Badge>
                <Badge variant="outline">
                  {student.courseType}
                </Badge>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-sm text-gray-900">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="text-sm text-gray-900 capitalize">{student.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-sm text-gray-900">{formatDate(student.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Aadhar Number</p>
                  <p className="text-sm text-gray-900">{student.aadharNumber}</p>
                </div>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Father's Name</p>
                  <p className="text-sm text-gray-900">{student.fatherName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mother's Name</p>
                  <p className="text-sm text-gray-900">{student.motherName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Father's Mobile</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {student.fatherMobile}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mother's Mobile</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {student.motherMobile || 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Father's Qualification</p>
                  <p className="text-sm text-gray-900">{student.fatherQualification || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mother's Qualification</p>
                  <p className="text-sm text-gray-900">{student.motherQualification || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Class</p>
                  <p className="text-sm text-gray-900">{classData?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Course Type</p>
                  <p className="text-sm text-gray-900 capitalize">{student.courseType}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Present School</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <School className="h-3 w-3" />
                    {student.presentSchoolName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">School Type</p>
                  <p className="text-sm text-gray-900 capitalize">{student.schoolType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Complete Address</p>
                <p className="text-sm text-gray-900">{student.address}</p>
              </div>
              {student.landmark && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Landmark</p>
                  <p className="text-sm text-gray-900">{student.landmark}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Village</p>
                <p className="text-sm text-gray-900">{villageData?.name || 'Loading...'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Primary Contact</p>
                  <p className="text-sm text-gray-900">{student.parentPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Parent Name</p>
                  <p className="text-sm text-gray-900">{student.parentName || student.fatherName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Date</p>
                  <p className="text-sm text-gray-900">{formatDate(student.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">QR Code</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    {student.qrCode || 'Not generated'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}