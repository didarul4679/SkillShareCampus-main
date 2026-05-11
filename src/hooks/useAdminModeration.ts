import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PostReport {
  id: string;
  post_id: string;
  reported_by: string;
  reason: string;
  report_type: string;
  status: string;
  created_at: string;
  post?: {
    id: string;
    content: string;
    author_id: string;
    image_url: string | null;
    author?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  reporter?: {
    id: string;
    full_name: string | null;
  };
}

export const useAdminModeration = (status = "pending", page = 0, pageSize = 20) => {
  const queryClient = useQueryClient();

  // Fetch reported posts
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["admin-reports", status, page, pageSize],
    queryFn: async () => {
      const start = page * pageSize;
      const end = start + pageSize - 1;

      const { data: reportsData, error, count } = await supabase
        .from("post_reports")
        .select("*", { count: "exact" })
        .eq("status", status)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) throw error;

      // Fetch related data separately
      const postIds = reportsData?.map((r) => r.post_id) || [];
      const reporterIds = reportsData?.map((r) => r.reported_by) || [];

      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, author_id, image_url")
        .in("id", postIds);

      const { data: authorsData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in(
          "id",
          postsData?.map((p) => p.author_id) || []
        );

      const { data: reportersData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", reporterIds);

      // Map data together
      const postsMap = new Map(postsData?.map((p) => [p.id, p]) || []);
      const authorsMap = new Map(authorsData?.map((a) => [a.id, a]) || []);
      const reportersMap = new Map(reportersData?.map((r) => [r.id, r]) || []);

      const reports: PostReport[] = (reportsData || []).map((report) => {
        const post = postsMap.get(report.post_id);
        const author = post ? authorsMap.get(post.author_id) : undefined;
        return {
          ...report,
          post: post
            ? {
                ...post,
                author: author || undefined,
              }
            : undefined,
          reporter: reportersMap.get(report.reported_by),
        };
      });

      return { reports, count: count || 0 };
    },
  });

  // Update report status
  const updateReportStatus = useMutation({
    mutationFn: async ({
      reportId,
      status,
      adminNotes,
    }: {
      reportId: string;
      status: string;
      adminNotes?: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from("post_reports")
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", reportId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "review_report",
        p_details: { reportId, status, adminNotes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report status updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });

  // Delete post (from moderation)
  const deletePost = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "delete_post",
        p_target_post_id: postId,
        p_details: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });

  // Issue warning
  const issueWarning = useMutation({
    mutationFn: async ({
      userId,
      warningType,
      reason,
      severity,
      expiresAt,
    }: {
      userId: string;
      warningType: string;
      reason: string;
      severity: string;
      expiresAt?: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase.from("user_warnings").insert({
        user_id: userId,
        issued_by: user?.id,
        warning_type: warningType,
        reason,
        severity,
        expires_at: expiresAt,
      });

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "issue_warning",
        p_target_user_id: userId,
        p_details: { warningType, reason, severity, expiresAt },
      });
    },
    onSuccess: () => {
      toast.success("Warning issued successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to issue warning: ${error.message}`);
    },
  });

  // Bulk action: dismiss multiple reports
  const bulkDismiss = useMutation({
    mutationFn: async (reportIds: string[]) => {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from("post_reports")
        .update({
          status: "dismissed",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .in("id", reportIds);

      if (error) throw error;

      // Log admin action
      await supabase.rpc("log_admin_action", {
        p_action_type: "bulk_dismiss_reports",
        p_details: { reportIds, count: reportIds.length },
      });
    },
    onSuccess: (_, reportIds) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success(`${reportIds.length} reports dismissed`);
    },
    onError: (error: any) => {
      toast.error(`Failed to dismiss reports: ${error.message}`);
    },
  });

  return {
    reports: reportsData?.reports || [],
    totalCount: reportsData?.count || 0,
    isLoading,
    updateReportStatus,
    deletePost,
    issueWarning,
    bulkDismiss,
  };
};
