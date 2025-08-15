import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, BookOpen, Flag, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Topic {
  topicId: string;
  topicName: string;
  description: string;
  orderIndex: number;
  isModerate: boolean;
  isImportant: boolean;
  isActive: boolean;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
}

export default function TopicsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics = [], isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics-management"],
    queryFn: () => apiRequest("GET", "/api/topics-management"),
  });

  const updateTopicMutation = useMutation({
    mutationFn: async ({ topicId, updates }: { topicId: string; updates: any }) => {
      return apiRequest("PATCH", `/api/topics/${topicId}/flags`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics-management"] });
      toast({
        title: "Success",
        description: "Topic flags updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update topic flags",
        variant: "destructive",
      });
    },
  });

  const handleToggleFlag = async (topicId: string, flagType: 'isModerate' | 'isImportant', currentValue: boolean) => {
    const updates = { [flagType]: !currentValue };
    updateTopicMutation.mutate({ topicId, updates });
  };

  const filteredTopics = Array.isArray(topics) ? topics.filter((topic: Topic) => {
    const matchesSearch = topic.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.chapterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || topic.className === filterClass;
    const matchesSubject = !filterSubject || topic.subjectName === filterSubject;
    return matchesSearch && matchesClass && matchesSubject;
  }) : [];

  const uniqueClasses = Array.from(new Set(Array.isArray(topics) ? topics.map((t: Topic) => t.className) : [])).filter(Boolean);
  const uniqueSubjects = Array.from(new Set(Array.isArray(topics) ? topics.map((t: Topic) => t.subjectName) : [])).filter(Boolean);

  const moderateCount = Array.isArray(topics) ? topics.filter((t: Topic) => t.isModerate).length : 0;
  const importantCount = Array.isArray(topics) ? topics.filter((t: Topic) => t.isImportant).length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading topics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Topics Management</h1>
          <p className="text-muted-foreground">
            Manage moderate and important flags for academic topics
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderate Topics</CardTitle>
            <Flag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{moderateCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Important Topics</CardTitle>
            <Star className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{importantCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClasses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Topics</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by topic or chapter name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class-filter">Filter by Class</Label>
              <select
                id="class-filter"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject-filter">Filter by Subject</Label>
              <select
                id="subject-filter"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Subjects</option>
                {uniqueSubjects.map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Topics ({filteredTopics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic Name</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-center">Moderate</TableHead>
                  <TableHead className="text-center">Important</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopics.map((topic: Topic) => (
                  <TableRow key={topic.topicId}>
                    <TableCell className="font-medium">
                      {topic.topicName}
                    </TableCell>
                    <TableCell>{topic.chapterName}</TableCell>
                    <TableCell>{topic.subjectName}</TableCell>
                    <TableCell>{topic.className}</TableCell>
                    <TableCell>{topic.orderIndex}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={topic.isModerate}
                          onCheckedChange={() => handleToggleFlag(topic.topicId, 'isModerate', topic.isModerate)}
                          disabled={updateTopicMutation.isPending}
                        />
                        {topic.isModerate && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            <Flag className="h-3 w-3 mr-1" />
                            Moderate
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={topic.isImportant}
                          onCheckedChange={() => handleToggleFlag(topic.topicId, 'isImportant', topic.isImportant)}
                          disabled={updateTopicMutation.isPending}
                        />
                        {topic.isImportant && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            <Star className="h-3 w-3 mr-1" />
                            Important
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={topic.isActive ? "default" : "secondary"}>
                        {topic.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTopics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No topics found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}