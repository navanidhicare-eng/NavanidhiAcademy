import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Users, TrendingUp, TrendingDown, UserCheck, Download, MapPin, Building, School } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface State {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  stateId: string;
}

interface Mandal {
  id: string;
  name: string;
  districtId: string;
}

interface Village {
  id: string;
  name: string;
  mandalId: string;
}

interface SoCenter {
  id: string;
  name: string;
  villageId: string;
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  student_id: string;
  class_name: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  student_name: string;
  student_code: string;
  class_name: string;
  center_name: string;
  center_code: string;
}

export default function Attendance() {
  // Hierarchical filter states
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // API calls for hierarchical data
  const { data: states = [] } = useQuery({
    queryKey: ['/api/locations/states'],
    enabled: true,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['/api/locations/districts', selectedState],
    queryFn: async () => {
      if (!selectedState) return [];
      const response = await fetch(`/api/locations/districts?stateId=${selectedState}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch districts');
      return response.json();
    },
    enabled: !!selectedState,
  });

  const { data: mandals = [] } = useQuery({
    queryKey: ['/api/locations/mandals', selectedDistrict],
    queryFn: async () => {
      if (!selectedDistrict) return [];
      const response = await fetch(`/api/locations/mandals?districtId=${selectedDistrict}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch mandals');
      return response.json();
    },
    enabled: !!selectedDistrict,
  });

  const { data: villages = [] } = useQuery({
    queryKey: ['/api/locations/villages', selectedMandal],
    queryFn: async () => {
      if (!selectedMandal) return [];
      const response = await fetch(`/api/locations/villages?mandalId=${selectedMandal}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch villages');
      return response.json();
    },
    enabled: !!selectedMandal,
  });

  const { data: centers = [] } = useQuery({
    queryKey: ['/api/locations/so-centers', selectedVillage],
    queryFn: async () => {
      if (!selectedVillage) return [];
      const response = await fetch(`/api/locations/so-centers?villageId=${selectedVillage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch SO centers');
      return response.json();
    },
    enabled: !!selectedVillage,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes/by-center', selectedCenter],
    queryFn: async () => {
      if (!selectedCenter) return [];
      const response = await fetch(`/api/classes/by-center?centerId=${selectedCenter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    enabled: !!selectedCenter,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students/by-filter', selectedClass, selectedCenter],
    queryFn: async () => {
      if (!selectedClass && !selectedCenter) return [];
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedCenter) params.append('centerId', selectedCenter);
      
      const response = await fetch(`/api/students/by-filter?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!(selectedClass || selectedCenter),
  });

  // Attendance data query
  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['/api/attendance', selectedStudent, selectedClass, selectedCenter, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStudent) params.append('studentId', selectedStudent);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedCenter) params.append('centerId', selectedCenter);
      if (selectedDate) params.append('date', selectedDate);
      
      const response = await fetch(`/api/attendance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!(selectedStudent || selectedClass || selectedCenter),
  });

  // Reset child selections when parent changes
  useEffect(() => {
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedCenter('');
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedState]);

  useEffect(() => {
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedCenter('');
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedDistrict]);

  useEffect(() => {
    setSelectedVillage('');
    setSelectedCenter('');
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedMandal]);

  useEffect(() => {
    setSelectedCenter('');
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedVillage]);

  useEffect(() => {
    setSelectedClass('');
    setSelectedStudent('');
  }, [selectedCenter]);

  useEffect(() => {
    setSelectedStudent('');
  }, [selectedClass]);

  // Calculate attendance statistics
  const totalPresent = attendanceData.filter((record: AttendanceRecord) => record.status === 'present').length;
  const totalAbsent = attendanceData.filter((record: AttendanceRecord) => record.status === 'absent').length;
  const totalLate = attendanceData.filter((record: AttendanceRecord) => record.status === 'late').length;
  const attendancePercentage = attendanceData.length > 0 ? Math.round((totalPresent / attendanceData.length) * 100) : 0;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Monitoring</h1>
            <p className="text-muted-foreground">
              Track student attendance with hierarchical filtering across the academy
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Hierarchical Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location & Student Filters
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select filters from left to right to narrow down attendance data
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full md:w-64"
                />
              </div>

              {/* Location Hierarchy Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto">
                {/* State */}
                <div className="space-y-2 min-w-40">
                  <Label>State</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {(states as State[]).map((state: State) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-2 min-w-40">
                  <Label>District</Label>
                  <Select 
                    value={selectedDistrict} 
                    onValueChange={setSelectedDistrict}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {(districts as District[]).map((district: District) => (
                        <SelectItem key={district.id} value={district.id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mandal */}
                <div className="space-y-2 min-w-40">
                  <Label>Mandal</Label>
                  <Select 
                    value={selectedMandal} 
                    onValueChange={setSelectedMandal}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mandals as Mandal[]).map((mandal: Mandal) => (
                        <SelectItem key={mandal.id} value={mandal.id}>
                          {mandal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Village */}
                <div className="space-y-2 min-w-40">
                  <Label>Village</Label>
                  <Select 
                    value={selectedVillage} 
                    onValueChange={setSelectedVillage}
                    disabled={!selectedMandal}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Village" />
                    </SelectTrigger>
                    <SelectContent>
                      {(villages as Village[]).map((village: Village) => (
                        <SelectItem key={village.id} value={village.id}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SO Center */}
                <div className="space-y-2 min-w-40">
                  <Label>SO Center</Label>
                  <Select 
                    value={selectedCenter} 
                    onValueChange={setSelectedCenter}
                    disabled={!selectedVillage}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select SO Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {(centers as SoCenter[]).map((center: SoCenter) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class */}
                <div className="space-y-2 min-w-40">
                  <Label>Class</Label>
                  <Select 
                    value={selectedClass} 
                    onValueChange={setSelectedClass}
                    disabled={!selectedCenter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(classes as Class[]).map((cls: Class) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student */}
                <div className="space-y-2 min-w-40">
                  <Label>Student (Optional)</Label>
                  <Select 
                    value={selectedStudent} 
                    onValueChange={setSelectedStudent}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      {(students as Student[]).map((student: Student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Statistics */}
        {attendanceData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{totalAbsent}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{totalLate}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{attendancePercentage}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </div>
                  <Users className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Attendance Records
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedStudent 
                ? `Showing attendance for selected student on ${format(new Date(selectedDate), 'MMM dd, yyyy')}`
                : `Showing attendance records based on current filters for ${format(new Date(selectedDate), 'MMM dd, yyyy')}`
              }
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading attendance data...</div>
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No attendance records found</p>
                  <p className="text-sm">
                    {!selectedCenter 
                      ? "Please select filters to view attendance data"
                      : "No attendance records for the selected filters and date"
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>SO Center</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record: AttendanceRecord) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.student_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.student_code}</Badge>
                        </TableCell>
                        <TableCell>{record.class_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {record.center_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}