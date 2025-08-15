
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, BookOpen, FileText, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AddChapterModal } from '@/components/admin/AddChapterModal';
import { AddTopicModal } from '@/components/admin/AddTopicModal';

interface Class {
  id: string;
  name: string;
  description?: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  classId: string;
  className?: string;
}

interface Chapter {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  subjectId: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  isActive: boolean;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  chapterId: string;
  chapterName?: string;
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  isActive: boolean;
  isModerate: boolean;
  isImportant: boolean;
}

export default function Structure() {
  const [activeTab, setActiveTab] = useState('chapters');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all classes
  const { data: allClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/admin/classes'],
    queryFn: () => apiRequest('GET', '/api/admin/classes'),
  });

  // Fetch all subjects
  const { data: allSubjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['/api/admin/subjects'],
    queryFn: () => apiRequest('GET', '/api/admin/subjects'),
  });

  // Fetch all chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['/api/admin/chapters'],
    queryFn: () => apiRequest('GET', '/api/admin/chapters'),
  });

  // Fetch all topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/admin/topics'],
    queryFn: () => apiRequest('GET', '/api/admin/topics'),
  });

  // Delete mutations
  const deleteChapterMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/chapters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
      toast({ title: 'Success', description: 'Chapter deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete chapter', variant: 'destructive' });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/topics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
      toast({ title: 'Success', description: 'Topic deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete topic', variant: 'destructive' });
    },
  });

  // Filter functions
  const filteredChapters = Array.isArray(chapters) ? chapters.filter((chapter: Chapter) => {
    const matchesSearch = chapter.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || chapter.className === filterClass;
    const matchesSubject = !filterSubject || chapter.subjectName === filterSubject;
    return matchesSearch && matchesClass && matchesSubject;
  }) : [];

  const filteredTopics = Array.isArray(topics) ? topics.filter((topic: Topic) => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || topic.className === filterClass;
    const matchesSubject = !filterSubject || topic.subjectName === filterSubject;
    const matchesChapter = !filterChapter || topic.chapterName === filterChapter;
    return matchesSearch && matchesClass && matchesSubject && matchesChapter;
  }) : [];

  // Get unique values for filters
  const uniqueClasses = Array.from(new Set(allClasses.map((c: Class) => c.name))).filter(Boolean);
  const uniqueSubjects = Array.from(new Set(allSubjects.map((s: Subject) => s.name))).filter(Boolean);
  const uniqueChapters = Array.from(new Set(chapters.map((c: Chapter) => c.name))).filter(Boolean);

  const handleDeleteChapter = (id: string) => {
    if (window.confirm('Are you sure you want to delete this chapter? This will also delete all associated topics.')) {
      deleteChapterMutation.mutate(id);
    }
  };

  const handleDeleteTopic = (id: string) => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      deleteTopicMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chapters and Topics Management</h1>
            <p className="text-muted-foreground">
              Manage your academic structure - chapters and topics
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allClasses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allSubjects.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{chapters.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{topics.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {uniqueClasses.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Subject</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {uniqueSubjects.map((subjectName) => (
                      <SelectItem key={subjectName} value={subjectName}>
                        {subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'topics' && (
                <div className="space-y-2">
                  <Label>Filter by Chapter</Label>
                  <Select value={filterChapter} onValueChange={setFilterChapter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Chapters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Chapters</SelectItem>
                      {uniqueChapters.map((chapterName) => (
                        <SelectItem key={chapterName} value={chapterName}>
                          {chapterName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>

          <TabsContent value="chapters" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Chapters</h2>
                <p className="text-muted-foreground">
                  {filteredChapters.length} chapter{filteredChapters.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <Button
                onClick={() => setIsChapterModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </div>

            {chaptersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading chapters...</span>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chapter Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChapters.map((chapter: Chapter) => (
                        <TableRow key={chapter.id}>
                          <TableCell className="font-medium">{chapter.name}</TableCell>
                          <TableCell>{chapter.subjectName}</TableCell>
                          <TableCell>{chapter.className}</TableCell>
                          <TableCell>{chapter.orderIndex}</TableCell>
                          <TableCell>
                            <Badge variant={chapter.isActive ? "default" : "secondary"}>
                              {chapter.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteChapter(chapter.id)}
                                disabled={deleteChapterMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredChapters.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No chapters found matching your filters.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Topics</h2>
                <p className="text-muted-foreground">
                  {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <Button
                onClick={() => setIsTopicModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>

            {topicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading topics...</span>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic Name</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTopics.map((topic: Topic) => (
                        <TableRow key={topic.id}>
                          <TableCell className="font-medium">{topic.name}</TableCell>
                          <TableCell>{topic.chapterName}</TableCell>
                          <TableCell>{topic.subjectName}</TableCell>
                          <TableCell>{topic.className}</TableCell>
                          <TableCell>{topic.orderIndex}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {topic.isModerate && (
                                <Badge variant="secondary" className="text-xs">Moderate</Badge>
                              )}
                              {topic.isImportant && (
                                <Badge variant="destructive" className="text-xs">Important</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={topic.isActive ? "default" : "secondary"}>
                              {topic.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTopic(topic.id)}
                                disabled={deleteTopicMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredTopics.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No topics found matching your filters.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddChapterModal 
          isOpen={isChapterModalOpen}
          onClose={() => setIsChapterModalOpen(false)}
          subjects={allSubjects} 
          onChapterAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/chapters'] });
            setIsChapterModalOpen(false);
          }} 
        />

        <AddTopicModal 
          isOpen={isTopicModalOpen}
          onClose={() => setIsTopicModalOpen(false)}
          chapters={chapters} 
          onTopicAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
            setIsTopicModalOpen(false);
          }} 
        />
      </div>
    </DashboardLayout>
  );
}
