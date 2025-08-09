import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, BookOpen, FileText } from 'lucide-react';

interface TeacherRecord {
  id: string;
  teacherId: string;
  recordDate: string;
  classId: string;
  subjectId: string;
  chapterId?: string;
  teachingDuration: number;
  notes?: string;
  className: string;
  subjectName: string;
  chapterTitle?: string;
  createdAt: string;
}

interface TeacherRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}

export function TeacherRecordsModal({ isOpen, onClose, teacherId, teacherName }: TeacherRecordsModalProps) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: records = [], isLoading, refetch } = useQuery<TeacherRecord[]>({
    queryKey: ['/api/admin/teachers', teacherId, 'records', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      const url = `/api/admin/teachers/${teacherId}/records${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest('GET', url);
      console.log('Teacher records API response:', response);
      return response;
    },
    enabled: isOpen && !!teacherId,
  });

  const handleDateFilter = () => {
    refetch();
  };

  // Calculate total hours taught
  const totalHours = Array.isArray(records) ? records.reduce((sum, record) => sum + (record.teachingDuration || 0), 0) : 0;

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'hh:mm a');
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Teaching Records</h2>
                <p className="text-sm text-gray-500">{teacherName}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{Math.floor(totalHours / 60)}h {totalHours % 60}m</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Teaching Time</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            {fromDate || toDate 
              ? `Filtered records ${fromDate ? `from ${formatDate(fromDate)}` : ''} ${toDate ? `to ${formatDate(toDate)}` : ''}`
              : "All teaching records for this teacher"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Modern Filter Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Date Range Filter</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <Label htmlFor="fromDate" className="text-xs text-gray-600 dark:text-gray-400">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 bg-white/70 border-blue-200"
                />
              </div>
              <div>
                <Label htmlFor="toDate" className="text-xs text-gray-600 dark:text-gray-400">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 bg-white/70 border-blue-200"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDateFilter} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  Apply Filter
                </Button>
                <Button 
                  onClick={clearDateFilter} 
                  variant="outline" 
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  Clear
                </Button>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{Array.isArray(records) ? records.length : 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Records Found</div>
              </div>
            </div>
          </div>

          {/* Modern Records Display */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-500 mt-4 font-medium">Loading teaching records...</p>
              </div>
            ) : !Array.isArray(records) || records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Records Found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {fromDate || toDate 
                    ? "No teaching records found for the selected date range. Try adjusting your filter dates." 
                    : "This teacher hasn't recorded any teaching activities yet. Records will appear here once they start logging their sessions."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(records) && records.map((record, index) => (
                  <div key={record.id} className="group">
                    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-gradient-to-r from-white to-blue-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{formatDate(record.recordDate)}</div>
                              <div className="text-xs text-gray-500">{formatTime(record.createdAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-600 font-semibold">
                              <Clock className="h-4 w-4" />
                              {Math.floor(record.teachingDuration / 60)}h {record.teachingDuration % 60}m
                            </div>
                            <div className="text-xs text-gray-500">{record.teachingDuration} minutes</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Class</div>
                            <div className="font-semibold text-gray-800">{record.className}</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Subject</div>
                            <div className="font-semibold text-gray-800">{record.subjectName}</div>
                          </div>
                        </div>
                        
                        {record.chapterTitle && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 mb-3">
                            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Chapter Covered</div>
                            <div className="font-semibold text-purple-800">{record.chapterTitle}</div>
                          </div>
                        )}
                        
                        {record.notes && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Teaching Notes
                            </div>
                            <div className="text-sm text-amber-800 leading-relaxed">{record.notes}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}