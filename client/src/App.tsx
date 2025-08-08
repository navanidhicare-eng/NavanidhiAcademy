import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Progress from "@/pages/Progress";
import Payments from "@/pages/Payments";
import Wallet from "@/pages/Wallet";
import PublicProgress from "@/pages/PublicProgress";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminUsers from "@/pages/admin/Users";
import AdminStructure from "@/pages/admin/Structure";
import AdminCenters from "@/pages/admin/Centers";
import AdminAllStudents from "@/pages/admin/AllStudents";
import AdminAllPayments from "@/pages/admin/AllPayments";

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
      <Route path="/progress">
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute>
          <Payments />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <Wallet />
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
      <Route path="/admin/centers">
        <ProtectedRoute>
          <AdminCenters />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute>
          <AdminAllStudents />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute>
          <AdminAllPayments />
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
