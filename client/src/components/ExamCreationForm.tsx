import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";

interface ExamCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  classes: any[];
  subjects: any[];
  filteredSoCenters: any[];
  selectedSoCenterIds: string[];
  setSelectedSoCenterIds: (ids: string[]) => void;
}

export function ExamCreationForm({
  isOpen,
  onClose,
  onSubmit,
  classes,
  subjects,
  filteredSoCenters,
  selectedSoCenterIds,
  setSelectedSoCenterIds
}: ExamCreationFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Exam Name</Label>
              <Input id="name" name="name" placeholder="Enter exam name" required />
            </div>
            <div>
              <Label htmlFor="examDate">Exam Date</Label>
              <Input id="examDate" name="examDate" type="date" required />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Enter exam description" />
          </div>

          {/* Academic Structure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="classId">Class</Label>
              <Select name="classId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.filter((cls: any) => cls.id && cls.id.trim() !== '').map((cls: any) => (
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
                  {subjects.filter((subject: any) => subject.id && subject.id.trim() !== '').map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exam Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" name="duration" type="number" placeholder="120" required />
            </div>
            <div>
              <Label htmlFor="totalQuestions">Total Questions</Label>
              <Input id="totalQuestions" name="totalQuestions" type="number" placeholder="50" required />
            </div>
            <div>
              <Label htmlFor="maxMarks">Maximum Marks</Label>
              <Input id="maxMarks" name="maxMarks" type="number" placeholder="100" required />
            </div>
          </div>

          <div>
            <Label htmlFor="passingMarks">Passing Marks</Label>
            <Input id="passingMarks" name="passingMarks" type="number" placeholder="35" required className="w-1/3" />
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
                    setSelectedSoCenterIds([]);
                  } else {
                    setSelectedSoCenterIds(filteredSoCenters.map((center: any) => center.id));
                  }
                }}
                className="text-xs"
              >
                {selectedSoCenterIds.length === filteredSoCenters.length ? 'Unselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {filteredSoCenters.map((center: any) => (
                <div key={center.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`center-${center.id}`}
                    checked={selectedSoCenterIds.includes(center.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSoCenterIds([...selectedSoCenterIds, center.id]);
                      } else {
                        setSelectedSoCenterIds(selectedSoCenterIds.filter(id => id !== center.id));
                      }
                    }}
                  />
                  <Label htmlFor={`center-${center.id}`} className="text-xs">
                    <div className="flex items-center space-x-1">
                      <MapPin size={12} />
                      <span>{center.name}</span>
                      <span className="text-gray-500">({center.code})</span>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedSoCenterIds.length} of {filteredSoCenters.length} centers
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Create Exam
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}