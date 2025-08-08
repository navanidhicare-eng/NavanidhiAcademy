import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Eye, 
  Calendar,
  Award,
  Target
} from 'lucide-react';

export default function Teachers() {
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock data - replace with actual API calls
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/admin/teachers', selectedCenter, selectedClass],
    queryFn: async () => {
      return [
        {
          id: '1',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh.kumar@navanidhi.com',
          phone: '+91 98765 43210',
          centerId: '1',
          centerName: 'Main Center',
          subjects: ['Mathematics', 'Physics'],
          classes: ['Class 10', 'Class 12'],
          totalStudents: 45,
          lessonsCompleted: 28,
          totalLessons: 35,
          progressPercentage: 80,
          averageRating: 4.8,
          joiningDate: '2023-06-15',
          status: 'active',
          currentMonth: {
            lessonsPlanned: 12,
            lessonsCompleted: 10,
            pendingLessons: 2,
          }
        },
        {
          id: '2',
          name: 'Ms. Priya Sharma',
          email: 'priya.sharma@navanidhi.com',
          phone: '+91 98765 43211',
          centerId: '2',
          centerName: 'Branch Center',
          subjects: ['Chemistry', 'Biology'],
          classes: ['Class 10', 'Navodaya'],
          totalStudents: 32,
          lessonsCompleted: 22,
          totalLessons: 30,
          progressPercentage: 73,
          averageRating: 4.6,
          joiningDate: '2023-08-20',
          status: 'active',
          currentMonth: {
            lessonsPlanned: 10,
            lessonsCompleted: 8,
            pendingLessons: 2,
          }
        },
        {
          id: '3',
          name: 'Mr. Amit Patel',
          email: 'amit.patel@navanidhi.com',
          phone: '+91 98765 43212',
          centerId: '1',
          centerName: 'Main Center',
          subjects: ['English', 'Social Studies'],
          classes: ['Navodaya', 'POLYCET'],
          totalStudents: 28,
          lessonsCompleted: 15,
          totalLessons: 25,
          progressPercentage: 60,
          averageRating: 4.4,
          joiningDate: '2024-01-10',
          status: 'active',
          currentMonth: {
            lessonsPlanned: 8,
            lessonsCompleted: 5,
            pendingLessons: 3,
          }
        }
      ];
    },
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/admin/teacher-lessons'],
    queryFn: async () => {
      return [
        {
          id: '1',
          teacherId: '1',
          teacherName: 'Dr. Rajesh Kumar',
          subject: 'Mathematics',
          class: 'Class 10',
          topic: 'Quadratic Equations - Introduction',
          plannedDate: '2025-01-10',
          completedDate: '2025-01-10',
          status: 'completed',
          studentsPresent: 22,
          totalStudents: 25,
          lessonRating: 4.5,
        },
        {
          id: '2',
          teacherId: '1',
          teacherName: 'Dr. Rajesh Kumar',
          subject: 'Mathematics',
          class: 'Class 10',
          topic: 'Quadratic Equations - Solving Methods',
          plannedDate: '2025-01-12',
          completedDate: null,
          status: 'scheduled',
          studentsPresent: 0,
          totalStudents: 25,
          lessonRating: null,
        },
        {
          id: '3',
          teacherId: '2',
          teacherName: 'Ms. Priya Sharma',
          subject: 'Chemistry',
          class: 'Class 10',
          topic: 'Acids, Bases and Salts',
          plannedDate: '2025-01-09',
          completedDate: '2025-01-09',
          status: 'completed',
          studentsPresent: 18,
          totalStudents: 20,
          lessonRating: 4.8,
        }
      ];
    },
  });

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCenter = selectedCenter === 'all' || teacher.centerId === selectedCenter;
    const matchesClass = selectedClass === 'all' || teacher.classes.includes(selectedClass);
    
    return matchesSearch && matchesCenter && matchesClass;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (teachersLoading || lessonsLoading) {
    return <div className="flex justify-center items-center h-64">Loading teacher data...</div>;
  }

  const totalLessonsCompleted = teachers.reduce((sum, teacher) => sum + teacher.lessonsCompleted, 0);
  const totalLessonsPlanned = teachers.reduce((sum, teacher) => sum + teacher.totalLessons, 0);
  const averageProgress = totalLessonsPlanned > 0 ? (totalLessonsCompleted / totalLessonsPlanned) * 100 : 0;
  const totalStudents = teachers.reduce((sum, teacher) => sum + teacher.totalStudents, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-1">Track teaching progress and lesson completion</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">Active teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Taught</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">Out of {totalLessonsPlanned} planned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress.toFixed(1)}%</div>
            <Progress value={averageProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search Teachers</label>
            <Input
              placeholder="Search by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                <SelectItem value="Class 10">Class 10</SelectItem>
                <SelectItem value="Class 12">Class 12</SelectItem>
                <SelectItem value="Navodaya">Navodaya</SelectItem>
                <SelectItem value="POLYCET">POLYCET</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedCenter('all');
                setSelectedClass('all');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Teachers Overview</h2>
          <p className="text-sm text-gray-600">Track teaching performance and lesson completion</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Center</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>This Month</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher: any) => (
              <TableRow key={teacher.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(teacher.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-sm text-gray-600">{teacher.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{teacher.centerName}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject: string) => (
                      <Badge key={subject} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <div className="font-medium">{teacher.totalStudents}</div>
                    <div className="text-sm text-gray-600">students</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${getProgressColor(teacher.progressPercentage)}`}>
                        {teacher.progressPercentage}%
                      </span>
                      <span className="text-xs text-gray-600">
                        {teacher.lessonsCompleted}/{teacher.totalLessons}
                      </span>
                    </div>
                    <Progress value={teacher.progressPercentage} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{teacher.currentMonth.lessonsCompleted} completed</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-3 h-3 text-yellow-600" />
                      <span>{teacher.currentMonth.pendingLessons} pending</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{teacher.averageRating}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Recent Lessons */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Lessons</h2>
          <p className="text-sm text-gray-600">Latest teaching activities and lesson updates</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Planned Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.map((lesson: any) => (
              <TableRow key={lesson.id}>
                <TableCell className="font-medium">{lesson.teacherName}</TableCell>
                <TableCell>{lesson.subject}</TableCell>
                <TableCell>{lesson.class}</TableCell>
                <TableCell className="max-w-xs truncate">{lesson.topic}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(lesson.plannedDate).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={lesson.status === 'completed' ? 'default' : 
                           lesson.status === 'scheduled' ? 'secondary' : 'destructive'}
                  >
                    {lesson.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lesson.status === 'completed' ? (
                    <span className="text-sm">
                      {lesson.studentsPresent}/{lesson.totalStudents}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {lesson.lessonRating ? (
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span>{lesson.lessonRating}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}