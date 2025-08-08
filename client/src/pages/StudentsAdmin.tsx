import { AdminStudentsList } from '@/components/students/AdminStudentsList';

export default function StudentsAdmin() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-600 mt-1">Manage all students across the system</p>
      </div>
      
      <AdminStudentsList />
    </div>
  );
}