import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Save } from 'lucide-react';
import { MathJaxComponent } from '@/components/ui/MathJax';

export function ProgressTracker() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [topicProgress, setTopicProgress] = useState<{[key: string]: boolean}>({});

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students?soCenterId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch subjects based on selected student's class
  const { data: subjects = [] } = useQuery({
    queryKey: ['/api/subjects', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const student = students.find((s: any) => s.id === selectedStudent);
      if (!student) return [];

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/subjects/${student.classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedStudent && students.length > 0,
  });

  // Fetch chapters based on selected subject
  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/chapters', selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chapters/${selectedSubject}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedSubject,
  });

  // Fetch topics based on selected chapter
  const { data: topics = [] } = useQuery({
    queryKey: ['/api/topics', selectedChapter],
    queryFn: async () => {
      if (!selectedChapter) return [];
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/topics/${selectedChapter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedChapter,
  });

  // Filter out already completed topics to prevent duplicate marking
  const availableTopics = topics.filter((topic: any) => {
    const existing = existingProgress.find((p: any) => p.topicId === topic.id);
    return !existing || !existing.completed;
  });

  // Calculate total completed topics for the selected student
  const totalCompletedTopics = existingProgress.filter((p: any) => p.completed).length;

  // Fetch existing progress for selected student
  const { data: existingProgress = [] } = useQuery({
    queryKey: ['/api/progress', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/progress/${selectedStudent}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedStudent,
  });

  const handleTopicToggle = (topicId: string, checked: boolean) => {
    setTopicProgress(prev => ({
      ...prev,
      [topicId]: checked
    }));
  };

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const progressUpdates = Object.entries(topicProgress).map(([topicId, completed]) => ({
        studentId: selectedStudent,
        topicId,
        completed,
        completedDate: completed ? new Date().toISOString() : null,
      }));

      const token = localStorage.getItem('auth_token');
      return Promise.all(
        progressUpdates.map(update => 
          apiRequest('POST', '/api/progress', update)
        )
      );
    },
    onSuccess: () => {
      toast({
        title: 'Progress Saved',
        description: 'Student progress has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress', selectedStudent] });
      setTopicProgress({});
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveProgress = () => {
    if (Object.keys(topicProgress).length === 0) {
      toast({
        title: 'No Changes',
        description: 'No progress changes to save.',
      });
      return;
    }
    saveProgressMutation.mutate();
  };

  // Get topic completion status
  const getTopicCompletion = (topicId: string) => {
    if (topicId in topicProgress) {
      return topicProgress[topicId];
    }
    const existing = existingProgress.find((p: any) => p.topicId === topicId);
    return existing?.completed || false;
  };

  // Get last updated date for topic
  const getLastUpdated = (topicId: string) => {
    const existing = existingProgress.find((p: any) => p.topicId === topicId);
    return existing?.completedDate ? new Date(existing.completedDate).toLocaleDateString() : '-';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Tracking</CardTitle>
        <p className="text-gray-600 mt-1">Update student topic completion status</p>
        {selectedStudent && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Total Topics Completed: <span className="text-lg font-bold">{totalCompletedTopics}</span>
              </span>
              <span className="text-xs text-blue-700">
                {availableTopics.length > 0 
                  ? `${availableTopics.length} topics available to mark`
                  : 'All topics in this chapter completed'
                }
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Student Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.classId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Chapter</label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder="Choose chapter..." />
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
        </div>

        {/* Topic Checklist */}
        {selectedChapter && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Chapter: {chapters.find((c: any) => c.id === selectedChapter)?.name || 'Selected Chapter'}
            </h3>
            
            {availableTopics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-lg font-medium">All Topics Completed!</p>
                <p className="text-sm">This student has completed all topics in this chapter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Only showing topics that haven't been completed yet to prevent duplicate marking.
                  </p>
                </div>
                
                {availableTopics.map((topic: any) => {
                  const isCompleted = getTopicCompletion(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={(checked) => handleTopicToggle(topic.id, checked as boolean)}
                        />
                        <div>
                          <h3 className="font-medium">
                            <MathJaxComponent inline={true}>{topic.name}</MathJaxComponent>
                          </h3>
                          <p className="text-sm text-gray-600">{topic.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          isCompleted 
                            ? 'bg-success bg-opacity-10 text-success' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isCompleted ? 'Learned' : 'Pending'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getLastUpdated(topic.id)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          )}

        {/* Show completed topics in a separate section */}
        {selectedChapter && existingProgress.length > 0 && (
          <div className="bg-green-50 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-green-900 mb-4">
              ✅ Completed Topics ({existingProgress.filter((p: any) => p.completed).length})
            </h3>
            <div className="space-y-2">
              {existingProgress
                .filter((p: any) => p.completed)
                .map((progress: any) => {
                  const topic = topics.find((t: any) => t.id === progress.topicId);
                  return (
                    <div key={progress.topicId} className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-900">
                            <MathJaxComponent inline={true}>{topic?.name || 'Unknown Topic'}</MathJaxComponent>
                          </h4>
                        </div>
                      </div>
                      <span className="text-xs text-green-700">
                        {new Date(progress.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
            </div>

            
            {availableTopics.length > 0 && (
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setTopicProgress({})}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProgress} 
                  disabled={saveProgressMutation.isPending || Object.keys(topicProgress).length === 0}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  <Save className="mr-2" size={16} />
                  {saveProgressMutation.isPending ? 'Saving...' : 'Save Progress'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}