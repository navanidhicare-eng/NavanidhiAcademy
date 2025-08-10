import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  PlusCircle, 
  Edit, 
  Trash2,
  MapPin,
  RotateCcw
} from 'lucide-react';

export default function ExamManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSoCenterIds, setSelectedSoCenterIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Location filters
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedSoCenter, setSelectedSoCenter] = useState('');

  // Data queries
  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/exams'],
  });

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/classes'],
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: soCenters = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/so-centers'],
  });

  // Location data queries
  const { data: states = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/states'],
  });

  const { data: districts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/districts'],
  });

  const { data: mandals = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/mandals'],
  });

  const { data: villages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/addresses/villages'],
  });

  // Filter SO Centers based on location selection
  const filteredSoCenters = soCenters.filter((center: any) => {
    if (selectedVillage && center.villageId !== selectedVillage) return false;
    if (selectedMandal && !villages.some((v: any) => v.id === center.villageId && v.mandalId === selectedMandal)) return false;
    if (selectedDistrict && !mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === selectedDistrict)) return false;
    if (selectedState && !districts.some((d: any) => mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === d.id) && d.stateId === selectedState)) return false;
    return true;
  });

  // Reset dependent filters when parent changes
  const handleStateChange = (value: string) => {
    setSelectedState(value === 'all' ? '' : value);
    setSelectedDistrict('');
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value === 'all' ? '' : value);
    setSelectedMandal('');
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleMandalChange = (value: string) => {
    setSelectedMandal(value === 'all' ? '' : value);
    setSelectedVillage('');
    setSelectedSoCenter('');
  };

  const handleVillageChange = (value: string) => {
    setSelectedVillage(value === 'all' ? '' : value);
    setSelectedSoCenter('');
  };

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      return apiRequest('POST', '/api/admin/exams', examData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
      setIsCreateModalOpen(false);
      setSelectedSoCenterIds([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      return apiRequest('DELETE', `/api/admin/exams/${examId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/exams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      });
    },
  });

  const handleCreateExam = (formData: FormData) => {
    const examData = {
      title: formData.get('name'),
      description: formData.get('description'),
      classId: formData.get('classId'),
      subjectId: formData.get('subjectId'),
      examDate: formData.get('examDate'),
      duration: parseInt(formData.get('duration') as string),
      totalMarks: parseInt(formData.get('maxMarks') as string),
      passingMarks: parseInt(formData.get('passingMarks') as string),
      soCenterIds: selectedSoCenterIds,
      chapterIds: [], // Default empty, can be enhanced later
    };
    createExamMutation.mutate(examData);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      deleteExamMutation.mutate(examId);
    }
  };

  return (
    <DashboardLayout
      title="Exam Management"
      subtitle="Create and manage exams for SO Centers"
    >
      {/* Location Filter Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin size={20} />
              <span>Location Filter</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedState('');
                setSelectedDistrict('');
                setSelectedMandal('');
                setSelectedVillage('');
                setSelectedSoCenter('');
              }}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={selectedState || 'all'} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state: any) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="district">District</Label>
              <Select 
                value={selectedDistrict || 'all'} 
                onValueChange={handleDistrictChange}
                disabled={!selectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts
                    .filter((district: any) => district.stateId === selectedState)
                    .map((district: any) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mandal">Mandal</Label>
              <Select 
                value={selectedMandal || 'all'} 
                onValueChange={handleMandalChange}
                disabled={!selectedDistrict}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mandals</SelectItem>
                  {mandals
                    .filter((mandal: any) => mandal.districtId === selectedDistrict)
                    .map((mandal: any) => (
                      <SelectItem key={mandal.id} value={mandal.id}>
                        {mandal.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="village">Village</Label>
              <Select 
                value={selectedVillage || 'all'} 
                onValueChange={handleVillageChange}
                disabled={!selectedMandal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Village" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Villages</SelectItem>
                  {villages
                    .filter((village: any) => village.mandalId === selectedMandal)
                    .map((village: any) => (
                      <SelectItem key={village.id} value={village.id}>
                        {village.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="soCenter">SO Center</Label>
              <Select value={selectedSoCenter || 'all'} onValueChange={setSelectedSoCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SO Center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SO Centers</SelectItem>
                  {filteredSoCenters.map((center: any) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap size={20} />
              <span>Exam Management</span>
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-white">
              <PlusCircle className="mr-2" size={16} />
              Create Exam
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {exams.map((exam: any) => (
              <div key={exam.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{exam.className}</Badge>
                    <Badge variant="secondary">{exam.subjectName}</Badge>
                    <Badge variant="outline">{exam.examDate}</Badge>
                    <Badge>{exam.totalMarks} marks</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="text-primary" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteExam(exam.id)}>
                    <Trash2 className="text-destructive" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Exam Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateExam(formData);
          }} className="space-y-4">
            <div>
              <Label htmlFor="name">Exam Name</Label>
              <Input id="name" name="name" placeholder="Enter exam name" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Enter exam description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classId">Class</Label>
                <Select name="classId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subjectId">Subject</Label>
                <Select name="subjectId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examDate">Exam Date</Label>
                <Input id="examDate" name="examDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" placeholder="120" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxMarks">Maximum Marks</Label>
                <Input id="maxMarks" name="maxMarks" type="number" placeholder="100" required />
              </div>
              <div>
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input id="passingMarks" name="passingMarks" type="number" placeholder="35" required />
              </div>
            </div>
            
            {/* SO Centers Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>SO Centers (Select Multiple)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSoCenterIds.length === filteredSoCenters.length) {
                      // If all are selected, unselect all
                      setSelectedSoCenterIds([]);
                    } else {
                      // Select all
                      setSelectedSoCenterIds(filteredSoCenters.map((center: any) => center.id));
                    }
                  }}
                  className="text-xs"
                >
                  {selectedSoCenterIds.length === filteredSoCenters.length ? 'Unselect All' : 'Select All'}
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                {filteredSoCenters.map((center: any) => (
                  <div key={center.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`center-${center.id}`}
                      checked={selectedSoCenterIds.includes(center.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSoCenterIds([...selectedSoCenterIds, center.id]);
                        } else {
                          setSelectedSoCenterIds(selectedSoCenterIds.filter(id => id !== center.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`center-${center.id}`} className="text-sm cursor-pointer">
                      {center.name}
                    </label>
                  </div>
                ))}
                {filteredSoCenters.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No SO Centers available. Please apply location filters above.
                  </p>
                )}
              </div>
              {selectedSoCenterIds.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedSoCenterIds.length} SO Center(s) selected
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedSoCenterIds([]);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExamMutation.isPending || selectedSoCenterIds.length === 0}>
                {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}