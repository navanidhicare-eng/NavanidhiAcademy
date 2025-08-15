import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function AdminStructure() {
  return (
    <DashboardLayout
      title="Academic Structure Management"
      subtitle="Manage classes, subjects, chapters, and topics"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Academic Structure
          </h2>
          <p className="text-gray-600">
            This page will be used to manage the academic structure including classes, subjects, chapters, and topics.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminStructure;