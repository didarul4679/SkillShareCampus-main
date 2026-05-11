import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useRateLimit } from "./useRateLimit";

export interface Friend {
  id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    location: string;
    company: string;
    last_seen_at: string | null;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkLimit, status, formatTimeRemaining } = useRateLimit("send_friend_request");

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          friend_id,
          status,
          created_at,
          profile:profiles!friendships_friend_id_fkey(
            id,
            full_name,
            avatar_url,
            bio,
            location,
            company,
            last_seen_at
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      return data as Friend[];
    },
    enabled: !!user,
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["pending-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          created_at,
          profile:profiles!friendships_user_id_fkey(
            id,
            full_name,
            avatar_url,
            bio,
            location,
            company
          )
        `)
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check rate limit
      const canSend = await checkLimit();
      if (!canSend) {
        throw new Error(`Rate limit exceeded. You can send ${status.remaining} more friend requests. Try again in ${formatTimeRemaining(status.reset_in_seconds)}.`);
      }

      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Friend request sent");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => {
      toast.error("Failed to send friend request");
    },
  });

  const acceptFriendRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get the original request
      const { data: request, error: fetchError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;

      // Verify the current user is the recipient of the request
      if (request.friend_id !== user.id) {
        throw new Error("Not authorized to accept this request");
      }

      // Update the original request to accepted
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Check if reciprocal friendship already exists
      const { data: existingReciprocal } = await supabase
        .from("friendships")
        .select("id")
        .eq("user_id", request.friend_id)
        .eq("friend_id", request.user_id)
        .maybeSingle();

      // Only create reciprocal friendship if it doesn't exist
      if (!existingReciprocal) {
        const { error: insertError } = await supabase
          .from("friendships")
          .insert({
            user_id: request.friend_id,
            friend_id: request.user_id,
            status: "accepted",
          });

        if (insertError) throw insertError;
      } else {
        // Update existing reciprocal to accepted if it exists
        await supabase
          .from("friendships")
          .update({ status: "accepted" })
          .eq("id", existingReciprocal.id);
      }
    },
    onSuccess: () => {
      toast.success("Friend request accepted");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept request");
    },
  });

  const rejectFriendRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Friend request rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    },
    onError: () => {
      toast.error("Failed to reject request");
    },
  });

  const removeFriend = useMutation({
    mutationFn: async (friendshipId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Delete both friendship records
      const { data: friendship, error: fetchError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .eq("id", friendshipId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the main friendship
      const { error: deleteError1 } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (deleteError1) throw deleteError1;

      // Delete the reciprocal friendship
      const { error: deleteError2 } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", friendship.friend_id)
        .eq("friend_id", friendship.user_id);

      if (deleteError2) throw deleteError2;
    },
    onSuccess: () => {
      toast.success("Friend removed");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => {
      toast.error("Failed to remove friend");
    },
  });

  const checkFriendshipStatus = async (userId: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("friendships")
      .select("id, status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (error) {
      console.error("Error checking friendship:", error);
      return null;
    }

    return data;
  };

  return {
    friends: friends || [],
    pendingRequests: pendingRequests || [],
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    checkFriendshipStatus,
  };
};
