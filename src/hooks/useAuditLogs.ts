import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_post_id: string | null;
  details: any;
  created_at: string;
  admin?: {
    id: string;
    full_name: string | null;
  };
}

export const useAuditLogs = (page = 0, pageSize = 50, userId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, pageSize, userId],
    queryFn: async () => {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, end);

      if (userId) {
        query = query.eq("target_user_id", userId);
      }

      const { data: logsData, error, count } = await query;

      if (error) throw error;

      // Fetch admin profiles separately
      const adminIds = logsData?.map((l) => l.admin_id) || [];
      const { data: adminsData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", adminIds);

      const adminsMap = new Map(adminsData?.map((a) => [a.id, a]) || []);

      const logs: AuditLog[] = (logsData || []).map((log) => ({
        ...log,
        admin: adminsMap.get(log.admin_id),
      }));

      return { logs, count: count || 0 };
    },
  });

  return {
    logs: data?.logs || [],
    totalCount: data?.count || 0,
    isLoading,
  };
};
