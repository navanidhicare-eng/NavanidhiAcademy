import { AdminStudentsList } from '@/components/students/AdminStudentsList';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function StudentsAdmin() {
  return (
    <DashboardLayout title="Student Management" subtitle="Manage all students across the system">
      <AdminStudentsList />
    </DashboardLayout>
  );
}