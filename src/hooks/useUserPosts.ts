import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export const useUserPosts = (userId: string | undefined, limit: number = 3) => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["user-posts", userId, limit],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("posts")
        .select("id, content, image_url, created_at, likes_count, comments_count")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserPost[];
    },
    enabled: !!userId,
  });

  return {
    posts: posts || [],
    isLoading,
  };
};
