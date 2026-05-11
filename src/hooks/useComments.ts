import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { validateComment } from "@/lib/validation";

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const useComments = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      if (!commentsData) return [];

      // Fetch author profiles
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // Map profiles to comments
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return commentsData.map(comment => ({
        ...comment,
        author: profilesMap.get(comment.author_id) || {
          id: comment.author_id,
          full_name: "Unknown User",
          avatar_url: "",
        },
      })) as Comment[];
    },
  });

  // Real-time subscription for new comments
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", postId] });
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  const createComment = useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate and sanitize input
      const validatedContent = validateComment(content);

      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: validatedContent,
        parent_comment_id: parentCommentId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to post comment");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("post_comments").delete().eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  return {
    comments: comments || [],
    isLoading,
    createComment,
    deleteComment,
  };
};
