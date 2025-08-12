import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, CheckCircle, Clock, MessageSquare, Shield, Calendar, Award, Target, BookOpen, Users, TrendingUp } from 'lucide-react';

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

  const { student, progressStats, subjectProgress = [], attendance, examResults = [] } = data;
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Use the calculated stats from the backend
  const { totalTopics, completedTopics, pendingTopics, overallProgress } = progressStats || {
    totalTopics: 0,
    completedTopics: 0,
    pendingTopics: 0,
    overallProgress: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-700">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with enhanced design */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
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
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
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
                      ID: {student.studentId} • Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="relative">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
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

          {/* Attendance Section */}
          {attendance && (
            <Card className="mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Attendance Record</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Month */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <TrendingUp size={18} className="mr-2" />
                      {attendance.currentMonth.monthName}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Present Days</span>
                        <span className="font-bold text-green-600 text-lg">{attendance.currentMonth.present}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Absent Days</span>
                        <span className="font-bold text-red-600 text-lg">{attendance.currentMonth.absent}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-gray-700 font-medium">Total Days</span>
                        <span className="font-bold text-blue-600 text-lg">{attendance.currentMonth.total}</span>
                      </div>
                      {attendance.currentMonth.total > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Attendance Rate</span>
                            <span>{Math.round((attendance.currentMonth.present / attendance.currentMonth.total) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300" 
                              style={{width: `${(attendance.currentMonth.present / attendance.currentMonth.total) * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Previous Month */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar size={18} className="mr-2" />
                      {attendance.previousMonth.monthName}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Present Days</span>
                        <span className="font-bold text-green-600 text-lg">{attendance.previousMonth.present}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Absent Days</span>
                        <span className="font-bold text-red-600 text-lg">{attendance.previousMonth.absent}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-gray-700 font-medium">Total Days</span>
                        <span className="font-bold text-gray-600 text-lg">{attendance.previousMonth.total}</span>
                      </div>
                      {attendance.previousMonth.total > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Attendance Rate</span>
                            <span>{Math.round((attendance.previousMonth.present / attendance.previousMonth.total) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-gray-500 to-slate-500 h-2 rounded-full transition-all duration-300" 
                              style={{width: `${(attendance.previousMonth.present / attendance.previousMonth.total) * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exam Results Section */}
          {examResults.length > 0 && (
            <Card className="mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="text-white" size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Recent Exam Results</h3>
                </div>
                
                <div className="space-y-4">
                  {examResults.slice(0, 5).map((exam: any) => (
                    <div key={exam.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg">{exam.examTitle}</h4>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            exam.percentage >= 80 ? 'bg-green-100 text-green-800' :
                            exam.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {exam.percentage}%
                          </span>
                          <span className="text-gray-600 text-sm">
                            {exam.marksObtained}/{exam.totalMarks}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Exam Date: {new Date(exam.examDate).toLocaleDateString()}</span>
                        <span className="capitalize">Status: {exam.answeredQuestions.replace('_', ' ')}</span>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-gray-600 mt-2">{exam.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subject-wise Progress Sections */}
          {subjectProgress.length > 0 && (
            <div className="space-y-6">
              {subjectProgress.map((subject: any) => (
                <Card key={subject.id} className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="text-white" size={20} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{subject.name}</h3>
                      <div className="ml-auto flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {subject.completedTopics.length} completed, {subject.pendingTopics.length} pending
                        </span>
                      </div>
                    </div>

                    {/* Completed Topics Section */}
                    {subject.completedTopics.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                          <CheckCircle size={18} className="mr-2" />
                          Completed Topics ({subject.completedTopics.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {subject.completedTopics.map((topic: any) => (
                            <div key={topic.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-green-800">{topic.name}</span>
                                  <p className="text-xs text-green-600 mt-1">{topic.chapterName}</p>
                                  {topic.completedDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Completed: {new Date(topic.completedDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {topic.isImportant && (
                                    <Target size={14} className="text-red-500" title="Important Topic" />
                                  )}
                                  {topic.isModerate && (
                                    <Users size={14} className="text-yellow-500" title="Moderate Difficulty" />
                                  )}
                                  <CheckCircle className="text-green-500" size={16} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Topics Section */}
                    {subject.pendingTopics.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
                          <Clock size={18} className="mr-2" />
                          Pending Topics ({subject.pendingTopics.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {subject.pendingTopics.map((topic: any) => (
                            <div key={topic.id} className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-orange-800">{topic.name}</span>
                                  <p className="text-xs text-orange-600 mt-1">{topic.chapterName}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {topic.isImportant && (
                                    <Target size={14} className="text-red-500" title="Important Topic" />
                                  )}
                                  {topic.isModerate && (
                                    <Users size={14} className="text-yellow-500" title="Moderate Difficulty" />
                                  )}
                                  <Clock className="text-orange-500" size={16} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="text-center mt-12 py-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3">
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
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
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
