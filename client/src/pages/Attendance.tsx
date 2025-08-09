import React, { useState, useEffect } from 'react';
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
import { Calendar, Users, CheckCircle, XCircle, CalendarOff, Info } from 'lucide-react';
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
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent' | 'not_posted'>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<string, { status: string; id: string }>>({});
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

  // Fetch existing attendance when class or date changes
  const { data: existingAttendanceData = {} } = useQuery({
    queryKey: ['/api/attendance/existing', attendanceDate, selectedClass],
    queryFn: async () => {
      if (!selectedClass || classStudents.length === 0) return {};
      
      const studentIds = classStudents.map(s => s.id).join(',');
      const response = await fetch(`/api/attendance/existing?date=${attendanceDate}&studentIds=${studentIds}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch existing attendance');
      return response.json();
    },
    enabled: !!selectedClass && classStudents.length > 0,
  });

  // Update existingAttendance when data changes
  React.useEffect(() => {
    setExistingAttendance(existingAttendanceData);
    
    // Initialize attendance status for students without existing records
    const newAttendanceStatus: Record<string, 'present' | 'absent' | 'not_posted'> = {};
    classStudents.forEach(student => {
      if (existingAttendanceData[student.id]) {
        newAttendanceStatus[student.id] = existingAttendanceData[student.id].status as 'present' | 'absent';
      } else {
        newAttendanceStatus[student.id] = 'not_posted';
      }
    });
    setAttendanceStatus(newAttendanceStatus);
  }, [existingAttendanceData, classStudents]);

  // Clear attendance status when class changes
  React.useEffect(() => {
    setAttendanceStatus({});
  }, [selectedClass]);

  // Submit attendance mutation
  const submitAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: any) => {
      return await apiRequest('POST', '/api/attendance/submit', attendanceData);
    },
    onSuccess: (data) => {
      toast({
        title: "Attendance Submitted Successfully!",
        description: `Attendance has been recorded for the selected students`,
        variant: "default"
      });
      setAttendanceStatus({});
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/existing'] });
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
      return await apiRequest('POST', '/api/attendance/holiday', holidayData);
    },
    onSuccess: (data) => {
      toast({
        title: "Holiday Marked Successfully!",
        description: `Holiday marked for all students in the class`,
        variant: "default"
      });
      setShowConfirmHoliday(false);
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/existing'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark Holiday",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle individual student attendance marking
  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    // Check if already marked in database
    if (existingAttendance[studentId] && existingAttendance[studentId].status !== 'not_posted') {
      toast({
        title: "Already Marked",
        description: `Attendance already marked as ${existingAttendance[studentId].status}`,
        variant: "default"
      });
      return;
    }

    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Clear individual student attendance
  const handleClearAttendance = (studentId: string) => {
    setAttendanceStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[studentId];
      return newStatus;
    });
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

    // Only submit records for students that have been marked
    const recordsToSubmit = classStudents
      .filter(student => attendanceStatus[student.id] && attendanceStatus[student.id] !== 'not_posted')
      .map((student: Student) => ({
        studentId: student.id,
        status: attendanceStatus[student.id]
      }));

    if (recordsToSubmit.length === 0) {
      toast({
        title: "No Attendance to Submit",
        description: "Please mark attendance for at least one student",
        variant: "destructive"
      });
      return;
    }

    submitAttendanceMutation.mutate({
      date: attendanceDate,
      classId: classStudents[0]?.classId,
      records: recordsToSubmit
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
              <Label>Date (Display Only)</Label>
              <input
                type="date"
                value={attendanceDate}
                readOnly
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
                title="Date cannot be changed - shows current date"
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
                  Present: {Object.values(attendanceStatus).filter(s => s === 'present').length} | 
                  Absent: {Object.values(attendanceStatus).filter(s => s === 'absent').length} | 
                  Not Posted: {classStudents.length - Object.keys(attendanceStatus).length}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Instructions:</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Click "Present" or "Absent" for each student. Unselected students will remain "Not Posted". 
                  Click "Submit Attendance" when done to save all marked attendance to database.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {classStudents.map((student: Student) => {
                  const currentStatus = attendanceStatus[student.id] || 'not_posted';
                  const isAlreadyMarked = existingAttendance[student.id] && existingAttendance[student.id].status !== 'not_posted';
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        currentStatus === 'present'
                          ? 'bg-green-50 border-green-200'
                          : currentStatus === 'absent'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.studentId}</p>
                        {isAlreadyMarked && (
                          <p className="text-xs text-blue-600 font-semibold">
                            Already Marked: {existingAttendance[student.id].status.toUpperCase()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === 'present' ? "default" : "outline"}
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          disabled={isAlreadyMarked}
                          className="min-w-[80px]"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'absent' ? "default" : "outline"}
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          disabled={isAlreadyMarked}
                          className="min-w-[80px]"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                        {currentStatus !== 'not_posted' && !isAlreadyMarked && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleClearAttendance(student.id)}
                            className="min-w-[60px]"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      <div className="w-24 text-center">
                        {currentStatus === 'present' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            PRESENT
                          </span>
                        )}
                        {currentStatus === 'absent' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ABSENT
                          </span>
                        )}
                        {currentStatus === 'not_posted' && !isAlreadyMarked && (
                          <span className="text-gray-500 text-sm">Not Posted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
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