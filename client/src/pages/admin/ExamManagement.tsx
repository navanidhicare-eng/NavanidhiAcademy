import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExamCreationForm } from '@/components/ExamCreationForm';
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
  const [selectedState, setSelectedState] = useState('all-states');
  const [selectedDistrict, setSelectedDistrict] = useState('all-districts');
  const [selectedMandal, setSelectedMandal] = useState('all-mandals');
  const [selectedVillage, setSelectedVillage] = useState('all-villages');
  const [selectedSoCenter, setSelectedSoCenter] = useState('all');

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
    // If no filters are applied, show all SO Centers
    if (selectedState === 'all-states' || !selectedState) {
      return true;
    }
    
    // Apply location-based filtering only when specific locations are selected
    if (selectedVillage && selectedVillage !== 'all-villages' && center.villageId !== selectedVillage) return false;
    if (selectedMandal && selectedMandal !== 'all-mandals' && !villages.some((v: any) => v.id === center.villageId && v.mandalId === selectedMandal)) return false;
    if (selectedDistrict && selectedDistrict !== 'all-districts' && !mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === selectedDistrict)) return false;
    if (selectedState && selectedState !== 'all-states' && !districts.some((d: any) => mandals.some((m: any) => villages.some((v: any) => v.mandalId === m.id && v.id === center.villageId) && m.districtId === d.id) && d.stateId === selectedState)) return false;
    return true;
  });

  // Debug logging for SO Centers
  console.log('📊 SO Centers Data Debug:');
  console.log('Total SO Centers:', soCenters.length);
  console.log('Filtered SO Centers:', filteredSoCenters.length);
  console.log('Selected Filters:', { selectedState, selectedDistrict, selectedMandal, selectedVillage });
  console.log('SO Centers sample:', soCenters.slice(0, 3));

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
    const totalQuestionsValue = formData.get('totalQuestions') as string;
    const durationValue = formData.get('duration') as string;
    const maxMarksValue = formData.get('maxMarks') as string;
    const passingMarksValue = formData.get('passingMarks') as string;

    console.log('Form data capture:', {
      totalQuestions: totalQuestionsValue,
      duration: durationValue,
      maxMarks: maxMarksValue,
      passingMarks: passingMarksValue
    });

    const examData = {
      title: formData.get('name'),
      description: formData.get('description'),
      classId: formData.get('classId'),
      subjectId: formData.get('subjectId'),
      examDate: formData.get('examDate'),
      duration: parseInt(durationValue) || 0,
      totalQuestions: parseInt(totalQuestionsValue) || 0,
      totalMarks: parseInt(maxMarksValue) || 0,
      passingMarks: parseInt(passingMarksValue) || 0,
      soCenterIds: selectedSoCenterIds,
      chapterIds: [], // Default empty, can be enhanced later
    };

    console.log('Exam data being sent:', examData);
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
                setSelectedState('all-states');
                setSelectedDistrict('all-districts');
                setSelectedMandal('all-mandals');
                setSelectedVillage('all-villages');
                setSelectedSoCenter('all');
              }}
            >
              <RotateCcw size={16} className="mr-1" />
              Reset Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">All States</SelectItem>
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
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-districts">All Districts</SelectItem>
                  {districts.filter((d: any) => !selectedState || selectedState === 'all-states' || d.stateId === selectedState).map((district: any) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mandal">Mandal</Label>
              <Select value={selectedMandal} onValueChange={setSelectedMandal} disabled={!selectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Mandal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-mandals">All Mandals</SelectItem>
                  {mandals.filter((m: any) => !selectedDistrict || selectedDistrict === 'all-districts' || m.districtId === selectedDistrict).map((mandal: any) => (
                    <SelectItem key={mandal.id} value={mandal.id}>
                      {mandal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="village">Village</Label>
              <Select value={selectedVillage} onValueChange={setSelectedVillage} disabled={!selectedMandal}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Village" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-villages">All Villages</SelectItem>
                  {villages.filter((v: any) => !selectedMandal || selectedMandal === 'all-mandals' || v.mandalId === selectedMandal).map((village: any) => (
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
                    <Badge variant="outline">{new Date(exam.examDate).toLocaleDateString('en-GB')}</Badge>
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
      <ExamCreationForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateExam}
        classes={classes}
        subjects={subjects}
        filteredSoCenters={filteredSoCenters}
        selectedSoCenterIds={selectedSoCenterIds}
        setSelectedSoCenterIds={setSelectedSoCenterIds}
      />
    </DashboardLayout>
  );
}