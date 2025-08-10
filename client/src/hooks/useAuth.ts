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
        return response.json();
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
      // Clear any existing tokens first
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store the token in localStorage with both keys for compatibility
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('auth_token', data.token);
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Update the user cache and invalidate to force refresh
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    onError: () => {
      // Clear any existing tokens on login error
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
    }
  });

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    return loginMutation.mutateAsync({ email, password });
  };

  const logout = () => {
    // Clear all possible tokens
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    
    // Clear user data
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    
    // Navigate to login if needed
    window.location.href = '/login';
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