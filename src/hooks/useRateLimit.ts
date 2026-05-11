import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RateLimitAction = "create_post" | "send_message" | "send_friend_request";

interface RateLimitConfig {
  maxActions: number;
  windowMinutes: number;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  create_post: { maxActions: 10, windowMinutes: 60 }, // 10 posts per hour
  send_message: { maxActions: 100, windowMinutes: 1440 }, // 100 messages per day
  send_friend_request: { maxActions: 20, windowMinutes: 1440 }, // 20 requests per day
};

export interface RateLimitStatus {
  remaining: number;
  total: number;
  reset_in_seconds: number;
  limited: boolean;
}

export const useRateLimit = (actionType: RateLimitAction) => {
  const { user } = useAuth();
  const config = RATE_LIMIT_CONFIGS[actionType];

  const { data: status, refetch } = useQuery<RateLimitStatus>({
    queryKey: ["rate-limit", user?.id, actionType],
    queryFn: async () => {
      if (!user) {
        return {
          remaining: config.maxActions,
          total: config.maxActions,
          reset_in_seconds: 0,
          limited: false,
        };
      }

      const { data, error } = await supabase.rpc("get_rate_limit_status", {
        p_user_id: user.id,
        p_action_type: actionType,
        p_max_actions: config.maxActions,
        p_window_minutes: config.windowMinutes,
      });

      if (error) throw error;
      return data as unknown as RateLimitStatus;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  const checkLimit = async (): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_action_type: actionType,
      p_max_actions: config.maxActions,
      p_window_minutes: config.windowMinutes,
    });

    if (error) throw error;

    // Refetch status after checking
    refetch();

    return data as boolean;
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "now";
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return {
    status: status || {
      remaining: config.maxActions,
      total: config.maxActions,
      reset_in_seconds: 0,
      limited: false,
    },
    checkLimit,
    formatTimeRemaining,
    isLimited: status?.limited || false,
  };
};
