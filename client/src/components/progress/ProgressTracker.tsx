import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';

export function ProgressTracker() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // Mock data - replace with actual API calls
  const students = [
    { id: 'student1', name: 'Arjun Reddy - Class 10' },
    { id: 'student2', name: 'Sneha Patel - Navodaya' },
  ];

  const subjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
  ];

  const chapters = [
    { id: 'chapter1', name: 'Quadratic Equations' },
    { id: 'chapter2', name: 'Arithmetic Progressions' },
  ];

  const topics = [
    {
      id: 'topic1',
      title: 'Introduction to Quadratic Equations',
      description: 'Understanding the standard form ax² + bx + c = 0',
      completed: true,
      updatedDate: 'Dec 15, 2024'
    },
    {
      id: 'topic2',
      title: 'Methods of Solving Quadratic Equations',
      description: 'Factorization, completing the square, and quadratic formula',
      completed: false,
      updatedDate: null
    }
  ];

  const handleTopicToggle = (topicId: string, checked: boolean) => {
    // Handle topic completion toggle
    console.log('Toggle topic:', topicId, checked);
  };

  const handleSaveProgress = () => {
    // Save progress to backend
    console.log('Saving progress...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Tracking</CardTitle>
        <p className="text-gray-600 mt-1">Update student topic completion status</p>
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
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
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
                {subjects.map((subject) => (
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
                {chapters.map((chapter) => (
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
            <h3 className="font-semibold text-gray-900 mb-4">Chapter: Quadratic Equations</h3>
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={topic.completed}
                      onCheckedChange={(checked) => handleTopicToggle(topic.id, checked as boolean)}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{topic.title}</p>
                      <p className="text-sm text-gray-600">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      topic.completed 
                        ? 'bg-success bg-opacity-10 text-success' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {topic.completed ? 'Learned' : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {topic.updatedDate || '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveProgress} className="bg-primary text-white hover:bg-blue-700">
                <Save className="mr-2" size={16} />
                Save Progress
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
