import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuth() {
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}