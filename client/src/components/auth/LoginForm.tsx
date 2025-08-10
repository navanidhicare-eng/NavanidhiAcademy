import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter email or SO Center ID'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginLoading, loginError } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Login form submitting...', { email: data.email });
      
      const result = await login(data.email, data.password);
      console.log('Login result received:', result);
      
      if (result && result.user) {
        toast({
          title: 'Login Successful',
          description: `Welcome ${result.user.name || result.user.email}!`,
        });
        
        // Small delay to ensure token is saved
        setTimeout(() => {
          // Navigate to the appropriate dashboard based on role
          if (result.redirectTo) {
            navigate(result.redirectTo);
          } else {
            navigate('/dashboard');
          }
        }, 100);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error?.message || loginError?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-white text-2xl" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Navanidhi Academy</CardTitle>
          <p className="text-gray-600 mt-2">Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email or SO Center ID
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter email or SO Center ID (e.g., NAV001)"
                {...form.register('email')}
                className="w-full"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  className="w-full pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-blue-700"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn className="mr-2" size={16} />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Login Instructions:</strong><br/>
              • Use your registered email address<br/>
              • SO Centers can use their Center ID (e.g., NAV001)<br/>
              • System will automatically detect your role
            </div>
            <a href="#" className="text-primary hover:text-blue-700 text-sm">
              Forgot Password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}