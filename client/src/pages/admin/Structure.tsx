import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AddClassModal } from '@/components/admin/AddClassModal';
import { AddSubjectModal } from '@/components/admin/AddSubjectModal';
import { AddChapterModal } from '@/components/admin/AddChapterModal';
import { AddTopicModal } from '@/components/admin/AddTopicModal';
import { 
  BookOpen, 
  FileText, 
  List, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

export default function AdminStructure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('classes');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all');

  // Fetch real data from API
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/admin/chapters'],
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/admin/topics'],
  });

  // Delete mutations
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/admin/classes/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Class deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete class', variant: 'destructive' });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/admin/subjects/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subject deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subjects'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/admin/chapters/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Chapter deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete chapter', variant: 'destructive' });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => apiRequest('DELETE', `/api/admin/topics/${id}`),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Topic deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete topic', variant: 'destructive' });
    },
  });

  // Filter functions
  const getFilteredSubjects = () => {
    return subjects.filter((subject: any) => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClassFilter === 'all' || subject.classId === selectedClassFilter;
      return matchesSearch && matchesClass;
    });
  };

  const getFilteredChapters = () => {
    return chapters.filter((chapter: any) => {
      const matchesSearch = chapter.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClassFilter === 'all' || 
        subjects.find((s: any) => s.id === chapter.subjectId)?.classId === selectedClassFilter;
      const matchesSubject = selectedSubjectFilter === 'all' || chapter.subjectId === selectedSubjectFilter;
      return matchesSearch && matchesClass && matchesSubject;
    });
  };

  const getFilteredTopics = () => {
    return topics.filter((topic: any) => {
      const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
      const chapter = chapters.find((c: any) => c.id === topic.chapterId);
      const subject = chapter ? subjects.find((s: any) => s.id === chapter.subjectId) : null;
      const matchesClass = selectedClassFilter === 'all' || subject?.classId === selectedClassFilter;
      const matchesSubject = selectedSubjectFilter === 'all' || chapter?.subjectId === selectedSubjectFilter;
      const matchesChapter = selectedChapterFilter === 'all' || topic.chapterId === selectedChapterFilter;
      return matchesSearch && matchesClass && matchesSubject && matchesChapter;
    });
  };

  const getFilteredClasses = () => {
    return classes.filter((cls: any) => 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get class name by ID
  const getClassName = (classId: string) => {
    return classes.find((c: any) => c.id === classId)?.name || 'Unknown';
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    return subjects.find((s: any) => s.id === subjectId)?.name || 'Unknown';
  };

  // Get chapter name by ID
  const getChapterName = (chapterId: string) => {
    return chapters.find((c: any) => c.id === chapterId)?.name || 'Unknown';
  };

  // Helper functions
  const getSubjectCountForClass = (classId: string) => {
    return (subjects as any[]).filter((subject: any) => subject.classId === classId).length;
  };

  const getChapterCountForSubject = (subjectId: string) => {
    return (chapters as any[]).filter((chapter: any) => chapter.subjectId === subjectId).length;
  };

  const getTopicCountForChapter = (chapterId: string) => {
    return (topics as any[]).filter((topic: any) => topic.chapterId === chapterId).length;
  };

  const handleAdd = (type: string) => {
    switch (type) {
      case 'Class':
        setIsClassModalOpen(true);
        break;
      case 'Subject':
        setIsSubjectModalOpen(true);
        break;
      case 'Chapter':
        setIsChapterModalOpen(true);
        break;
      case 'Topic':
        setIsTopicModalOpen(true);
        break;
      default:
        break;
    }
  };

  // Reset filters when switching tabs for better UX
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
    setSelectedClassFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedChapterFilter('all');
  };

  return (
    <DashboardLayout
      title="Academic Structure"
      subtitle="Manage classes, subjects, chapters, and topics"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {activeTab !== 'classes' && (
            <div className="flex gap-2">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(activeTab === 'chapters' || activeTab === 'topics') && (
                <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects
                      .filter((s: any) => selectedClassFilter === 'all' || s.classId === selectedClassFilter)
                      .map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {activeTab === 'topics' && (
                <Select value={selectedChapterFilter} onValueChange={setSelectedChapterFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {chapters
                      .filter((c: any) => {
                        const subject = subjects.find((s: any) => s.id === c.subjectId);
                        const matchesClass = selectedClassFilter === 'all' || subject?.classId === selectedClassFilter;
                        const matchesSubject = selectedSubjectFilter === 'all' || c.subjectId === selectedSubjectFilter;
                        return matchesClass && matchesSubject;
                      })
                      .map((chapter: any) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen size={20} />
                  <span>Classes</span>
                </CardTitle>
                <Button onClick={() => handleAdd('Class')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {classesLoading ? (
                  <div className="text-center py-4">Loading classes...</div>
                ) : getFilteredClasses().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No classes found. Add your first class to get started.</p>
                  </div>
                ) : (
                  getFilteredClasses().map((cls: any) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                        <p className="text-sm text-gray-600">{cls.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{getSubjectCountForClass(cls.id)} subjects</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="text-primary" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteClassMutation.mutate(cls.id)}
                          disabled={deleteClassMutation.isPending}
                        >
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText size={20} />
                  <span>Subjects</span>
                </CardTitle>
                <Button onClick={() => handleAdd('Subject')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {subjectsLoading ? (
                  <div className="text-center py-4">Loading subjects...</div>
                ) : getFilteredSubjects().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No subjects found. Add your first subject to get started.</p>
                  </div>
                ) : (
                  getFilteredSubjects().map((subject: any) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{getClassName(subject.classId)}</Badge>
                          <span className="text-xs text-gray-500">{getChapterCountForSubject(subject.id)} chapters</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="text-primary" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteSubjectMutation.mutate(subject.id)}
                          disabled={deleteSubjectMutation.isPending}
                        >
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <List size={20} />
                  <span>Chapters</span>
                </CardTitle>
                <Button onClick={() => handleAdd('Chapter')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Chapter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {chaptersLoading ? (
                  <div className="text-center py-4">Loading chapters...</div>
                ) : getFilteredChapters().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No chapters found. Add your first chapter to get started.</p>
                  </div>
                ) : (
                  getFilteredChapters().map((chapter: any) => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{chapter.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{getSubjectName(chapter.subjectId)}</Badge>
                          <span className="text-xs text-gray-500">{getTopicCountForChapter(chapter.id)} topics</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="text-primary" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteChapterMutation.mutate(chapter.id)}
                          disabled={deleteChapterMutation.isPending}
                        >
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText size={20} />
                  <span>Topics</span>
                </CardTitle>
                <Button onClick={() => handleAdd('Topic')} className="bg-primary text-white">
                  <Plus className="mr-2" size={16} />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {topicsLoading ? (
                  <div className="text-center py-4">Loading topics...</div>
                ) : getFilteredTopics().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No topics found. Add your first topic to get started.</p>
                  </div>
                ) : (
                  getFilteredTopics().map((topic: any) => (
                    <div key={topic.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                          {topic.isModerate && (
                            <Badge variant="secondary" className="text-xs">
                              Moderate
                            </Badge>
                          )}
                          {topic.isImportant && (
                            <Badge variant="destructive" className="text-xs bg-red-500 text-white font-bold">
                              IMP
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{getChapterName(topic.chapterId)}</Badge>
                          <span className="text-xs text-gray-500">Order: {topic.orderIndex || 0}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="text-primary" size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteTopicMutation.mutate(topic.id)}
                          disabled={deleteTopicMutation.isPending}
                        >
                          <Trash2 className="text-destructive" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AddClassModal 
        isOpen={isClassModalOpen} 
        onClose={() => setIsClassModalOpen(false)} 
      />
      <AddSubjectModal 
        isOpen={isSubjectModalOpen} 
        onClose={() => setIsSubjectModalOpen(false)} 
      />
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