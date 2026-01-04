import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['is-admin', userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc('is_admin', { _user_id: userId });
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};
