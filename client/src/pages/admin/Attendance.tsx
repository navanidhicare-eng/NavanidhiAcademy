import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, TrendingUp, TrendingDown, UserCheck, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Attendance() {
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<string>('today');

  // Mock data - replace with actual API calls
  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['/api/admin/attendance', selectedCenter, selectedClass, selectedDate, dateRange],
    queryFn: async () => {
      return [
        {
          id: '1',
          date: '2025-01-08',
          centerId: '1',
          centerName: 'Main Center',
          classId: '1',
          className: 'Class 10',
          subject: 'Mathematics',
          teacherName: 'Dr. Rajesh Kumar',
          totalStudents: 25,
          presentStudents: 22,
          absentStudents: 3,
          attendancePercentage: 88,
          sessionTime: '10:00 AM - 12:00 PM',
          students: [
            { id: '1', name: 'Ravi Kumar', rollNumber: 'C10001', status: 'present' },
            { id: '2', name: 'Priya Sharma', rollNumber: 'C10002', status: 'present' },
            { id: '3', name: 'Amit Patel', rollNumber: 'C10003', status: 'absent' },
          ]
        },
        {
          id: '2',
          date: '2025-01-08',
          centerId: '2',
          centerName: 'Branch Center',
          classId: '3',
          className: 'Navodaya',
          subject: 'Science',
          teacherName: 'Ms. Priya Sharma',
          totalStudents: 20,
          presentStudents: 18,
          absentStudents: 2,
          attendancePercentage: 90,
          sessionTime: '02:00 PM - 04:00 PM',
          students: [
            { id: '4', name: 'Rajesh Singh', rollNumber: 'NV001', status: 'present' },
            { id: '5', name: 'Sunita Devi', rollNumber: 'NV002', status: 'present' },
            { id: '6', name: 'Vikram Yadav', rollNumber: 'NV003', status: 'absent' },
          ]
        },
        {
          id: '3',
          date: '2025-01-08',
          centerId: '1',
          centerName: 'Main Center',
          classId: '2',
          className: 'Class 12',
          subject: 'Physics',
          teacherName: 'Dr. Rajesh Kumar',
          totalStudents: 18,
          presentStudents: 15,
          absentStudents: 3,
          attendancePercentage: 83,
          sessionTime: '03:00 PM - 05:00 PM',
          students: [
            { id: '7', name: 'Anita Gupta', rollNumber: 'C12001', status: 'present' },
            { id: '8', name: 'Suresh Kumar', rollNumber: 'C12002', status: 'absent' },
          ]
        }
      ];
    },
  });

  const { data: summaryData = {
    totalSessions: 0,
    averageAttendance: 0,
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    trendDirection: 'up',
    trendPercentage: 0,
    centerWiseData: [],
    classWiseData: []
  }, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/admin/attendance-summary', dateRange],
    queryFn: async () => {
      return {
        totalSessions: 15,
        averageAttendance: 85.5,
        totalStudents: 150,
        totalPresent: 128,
        totalAbsent: 22,
        trendDirection: 'up',
        trendPercentage: 3.2,
        centerWiseData: [
          { centerId: '1', centerName: 'Main Center', attendance: 87.2, sessions: 8 },
          { centerId: '2', centerName: 'Branch Center', attendance: 83.1, sessions: 7 },
        ],
        classWiseData: [
          { classId: '1', className: 'Class 10', attendance: 88.0, totalStudents: 45 },
          { classId: '2', className: 'Class 12', attendance: 85.5, totalStudents: 35 },
          { classId: '3', className: 'Navodaya', attendance: 82.1, totalStudents: 40 },
          { classId: '4', className: 'POLYCET', attendance: 87.8, totalStudents: 30 },
        ]
      };
    },
  });

  // Filter attendance data
  const filteredData = attendanceData.filter(record => {
    const matchesCenter = selectedCenter === 'all' || record.centerId === selectedCenter;
    const matchesClass = selectedClass === 'all' || record.classId === selectedClass;
    const matchesDate = dateRange === 'all' || record.date === format(selectedDate, 'yyyy-MM-dd');
    
    return matchesCenter && matchesClass && matchesDate;
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 85) return 'default';
    if (percentage >= 70) return 'secondary';
    return 'destructive';
  };

  if (isLoading || summaryLoading) {
    return <div className="flex justify-center items-center h-64">Loading attendance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Monitoring</h1>
          <p className="text-gray-600 mt-1">Track student attendance across all centers and classes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.averageAttendance}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {summaryData.trendDirection === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={summaryData.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}>
                {summaryData.trendPercentage}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryData.totalPresent}</div>
            <p className="text-xs text-muted-foreground">Out of {summaryData.totalStudents} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryData.totalAbsent}</div>
            <p className="text-xs text-muted-foreground">{((summaryData.totalAbsent / summaryData.totalStudents) * 100).toFixed(1)}% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Today's sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">SO Center</label>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger>
                <SelectValue placeholder="Select center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                <SelectItem value="1">Main Center</SelectItem>
                <SelectItem value="2">Branch Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="1">Class 10</SelectItem>
                <SelectItem value="2">Class 12</SelectItem>
                <SelectItem value="3">Navodaya</SelectItem>
                <SelectItem value="4">POLYCET</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCenter('all');
                setSelectedClass('all');
                setDateRange('today');
                setSelectedDate(new Date());
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
          <p className="text-sm text-gray-600">Detailed session-wise attendance tracking</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Center</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Total Students</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Attendance %</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((record: any) => (
              <TableRow key={record.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{new Date(record.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-600">{record.sessionTime}</div>
                  </div>
                </TableCell>
                <TableCell>{record.centerName}</TableCell>
                <TableCell>{record.className}</TableCell>
                <TableCell>{record.subject}</TableCell>
                <TableCell>{record.teacherName}</TableCell>
                <TableCell className="text-center">{record.totalStudents}</TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-green-600">{record.presentStudents}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium text-red-600">{record.absentStudents}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getAttendanceBadge(record.attendancePercentage)}>
                    <span className={getAttendanceColor(record.attendancePercentage)}>
                      {record.attendancePercentage}%
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Center-wise and Class-wise Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Center-wise Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {summaryData.centerWiseData?.map((center: any) => (
                <div key={center.centerId} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{center.centerName}</div>
                    <div className="text-sm text-gray-600">{center.sessions} sessions</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getAttendanceColor(center.attendance)}`}>
                      {center.attendance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Class-wise Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {summaryData.classWiseData?.map((classData: any) => (
                <div key={classData.classId} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{classData.className}</div>
                    <div className="text-sm text-gray-600">{classData.totalStudents} students</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getAttendanceColor(classData.attendance)}`}>
                      {classData.attendance}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}