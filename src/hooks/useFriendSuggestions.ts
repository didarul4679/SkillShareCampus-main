import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FriendSuggestion {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  mutual_friends_count: number;
  shared_skills_count: number;
  same_company: boolean;
  same_location: boolean;
  suggestion_score: number;
}

export const useFriendSuggestions = () => {
  const { user } = useAuth();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["friend-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get current user's profile info
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("company, location")
        .eq("id", user.id)
        .single();

      // Get user's current friends
      const { data: currentFriends } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const friendIds = currentFriends?.map((f) => f.friend_id) || [];

      // Get user's skills
      const { data: userSkills } = await supabase
        .from("skills")
        .select("skill_name")
        .eq("user_id", user.id);

      const userSkillNames = userSkills?.map((s) => s.skill_name) || [];

      // Get all profiles except current user and existing friends
      const { data: allProfiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, location, company")
        .neq("id", user.id);

      if (error) throw error;

      // Filter out existing friends and pending requests
      const { data: pendingRequests } = await supabase
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .neq("status", "rejected");

      const excludedIds = new Set([
        ...friendIds,
        ...(pendingRequests?.map((r) => 
          r.user_id === user.id ? r.friend_id : r.user_id
        ) || []),
      ]);

      const potentialSuggestions = allProfiles?.filter(
        (profile) => !excludedIds.has(profile.id)
      ) || [];

      // Calculate suggestion scores for each potential friend
      const suggestionsWithScores = await Promise.all(
        potentialSuggestions.map(async (profile) => {
          let score = 0;

          // 1. Calculate mutual friends (weight: 3 points per mutual friend)
          const { data: theirFriends } = await supabase
            .from("friendships")
            .select("friend_id")
            .eq("user_id", profile.id)
            .eq("status", "accepted");

          const theirFriendIds = theirFriends?.map((f) => f.friend_id) || [];
          const mutualFriends = friendIds.filter((id) =>
            theirFriendIds.includes(id)
          );
          const mutualFriendsCount = mutualFriends.length;
          score += mutualFriendsCount * 3;

          // 2. Calculate shared skills (weight: 2 points per shared skill)
          const { data: theirSkills } = await supabase
            .from("skills")
            .select("skill_name")
            .eq("user_id", profile.id);

          const theirSkillNames = theirSkills?.map((s) => s.skill_name) || [];
          const sharedSkills = userSkillNames.filter((skill) =>
            theirSkillNames.includes(skill)
          );
          const sharedSkillsCount = sharedSkills.length;
          score += sharedSkillsCount * 2;

          // 3. Same company (weight: 5 points)
          const sameCompany =
            currentProfile?.company &&
            profile.company &&
            currentProfile.company.toLowerCase() === profile.company.toLowerCase();
          if (sameCompany) score += 5;

          // 4. Same location (weight: 2 points)
          const sameLocation =
            currentProfile?.location &&
            profile.location &&
            currentProfile.location.toLowerCase() === profile.location.toLowerCase();
          if (sameLocation) score += 2;

          return {
            ...profile,
            mutual_friends_count: mutualFriendsCount,
            shared_skills_count: sharedSkillsCount,
            same_company: sameCompany || false,
            same_location: sameLocation || false,
            suggestion_score: score,
          };
        })
      );

      // Sort by score (descending) and return top 10
      return suggestionsWithScores
        .filter((s) => s.suggestion_score > 0)
        .sort((a, b) => b.suggestion_score - a.suggestion_score)
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const getMutualFriends = async (userId: string) => {
    if (!user) return [];

    // Get current user's friends
    const { data: currentFriends } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const friendIds = currentFriends?.map((f) => f.friend_id) || [];

    // Get other user's friends
    const { data: theirFriends } = await supabase
      .from("friendships")
      .select("friend_id, profile:profiles!friendships_friend_id_fkey(id, full_name, avatar_url)")
      .eq("user_id", userId)
      .eq("status", "accepted");

    // Find mutual friends
    const mutualFriends = theirFriends?.filter((friend) =>
      friendIds.includes(friend.friend_id)
    );

    return mutualFriends || [];
  };

  return {
    suggestions: suggestions || [],
    isLoading,
    getMutualFriends,
  };
};
