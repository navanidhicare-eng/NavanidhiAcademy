import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, CheckCircle, Clock, MessageSquare, Shield, Calendar, Award, Target, BookOpen, Users, TrendingUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { MathJaxComponent } from '@/components/ui/MathJax';

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

  // State for dropdown selections
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

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

  // Helper to get pending topics for a selected subject
  const getPendingTopicsForSubject = () => {
    if (!selectedSubject) return [];
    const subject = subjectProgress.find(subj => subj.name === selectedSubject);
    return subject?.pendingTopics || [];
  };

  // Helper to get details of the selected exam
  const getSelectedExamResult = () => {
    return examResults.find(exam => exam.examTitle === selectedExam);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Student Header */}
        <Card className="overflow-hidden shadow-xl border-0">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold">{student.name}</h1>
                  <p className="text-green-100 text-sm sm:text-base">
                    Student ID: {student.studentId} • Class: {student.className || student.classId}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                <p className="text-xs sm:text-sm text-green-100">Navanidhi Academy</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Attendance Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Attendance Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Last Month Attendance */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Last Month ({attendance?.previousMonth?.monthName})</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">{attendance?.previousMonth?.present || 0}</div>
                      <div className="text-xs sm:text-sm text-blue-600">Present Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-red-600">{attendance?.previousMonth?.absent || 0}</div>
                      <div className="text-xs sm:text-sm text-red-600">Absent Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-gray-600">{attendance?.previousMonth?.total || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Total Days</div>
                    </div>
                  </div>
                </div>

                {/* Current Month Attendance */}
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">This Month ({attendance?.currentMonth?.monthName})</h3>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-green-600">{attendance?.currentMonth?.present || 0}</div>
                      <div className="text-xs sm:text-sm text-green-600">Present Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-red-600">{attendance?.currentMonth?.absent || 0}</div>
                      <div className="text-xs sm:text-sm text-red-600">Absent Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-2xl font-bold text-gray-600">{attendance?.currentMonth?.total || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Total Days</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topics Progress Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Topics Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{totalTopics}</div>
                    <div className="text-xs sm:text-sm text-green-600">Total Topics</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">{completedTopics}</div>
                    <div className="text-xs sm:text-sm text-blue-600">Completed</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">{pendingTopics}</div>
                    <div className="text-xs sm:text-sm text-orange-600">Pending</div>
                  </div>
                </div>

                {/* Pending Topics Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Pending Topics by Subject:
                  </label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  >
                    <option value="">Select Subject</option>
                    {subjectProgress.map((subject) => (
                      <option key={subject.id} value={subject.name}>
                        {subject.name} ({subject.pendingTopics?.length || 0} pending)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show Pending Topics - Increased Height */}
                {selectedSubject && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">Pending Topics in {selectedSubject}:</h4>
                    <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                      {getPendingTopicsForSubject().length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No pending topics in this subject!</p>
                        </div>
                      ) : (
                        getPendingTopicsForSubject().map((topic, index) => (
                          <div key={index} className="p-3 sm:p-4 bg-orange-50 rounded-md border-l-4 border-orange-400 shadow-sm">
                            <div className="font-medium text-orange-800 text-sm sm:text-base">
                              <MathJaxComponent inline={true}>{topic.name}</MathJaxComponent>
                            </div>
                            <div className="text-xs sm:text-sm text-orange-600 mt-1">Chapter: {topic.chapterName}</div>
                            {topic.isImportant && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                                Important
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Exam Results Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Exam Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Exam Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Exam:
                  </label>
                  <select 
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                  >
                    <option value="">Select Exam</option>
                    {examResults.map((exam, index) => (
                      <option key={index} value={exam.examTitle}>
                        {exam.examTitle} - {exam.percentage}%
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show Selected Exam Details */}
                {selectedExam && getSelectedExamResult() && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3 text-sm sm:text-base">{getSelectedExamResult().examTitle}</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-white rounded-md">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">
                          {getSelectedExamResult().marksObtained}
                        </div>
                        <div className="text-xs sm:text-sm text-blue-600">Marks Obtained</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-white rounded-md">
                        <div className="text-lg sm:text-2xl font-bold text-gray-600">
                          {getSelectedExamResult().totalMarks}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">Total Marks</div>
                      </div>
                    </div>
                    <div className="mt-3 p-2 sm:p-3 bg-white rounded-md text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">
                        {getSelectedExamResult().percentage}%
                      </div>
                      <div className="text-xs sm:text-sm text-green-600">Percentage</div>
                    </div>
                    {getSelectedExamResult().examDate && (
                      <div className="mt-2 text-xs sm:text-sm text-gray-600 text-center">
                        Exam Date: {new Date(getSelectedExamResult().examDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* All Exam Results List */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">All Exam Results:</h4>
                  <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto bg-gray-50 p-3 rounded-lg border">
                    {examResults.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No exam results available</p>
                      </div>
                    ) : (
                      examResults.map((exam, index) => (
                        <div key={index} className="p-3 bg-white rounded-md border shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 text-sm sm:text-base">{exam.examTitle}</div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                {exam.marksObtained}/{exam.totalMarks} marks
                              </div>
                              {exam.examDate && (
                                <div className="text-xs text-gray-500">
                                  {new Date(exam.examDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <div className={`text-lg sm:text-xl font-bold ${
                                exam.percentage >= 80 ? 'text-green-600' :
                                exam.percentage >= 60 ? 'text-blue-600' :
                                exam.percentage >= 35 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {exam.percentage}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <Card className="text-center p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="font-semibold text-green-800 text-sm sm:text-base">Navanidhi Academy</span>
          </div>
          <p className="text-xs sm:text-sm text-green-700">
            Empowering students through quality education and continuous progress tracking
          </p>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-green-600">
            <span>📊 Real-time Progress</span>
            <span>🏆 Performance Tracking</span>
            <span>📱 Mobile Friendly</span>
          </div>
        </Card>
      </div>
    </div>
  );
}