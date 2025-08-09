import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
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
    queryKey: ['/api/admin/teachers', teacherId, 'records', { fromDate, toDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      const response = await fetch(`/api/admin/teachers/${teacherId}/records?${params}`);
      if (!response.ok) throw new Error('Failed to fetch records');
      return response.json();
    },
    enabled: isOpen && !!teacherId,
  });

  const handleDateFilter = () => {
    refetch();
  };

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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Teaching Records - {teacherName}
          </DialogTitle>
          <DialogDescription>
            View daily teaching records with date-wise filtering
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDateFilter} size="sm">
                    Apply Filter
                  </Button>
                  <Button onClick={clearDateFilter} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Display */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {fromDate || toDate 
                    ? "No teaching records found for the selected date range" 
                    : "No teaching records found for this teacher"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {records.length} record{records.length !== 1 ? 's' : ''}
                </div>
                
                {records.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{formatDate(record.recordDate)}</span>
                          <Badge variant="outline" className="text-xs">
                            {formatTime(record.createdAt)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {record.teachingDuration} minutes
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Class</div>
                          <div className="font-medium">{record.className}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Subject</div>
                          <div className="font-medium">{record.subjectName}</div>
                        </div>
                      </div>
                      
                      {record.chapterTitle && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Chapter</div>
                          <div className="font-medium">{record.chapterTitle}</div>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Notes
                          </div>
                          <div className="text-sm bg-muted rounded-md p-2 mt-1">
                            {record.notes}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}