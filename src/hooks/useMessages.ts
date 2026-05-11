import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";
import { validateMessage } from "@/lib/validation";
import { useRateLimit } from "./useRateLimit";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  receiver?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface MessageSearchResult {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
}

export const useMessages = (selectedUserId?: string, searchQuery?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkLimit, status, formatTimeRemaining } = useRateLimit("send_message");

  // Search messages query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["messages-search", user?.id, searchQuery],
    queryFn: async () => {
      if (!user || !searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .ilike("content", `%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((msg: any) => {
        const isReceived = msg.receiver_id === user.id;
        const otherUser = isReceived ? msg.sender : msg.receiver;
        return {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          other_user_id: isReceived ? msg.sender_id : msg.receiver_id,
          other_user_name: otherUser?.full_name || "Unknown",
          other_user_avatar: otherUser?.avatar_url || "",
        } as MessageSearchResult;
      });
    },
    enabled: !!user && !!searchQuery && searchQuery.length >= 2,
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      messages?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user_id: otherUserId,
            full_name: otherUser.full_name || "Unknown",
            avatar_url: otherUser.avatar_url || "",
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });

      return Array.from(conversationMap.values());
    },
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["messages", user?.id, selectedUserId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user || !selectedUserId) return [];

      const MESSAGES_PER_PAGE = 50;
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at,
          attachment_url,
          attachment_type,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .range(pageParam * MESSAGES_PER_PAGE, (pageParam + 1) * MESSAGES_PER_PAGE - 1);

      if (error) throw error;
      return data as Message[];
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 50 ? pages.length : undefined;
    },
    enabled: !!user && !!selectedUserId,
    initialPageParam: 0,
  });

  // Flatten and reverse messages for display (newest at bottom)
  const flatMessages = (messages && 'pages' in messages) ? messages.pages.flat().reverse() : [];

  // Real-time subscription for new messages and read receipts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          // Update read receipt status for sent messages
          queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ 
      receiverId, 
      content, 
      file 
    }: { 
      receiverId: string; 
      content: string;
      file?: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check rate limit
      const canSend = await checkLimit();
      if (!canSend) {
        throw new Error(`Rate limit exceeded. You can send ${status.remaining} more messages. Try again in ${formatTimeRemaining(status.reset_in_seconds)}.`);
      }

      // Validate and sanitize input
      const validatedContent = validateMessage(content);

      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      // Upload file if provided
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File size must be less than 5MB");
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${receiverId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("message-attachments")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Store only the object path (not the full URL) - signed URLs will be generated on display
        attachmentUrl = fileName;
        attachmentType = file.type;
      }

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: validatedContent,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markConversationAsRead = useMutation({
    mutationFn: async (senderId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  return {
    conversations: conversations || [],
    messages: flatMessages,
    isLoading: conversationsLoading || messagesLoading,
    sendMessage,
    markAsRead,
    markConversationAsRead,
    loadMoreMessages: fetchNextPage,
    hasMoreMessages: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    searchResults: searchResults || [],
    isSearching: searchLoading,
  };
};
