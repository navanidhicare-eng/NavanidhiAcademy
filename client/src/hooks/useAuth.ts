import { useState, useEffect } from 'react';
import { authService, type User } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate('/login');
    },
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, [currentUser]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: async (email: string, password: string) => {
      return await loginMutation.mutateAsync({ email, password });
    },
    logout: () => logoutMutation.mutate(),
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
