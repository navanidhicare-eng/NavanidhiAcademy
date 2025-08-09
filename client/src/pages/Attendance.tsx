import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Calendar, Users, CheckCircle, XCircle, CalendarOff } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  className: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [presentStudents, setPresentStudents] = useState<Set<string>>(new Set());
  const [showConfirmHoliday, setShowConfirmHoliday] = useState(false);

  // Fetch students for the SO center
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students', user?.id],
    queryFn: async () => {
      const soCenterId = user?.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : user?.id;
      const response = await fetch('/api/students?soCenterId=' + soCenterId, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  // Get unique classes
  const availableClasses = Array.from(new Set(allStudents.map((student: Student) => student.className))).filter(Boolean);

  // Filter students by selected class
  const classStudents = selectedClass ? allStudents.filter((student: Student) => student.className === selectedClass) : [];

  // Submit attendance mutation
  const submitAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      const response = await apiRequest('POST', '/api/attendance/submit', attendanceData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Attendance Submitted Successfully!",
        description: `Marked ${data.presentCount} present, ${data.absentCount} absent`,
        variant: "default"
      });
      setPresentStudents(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Attendance",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Mark holiday mutation
  const markHolidayMutation = useMutation({
    mutationFn: async (holidayData: any) => {
      const response = await apiRequest('POST', '/api/attendance/holiday', holidayData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Holiday Marked Successfully!",
        description: `Marked holiday for ${data.studentCount} students`,
        variant: "default"
      });
      setShowConfirmHoliday(false);
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark Holiday",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  const handleStudentToggle = (studentId: string) => {
    const newPresentStudents = new Set(presentStudents);
    if (newPresentStudents.has(studentId)) {
      newPresentStudents.delete(studentId);
    } else {
      newPresentStudents.add(studentId);
    }
    setPresentStudents(newPresentStudents);
  };

  const handleSubmitAttendance = () => {
    if (!selectedClass || classStudents.length === 0) {
      toast({
        title: "No Class Selected",
        description: "Please select a class first",
        variant: "destructive"
      });
      return;
    }

    const attendanceRecords = classStudents.map((student: Student) => ({
      studentId: student.id,
      classId: student.classId,
      date: attendanceDate,
      status: presentStudents.has(student.id) ? 'present' : 'absent'
    }));

    submitAttendanceMutation.mutate({
      date: attendanceDate,
      classId: classStudents[0]?.classId,
      records: attendanceRecords
    });
  };

  const handleMarkHoliday = () => {
    if (!selectedClass || classStudents.length === 0) {
      toast({
        title: "No Class Selected",
        description: "Please select a class first",
        variant: "destructive"
      });
      return;
    }

    const holidayRecords = classStudents.map((student: Student) => ({
      studentId: student.id,
      classId: student.classId,
      date: attendanceDate,
      status: 'holiday'
    }));

    markHolidayMutation.mutate({
      date: attendanceDate,
      classId: classStudents[0]?.classId,
      records: holidayRecords
    });
  };

  return (
    <DashboardLayout title="Attendance Management" subtitle="Mark daily attendance for students">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Attendance Management</h1>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date and Class Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student List */}
          {selectedClass && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students in {selectedClass} ({classStudents.length})
                </h3>
                <div className="text-sm text-gray-600">
                  Present: {presentStudents.size} | Absent: {classStudents.length - presentStudents.size}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {classStudents.map((student: Student) => (
                  <div
                    key={student.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      presentStudents.has(student.id)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <Checkbox
                      checked={presentStudents.has(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.studentId}</p>
                    </div>
                    {presentStudents.has(student.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={!selectedClass || classStudents.length === 0 || submitAttendanceMutation.isPending}
                  className="flex-1"
                >
                  {submitAttendanceMutation.isPending ? "Submitting..." : "Submit Attendance"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmHoliday(true)}
                  disabled={!selectedClass || classStudents.length === 0 || markHolidayMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CalendarOff className="h-4 w-4" />
                  Mark Holiday
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holiday Confirmation Dialog */}
      {showConfirmHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Holiday</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark {attendanceDate} as a holiday for all students in {selectedClass}?
              This will mark all {classStudents.length} students as on holiday.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmHoliday(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkHoliday}
                disabled={markHolidayMutation.isPending}
                className="flex-1"
              >
                {markHolidayMutation.isPending ? "Marking..." : "Confirm Holiday"}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}