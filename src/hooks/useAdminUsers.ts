import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  is_banned: boolean;
  roles: string[];
}

export const useAdminUsers = (page = 0, pageSize = 20, searchQuery = "") => {
  const queryClient = useQueryClient();

  // Fetch all users with pagination
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", page, pageSize, searchQuery],
    queryFn: async () => {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          created_at,
          last_seen_at
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, end);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error, count } = await query;

      if (error) throw error;

      // Fetch user emails from auth.users (requires service role or admin function)
      const userIds = profiles?.map((p) => p.id) || [];
      
      // Fetch roles for all users
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Fetch ban status for all users
      const { data: bansData } = await supabase
        .from("banned_users")
        .select("user_id")
        .in("user_id", userIds);

      const bannedUserIds = new Set(bansData?.map((b) => b.user_id) || []);
      
      // Group roles by user_id
      const rolesByUser = (rolesData || []).reduce((acc, { user_id, role }) => {
        if (!acc[user_id]) acc[user_id] = [];
        acc[user_id].push(role);
        return acc;
      }, {} as Record<string, string[]>);

      const users: AdminUser[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: "", // Email requires admin query
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        last_seen_at: profile.last_seen_at,
        is_banned: bannedUserIds.has(profile.id),
        roles: rolesByUser[profile.id] || ["user"],
      }));

      return { users, count: count || 0 };
    },
  });

  // Ban user
  const banUser = useMutation({
    mutationFn: async ({
      userId,
      reason,
      isPermanent,
      bannedUntil,
    }: {
      userId: string;
      reason: string;
      isPermanent: boolean;
      bannedUntil?: string;
    }) => {
      const { error } = await supabase.from("banned_users").insert({
        user_id: userId,
        banned_by: (await supabase.auth.getUser()).data.user?.id,
        reason,
        is_permanent: isPermanent,
        banned_until: bannedUntil,
      });

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "ban_user",
        p_target_user_id: userId,
        p_details: { reason, isPermanent, bannedUntil },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User banned successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to ban user: ${error.message}`);
    },
  });

  // Unban user
  const unbanUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "unban_user",
        p_target_user_id: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User unbanned successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to unban user: ${error.message}`);
    },
  });

  // Assign role
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as any,
      });

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "assign_role",
        p_target_user_id: userId,
        p_details: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role assigned successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  // Revoke role
  const revokeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "revoke_role",
        p_target_user_id: userId,
        p_details: { role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role revoked successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to revoke role: ${error.message}`);
    },
  });

  return {
    users: usersData?.users || [],
    totalCount: usersData?.count || 0,
    isLoading,
    banUser,
    unbanUser,
    assignRole,
    revokeRole,
  };
};
