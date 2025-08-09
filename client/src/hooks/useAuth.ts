import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: User;
  redirectTo?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<User | null> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return null;
        }
        
        const response = await apiRequest('GET', '/api/auth/me');
        return response;
      } catch (error) {
        // If authentication fails, clear the token
        localStorage.removeItem('token');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      
      return data;
    },
    onSuccess: (data) => {
      // Update the user cache
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
    onError: () => {
      // Clear any existing token on login error
      localStorage.removeItem('token');
    }
  });

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    return loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error as Error | null
  };
}