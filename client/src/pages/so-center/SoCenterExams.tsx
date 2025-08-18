import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Calendar,
  Search,
  Filter,
  GraduationCap,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  totalMarks: number;
  duration: number;
  examDate: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  studentsRegistered: number;
  studentsCompleted: number;
}

export default function SoCenterExams() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();

  // Fetch exams data
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['/api/so-center/exams'],
    queryFn: () => apiRequest('GET', '/api/so-center/exams'),
  });

  // Fetch subjects and classes for filters
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/admin/academic/subjects'],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['/api/admin/academic/classes'],
  });

  // Filter exams based on search and filters  
  const filteredExams = (exams as Exam[]).filter((exam: Exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || exam.subject === selectedSubject;
    const matchesClass = selectedClass === 'all' || exam.class === selectedClass;
    const matchesTab = activeTab === 'all' || exam.status === activeTab;
    
    return matchesSearch && matchesSubject && matchesClass && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'ongoing': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Exams">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exams...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Exams">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
            <p className="text-gray-600">Manage and monitor exam schedules</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {(subjects as any[]).map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {(classes as any[]).map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exam Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  {activeTab === 'all' ? 'All Exams' : 
                   activeTab === 'upcoming' ? 'Upcoming Exams' :
                   activeTab === 'ongoing' ? 'Ongoing Exams' : 'Completed Exams'}
                  <Badge variant="secondary" className="ml-2">
                    {filteredExams.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredExams.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
                    <p className="text-gray-600">
                      {searchTerm || selectedSubject !== 'all' || selectedClass !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No exams are currently scheduled'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Details</TableHead>
                          <TableHead>Subject & Class</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExams.map((exam: Exam) => (
                          <TableRow key={exam.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{exam.title}</div>
                                <div className="text-sm text-gray-600">{exam.description}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {exam.totalMarks} marks • {exam.duration} minutes
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <Badge variant="outline" className="mb-1">
                                  {exam.subject}
                                </Badge>
                                <div className="text-sm text-gray-600">Class {exam.class}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div>{new Date(exam.examDate).toLocaleDateString()}</div>
                                  <div className="text-gray-600">
                                    {exam.startTime} - {exam.endTime}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span>{exam.studentsCompleted}/{exam.studentsRegistered}</span>
                                </div>
                                <div className="text-gray-600">completed</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(exam.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(exam.status)}
                                  {exam.status}
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.location.href = `/so-center/post-exam-result/${exam.id}`}
                                >
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}