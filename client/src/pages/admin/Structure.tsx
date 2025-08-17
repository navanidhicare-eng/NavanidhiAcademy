
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  BookOpen, 
  FileText, 
  Edit, 
  Trash2, 
  Target,
  Flag,
  Star
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddChapterModal } from '@/components/admin/AddChapterModal';
import { AddTopicModal } from '@/components/admin/AddTopicModal';
import { MathJaxComponent } from '@/components/ui/MathJax';

interface Chapter {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  className: string;
  order?: number;
  topicCount?: number;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  chapterId: string;
  chapterName: string;
  subjectName: string;
  className: string;
  isImportant: boolean;
  isModerate: boolean;
  order?: number;
}

function AdminStructure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chapters');
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | undefined>();
  const [editingTopic, setEditingTopic] = useState<Topic | undefined>();

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['/api/admin/chapters'],
  });

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ['/api/admin/topics'],
  });

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      return apiRequest('DELETE', `/api/admin/chapters/${chapterId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Chapter Deleted',
        description: 'Chapter has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete chapter.',
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
        description: error.message || 'Failed to delete topic.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteChapter = (chapterId: string, chapterName: string) => {
    if (window.confirm(`Are you sure you want to delete "${chapterName}"? This will also delete all topics in this chapter.`)) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleDeleteTopic = (topicId: string, topicName: string) => {
    if (window.confirm(`Are you sure you want to delete "${topicName}"?`)) {
      deleteTopicMutation.mutate(topicId);
    }
  };

  // Calculate statistics
  const totalChapters = chapters.length;
  const totalTopics = topics.length;
  const moderateTopics = topics.filter(topic => topic.isModerate).length;
  const importantTopics = topics.filter(topic => topic.isImportant).length;

  return (
    <DashboardLayout
      title="Chapters and Topics Management"
      subtitle="Manage the academic structure: chapters and topics for all subjects"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalChapters}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTopics}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderate Topics</CardTitle>
              <Flag className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{moderateTopics}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Important Topics</CardTitle>
              <Star className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{importantTopics}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/admin/topics-management')}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Target className="h-4 w-4 mr-2" />
                Manage Topic Flags
              </Button>
              <Button 
                onClick={() => setShowAddChapterModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
              <Button 
                onClick={() => setShowAddTopicModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>
          </div>

          <TabsContent value="chapters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Chapters ({totalChapters})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chaptersLoading ? (
                  <div className="text-center py-8">Loading chapters...</div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Chapters Added Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      Start building your academic structure by adding chapters to your subjects.
                    </p>
                    <Button 
                      onClick={() => setShowAddChapterModal(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Chapter
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chapter Name</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Topics Count</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chapters.map((chapter) => (
                          <TableRow key={chapter.id}>
                            <TableCell className="font-medium">
                              {chapter.name}
                            </TableCell>
                            <TableCell>{chapter.subjectName}</TableCell>
                            <TableCell>{chapter.className}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {topics.filter(t => t.chapterId === chapter.id).length} topics
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingChapter(chapter)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                                  disabled={deleteChapterMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Topics ({totalTopics})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topicsLoading ? (
                  <div className="text-center py-8">Loading topics...</div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Topics Added Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                      Add topics to your chapters to complete the academic structure.
                    </p>
                    <Button 
                      onClick={() => setShowAddTopicModal(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Topic
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic Name</TableHead>
                          <TableHead>Chapter</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topics.map((topic) => (
                          <TableRow key={topic.id}>
                            <TableCell className="font-medium">
                              <MathJaxComponent>{topic.name}</MathJaxComponent>
                            </TableCell>
                            <TableCell>{topic.chapterName}</TableCell>
                            <TableCell>{topic.subjectName}</TableCell>
                            <TableCell>{topic.className}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {topic.isImportant && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Important
                                  </Badge>
                                )}
                                {topic.isModerate && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                    <Flag className="h-3 w-3 mr-1" />
                                    Moderate
                                  </Badge>
                                )}
                                {!topic.isImportant && !topic.isModerate && (
                                  <Badge variant="outline" className="text-xs">
                                    Normal
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingTopic(topic)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTopic(topic.id, topic.name)}
                                  disabled={deleteTopicMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Chapter Modal */}
        <AddChapterModal
          isOpen={showAddChapterModal}
          onClose={() => setShowAddChapterModal(false)}
        />

        {/* Add Topic Modal */}
        <AddTopicModal
          isOpen={showAddTopicModal}
          onClose={() => setShowAddTopicModal(false)}
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminStructure;
