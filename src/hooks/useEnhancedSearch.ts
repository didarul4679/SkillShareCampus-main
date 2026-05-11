import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export type SearchType = "all" | "people" | "posts" | "hashtags";

export interface SearchResult {
  type: "user" | "post" | "hashtag";
  id: string;
  title: string;
  subtitle?: string;
  avatar_url?: string;
  created_at?: string;
  metadata?: any;
}

export const useEnhancedSearch = (searchQuery: string, searchType: SearchType = "all") => {
  const { user } = useAuth();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search users
  const { data: userResults = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["search-users", debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      if (searchType !== "all" && searchType !== "people") return [];

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          avatar_url, 
          bio, 
          location, 
          company,
          last_seen_at
        `)
        .neq("id", user?.id || "")
        .or(`full_name.ilike.%${debouncedQuery}%,company.ilike.%${debouncedQuery}%,location.ilike.%${debouncedQuery}%`)
        .limit(10);

      if (error) throw error;

      // Also search by skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            bio,
            location,
            company,
            last_seen_at
          )
        `)
        .ilike("skill_name", `%${debouncedQuery}%`)
        .limit(5);

      if (skillsError) throw skillsError;

      // Merge and deduplicate results
      const allUsers = [...(data || [])];
      skillsData?.forEach((skill: any) => {
        if (skill.profiles && !allUsers.find(u => u.id === skill.profiles.id)) {
          allUsers.push(skill.profiles);
        }
      });

      return allUsers.map(user => ({
        type: "user" as const,
        id: user.id,
        title: user.full_name || "Unknown User",
        subtitle: user.company || user.location || user.bio || "",
        avatar_url: user.avatar_url,
        metadata: user,
      }));
    },
    enabled: !!user && debouncedQuery.length >= 2,
  });

  // Search posts
  const { data: postResults = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["search-posts", debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      if (searchType !== "all" && searchType !== "posts") return [];

      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          hashtags,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
        .ilike("content", `%${debouncedQuery}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map((post: any) => ({
        type: "post" as const,
        id: post.id,
        title: post.content.substring(0, 100) + (post.content.length > 100 ? "..." : ""),
        subtitle: `by ${post.profiles?.full_name || "Unknown"} • ${new Date(post.created_at).toLocaleDateString()}`,
        avatar_url: post.profiles?.avatar_url,
        created_at: post.created_at,
        metadata: post,
      }));
    },
    enabled: !!user && debouncedQuery.length >= 2,
  });

  // Search hashtags
  const { data: hashtagResults = [], isLoading: loadingHashtags } = useQuery({
    queryKey: ["search-hashtags", debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      if (searchType !== "all" && searchType !== "hashtags") return [];

      const { data, error } = await supabase
        .from("posts")
        .select("hashtags")
        .not("hashtags", "is", null);

      if (error) throw error;

      // Extract and count hashtags
      const hashtagCounts: Record<string, number> = {};
      data.forEach((post: any) => {
        post.hashtags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(debouncedQuery.toLowerCase())) {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
          }
        });
      });

      return Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({
          type: "hashtag" as const,
          id: tag,
          title: `#${tag}`,
          subtitle: `${count} ${count === 1 ? "post" : "posts"}`,
          metadata: { tag, count },
        }));
    },
    enabled: !!user && debouncedQuery.length >= 2,
  });

  // Save recent searches
  useEffect(() => {
    if (debouncedQuery.length >= 2 && (userResults.length > 0 || postResults.length > 0 || hashtagResults.length > 0)) {
      const recentSearches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const updatedSearches = [
        debouncedQuery,
        ...recentSearches.filter((s: string) => s !== debouncedQuery),
      ].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    }
  }, [debouncedQuery, userResults, postResults, hashtagResults]);

  const allResults = [...userResults, ...postResults, ...hashtagResults];
  const isLoading = loadingUsers || loadingPosts || loadingHashtags;
  const isSearching = searchQuery !== debouncedQuery;

  return {
    results: allResults,
    userResults,
    postResults,
    hashtagResults,
    isLoading,
    isSearching,
    debouncedQuery,
  };
};

export const getRecentSearches = (): string[] => {
  return JSON.parse(localStorage.getItem("recentSearches") || "[]");
};

export const clearRecentSearches = () => {
  localStorage.removeItem("recentSearches");
};
