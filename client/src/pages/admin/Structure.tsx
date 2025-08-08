import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  FileText, 
  List, 
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

export default function AdminStructure() {
  const { toast } = useToast();

  // Mock academic structure data
  const mockClasses = [
    { id: '1', name: 'Class 10', description: 'Secondary School Class 10', subjectCount: 3 },
    { id: '2', name: 'Class 12', description: 'Higher Secondary Class 12', subjectCount: 4 },
    { id: '3', name: 'Navodaya', description: 'Navodaya Entrance Preparation', subjectCount: 3 },
    { id: '4', name: 'POLYCET', description: 'Polytechnic Common Entrance Test', subjectCount: 2 }
  ];

  const mockSubjects = [
    { id: '1', name: 'Mathematics', classId: '1', className: 'Class 10', chapterCount: 15 },
    { id: '2', name: 'Physics', classId: '1', className: 'Class 10', chapterCount: 12 },
    { id: '3', name: 'Chemistry', classId: '1', className: 'Class 10', chapterCount: 10 },
    { id: '4', name: 'Mathematics', classId: '3', className: 'Navodaya', chapterCount: 20 }
  ];

  const mockChapters = [
    { id: '1', name: 'Quadratic Equations', subjectId: '1', subjectName: 'Mathematics', topicCount: 8 },
    { id: '2', name: 'Arithmetic Progressions', subjectId: '1', subjectName: 'Mathematics', topicCount: 6 },
    { id: '3', name: 'Light - Reflection and Refraction', subjectId: '2', subjectName: 'Physics', topicCount: 10 },
    { id: '4', name: 'Acids, Bases and Salts', subjectId: '3', subjectName: 'Chemistry', topicCount: 12 }
  ];

  const mockTopics = [
    { id: '1', name: 'Introduction to Quadratic Equations', chapterId: '1', chapterName: 'Quadratic Equations', orderIndex: 1 },
    { id: '2', name: 'Methods of Solving', chapterId: '1', chapterName: 'Quadratic Equations', orderIndex: 2 },
    { id: '3', name: 'Nature of Roots', chapterId: '1', chapterName: 'Quadratic Equations', orderIndex: 3 },
    { id: '4', name: 'Introduction to AP', chapterId: '2', chapterName: 'Arithmetic Progressions', orderIndex: 1 }
  ];

  const handleAdd = (type: string) => {
    toast({ 
      title: `Add ${type}`, 
      description: `Add ${type.toLowerCase()} functionality coming soon!` 
    });
  };

  return (
    <DashboardLayout
      title="Academic Structure"
      subtitle="Manage classes, subjects, chapters, and topics"
    >
      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

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
                {mockClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600">{cls.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{cls.subjectCount} subjects</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
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
                {mockSubjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{subject.className}</Badge>
                        <span className="text-xs text-gray-500">{subject.chapterCount} chapters</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
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
                {mockChapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{chapter.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{chapter.subjectName}</Badge>
                        <span className="text-xs text-gray-500">{chapter.topicCount} topics</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
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
                {mockTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{topic.chapterName}</Badge>
                        <span className="text-xs text-gray-500">Order: {topic.orderIndex}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="text-primary" size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="text-destructive" size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}