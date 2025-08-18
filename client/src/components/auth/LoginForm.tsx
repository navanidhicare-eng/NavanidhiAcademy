
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
            src="/education-brain.jpg" 
            alt="Educational Excellence" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/60 to-purple-900/70"></div>
        </div>
        
        {/* Top Logo */}
        <div className="absolute top-8 left-8 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-white text-xl font-semibold">Navanidhi Academy</span>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
          <div className="max-w-lg space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight">
                Join <span className="text-blue-400">8 Million+</span> Students that Trust<br />
                <span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
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
                <span className="text-lg text-blue-100">500+ Learning Modules</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-blue-100">Smart Progress Tracking</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-blue-100">Comprehensive Assessment System</span>
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Navanidhi Academy</span>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
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

            <div className="text-center">
              <span className="text-sm text-gray-500">or</span>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 text-gray-700 font-medium text-base rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue as Nava Nidhi
              </div>
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
