import { useState, useEffect } from 'react';
import { supabaseAuthService, type User } from '@/lib/supabaseAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(supabaseAuthService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      supabaseAuthService.login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api'] });
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${data.user.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      name: string;
      role: string;
      phone?: string;
      villageId?: string;
    }) => supabaseAuthService.register(userData),
    onSuccess: (user) => {
      toast({
        title: 'Account Created',
        description: `Welcome ${user.name}! Please check your email to verify your account.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => supabaseAuthService.logout(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Logout Error',
        description: error.message || 'Failed to logout properly.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Sync user data with Supabase
        await supabaseAuthService.syncUserData();
        const currentUser = supabaseAuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const interval = setInterval(() => {
      const currentUser = supabaseAuthService.getCurrentUser();
      if (currentUser !== user) {
        setUser(currentUser);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && supabaseAuthService.isAuthenticated(),
    login: async (email: string, password: string) => {
      return await loginMutation.mutateAsync({ email, password });
    },
    register: async (userData: {
      email: string;
      password: string;
      name: string;
      role: string;
      phone?: string;
      villageId?: string;
    }) => {
      return await registerMutation.mutateAsync(userData);
    },
    logout: () => logoutMutation.mutate(),
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    getAccessToken: () => supabaseAuthService.getAccessToken(),
  };
}