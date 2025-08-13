import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddChapterModal } from '@/components/admin/AddChapterModal';
import { AddTopicModal } from '@/components/admin/AddTopicModal';
import { 
  BookOpen, 
  FileText, 
  List, 
  Plus,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function AdminStructure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Workflow states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // Modal states
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  // Fetch real data from API
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: allSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/admin/chapters'],
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/admin/topics'],
  });

  // Filter subjects based on selected class
  const filteredSubjects = selectedClass 
    ? allSubjects.filter((subject: any) => subject.classId === selectedClass)
    : [];

  // Filter chapters based on selected subject
  const filteredChapters = selectedSubject 
    ? chapters.filter((chapter: any) => chapter.subjectId === selectedSubject)
    : [];

  // Filter topics based on selected chapter
  const filteredTopics = selectedChapter 
    ? topics.filter((topic: any) => topic.chapterId === selectedChapter)
    : [];

  // Get class name by ID
  const getClassName = (classId: string) => {
    return classes.find((c: any) => c.id === classId)?.name || 'Unknown';
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    return allSubjects.find((s: any) => s.id === subjectId)?.name || 'Unknown';
  };

  // Get chapter name by ID
  const getChapterName = (chapterId: string) => {
    return chapters.find((c: any) => c.id === chapterId)?.name || 'Unknown';
  };

  const resetSelections = (fromStep: number) => {
    if (fromStep <= 1) {
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedChapter('');
    } else if (fromStep <= 2) {
      setSelectedSubject('');
      setSelectedChapter('');
    } else if (fromStep <= 3) {
      setSelectedChapter('');
    }
  };

  return (
    <DashboardLayout
      title="Chapters and Topics Managing"
      subtitle="Manage chapters and their topics effectively"
    >
      <div className="space-y-6">
        {/* Content Management */}
        {(
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chapter Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <List size={20} />
                    <span>Chapters</span>
                  </CardTitle>
                  <Button onClick={() => setIsChapterModalOpen(true)} size="sm">
                    <Plus className="mr-2" size={16} />
                    Add Chapter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chaptersLoading ? (
                    <div className="text-center py-4">Loading chapters...</div>
                  ) : chapters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <List className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>No chapters found. Add your first chapter!</p>
                    </div>
                  ) : (
                    chapters.map((chapter: any) => (
                      <div 
                        key={chapter.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedChapter === chapter.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedChapter(chapter.id)}
                      >
                        <h3 className="font-medium">{chapter.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {topics.filter((t: any) => t.chapterId === chapter.id).length} topics
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Topic Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText size={20} />
                    <span>Topics</span>
                  </CardTitle>
                  <Button 
                    onClick={() => setIsTopicModalOpen(true)} 
                    size="sm"
                    disabled={!selectedChapter}
                  >
                    <Plus className="mr-2" size={16} />
                    Add Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedChapter ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>Select a chapter to manage topics</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {topicsLoading ? (
                      <div className="text-center py-4">Loading topics...</div>
                    ) : topics.filter((t: any) => t.chapterId === selectedChapter).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>No topics found for {getChapterName(selectedChapter)}. Add your first topic!</p>
                      </div>
                    ) : (
                      topics.filter((t: any) => t.chapterId === selectedChapter).map((topic: any) => (
                        <div key={topic.id} className="p-3 border rounded-lg bg-white">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{topic.name}</h3>
                            <div className="flex space-x-1">
                              {topic.isImportant && (
                                <Badge variant="destructive" className="text-xs">IMP</Badge>
                              )}
                              {topic.isModerate && (
                                <Badge variant="secondary" className="text-xs">MOD</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Order: {topic.orderIndex || 0}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Selection Summary */}
        {selectedChapter && (
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">Current Selection:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-purple-100">
                  Chapter: {getChapterName(selectedChapter)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AddChapterModal 
        isOpen={isChapterModalOpen} 
        onClose={() => setIsChapterModalOpen(false)} 
      />
      <AddTopicModal 
        isOpen={isTopicModalOpen} 
        onClose={() => setIsTopicModalOpen(false)} 
      />
    </DashboardLayout>
  );
}