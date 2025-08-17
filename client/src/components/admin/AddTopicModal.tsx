import { useForm } from 'react-hook-form';
import { useMemo, useCallback, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const addTopicSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class selection is required'),
  subjectId: z.string().min(1, 'Subject selection is required'),
  chapterId: z.string().min(1, 'Chapter selection is required'),
  orderIndex: z.string().min(1, 'Order is required'),
  isModerate: z.boolean().default(false),
  isImportant: z.boolean().default(false),
}).refine(data => !(data.isModerate && data.isImportant), {
  message: "You can only select either Moderate or Important, not both",
  path: ["isImportant"],
});

type AddTopicFormData = z.infer<typeof addTopicSchema>;

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTopicModal({ isOpen, onClose }: AddTopicModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real data from API
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });

  const { data: allSubjects = [] } = useQuery({
    queryKey: ['/api/admin/subjects'],
  });

  const { data: allChapters = [] } = useQuery({
    queryKey: ['/api/admin/chapters'],
  });

  const defaultValues = useMemo(() => ({
    name: '',
    description: '',
    classId: '',
    subjectId: '',
    chapterId: '',
    orderIndex: '',
    isModerate: false,
    isImportant: false,
  }), []);

  const form = useForm<AddTopicFormData>({
    resolver: zodResolver(addTopicSchema),
    defaultValues,
    mode: 'onChange',
  });

  const selectedClassId = form.watch('classId');
  const selectedSubjectId = form.watch('subjectId');

  // Filter subjects based on selected class with useMemo to prevent re-renders
  const filteredSubjects = useMemo(() => 
    (allSubjects as any[]).filter((subject: any) => 
      selectedClassId ? subject.classId === selectedClassId : false
    ), [allSubjects, selectedClassId]
  );

  // Filter chapters based on selected subject with useMemo to prevent re-renders
  const filteredChapters = useMemo(() => 
    (allChapters as any[]).filter((chapter: any) => 
      selectedSubjectId ? chapter.subjectId === selectedSubjectId : false
    ), [allChapters, selectedSubjectId]
  );

  const handleClassChange = useCallback((value: string) => {
    form.setValue('classId', value);
    form.setValue('subjectId', '');
    form.setValue('chapterId', '');
  }, [form]);

  const handleSubjectChange = useCallback((value: string) => {
    form.setValue('subjectId', value);
    form.setValue('chapterId', '');
  }, [form]);

  const createTopicMutation = useMutation({
    mutationFn: async (data: AddTopicFormData) => {
      const submitData = {
        name: data.name,
        description: data.description || '',
        chapterId: data.chapterId,
        orderIndex: parseInt(data.orderIndex),
        isModerate: data.isModerate,
        isImportant: data.isImportant,
      };
      return apiRequest('POST', '/api/admin/topics', submitData);
    },
    onSuccess: () => {
      toast({
        title: 'Topic Created',
        description: 'Topic has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/topics'] });
      setTimeout(() => {
        form.reset(defaultValues);
        onClose();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create topic. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddTopicFormData) => {
    createTopicMutation.mutate(data);
  };

  // This useEffect is intended to fix an infinite loop by ensuring the chapterId is only set if it differs from the current value.
  // It's crucial for preventing unnecessary re-renders or state updates.
  useEffect(() => {
    if (selectedChapter && form.getValues('chapterId') !== selectedChapter) {
      form.setValue('chapterId', selectedChapter);
    }
  }, [selectedChapter, form]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Topic</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 border border-gray-200 rounded-lg bg-gray-50/50" style={{ maxHeight: 'calc(85vh - 140px)', minHeight: '500px' }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8 bg-white rounded p-4"
                  style={{ minHeight: '700px' }}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Name (LaTeX Math Support)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter topic name with LaTeX: e.g., Quadratic Formula $ax^2 + bx + c = 0$" {...field} />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>LaTeX Examples for Title:</strong><br />
                    • Use $...$ for inline math: $E = mc^2$<br />
                    • Formulas: $x^2 + y^2 = z^2$ or $\frac{a}{b}$
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (LaTeX Math Support)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter topic description with LaTeX math formulas.
Use $...$ for inline math: $x^2 + y^2 = z^2$
Use $$...$$ for block math: $$\frac{numerator}{denominator}$$"
                      className="min-h-[100px] resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong>LaTeX Examples:</strong><br />
                    • Inline: $x^2 + y^2 = z^2$ or $\frac{numerator}{denominator}$<br />
                    • Block: $$\int_0^1 x^2 dx = \frac{1}{3}$$<br />
                    • Equations: $$E = mc^2$$
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Select onValueChange={handleClassChange} value={field.value}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Select onValueChange={handleSubjectChange} value={field.value} disabled={!selectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedClassId ? "Select subject" : "Select class first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubjects.map((subject: any) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedSubjectId ? "Select chapter" : "Select subject first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredChapters.map((chapter: any) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority Checkboxes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Topic Priority (select one):</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isModerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue('isImportant', false);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Moderate
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Shows "Moderate" tag
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isImportant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue('isModerate', false);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Important
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Shows attractive "IMP" tag
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Follow the sequence: Class → Subject → Chapter → Topic. The order determines the sequence in which topics appear in the chapter.
              </p>
            </div>

            </form>
          </Form>
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t bg-background/95 backdrop-blur">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createTopicMutation.isPending}
            className="bg-primary text-white hover:bg-blue-700"
            onClick={form.handleSubmit(onSubmit)}
          >
            {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}