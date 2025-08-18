import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Download, Users, TrendingUp, TrendingDown, Phone, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface AttendanceReport {
  studentId: string;
  studentName: string;
  class: string;
  centerName: string;
  village: string;
  mandal: string;
  district: string;
  daysPresent: number;
  daysAbsent: number;
  attendancePercentage: number;
  parentContact: {
    fatherMobile: string;
    motherMobile?: string;
  };
}

interface AttendanceTrend {
  date: string;
  presentCount: number;
  totalStudents: number;
  attendancePercentage: number;
}

interface AttendanceSummary {
  totalStudents: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  averageAttendance: number;
  excellentAttendance: number; // >90%
  goodAttendance: number; // 75-90%
  poorAttendance: number; // <75%
}

interface AddressFilter {
  stateId: string;
  districtId: string;
  mandalId: string;
  villageId: string;
  centerId: string;
  classId: string;
}

export default function AttendanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState<AddressFilter>({
    stateId: '',
    districtId: '',
    mandalId: '',
    villageId: '',
    centerId: '',
    classId: ''
  });

  // Fetch attendance data
  const { data: attendanceReports, isLoading } = useQuery<AttendanceReport[]>({
    queryKey: ['/api/office/attendance-reports', selectedMonth, selectedYear, filters],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<AttendanceSummary>({
    queryKey: ['/api/office/attendance-summary', selectedMonth, selectedYear, filters],
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<AttendanceTrend[]>({
    queryKey: ['/api/office/attendance-trends', selectedMonth, selectedYear, filters],
  });

  // Fetch dropdown data
  const { data: states } = useQuery({ queryKey: ['/api/admin/addresses/states'] });
  const { data: districts } = useQuery({
    queryKey: ['/api/admin/addresses/districts', filters.stateId],
    enabled: !!filters.stateId,
  });
  const { data: mandals } = useQuery({
    queryKey: ['/api/admin/addresses/mandals', filters.districtId],
    enabled: !!filters.districtId,
  });
  const { data: villages } = useQuery({
    queryKey: ['/api/admin/addresses/villages', filters.mandalId],
    enabled: !!filters.mandalId,
  });
  const { data: centers } = useQuery({
    queryKey: ['/api/so-centers/by-village', filters.villageId],
    enabled: !!filters.villageId,
  });
  const { data: classes } = useQuery({ queryKey: ['/api/classes'] });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return 'default';
    if (percentage >= 75) return 'secondary';
    return 'destructive';
  };

  const handleExport = () => {
    console.log('Exporting attendance reports...');
  };

  const resetFilters = () => {
    setFilters({
      stateId: '',
      districtId: '',
      mandalId: '',
      villageId: '',
      centerId: '',
      classId: ''
    });
  };

  // Generate month and year options
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Attendance Reports</h1>
          <p className="text-gray-600">Comprehensive attendance tracking and analysis</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.averageAttendance?.toFixed(1) || 0}%</div>
            <Progress value={summary?.averageAttendance || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excellent (&gt;90%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary?.excellentAttendance || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good (75-90%)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.goodAttendance || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Poor (&lt;75%)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.poorAttendance || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      {!trendsLoading && trends && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trends for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendancePercentage"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Attendance %"
                  />
                  <Line
                    type="monotone"
                    dataKey="presentCount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Present Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Select
              value={filters.stateId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, stateId: value, districtId: '', mandalId: '', villageId: '', centerId: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states?.map((state: any) => (
                  <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.districtId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, districtId: value, mandalId: '', villageId: '', centerId: '' }))}
              disabled={!filters.stateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {districts?.map((district: any) => (
                  <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.mandalId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, mandalId: value, villageId: '', centerId: '' }))}
              disabled={!filters.districtId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Mandal" />
              </SelectTrigger>
              <SelectContent>
                {mandals?.map((mandal: any) => (
                  <SelectItem key={mandal.id} value={mandal.id}>{mandal.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.villageId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, villageId: value, centerId: '' }))}
              disabled={!filters.mandalId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Village" />
              </SelectTrigger>
              <SelectContent>
                {villages?.map((village: any) => (
                  <SelectItem key={village.id} value={village.id}>{village.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.centerId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, centerId: value }))}
              disabled={!filters.villageId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Center" />
              </SelectTrigger>
              <SelectContent>
                {centers?.map((center: any) => (
                  <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.classId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={resetFilters} variant="outline">
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Details ({attendanceReports?.length || 0} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>SO Center</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Days Present</TableHead>
                  <TableHead>Days Absent</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceReports?.map((report, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-semibold">{report.studentName}</p>
                        <p className="text-sm text-gray-500">ID: {report.studentId}</p>
                        <Badge variant="outline" className="mt-1">{report.class}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{report.centerName}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin size={12} className="mt-1" />
                        <div>
                          <p>{report.village}</p>
                          <p className="text-gray-500">{report.mandal}, {report.district}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">{report.daysPresent}</span>
                        <TrendingUp size={14} className="text-green-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-semibold">{report.daysAbsent}</span>
                        <TrendingDown size={14} className="text-red-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getAttendanceColor(report.attendancePercentage)}`}>
                          {report.attendancePercentage.toFixed(1)}%
                        </span>
                        <Progress value={report.attendancePercentage} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone size={12} />
                          <span>F: {report.parentContact.fatherMobile}</span>
                        </div>
                        {report.parentContact.motherMobile && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone size={12} />
                            <span>M: {report.parentContact.motherMobile}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAttendanceBadgeVariant(report.attendancePercentage)}>
                        {report.attendancePercentage >= 90 ? 'Excellent' :
                         report.attendancePercentage >= 75 ? 'Good' : 'Poor'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!attendanceReports || attendanceReports.length === 0) && (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance data found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting the month/year selection or your filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}