import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BookOpen, Clock, Users, MapPin, Phone, Calendar, DollarSign } from 'lucide-react';
import type { Teacher } from '@shared/schema';

interface TeacherDetailViewProps {
  teacher: Teacher;
}

export function TeacherDetailView({ teacher }: TeacherDetailViewProps) {
  // Fetch teacher's subjects
  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ['/api/admin/teachers', teacher.id, 'subjects'],
  });

  // Fetch teacher's classes
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['/api/admin/teachers', teacher.id, 'classes'],
  });

  // Fetch teacher's daily records
  const { data: teachingRecords = [] } = useQuery({
    queryKey: ['/api/admin/teachers', teacher.id, 'records'],
  });

  // Calculate stats
  const totalHours = teachingRecords.reduce((sum: number, record: any) => sum + record.teachingDuration, 0);
  const avgDailyHours = teachingRecords.length > 0 ? (totalHours / 60 / teachingRecords.length).toFixed(1) : '0';
  const uniqueDays = new Set(teachingRecords.map((r: any) => r.recordDate)).size;

  return (
    <div className="space-y-6">
      {/* Teacher Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{teacher.name}</h3>
                <p className="text-gray-600">Father: {teacher.fatherName}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">DOB: {new Date(teacher.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{teacher.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{teacher.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">₹{parseFloat(teacher.salary).toLocaleString()} 
                  <Badge variant="outline" className="ml-2">
                    {teacher.salaryType.toUpperCase()}
                  </Badge>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Teaching Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{teachingRecords.length}</div>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uniqueDays}</div>
                <p className="text-sm text-gray-600">Days Taught</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.round(totalHours / 60)}</div>
                <p className="text-sm text-gray-600">Total Hours</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{avgDailyHours}</div>
                <p className="text-sm text-gray-600">Avg Hours/Day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="records">Teaching Records</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teacherSubjects.length > 0 ? (
                    teacherSubjects.map((subject: any) => (
                      <Badge key={subject.id} variant="secondary" className="mr-2 mb-2">
                        {subject.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No subjects assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assigned Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teacherClasses.length > 0 ? (
                    teacherClasses.map((classItem: any) => (
                      <Badge key={classItem.id} variant="outline" className="mr-2 mb-2">
                        {classItem.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No classes assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teaching Records Tab */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Teaching Records</CardTitle>
            </CardHeader>
            <CardContent>
              {teachingRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Class</th>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-left">Topic</th>
                        <th className="px-4 py-2 text-left">Duration</th>
                        <th className="px-4 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {teachingRecords.slice(0, 10).map((record: any) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(record.recordDate).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{record.className || 'N/A'}</td>
                          <td className="px-4 py-2">{record.subjectName || 'N/A'}</td>
                          <td className="px-4 py-2">{record.topicName || record.chapterName || 'N/A'}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">
                              {Math.round(record.teachingDuration / 60)}h {record.teachingDuration % 60}m
                            </Badge>
                          </td>
                          <td className="px-4 py-2 max-w-xs truncate">{record.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {teachingRecords.length > 10 && (
                    <p className="text-sm text-gray-500 mt-4 text-center">
                      Showing 10 of {teachingRecords.length} records
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No teaching records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No daily teaching records have been added for this teacher yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teaching Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Schedule Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Schedule management feature coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}