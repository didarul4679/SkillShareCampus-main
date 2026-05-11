import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchUser {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  last_seen_at: string | null;
}

export const useUserSearch = (searchQuery: string) => {
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, location, company, last_seen_at")
        .neq("id", user?.id || "")
        .ilike("full_name", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data as SearchUser[];
    },
    enabled: !!user && searchQuery.length >= 2,
  });

  return {
    users: users || [],
    isLoading,
  };
};
