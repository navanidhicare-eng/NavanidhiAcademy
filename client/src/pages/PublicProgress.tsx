import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, CheckCircle, Clock, MessageSquare, Shield } from 'lucide-react';

export default function PublicProgress() {
  const [, params] = useRoute('/progress/:qrCode');
  const qrCode = params?.qrCode;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/public/progress', qrCode],
    queryFn: async () => {
      const response = await fetch(`/api/public/progress/${qrCode}`);
      if (!response.ok) {
        throw new Error('Student not found');
      }
      return response.json();
    },
    enabled: !!qrCode,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <CheckCircle size={48} className="mx-auto" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Progress Not Found</h1>
            <p className="text-gray-600">
              The QR code you scanned is invalid or the student record doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, progress = [] } = data;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Calculate progress stats from real data
  const completedTopics = progress.filter((p: any) => p.status === 'learned').length;
  const totalTopics = progress.length || completedTopics; // Use actual progress data length
  const pendingTopics = totalTopics - completedTopics;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-white text-2xl" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Student Progress Report</h1>
            <p className="text-gray-600 mt-2">Real-time academic progress tracking</p>
          </div>

          {/* Student Info Card */}
          <Card className="mb-8 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {getInitials(student.name)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                    <p className="text-gray-600">Class 10 - Mathematics & Science</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
                  <p className="text-gray-600">Overall Progress</p>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-success bg-opacity-10 rounded-xl">
                  <div className="text-2xl font-bold text-success">{completedTopics}</div>
                  <p className="text-gray-600">Topics Completed</p>
                </div>
                <div className="text-center p-4 bg-warning bg-opacity-10 rounded-xl">
                  <div className="text-2xl font-bold text-warning">{pendingTopics}</div>
                  <p className="text-gray-600">Topics Pending</p>
                </div>
                <div className="text-center p-4 bg-primary bg-opacity-10 rounded-xl">
                  <div className="text-2xl font-bold text-primary">{totalTopics}</div>
                  <p className="text-gray-600">Total Topics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Progress - Mock Data */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Mathematics</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                </div>

                {/* Chapter Progress */}
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Quadratic Equations</h4>
                      <span className="px-3 py-1 bg-success bg-opacity-10 text-success text-sm font-medium rounded-full">
                        <CheckCircle className="inline mr-1" size={12} />
                        80% Complete
                      </span>
                    </div>

                    {/* Topic List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Introduction to Quadratic Equations</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-success rounded-full"></div>
                          <span className="text-xs text-gray-500">Dec 10, 2024</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">Methods of Solving</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-xs text-gray-500">Pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Feedback */}
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="text-primary mt-1" size={16} />
                        <div>
                          <p className="text-sm text-gray-700">
                            Good progress on basic concepts. Practice more word problems.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Teacher feedback - Dec 12, 2024</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 py-6">
            <p className="text-gray-600">
              <Shield className="inline mr-2" size={16} />
              This progress report is updated in real-time by Navanidhi Academy
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For any queries, contact your SO center or call academy support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
