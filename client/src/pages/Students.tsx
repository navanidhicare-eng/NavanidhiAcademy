import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentTable } from '@/components/students/StudentTable';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { useAuth } from '@/hooks/useAuth';

export default function Students() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const response = await fetch('/api/students?soCenterId=' + user?.id, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout
      title="Students"
      subtitle="Manage student registrations and information"
      showAddButton={user?.role === 'so_center'}
      onAddClick={() => setIsAddModalOpen(true)}
    >
      <StudentTable students={students} isLoading={isLoading} />
      
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </DashboardLayout>
  );
}
