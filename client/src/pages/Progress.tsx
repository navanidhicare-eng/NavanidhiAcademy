import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProgressTracker } from '@/components/progress/ProgressTracker';

export default function Progress() {
  return (
    <DashboardLayout
      title="Progress Tracking"
      subtitle="Update student topic completion status"
    >
      <ProgressTracker />
    </DashboardLayout>
  );
}
