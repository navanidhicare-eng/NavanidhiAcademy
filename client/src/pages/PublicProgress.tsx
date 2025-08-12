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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with enhanced design */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <GraduationCap className="text-white text-3xl" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Student Progress Report</h1>
            <p className="text-gray-200 text-lg">Real-time academic progress tracking powered by Navanidhi Academy</p>
          </div>

          {/* Enhanced Student Info Card */}
          <Card className="mb-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {getInitials(student.name)}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">{student.name}</h2>
                    <p className="text-gray-600 font-medium">{student.className || 'Academic Student'}</p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Clock size={14} className="mr-1" />
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="relative">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {overallProgress}%
                    </div>
                    <p className="text-gray-600 font-medium">Overall Progress</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-green-700 mb-1">{completedTopics}</div>
                  <p className="text-gray-700 font-medium">Topics Completed</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-orange-700 mb-1">{pendingTopics}</div>
                  <p className="text-gray-700 font-medium">Topics Pending</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-blue-700 mb-1">{totalTopics}</div>
                  <p className="text-gray-700 font-medium">Total Topics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Subject Progress */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">📊</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Academic Progress Details</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full shadow-sm" style={{width: `${overallProgress}%`}}></div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{overallProgress}%</span>
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

          {/* Enhanced Footer */}
          <div className="text-center mt-12 py-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                  <Shield className="text-white" size={16} />
                </div>
                <p className="text-gray-700 font-medium text-lg">
                  Powered by Navanidhi Academy - Real-time Progress Tracking
                </p>
              </div>
              <p className="text-gray-600 mb-3">
                This progress report is automatically updated as your child learns new topics
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Secure & Private
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Real-time Updates
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Parent Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
