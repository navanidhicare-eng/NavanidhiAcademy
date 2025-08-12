import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StudentTable } from '@/components/students/StudentTable';
import { useAuth } from '@/hooks/useAuth';

export default function Students() {
  const { user } = useAuth();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['/api/students', user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching students for user:', user?.id, 'email:', user?.email, 'role:', user?.role);
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      console.log('📊 Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      console.log('📋 Students found for this SO Center:', data.length);
      console.log('📋 Raw API response:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  return (
    <DashboardLayout
      title="Students"
      subtitle="Manage student registrations and information"
    >
      <StudentTable students={students} isLoading={isLoading} />
    </DashboardLayout>
  );
}
