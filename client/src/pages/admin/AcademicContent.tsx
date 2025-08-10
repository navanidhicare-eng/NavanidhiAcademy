import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  PlusCircle,
  Edit,
  Trash2
} from 'lucide-react';

export default function AcademicContent() {
  const [activeContentTab, setActiveContentTab] = useState('classes');

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/chapters'],
  });

  const { data: topics = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/topics'],
  });

  return (
    <DashboardLayout
      title="Academic Content Management"
      subtitle="Manage classes, subjects, chapters, and topics"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen size={20} />
              <span>Academic Content Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeContentTab} onValueChange={setActiveContentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
              </TabsList>

              <TabsContent value="classes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Classes ({classes.length})</h3>
                  <Button className="bg-primary text-white">
                    <PlusCircle className="mr-2" size={16} />
                    Add Class
                  </Button>
                </div>
                <div className="grid gap-4">
                  {classes.map((cls: any) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{cls.name}</h4>
                        <p className="text-sm text-gray-600">{cls.description}</p>
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
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Subjects ({subjects.length})</h3>
                  <Button className="bg-primary text-white">
                    <PlusCircle className="mr-2" size={16} />
                    Add Subject
                  </Button>
                </div>
                <div className="grid gap-4">
                  {subjects.map((subject: any) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{subject.name}</h4>
                        <p className="text-sm text-gray-600">{subject.description}</p>
                        <Badge variant="outline" className="mt-1">{subject.className}</Badge>
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
              </TabsContent>

              <TabsContent value="chapters" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Chapters ({chapters.length})</h3>
                  <Button className="bg-primary text-white">
                    <PlusCircle className="mr-2" size={16} />
                    Add Chapter
                  </Button>
                </div>
                <div className="grid gap-4">
                  {chapters.map((chapter: any) => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{chapter.name}</h4>
                        <p className="text-sm text-gray-600">{chapter.description}</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline">{chapter.subjectName}</Badge>
                          <Badge variant="secondary">{chapter.className}</Badge>
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
              </TabsContent>

              <TabsContent value="topics" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Topics ({topics.length})</h3>
                  <Button className="bg-primary text-white">
                    <PlusCircle className="mr-2" size={16} />
                    Add Topic
                  </Button>
                </div>
                <div className="grid gap-4">
                  {topics.map((topic: any) => (
                    <div key={topic.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{topic.name}</h4>
                        <p className="text-sm text-gray-600">{topic.description}</p>
                        <div className="flex space-x-2 mt-1">
                          <Badge variant="outline">{topic.chapterName}</Badge>
                          <Badge variant="secondary">{topic.subjectName}</Badge>
                          <Badge variant="outline">{topic.className}</Badge>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}