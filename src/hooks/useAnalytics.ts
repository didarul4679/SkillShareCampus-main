import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, format } from "date-fns";

export interface AnalyticsData {
  dau: number;
  mau: number;
  totalUsers: number;
  dailyPostRate: number;
  weeklyPostRate: number;
  avgEngagementRate: number;
  retentionDay1: number;
  retentionDay7: number;
  retentionDay30: number;
  storageUsed: number;
  dailyActiveUsersChart: { date: string; users: number }[];
  postCreationChart: { date: string; posts: number }[];
  engagementChart: { metric: string; value: number }[];
}

export const useAnalytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const oneDayAgo = subDays(now, 1);
      const sevenDaysAgo = subDays(now, 7);
      const thirtyDaysAgo = subDays(now, 30);

      // DAU - users active in last 24 hours
      const { count: dau } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", oneDayAgo.toISOString());

      // MAU - users active in last 30 days
      const { count: mau } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen_at", thirtyDaysAgo.toISOString());

      // Total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Posts in last 24 hours
      const { count: dailyPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo.toISOString());

      // Posts in last 7 days
      const { count: weeklyPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Get all posts with their engagement
      const { data: posts } = await supabase
        .from("posts")
        .select("likes_count, comments_count")
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Calculate average engagement rate
      const totalEngagement =
        posts?.reduce(
          (sum, post) => sum + post.likes_count + post.comments_count,
          0
        ) || 0;
      const avgEngagementRate =
        posts && posts.length > 0 ? totalEngagement / posts.length : 0;

      // Retention calculations
      // Day 1: users who signed up 2 days ago and were active yesterday
      const twoDaysAgo = subDays(now, 2);
      const { data: day2Cohort } = await supabase
        .from("profiles")
        .select("id, created_at, last_seen_at")
        .gte("created_at", startOfDay(twoDaysAgo).toISOString())
        .lt("created_at", startOfDay(oneDayAgo).toISOString());

      const day1Retained =
        day2Cohort?.filter(
          (u) =>
            u.last_seen_at &&
            new Date(u.last_seen_at) >= oneDayAgo &&
            new Date(u.last_seen_at) < now
        ).length || 0;
      const retentionDay1 =
        day2Cohort && day2Cohort.length > 0
          ? (day1Retained / day2Cohort.length) * 100
          : 0;

      // Day 7: users who signed up 8 days ago and were active in last 7 days
      const eightDaysAgo = subDays(now, 8);
      const { data: day8Cohort } = await supabase
        .from("profiles")
        .select("id, created_at, last_seen_at")
        .gte("created_at", startOfDay(eightDaysAgo).toISOString())
        .lt("created_at", startOfDay(sevenDaysAgo).toISOString());

      const day7Retained =
        day8Cohort?.filter(
          (u) => u.last_seen_at && new Date(u.last_seen_at) >= sevenDaysAgo
        ).length || 0;
      const retentionDay7 =
        day8Cohort && day8Cohort.length > 0
          ? (day7Retained / day8Cohort.length) * 100
          : 0;

      // Day 30: users who signed up 31 days ago and were active in last 30 days
      const thirtyOneDaysAgo = subDays(now, 31);
      const { data: day31Cohort } = await supabase
        .from("profiles")
        .select("id, created_at, last_seen_at")
        .gte("created_at", startOfDay(thirtyOneDaysAgo).toISOString())
        .lt("created_at", startOfDay(thirtyDaysAgo).toISOString());

      const day30Retained =
        day31Cohort?.filter(
          (u) => u.last_seen_at && new Date(u.last_seen_at) >= thirtyDaysAgo
        ).length || 0;
      const retentionDay30 =
        day31Cohort && day31Cohort.length > 0
          ? (day30Retained / day31Cohort.length) * 100
          : 0;

      // Daily active users chart (last 7 days)
      const dailyActiveUsersChart = await Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = subDays(now, 6 - i);
          const startDate = startOfDay(date);
          const endDate = startOfDay(subDays(now, 5 - i));

          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("last_seen_at", startDate.toISOString())
            .lt("last_seen_at", endDate.toISOString());

          return {
            date: format(date, "MMM dd"),
            users: count || 0,
          };
        })
      );

      // Post creation chart (last 7 days)
      const postCreationChart = await Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = subDays(now, 6 - i);
          const startDate = startOfDay(date);
          const endDate = startOfDay(subDays(now, 5 - i));

          const { count } = await supabase
            .from("posts")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startDate.toISOString())
            .lt("created_at", endDate.toISOString());

          return {
            date: format(date, "MMM dd"),
            posts: count || 0,
          };
        })
      );

      // Engagement breakdown
      const { count: totalLikes } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      const { count: totalComments } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      const { count: totalShares } = await supabase
        .from("post_shares")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      const engagementChart = [
        { metric: "Likes", value: totalLikes || 0 },
        { metric: "Comments", value: totalComments || 0 },
        { metric: "Shares", value: totalShares || 0 },
      ];

      // Storage usage - approximate based on uploaded files
      const { data: storageData } = await supabase.storage
        .from("avatars")
        .list();
      const { data: postImages } = await supabase.storage
        .from("post-images")
        .list();
      const { data: coverImages } = await supabase.storage
        .from("covers")
        .list();

      // Estimate storage (rough calculation)
      const storageUsed =
        ((storageData?.length || 0) * 0.5 +
          (postImages?.length || 0) * 2 +
          (coverImages?.length || 0) * 1) /
        1024; // Convert to GB estimate

      return {
        dau: dau || 0,
        mau: mau || 0,
        totalUsers: totalUsers || 0,
        dailyPostRate: dailyPosts || 0,
        weeklyPostRate: weeklyPosts || 0,
        avgEngagementRate,
        retentionDay1,
        retentionDay7,
        retentionDay30,
        storageUsed,
        dailyActiveUsersChart,
        postCreationChart,
        engagementChart,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    analytics: data,
    isLoading,
    error,
  };
};
