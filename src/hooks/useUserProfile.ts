import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserProfile = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: education, isLoading: educationLoading } = useQuery({
    queryKey: ["user-education", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ["user-skills", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: experience, isLoading: experienceLoading } = useQuery({
    queryKey: ["user-experience", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("experience")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["user-achievements", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: friendCount } = useQuery({
    queryKey: ["user-friend-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("User ID not found");

      // Validate file
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 2MB limit.");
      }

      // Create file path: userId/avatar.extension
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `${userId}/${file.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      return publicUrlData.publicUrl;
    },
    onSuccess: () => {
      toast.success("Profile picture updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload profile picture");
    },
  });

  const uploadCoverImage = useMutation({
    mutationFn: async (file: File) => {
      if (!userId) throw new Error("User ID not found");

      // Validate file
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      }

      const maxSize = 5 * 1024 * 1024; // 5MB for cover images
      if (file.size > maxSize) {
        throw new Error("File size exceeds 5MB limit.");
      }

      // Create file path: userId/cover.extension with timestamp for cache busting
      const fileExt = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const filePath = `${userId}/cover_${timestamp}.${fileExt}`;

      // Delete old cover if exists
      const { data: existingFiles } = await supabase.storage
        .from("covers")
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `${userId}/${file.name}`);
        await supabase.storage.from("covers").remove(filesToDelete);
      }

      // Upload new cover
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      // Update profile with new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: publicUrlData.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      return publicUrlData.publicUrl;
    },
    onSuccess: () => {
      toast.success("Cover image updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload cover image");
    },
  });

  return {
    profile,
    education: education || [],
    skills: skills || [],
    experience: experience || [],
    achievements: achievements || [],
    friendCount: friendCount || 0,
    isLoading: profileLoading || educationLoading || skillsLoading || experienceLoading || achievementsLoading,
    uploadAvatar,
    uploadCoverImage,
  };
};
