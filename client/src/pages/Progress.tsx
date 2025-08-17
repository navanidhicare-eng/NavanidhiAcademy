import { useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EnhancedProgressTracker } from '@/components/progress/EnhancedProgressTracker';
import { useAuth } from '@/hooks/useAuth';
import { MathJaxComponent } from '@/components/ui/MathJax';

export default function Progress() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only allow SO Center users to access progress tracking
    if (user && user.role !== 'so_center') {
      setLocation('/dashboard');
      return;
    }
  }, [user, setLocation]);

  // If user is not SO Center, don't render the component
  if (user && user.role !== 'so_center') {
    return null;
  }

  return (
    <DashboardLayout>
      <EnhancedProgressTracker />
    </DashboardLayout>
  );
}