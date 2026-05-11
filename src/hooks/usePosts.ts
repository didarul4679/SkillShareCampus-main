import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { validatePost } from "@/lib/validation";
import { useRateLimit } from "./useRateLimit";

export type ReactionType = "like" | "celebrate" | "support" | "love" | "insightful" | "funny";

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ReactionCounts {
  like: number;
  celebrate: number;
  support: number;
  love: number;
  insightful: number;
  funny: number;
}

export interface SharedPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  hashtags: string[];
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  shared_count: number;
  created_at: string;
  edited_at: string | null;
  shared_post_id: string | null;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
  };
  post_likes?: PostLike[];
  user_reaction?: ReactionType | null;
  reaction_counts?: ReactionCounts;
  shared_post?: SharedPost | null;
}

export const usePosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkLimit, status, formatTimeRemaining } = useRateLimit("create_post");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get visible post IDs (friends' posts + own posts) using the database function
      const { data: visiblePostIds, error: visibleError } = await supabase
        .rpc("get_visible_posts", { for_user_id: user.id });

      if (visibleError) throw visibleError;

      // If no visible posts, return empty array
      if (!visiblePostIds || visiblePostIds.length === 0) return [];

      // Extract post IDs
      const postIds = visiblePostIds.map((row: any) => row.post_id);

      // Fetch full post details for visible posts
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          author_id,
          content,
          hashtags,
          image_url,
          likes_count,
          comments_count,
          shared_count,
          created_at,
          edited_at,
          shared_post_id,
          author:profiles!posts_author_id_fkey(
            id,
            full_name,
            avatar_url,
            bio
          ),
          post_likes(
            id,
            post_id,
            user_id,
            reaction_type,
            created_at
          )
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch shared posts data
      const sharedPostIds = data
        ?.filter(post => post.shared_post_id)
        .map(post => post.shared_post_id) || [];

      let sharedPostsMap: Record<string, SharedPost> = {};
      
      if (sharedPostIds.length > 0) {
        const { data: sharedPosts, error: sharedError } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            image_url,
            created_at,
            author:profiles!posts_author_id_fkey(
              id,
              full_name,
              avatar_url
            )
          `)
          .in("id", sharedPostIds);

      if (!sharedError && sharedPosts) {
          sharedPostsMap = sharedPosts.reduce((acc, post) => {
            // Properly transform the author data from Supabase join
            const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
            acc[post.id] = {
              id: post.id,
              content: post.content,
              image_url: post.image_url,
              created_at: post.created_at,
              author: {
                id: authorData?.id || '',
                full_name: authorData?.full_name || 'Unknown User',
                avatar_url: authorData?.avatar_url || ''
              }
            };
            return acc;
          }, {} as Record<string, SharedPost>);
        }
      }

      if (error) throw error;
      
      // Add user reaction and reaction counts
      const postsWithReactions = data?.map(post => {
        const userLike = user ? post.post_likes?.find(like => like.user_id === user.id) : null;
        
        // Calculate reaction counts
        const reactionCounts: ReactionCounts = {
          like: 0,
          celebrate: 0,
          support: 0,
          love: 0,
          insightful: 0,
          funny: 0,
        };
        
        post.post_likes?.forEach(like => {
          if (like.reaction_type in reactionCounts) {
            reactionCounts[like.reaction_type]++;
          }
        });
        
        return {
          ...post,
          user_reaction: userLike?.reaction_type || null,
          reaction_counts: reactionCounts,
          shared_post: post.shared_post_id ? sharedPostsMap[post.shared_post_id] || null : null,
        };
      }) as Post[];
      
      return postsWithReactions;
    },
  });

  // Real-time subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel("posts-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createPost = useMutation({
    mutationFn: async ({ content, hashtags, image }: { content: string; hashtags: string[]; image?: File }) => {
      if (!user) throw new Error("Not authenticated");

      // Check rate limit
      const canPost = await checkLimit();
      if (!canPost) {
        throw new Error(`Rate limit exceeded. You can create ${status.remaining} more posts. Try again in ${formatTimeRemaining(status.reset_in_seconds)}.`);
      }

      // Validate and sanitize input
      const validated = validatePost(content, hashtags);

      let imageUrl: string | null = null;

      // Upload image if provided
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: validated.content,
        hashtags: validated.hashtags,
        image_url: imageUrl,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create post");
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get post details to check authorization and get image URL
      const { data: post, error: fetchError } = await supabase
        .from("posts")
        .select("author_id, image_url")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;
      if (!post) throw new Error("Post not found");

      // Check authorization: post author, moderator, or admin
      const { data: userRoles } = await supabase
        .rpc("get_user_roles", { _user_id: user.id });

      const isAuthor = post.author_id === user.id;
      const isModerator = userRoles?.includes("moderator");
      const isAdmin = userRoles?.includes("admin");

      if (!isAuthor && !isModerator && !isAdmin) {
        throw new Error("You don't have permission to delete this post");
      }

      // Delete cascade: post_likes, post_comments, post_shares
      const { error: likesError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId);
      
      if (likesError) throw likesError;

      const { error: commentsError } = await supabase
        .from("post_comments")
        .delete()
        .eq("post_id", postId);
      
      if (commentsError) throw commentsError;

      const { error: sharesError } = await supabase
        .from("post_shares")
        .delete()
        .eq("post_id", postId);
      
      if (sharesError) throw sharesError;

      // Delete image from storage if exists
      if (post.image_url) {
        try {
          const urlParts = post.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const userId = urlParts[urlParts.length - 2];
          const filePath = `${userId}/${fileName}`;
          
          await supabase.storage
            .from('post-images')
            .remove([filePath]);
        } catch (storageError) {
          console.error("Failed to delete image:", storageError);
          // Continue with post deletion even if image deletion fails
        }
      }

      // Finally, delete the post
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  const editPost = useMutation({
    mutationFn: async ({ postId, content, hashtags, image, removeImage }: { postId: string; content: string; hashtags: string[]; image?: File; removeImage?: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate and sanitize input
      const validated = validatePost(content, hashtags);

      let imageUrl: string | null | undefined = undefined;

      // Handle image removal
      if (removeImage) {
        imageUrl = null;
      }
      // Upload new image if provided
      else if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      const updateData: any = {
        content: validated.content,
        hashtags: validated.hashtags,
        edited_at: new Date().toISOString(),
      };

      if (imageUrl !== undefined) {
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", postId)
        .eq("author_id", user.id); // Extra security: ensure user owns the post

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post updated successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update post");
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async ({ 
      postId, 
      reactionType, 
      currentReaction 
    }: { 
      postId: string; 
      reactionType: ReactionType;
      currentReaction: ReactionType | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      if (currentReaction === reactionType) {
        // Remove reaction if clicking the same one
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else if (currentReaction) {
        // Update existing reaction to new type
        const { error } = await supabase
          .from("post_likes")
          .update({ reaction_type: reactionType })
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new reaction
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;
      }
    },
    onMutate: async ({ postId, reactionType, currentReaction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData<Post[]>(["posts", user?.id]);

      // Optimistically update
      queryClient.setQueryData<Post[]>(["posts", user?.id], (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id !== postId) return post;

          const newReactionCounts = { ...post.reaction_counts! };
          let newLikesCount = post.likes_count;

          // Update counts based on reaction change
          if (currentReaction === reactionType) {
            // Removing reaction
            newReactionCounts[reactionType]--;
            newLikesCount--;
          } else if (currentReaction) {
            // Changing reaction
            newReactionCounts[currentReaction]--;
            newReactionCounts[reactionType]++;
          } else {
            // Adding new reaction
            newReactionCounts[reactionType]++;
            newLikesCount++;
          }

          return {
            ...post,
            user_reaction: currentReaction === reactionType ? null : reactionType,
            reaction_counts: newReactionCounts,
            likes_count: newLikesCount,
          };
        });
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts", user?.id], context.previousPosts);
      }
      toast.error("Failed to update reaction");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return {
    posts: posts || [],
    isLoading,
    createPost,
    deletePost,
    editPost,
    toggleReaction,
    rateLimit: { status, formatTimeRemaining },
  };
};
