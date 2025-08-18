
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
import { GraduationCap, Eye, EyeOff, LogIn, BookOpen, Brain, Sparkles } from 'lucide-react';
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
      {/* Left Section - High Quality Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 z-10"></div>
        <img 
          src="/education-brain.jpg" 
          alt="Educational Excellence" 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-12 text-white">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Navanidhi Academy
              </h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-blue-100">
                Empowering Minds, Shaping Futures
              </h2>
              <p className="text-lg text-blue-200 leading-relaxed max-w-md">
                Join our comprehensive educational management system designed to nurture academic excellence and unlock every student's potential.
              </p>
            </div>
            
            <div className="flex space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-300" />
                <span className="text-sm text-blue-200">Interactive Learning</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span className="text-sm text-blue-200">Smart Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="text-white text-2xl" size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your Navanidhi Academy account</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl font-semibold text-gray-800">
                Management System Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email or SO Center ID
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter email or SO Center ID (e.g., NAV001)"
                    {...form.register('email')}
                    className="h-11 bg-white/70 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...form.register('password')}
                      className="h-11 bg-white/70 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
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
                      Sign In to Dashboard
                    </>
                  )}
                </Button>
              </form>

              {/* Login Instructions */}
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Forgot Password?
                  </a>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Login Instructions:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Use your registered email address</li>
                    <li>• SO Centers can use their Center ID (e.g., NAV001)</li>
                    <li>• System will automatically detect your role</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 Navanidhi Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
