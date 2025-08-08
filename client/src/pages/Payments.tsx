import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PaymentForm } from '@/components/payments/PaymentForm';

export default function Payments() {
  return (
    <DashboardLayout
      title="Payment Management"
      subtitle="Record and track student fee payments"
    >
      <PaymentForm />
    </DashboardLayout>
  );
}
