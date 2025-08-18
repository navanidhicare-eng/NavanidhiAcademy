import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, Download, TrendingUp, BookOpen, Users, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface StudentProgress {
  id: string;
  studentId: string;
  name: string;
  class: string;
  centerName: string;
  village: string;
  mandal: string;
  district: string;
  state: string;
  totalTopics: number;
  completedTopics: number;
  progressPercentage: number;
  lastActivityDate: string;
  subjectWiseProgress: {
    subjectName: string;
    totalTopics: number;
    completedTopics: number;
    percentage: number;
  }[];
}

interface AddressFilter {
  stateId: string;
  districtId: string;
  mandalId: string;
  villageId: string;
  centerId: string;
  classId: string;
}

interface ProgressSummary {
  totalStudents: number;
  averageProgress: number;
  highPerformers: number; // >80%
  needsAttention: number; // <50%
  classWiseProgress: {
    className: string;
    averageProgress: number;
    studentCount: number;
  }[];
}

export default function ProgressReports() {
  const [filters, setFilters] = useState<AddressFilter>({
    stateId: '',
    districtId: '',
    mandalId: '',
    villageId: '',
    centerId: '',
    classId: ''
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch progress data
  const { data: progressData, isLoading } = useQuery<StudentProgress[]>({
    queryKey: ['/api/office/progress-reports', filters],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<ProgressSummary>({
    queryKey: ['/api/office/progress-summary', filters],
  });

  // Fetch dropdown data
  const { data: states = [] } = useQuery<any[]>({ queryKey: ['/api/admin/addresses/states'] });
  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts', filters.stateId],
    enabled: !!filters.stateId,
  });
  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals', filters.districtId],
    enabled: !!filters.districtId,
  });
  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages', filters.mandalId],
    enabled: !!filters.mandalId,
  });
  const { data: centers = [] } = useQuery<any[]>({
    queryKey: ['/api/so-centers/by-village', filters.villageId],
    enabled: !!filters.villageId,
  });
  const { data: classes = [] } = useQuery<any[]>({ queryKey: ['/api/classes'] });

  const toggleRowExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return 'default';
    if (percentage >= 60) return 'secondary';
    if (percentage >= 40) return 'outline';
    return 'destructive';
  };

  const handleExport = () => {
    console.log('Exporting progress reports...');
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

  // Chart colors
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  if (isLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Progress Reports</h1>
          <p className="text-gray-600">Track academic progress across all centers and classes</p>
        </div>

        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export Reports
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.averageProgress?.toFixed(1) || 0}%</div>
            <Progress value={summary?.averageProgress || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary?.highPerformers || 0}</div>
            <p className="text-xs text-gray-500">Above 80% progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.needsAttention || 0}</div>
            <p className="text-xs text-gray-500">Below 50% progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Progress Chart */}
      {summary?.classWiseProgress && summary.classWiseProgress.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.classWiseProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="className" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="averageProgress" fill="#10B981" name="Average Progress %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Distribution by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.classWiseProgress}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ className, studentCount }) => `${className}: ${studentCount}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="studentCount"
                    >
                      {summary.classWiseProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
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
                {(states || []).map((state: any) => (
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
                {(districts || []).map((district: any) => (
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
                {(mandals || []).map((mandal: any) => (
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
                {(villages || []).map((village: any) => (
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
                {(centers || []).map((center: any) => (
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
                {(classes || []).map((cls: any) => (
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

      {/* Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress Details ({progressData?.length || 0} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>SO Center</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Topics Progress</TableHead>
                  <TableHead>Progress %</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressData?.map((student) => (
                  <>
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-gray-500">ID: {student.studentId}</p>
                          <Badge variant="outline" className="mt-1">{student.class}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{student.centerName}</p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{student.village}</p>
                          <p className="text-gray-500">{student.mandal}, {student.district}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{student.completedTopics}/{student.totalTopics}</span>
                          <Progress value={(student.completedTopics / student.totalTopics) * 100} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getProgressColor(student.progressPercentage)}`}>
                            {student.progressPercentage.toFixed(1)}%
                          </span>
                          <Badge variant={getProgressBadgeVariant(student.progressPercentage)}>
                            {student.progressPercentage >= 80 ? 'Excellent' :
                             student.progressPercentage >= 60 ? 'Good' :
                             student.progressPercentage >= 40 ? 'Average' : 'Needs Help'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{new Date(student.lastActivityDate).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(student.id)}
                        >
                          {expandedRows.has(student.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Subject-wise Progress */}
                    {expandedRows.has(student.id) && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">Subject-wise Progress Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {student.subjectWiseProgress.map((subject, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-white">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{subject.subjectName}</span>
                                    <Badge variant="outline">
                                      {subject.completedTopics}/{subject.totalTopics}
                                    </Badge>
                                  </div>
                                  <Progress value={subject.percentage} className="h-2 mb-2" />
                                  <p className={`text-center text-sm font-semibold ${getProgressColor(subject.percentage)}`}>
                                    {subject.percentage.toFixed(1)}%
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

          {(!progressData || progressData.length === 0) && (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress data found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or check if students have started learning.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}