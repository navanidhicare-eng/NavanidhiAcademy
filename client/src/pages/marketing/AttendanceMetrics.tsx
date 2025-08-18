import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, TrendingUp, TrendingDown, BarChart3, Award, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface AttendanceMetric {
  id: string;
  centerName: string;
  centerId: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
  classWiseBreakdown: {
    className: string;
    totalStudents: number;
    presentCount: number;
    attendancePercentage: number;
  }[];
}

interface AttendanceSummary {
  overallAttendancePercentage: number;
  totalPresentCount: number;
  totalAbsentCount: number;
  bestPerformingCenter: {
    name: string;
    percentage: number;
  };
  attentionNeededCenters: {
    name: string;
    percentage: number;
  }[];
}

interface AttendanceTrend {
  date: string;
  attendance: number;
}

export default function AttendanceMetrics() {
  const [dateRange, setDateRange] = useState('thisMonth');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch attendance metrics
  const { data: summary, isLoading: summaryLoading } = useQuery<AttendanceSummary>({
    queryKey: ['/api/marketing/attendance-summary', dateRange],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<AttendanceMetric[]>({
    queryKey: ['/api/marketing/attendance-metrics', dateRange],
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<AttendanceTrend[]>({
    queryKey: ['/api/marketing/attendance-trends', dateRange],
  });

  const toggleRowExpansion = (centerId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(centerId)) {
      newExpandedRows.delete(centerId);
    } else {
      newExpandedRows.add(centerId);
    }
    setExpandedRows(newExpandedRows);
  };

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

  if (summaryLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Metrics</h1>
          <p className="text-gray-600">Monitor attendance across all SO Centers</p>
        </div>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="last3Months">Last 3 Months</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.overallAttendancePercentage?.toFixed(1) || 0}%
            </div>
            <Progress value={summary?.overallAttendancePercentage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Present</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary?.totalPresentCount || 0}
            </div>
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              Students attended
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary?.totalAbsentCount || 0}
            </div>
            <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
              <TrendingDown size={12} />
              Students absent
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Center</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-green-600 truncate">
              {summary?.bestPerformingCenter?.name || 'N/A'}
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summary?.bestPerformingCenter?.percentage?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention Needed Centers */}
      {summary?.attentionNeededCenters && summary.attentionNeededCenters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Centers Needing Attention (Below 75% Attendance)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.attentionNeededCenters.map((center, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                  <div>
                    <p className="font-semibold text-red-800">{center.name}</p>
                    <p className="text-sm text-red-600">{center.percentage.toFixed(1)}% attendance</p>
                  </div>
                  <Badge variant="destructive">{center.percentage.toFixed(0)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Trends Chart */}
      {!trendsLoading && trends && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
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
                    dataKey="attendance"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SO Center-wise Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>SO Center Attendance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Center Details</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.map((metric) => (
                  <>
                    <TableRow key={metric.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold">{metric.centerName}</p>
                          <p className="text-sm text-gray-500">{metric.centerId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.totalStudents}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-semibold">{metric.presentCount}</span>
                          <TrendingUp size={14} className="text-green-600" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-semibold">{metric.absentCount}</span>
                          <TrendingDown size={14} className="text-red-600" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getAttendanceColor(metric.attendancePercentage)}`}>
                            {metric.attendancePercentage.toFixed(1)}%
                          </span>
                          <Progress value={metric.attendancePercentage} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAttendanceBadgeVariant(metric.attendancePercentage)}>
                          {metric.attendancePercentage >= 90 ? 'Excellent' :
                           metric.attendancePercentage >= 75 ? 'Good' : 'Needs Attention'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRowExpansion(metric.id)}
                        >
                          {expandedRows.has(metric.id) ? 'Hide' : 'Show'} Classes
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Class-wise Breakdown */}
                    {expandedRows.has(metric.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">Class-wise Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {metric.classWiseBreakdown.map((classData, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-white">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{classData.className}</span>
                                    <Badge variant="outline">{classData.totalStudents} students</Badge>
                                  </div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-green-600">Present: {classData.presentCount}</span>
                                    <span className="text-red-600">Absent: {classData.totalStudents - classData.presentCount}</span>
                                  </div>
                                  <Progress value={classData.attendancePercentage} className="h-2" />
                                  <p className={`text-center text-sm mt-1 font-semibold ${getAttendanceColor(classData.attendancePercentage)}`}>
                                    {classData.attendancePercentage.toFixed(1)}%
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {(!metrics || metrics.length === 0) && (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance data found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try selecting a different date range.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}