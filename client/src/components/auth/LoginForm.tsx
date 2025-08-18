
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Background Image */}
      <div 
        className="absolute inset-0 login-background"
        style={{
          backgroundImage: 'url(/login-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Section - Text Content */}
        <div className="hidden lg:flex lg:w-3/5 flex-col justify-center px-12 text-white">
          {/* Top Logo */}
          <div className="absolute top-8 left-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center p-3 border border-white/20 shadow-lg">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-2xl font-bold drop-shadow-lg">Navanidhi Academy</span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="max-w-lg space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight drop-shadow-lg">
                Join <span className="text-green-400 drop-shadow-lg">8 Million+</span> Students that Trust<br />
                <span className="text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text drop-shadow-lg">
                  Navanidhi Academy
                </span> to Supercharge their Learning
              </h1>
            </div>
            
            {/* Feature Points */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-7 h-7 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
                  <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                </div>
                <span className="text-lg text-green-100 drop-shadow-md font-medium">500+ Learning Modules</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-7 h-7 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
                  <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                </div>
                <span className="text-lg text-green-100 drop-shadow-md font-medium">Smart Progress Tracking</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-7 h-7 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-green-400/30">
                  <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                </div>
                <span className="text-lg text-green-100 drop-shadow-md font-medium">Comprehensive Assessment System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto bg-white/15 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 space-y-6">
          {/* Mobile Logo (visible on small screens) */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center p-3 shadow-lg border border-white/30">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold text-white drop-shadow-lg">Navanidhi Academy</span>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center p-3 shadow-lg border border-white/30">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-full h-full object-contain" />
              </div>
            </div>
            <p className="text-sm text-white/80 uppercase tracking-wider font-medium drop-shadow-md">Welcome to Navanidhi Academy</p>
            <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">
              Get started with your email<br />or SO Center ID
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-white/90 sr-only">
                Email or SO Center ID
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or SO Center ID"
                {...form.register('email')}
                className="h-12 text-sm border-white/30 rounded-xl focus:border-white/50 focus:ring-white/30 bg-white/20 backdrop-blur-md text-white placeholder:text-white/60 focus:bg-white/25 transition-all shadow-lg"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-300 mt-1 drop-shadow-md">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-white/90 sr-only">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  className="h-12 text-sm border-white/30 rounded-xl focus:border-white/50 focus:ring-white/30 bg-white/20 backdrop-blur-md text-white placeholder:text-white/60 focus:bg-white/25 transition-all shadow-lg pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-white/20 rounded-lg transition-all"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} className="text-white/70" /> : <Eye size={18} className="text-white/70" />}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-300 mt-1 drop-shadow-md">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-500/90 to-emerald-600/90 hover:from-green-600/90 hover:to-emerald-700/90 text-white font-medium text-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] backdrop-blur-md border border-green-400/30"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Signing In...
                </div>
              ) : (
                'Continue'
              )}
            </Button>

            
          </form>

          {/* Footer */}
          <div className="text-center text-xs text-white/70 leading-relaxed drop-shadow-md">
            By continuing, you agree to our{' '}
            <a href="#" className="text-green-300 hover:text-green-200 transition-colors">privacy policy</a>{' '}
            and{' '}
            <a href="#" className="text-green-300 hover:text-green-200 transition-colors">terms of use</a>.
          </div>

          {/* Help Section */}
          <div className="border-t border-white/20 pt-5">
            <div className="text-center">
              <p className="text-xs text-white/80 mb-3 drop-shadow-md">Need help logging in?</p>
              <div className="space-y-2 text-xs">
                <p className="text-white/70 drop-shadow-md">• Use your registered email address</p>
                <p className="text-white/70 drop-shadow-md">• SO Centers can use their Center ID (e.g., NAV001)</p>
                <p className="text-white/70 drop-shadow-md">• Contact support for password reset</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
