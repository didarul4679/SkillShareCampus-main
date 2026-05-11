import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampusNews {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  published_at: string;
}

export const useCampusNews = (limit: number = 5) => {
  return useQuery({
    queryKey: ['campus-news', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campus_news')
        .select('id, title, content, category, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as CampusNews[];
    },
  });
};
