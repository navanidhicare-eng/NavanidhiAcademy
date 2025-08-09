import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { insertTeacherDailyRecordSchema, type InsertTeacherDailyRecord } from '@shared/schema';
import { useState } from 'react';

interface AddTeachingRecordFormProps {
  onSuccess: () => void;
}

export function AddTeachingRecordForm({ onSuccess }: AddTeachingRecordFormProps) {
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InsertTeacherDailyRecord>({
    resolver: zodResolver(insertTeacherDailyRecordSchema),
    defaultValues: {
      recordDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch required data
  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch teacher's assigned classes
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers', selectedTeacher, 'classes'],
    enabled: !!selectedTeacher,
  });

  // Fetch teacher's assigned subjects
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/teachers', selectedTeacher, 'subjects'],
    enabled: !!selectedTeacher,
  });

  // Fetch chapters based on selected subject and class
  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ['/api/chapters', selectedSubject, selectedClass],
    queryFn: async () => {
      if (!selectedSubject || !selectedClass) return [];
      const response = await fetch(`/api/chapters/${selectedSubject}/${selectedClass}`);
      if (!response.ok) throw new Error('Failed to fetch chapters');
      return response.json();
    },
    enabled: !!selectedSubject && !!selectedClass,
  });

  // Create teaching record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: InsertTeacherDailyRecord) => {
      return apiRequest('POST', '/api/admin/teacher-records', data);
    },
    onSuccess: () => {
      toast({
        title: 'Teaching Record Added',
        description: 'Daily teaching record has been successfully recorded.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add teaching record.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertTeacherDailyRecord) => {
    createRecordMutation.mutate(data);
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    setValue('teacherId', teacherId);
    // Reset dependent selections when teacher changes
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedChapter('');
    setValue('classId', '');
    setValue('subjectId', '');
    setValue('chapterId', undefined);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setValue('classId', classId);
    // Reset subject and chapter when class changes
    setSelectedSubject('');
    setSelectedChapter('');
    setValue('subjectId', '');
    setValue('chapterId', undefined);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setValue('subjectId', subjectId);
    // Reset chapter when subject changes
    setSelectedChapter('');
    setValue('chapterId', undefined);
  };

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapter(chapterId);
    setValue('chapterId', chapterId);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teacher Selection */}
        <div>
          <Label htmlFor="teacherId">Select Teacher *</Label>
          <Select onValueChange={handleTeacherChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher: any) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.teacherId && <p className="text-sm text-red-600">{errors.teacherId.message}</p>}
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="recordDate">Teaching Date *</Label>
          <Input
            id="recordDate"
            type="date"
            {...register('recordDate')}
          />
          {errors.recordDate && <p className="text-sm text-red-600">{errors.recordDate.message}</p>}
        </div>

        {/* Class Selection */}
        <div>
          <Label htmlFor="classId">Class *</Label>
          <Select onValueChange={handleClassChange} disabled={!selectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder={selectedTeacher ? "Choose class" : "Select teacher first"} />
            </SelectTrigger>
            <SelectContent>
              {classes.length > 0 ? classes.map((classItem: any) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>
              )) : selectedTeacher ? (
                <div className="px-2 py-1 text-sm text-gray-500">No classes assigned to this teacher</div>
              ) : null}
            </SelectContent>
          </Select>
          {errors.classId && <p className="text-sm text-red-600">{errors.classId.message}</p>}
        </div>

        {/* Subject Selection */}
        <div>
          <Label htmlFor="subjectId">Subject *</Label>
          <Select onValueChange={handleSubjectChange} disabled={!selectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder={selectedTeacher ? "Choose subject" : "Select teacher first"} />
            </SelectTrigger>
            <SelectContent>
              {subjects.length > 0 ? subjects.map((subject: any) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              )) : selectedTeacher ? (
                <div className="px-2 py-1 text-sm text-gray-500">No subjects assigned to this teacher</div>
              ) : null}
            </SelectContent>
          </Select>
          {errors.subjectId && <p className="text-sm text-red-600">{errors.subjectId.message}</p>}
        </div>

        {/* Chapter Selection */}
        <div>
          <Label htmlFor="chapterId">Chapter (Optional)</Label>
          <Select onValueChange={handleChapterChange} disabled={!selectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder={selectedSubject ? "Choose chapter" : "Select subject first"} />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((chapter: any) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>



        {/* Teaching Duration */}
        <div>
          <Label htmlFor="teachingDuration">Duration (minutes) *</Label>
          <Input
            id="teachingDuration"
            type="number"
            min="1"
            max="600"
            {...register('teachingDuration', { valueAsNumber: true })}
            placeholder="e.g., 60"
          />
          {errors.teachingDuration && <p className="text-sm text-red-600">{errors.teachingDuration.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Teaching Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Add notes about what was taught, student responses, etc."
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button 
          type="submit" 
          disabled={createRecordMutation.isPending}
          className="min-w-32"
        >
          {createRecordMutation.isPending ? 'Adding...' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}