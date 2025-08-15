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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, FileText, List, Plus, ArrowRight, CheckCircle, Search } from 'lucide-react';

export default function AdminStructure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Workflow states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [activeTab, setActiveTab] = useState('chapters'); // Default to chapters tab

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
    : allSubjects; // Show all subjects if no class is selected

  // Filter chapters based on selected subject and class
  const filteredChapters = selectedChapter 
    ? chapters.filter((chapter: any) => chapter.id === selectedChapter)
    : selectedSubject 
      ? chapters.filter((chapter: any) => chapter.subjectId === selectedSubject)
      : selectedClass
        ? chapters.filter((chapter: any) => chapter.classId === selectedClass)
        : chapters; // Show all chapters if no filters are applied

  // Filter topics based on selected chapter, subject, and class
  const filteredTopics = selectedChapter 
    ? topics.filter((topic: any) => topic.chapterId === selectedChapter)
    : selectedSubject
      ? topics.filter((topic: any) => {
          const chapterIdsInSubject = chapters.filter(ch => ch.subjectId === selectedSubject).map(ch => ch.id);
          return chapterIdsInSubject.includes(topic.chapterId);
        })
      : selectedClass
        ? topics.filter((topic: any) => {
            const chapterIdsInClass = chapters.filter(ch => ch.classId === selectedClass).map(ch => ch.id);
            return chapterIdsInClass.includes(topic.chapterId);
          })
        : topics; // Show all topics if no filters are applied


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

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      return apiRequest('DELETE', `/api/admin/chapters/${chapterId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Chapter Deleted',
        description: 'Chapter and all its topics have been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
      setSelectedChapter(''); // Reset selection
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chapter. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: string) => {
      return apiRequest('DELETE', `/api/admin/topics/${topicId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Topic Deleted',
        description: 'Topic has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete topic. Please try again.',
        variant: 'destructive',
      });
    },
  });

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
        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters & Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={selectedClass} onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedSubject('');
                  setSelectedChapter('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.filter((cls: any) => cls.id && cls.name).map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter by Subject</Label>
                <Select 
                  value={selectedSubject} 
                  onValueChange={(value) => {
                    setSelectedSubject(value);
                    setSelectedChapter('');
                  }}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedClass ? "Select Subject" : "Select Class first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {filteredSubjects.filter((subject: any) => subject.id && subject.name).map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filter by Chapter</Label>
                <Select 
                  value={selectedChapter} 
                  onValueChange={setSelectedChapter}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedSubject ? "Select Chapter" : "Select Subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Chapters</SelectItem>
                    {chapters
                      .filter((ch: any) => ch.id && ch.name && (!selectedSubject || ch.subjectId === selectedSubject))
                      .map((chapter: any) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Stats */}
            {(selectedClass || selectedSubject || selectedChapter) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-700">{filteredSubjects.length}</div>
                    <div className="text-blue-600">Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-700">{filteredChapters.length}</div>
                    <div className="text-green-600">Chapters</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-700">{filteredTopics.length}</div>
                    <div className="text-purple-600">Topics</div>
                  </div>
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedClass('');
                        setSelectedSubject('');
                        setSelectedChapter('');
                      }}
                      className="text-xs"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Chapters Management</h2>
                <p className="text-gray-600">
                  {selectedClass && selectedSubject 
                    ? `Showing chapters for ${getSubjectName(selectedSubject)} in ${getClassName(selectedClass)}`
                    : selectedClass 
                      ? `Showing chapters for ${getClassName(selectedClass)}`
                      : "All chapters across all classes and subjects"
                  }
                </p>
              </div>
              <AddChapterModal 
                subjects={allSubjects} 
                onChapterAdded={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] })} 
              />
            </div>

            {chaptersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading chapters...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Grouped by Subject if showing multiple subjects */}
                {!selectedSubject ? (
                  // Group chapters by subject when no specific subject is selected
                  Object.entries(
                    (selectedClass ? filteredSubjects : allSubjects).reduce((acc: any, subject: any) => {
                      const subjectChapters = chapters.filter((chapter: any) => 
                        chapter.subjectId === subject.id &&
                        (!selectedClass || chapter.classId === selectedClass)
                      );
                      if (subjectChapters.length > 0) {
                        acc[subject.id] = {
                          subject,
                          chapters: subjectChapters
                        };
                      }
                      return acc;
                    }, {})
                  ).map(([subjectId, { subject, chapters: subjectChapters }]: [string, any]) => (
                    <Card key={subjectId} className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-blue-800">{subject.name}</h3>
                        <p className="text-sm text-gray-600">
                          Class: {getClassName(subject.classId)} • {subjectChapters.length} chapters
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectChapters.map((chapter: any) => (
                          <div key={chapter.id} className="p-4 border rounded-lg bg-blue-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{chapter.name}</h4>
                              <Badge variant="secondary" className="text-xs">
                                Order: {chapter.orderIndex || 0}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {topics.filter((t: any) => t.chapterId === chapter.id).length} topics
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                ) : (
                  // Show filtered chapters when a subject is selected
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChapters.map((chapter: any) => (
                      <Card key={chapter.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{chapter.name}</h3>
                          <Badge variant="outline">
                            Order: {chapter.orderIndex || 0}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Subject: {getSubjectName(chapter.subjectId)}</p>
                          <p>Class: {getClassName(chapter.classId)}</p>
                          <p className="font-medium text-purple-700">
                            {topics.filter((t: any) => t.chapterId === chapter.id).length} topics
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {filteredChapters.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No chapters found</h3>
                    <p className="text-gray-600">
                      {selectedClass && selectedSubject 
                        ? `No chapters found for ${getSubjectName(selectedSubject)} in ${getClassName(selectedClass)}`
                        : "Try adjusting your filters or create a new chapter"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Topics Management</h2>
                <p className="text-gray-600">
                  {selectedChapter 
                    ? `Showing topics for ${getChapterName(selectedChapter)}`
                    : selectedSubject 
                      ? `Showing topics for ${getSubjectName(selectedSubject)}`
                      : selectedClass 
                        ? `Showing topics for ${getClassName(selectedClass)}`
                        : "All topics across all chapters"
                  }
                </p>
              </div>
              <AddTopicModal 
                chapters={chapters} 
                onTopicAdded={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] })} 
              />
            </div>

            {topicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading topics...</span>
              </div>
            ) : selectedChapter ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800">
                    Topics in {getChapterName(selectedChapter)}
                  </h3>
                  <p className="text-sm text-blue-600">
                    Subject: {getSubjectName(chapters.find((c: any) => c.id === selectedChapter)?.subjectId)} • 
                    Class: {getClassName(chapters.find((c: any) => c.id === selectedChapter)?.classId)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTopics.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Topics Yet</h3>
                      <p>No topics found for {getChapterName(selectedChapter)}. Add your first topic!</p>
                    </div>
                  ) : (
                    filteredTopics.map((topic: any) => (
                      <div key={topic.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{topic.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Order: {topic.orderIndex || 0}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {topic.isImportant && (
                                <Badge variant="destructive" className="text-xs">IMP</Badge>
                              )}
                              {topic.isModerate && (
                                <Badge variant="secondary" className="text-xs">MOD</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-600">
                            {topic.description && (
                              <p className="truncate max-w-[200px]">{topic.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show topics grouped by chapter when no specific chapter is selected */}
                {filteredChapters.length > 0 ? (
                  filteredChapters.map((chapter: any) => {
                    const chapterTopics = filteredTopics.filter((t: any) => t.chapterId === chapter.id);
                    if (chapterTopics.length === 0) return null;

                    return (
                      <Card key={chapter.id} className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-purple-800">{chapter.name}</h3>
                          <p className="text-sm text-gray-600">
                            Subject: {getSubjectName(chapter.subjectId)} • 
                            Class: {getClassName(chapter.classId)} • 
                            {chapterTopics.length} topics
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {chapterTopics.map((topic: any) => (
                            <div key={topic.id} className="p-3 border rounded-lg bg-purple-50">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">{topic.name}</h4>
                                <div className="flex space-x-1">
                                  {topic.isImportant && (
                                    <Badge variant="destructive" className="text-xs">IMP</Badge>
                                  )}
                                  {topic.isModerate && (
                                    <Badge variant="secondary" className="text-xs">MOD</Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600">Order: {topic.orderIndex || 0}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Select Filters</h3>
                    <p className="text-gray-600">Choose a class, subject, or chapter from the filters above to view and manage topics.</p>
                  </div>
                )}

                {/* Empty state for filtered results */}
                {filteredChapters.length > 0 && filteredTopics.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
                    <p className="text-gray-600">
                      No topics found for the selected filters. Create topics for your chapters.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}