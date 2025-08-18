
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
import { GraduationCap, Eye, EyeOff, LogIn, BookOpen, Brain, Sparkles, CheckCircle, Users, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen flex">
      {/* Left Section - Brain Image with Content */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/login-background.jpg" 
            alt="Educational Excellence" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-purple-900/40"></div>
        </div>
        
        {/* Top Logo */}
        <div className="absolute top-8 left-8 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
              <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
            </div>
            <span className="text-white text-xl font-semibold">Navanidhi Academy</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
          <div className="max-w-lg space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                Join <span className="text-green-400">8 Million+</span> Students that Trust<br />
                <span className="text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
                  Navanidhi Academy
                </span> to Supercharge their Learning
              </h1>
            </div>
            
            {/* Feature Points */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-green-100">500+ Learning Modules</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-green-100">Smart Progress Tracking</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-green-100">Comprehensive Assessment System</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo (visible on small screens) */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-md">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Navanidhi Academy</span>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-md border">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Welcome to Navanidhi Academy</p>
            <h2 className="text-3xl font-bold text-gray-900">
              Get started with your email<br />or SO Center ID
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 sr-only">
                Email or SO Center ID
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or SO Center ID"
                {...form.register('email')}
                className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 sr-only">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  className="h-12 text-base border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-gray-100 rounded-md"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base rounded-lg shadow-sm transition-colors"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Signing In...
                </div>
              ) : (
                'Continue'
              )}
            </Button>

            
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">privacy policy</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">terms of use</a>.
          </div>

          {/* Help Section */}
          <div className="border-t pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Need help logging in?</p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">• Use your registered email address</p>
                <p className="text-gray-500">• SO Centers can use their Center ID (e.g., NAV001)</p>
                <p className="text-gray-500">• Contact support for password reset</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
