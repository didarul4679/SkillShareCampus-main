import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_free_preview: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useCourseDetails(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor_profile:profiles!courses_instructor_id_fkey(id, full_name, avatar_url, bio)
        `)
        .eq("id", courseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!courseId,
  });
}

export function useCourseReviews(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      if (!courseId) return [];

      const { data, error } = await supabase
        .from("course_reviews")
        .select(`
          *,
          user_profile:profiles!course_reviews_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CourseReview[];
    },
    enabled: !!courseId,
  });
}

export function useEnrollment(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["enrollment", courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;

      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          course_id: courseId,
          user_id: user.id,
          status: "enrolled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Successfully enrolled in course!");
    },
    onError: (error) => {
      toast.error("Failed to enroll: " + error.message);
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      rating,
      reviewText,
    }: {
      courseId: string;
      rating: number;
      reviewText?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("course_reviews")
        .upsert({
          course_id: courseId,
          user_id: user.id,
          rating,
          review_text: reviewText || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Review submitted!");
    },
    onError: (error) => {
      toast.error("Failed to submit review: " + error.message);
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonData: Partial<Lesson> & { course_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("course_lessons")
        .insert({
          course_id: lessonData.course_id,
          title: lessonData.title,
          description: lessonData.description,
          content_type: lessonData.content_type || 'video',
          content_url: lessonData.content_url,
          content_text: lessonData.content_text,
          order_index: lessonData.order_index || 0,
          duration_minutes: lessonData.duration_minutes,
          is_free_preview: lessonData.is_free_preview,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", data.course_id] });
      toast.success("Lesson created!");
    },
    onError: (error) => {
      toast.error("Failed to create lesson: " + error.message);
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lessonData }: Partial<Lesson> & { id: string }) => {
      const { data, error } = await supabase
        .from("course_lessons")
        .update(lessonData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", data.course_id] });
      toast.success("Lesson updated!");
    },
    onError: (error) => {
      toast.error("Failed to update lesson: " + error.message);
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from("course_lessons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, courseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", data.courseId] });
      toast.success("Lesson deleted!");
    },
    onError: (error) => {
      toast.error("Failed to delete lesson: " + error.message);
    },
  });
}
