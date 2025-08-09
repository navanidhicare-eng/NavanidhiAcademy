import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, BarChart3, Users, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalHolidays: number;
  classWiseStats: {
    className: string;
    present: number;
    absent: number;
    total: number;
    percentage: number;
  }[];
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  attendanceRecords: {
    date: string;
    status: 'present' | 'absent' | 'holiday';
  }[];
  attendancePercentage: number;
  totalPresent: number;
  totalAbsent: number;
  totalDays: number;
}

export default function AttendanceReports() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  // Fetch attendance statistics
  const { data: attendanceStats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ['/api/attendance/stats', selectedMonth, selectedClass],
    queryFn: async () => {
      const soCenterId = user?.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : user?.id;
      const params = new URLSearchParams();
      if (soCenterId) params.append('soCenterId', soCenterId);
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedClass) params.append('classId', selectedClass);
      
      const response = await fetch(`/api/attendance/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance stats');
      return await response.json();
    },
    enabled: !!user && !!selectedMonth,
  });

  // Fetch students for class selection
  const { data: allStudents = [] } = useQuery({
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

  // Fetch individual student attendance report
  const { data: studentReport, isLoading: reportLoading } = useQuery<StudentAttendance>({
    queryKey: ['/api/attendance/student-report', selectedStudent, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/student-report?studentId=${selectedStudent}&month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch student report');
      return await response.json();
    },
    enabled: !!selectedStudent && !!selectedMonth,
  });

  // Get unique classes
  const availableClasses = allStudents ? Array.from(new Set(allStudents.map((student: any) => ({
    id: student.classId,
    name: student.className
  })).filter(c => c.name).map(c => JSON.stringify(c)))).map(c => JSON.parse(c)) : [];

  // Filter students by selected class
  const classStudents = selectedClass && allStudents ? allStudents.filter((student: any) => student.classId === selectedClass) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'holiday': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'holiday': return 'H';
      default: return '-';
    }
  };

  const getAttendanceSymbol = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'holiday': return 'H';
      default: return '';
    }
  };

  const getAttendanceCellColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-50 text-green-700';
      case 'absent': return 'bg-red-50 text-red-700';
      case 'holiday': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-50';
    }
  };

  // Get all days in the selected month
  const getDaysInMonth = () => {
    if (!selectedMonth) return [];
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Fetch monthly attendance report data
  const { data: monthlyReportData } = useQuery({
    queryKey: ['/api/attendance/monthly-report', selectedMonth, selectedClass],
    queryFn: async () => {
      const soCenterId = user?.role === 'so_center' ? '84bf6d19-8830-4abd-8374-2c29faecaa24' : user?.id;
      const params = new URLSearchParams();
      if (soCenterId) params.append('soCenterId', soCenterId);
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedClass) params.append('classId', selectedClass);
      
      const response = await fetch(`/api/attendance/monthly-report?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch monthly report');
      return await response.json();
    },
    enabled: !!selectedMonth && !!selectedClass && !!user,
    staleTime: 30000,
  });

  // Get student attendance for the entire month
  const getStudentMonthlyAttendance = (studentId: string) => {
    if (!monthlyReportData?.students) {
      return [];
    }
    
    const student = monthlyReportData.students.find(s => s.id === studentId);
    if (!student) return [];
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Create a map of all possible dates in the month with actual attendance data
    const monthAttendance = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const attendanceRecord = student.attendanceRecords.find(record => record.date === dateStr);
      
      monthAttendance.push({
        date: dateStr,
        status: attendanceRecord?.status || ''
      });
    }
    
    return monthAttendance;
  };

  // Download monthly report as CSV
  const downloadMonthlyReport = () => {
    if (!selectedClass || !monthlyReportData?.students.length) return;
    
    const className = availableClasses.find(c => c.id === selectedClass)?.name || 'Unknown Class';
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Create CSV content
    let csvContent = `Attendance - Class: ${className} Section: All Sections,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,Month: ${monthName}\n`;
    csvContent += `Students ↓,${getDaysInMonth().join(',')},Total Attendance,Total Present,Total Absent,Total Holiday,Total %\n`;
    
    monthlyReportData.students.forEach(student => {
      const studentAttendance = getStudentMonthlyAttendance(student.id);
      const totalPresent = studentAttendance.filter(a => a.status === 'present').length;
      const totalAbsent = studentAttendance.filter(a => a.status === 'absent').length;
      const totalHoliday = studentAttendance.filter(a => a.status === 'holiday').length;
      const totalWorkingDays = totalPresent + totalAbsent;
      const percentage = totalWorkingDays > 0 ? (totalPresent / totalWorkingDays * 100).toFixed(1) : '0.0';
      
      const row = [
        `${student.name} Roll No. ${student.studentId}`,
        ...getDaysInMonth().map(day => {
          const dayRecord = studentAttendance.find(a => new Date(a.date).getDate() === day);
          return getAttendanceSymbol(dayRecord?.status || '');
        }),
        totalPresent + totalAbsent + totalHoliday,
        totalPresent,
        totalAbsent,
        totalHoliday,
        percentage + '%'
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${className}_Attendance_${monthName.replace(' ', '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <DashboardLayout title="Attendance Reports" subtitle="View detailed attendance statistics and reports">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Attendance Reports</h1>
        </div>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Select Month</Label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <Label>Filter by Class (Optional)</Label>
              <Select value={selectedClass || 'all'} onValueChange={(value) => setSelectedClass(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id || 'unknown'}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student Report</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {classStudents.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.studentId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total Present</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {attendanceStats.totalPresent}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Total Absent</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-2">
                {attendanceStats.totalAbsent}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Holidays</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {attendanceStats.totalHolidays}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Monthly Report */}
      {selectedClass && attendanceStats && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Attendance Report - {availableClasses.find(c => c.id === selectedClass)?.name}</CardTitle>
            <Button onClick={downloadMonthlyReport} variant="outline">
              Download Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-2 text-left font-semibold">Students ↓</th>
                    {getDaysInMonth().map(day => (
                      <th key={day} className="border border-gray-300 p-1 text-center font-semibold min-w-[30px]">
                        {day}
                      </th>
                    ))}
                    <th className="border border-gray-300 p-2 text-center font-semibold">Total Attendance</th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">Total Present</th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">Total Absent</th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">Total Holiday</th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">Total %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReportData?.students.map((student) => {
                    const studentAttendance = getStudentMonthlyAttendance(student.id);
                    const totalPresent = studentAttendance.filter(a => a.status === 'present').length;
                    const totalAbsent = studentAttendance.filter(a => a.status === 'absent').length;
                    const totalHoliday = studentAttendance.filter(a => a.status === 'holiday').length;
                    const totalWorkingDays = totalPresent + totalAbsent;
                    const percentage = totalWorkingDays > 0 ? (totalPresent / totalWorkingDays * 100).toFixed(1) : '0.0';
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">
                          <div>{student.name}</div>
                          <div className="text-xs text-gray-500">Roll No. {student.studentId}</div>
                        </td>
                        {getDaysInMonth().map(day => {
                          const dayRecord = studentAttendance.find(a => new Date(a.date).getDate() === day);
                          const status = dayRecord?.status || '';
                          return (
                            <td key={day} className={`border border-gray-300 p-1 text-center font-medium ${getAttendanceCellColor(status)}`}>
                              {getAttendanceSymbol(status)}
                            </td>
                          );
                        })}
                        <td className="border border-gray-300 p-2 text-center font-medium">{totalPresent + totalAbsent + totalHoliday}</td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-green-600">{totalPresent}</td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-red-600">{totalAbsent}</td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-blue-600">{totalHoliday}</td>
                        <td className="border border-gray-300 p-2 text-center font-medium text-purple-600">{percentage}%</td>
                      </tr>
                    );
                  }) || []}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class-wise Statistics */}
      {attendanceStats?.classWiseStats && attendanceStats.classWiseStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceStats.classWiseStats.map((classStats, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{classStats.className}</h3>
                    <span className="text-sm text-gray-600">
                      {classStats.percentage.toFixed(1)}% Attendance
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-green-600">
                      Present: {classStats.present}
                    </div>
                    <div className="text-red-600">
                      Absent: {classStats.absent}
                    </div>
                    <div className="text-gray-600">
                      Total: {classStats.total}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${classStats.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Student Report */}
      {studentReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Report: {studentReport.studentName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Student Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {studentReport.attendancePercentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Attendance Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {studentReport.totalPresent}
                  </div>
                  <div className="text-sm text-gray-600">Present Days</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {studentReport.totalAbsent}
                  </div>
                  <div className="text-sm text-gray-600">Absent Days</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-600">
                    {studentReport.totalDays}
                  </div>
                  <div className="text-sm text-gray-600">Total Days</div>
                </div>
              </div>

              {/* Daily Attendance Calendar */}
              <div>
                <h4 className="font-semibold mb-3">Daily Attendance</h4>
                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {/* Calendar headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="font-semibold p-2">{day}</div>
                  ))}
                  
                  {/* Calendar days */}
                  {studentReport.attendanceRecords.map((record, index) => (
                    <div
                      key={index}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${getStatusColor(record.status)}`}
                      title={`${record.date}: ${record.status}`}
                    >
                      {getStatusText(record.status)}
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Present (P)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Absent (A)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Holiday (H)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}