import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Progress from "@/pages/Progress";

import { FeePayments } from "@/pages/FeePayments";
import Attendance from "@/pages/Attendance";
import AttendanceReports from "@/pages/AttendanceReports";
import Settings from "@/pages/Settings";
import Wallet from "@/pages/Wallet";
import Expenses from "@/pages/Expenses";
import PublicProgress from "@/pages/PublicProgress";
import NotFound from "@/pages/not-found";
import StudentsAdmin from "@/pages/StudentsAdmin";

// Admin Pages
import AdminUsers from "@/pages/admin/Users";
import AdminRoles from "@/pages/admin/Roles";
import AdminAddresses from "@/pages/admin/Addresses";
import AdminStructure from '@/pages/admin/Structure';
import AdminCenters from '@/pages/admin/Centers';
import AdminAllStudents from "@/pages/admin/AllStudents";
import AdminAllPayments from "@/pages/admin/AllPayments";
import AdminFees from "@/pages/admin/Fees";
import AdminExpenses from "@/pages/admin/Expenses";
import AdminAcademics from "@/pages/admin/Academics";
import AdminTeachers from "@/pages/admin/Teachers";
import AdminAttendance from "@/pages/admin/Attendance";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminApprovals from "@/pages/admin/Approvals";
import AdminProducts from "@/pages/admin/Products";
import AdminStudents from "@/pages/admin/Students";
import AcademicDashboard from "@/pages/admin/AcademicDashboard";
import ExamManagement from "@/pages/admin/ExamManagement";
import SoCenterExamManagement from "@/pages/so-center/ExamManagement";
import SoCenterExams from "@/pages/so-center/SoCenterExams";
import ExamResults from "@/pages/so-center/ExamResults";
import PostExamResult from "@/pages/so-center/PostExamResult";

import CoursePurchases from "@/pages/admin/CoursePurchases";
import TopicsManagement from "@/pages/admin/TopicsManagement";
import StudentDropoutRequests from "@/pages/so-center/StudentDropoutRequests";
import DropoutRequestsManagement from "@/pages/admin/DropoutRequestsManagement";
import ClassSubjectManagement from '@/pages/admin/ClassSubjectManagement';
import AdminProgressTracking from '@/pages/admin/ProgressTracking';
import AdminWalletBalances from "@/pages/admin/WalletBalances";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public route for QR code progress */}
      <Route path="/progress/:qrCode" component={PublicProgress} />

      {/* Protected routes */}
      <Route path="/login" component={LoginForm} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/students">
        <ProtectedRoute>
          <Students />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <StudentsAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/progress">
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      </Route>

      <Route path="/fee-payments">
        <ProtectedRoute>
          <FeePayments />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      </Route>
      <Route path="/attendance">
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      </Route>
      <Route path="/attendance-reports">
        <ProtectedRoute>
          <AttendanceReports />
        </ProtectedRoute>
      </Route>
      <Route path="/expenses">
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute>
          <AdminProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/so-center/dashboard">
        <ProtectedRoute>
          <SoCenterExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/so-center/exam-management">
        <ProtectedRoute>
          <SoCenterExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/exam-management">
        <ProtectedRoute>
          <SoCenterExamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/so-center/exams">
        <ProtectedRoute>
          <SoCenterExams />
        </ProtectedRoute>
      </Route>
      <Route path="/so-center/exam-results">
        <ProtectedRoute>
          <ExamResults />
        </ProtectedRoute>
      </Route>
      <Route path="/post-exam-result/:examId">
        <ProtectedRoute>
          <PostExamResult />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/users">
        <ProtectedRoute>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/structure">
        <ProtectedRoute>
          <AdminStructure />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/class-subject-management">
        <ProtectedRoute>
          <ClassSubjectManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/centers">
        <ProtectedRoute>
          <AdminCenters />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/so-centers">
        <ProtectedRoute>
          <AdminCenters />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <AdminStudents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute>
          <AdminAllPayments />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/academic-dashboard" component={() => <AcademicDashboard />} />
          <Route path="/admin/attendance" component={() => <Attendance />} />
          <Route path="/admin/course-purchases" component={() => <CoursePurchases />} />
          <Route path="/admin/topics-management" component={() => <TopicsManagement />} />
          <Route path="/admin/progress-tracking" component={() => <AdminProgressTracking />} />
          <Route path="/admin/dropout-requests" component={() => <DropoutRequestsManagement />} />
      <Route path="/admin/exam-management">
        <ProtectedRoute>
          <ExamManagement />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/all-payments">
        <ProtectedRoute>
          <AdminAllPayments />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/roles">
        <ProtectedRoute>
          <AdminRoles />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/addresses">
        <ProtectedRoute>
          <AdminAddresses />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/fees">
        <ProtectedRoute>
          <AdminFees />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/expenses">
        <ProtectedRoute>
          <AdminExpenses />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/academics">
        <ProtectedRoute>
          <AdminAcademics />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/teachers">
        <ProtectedRoute>
          <AdminTeachers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute>
          <AdminProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/attendance">
        <ProtectedRoute>
          <AdminAttendance />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/announcements">
        <ProtectedRoute>
          <AdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/course-purchases">
        <ProtectedRoute>
          <CoursePurchases />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/approvals">
        <ProtectedRoute>
          <AdminApprovals />
        </ProtectedRoute>
      </Route>


      {/* New Features: Topics Management & Dropout Requests */}
      <Route path="/admin/topics-management">
        <ProtectedRoute>
          <TopicsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dropout-requests">
        <ProtectedRoute>
          <DropoutRequestsManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/so-center/dropout-requests">
        <ProtectedRoute>
          <StudentDropoutRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/wallet-balances">
        <ProtectedRoute requiredRole="admin">
          <AdminWalletBalances />
        </ProtectedRoute>
      </Route>


      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;