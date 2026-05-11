import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  completed_at: string | null;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string | null;
}

export function useLessonProgressForCourse(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lesson-progress", courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return [];

      const { data: lessons } = await supabase
        .from("course_lessons")
        .select("id")
        .eq("course_id", courseId);

      if (!lessons || lessons.length === 0) return [];

      const lessonIds = lessons.map((l) => l.id);

      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds);

      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!courseId && !!user,
  });
}

export function useMarkLessonComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      courseId,
    }: {
      lessonId: string;
      courseId: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, courseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", result.courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", result.courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-enrolled-courses"] });
    },
  });
}

export function useUpdateLessonTime() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      lessonId,
      timeSpent,
    }: {
      lessonId: string;
      timeSpent: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          time_spent_seconds: timeSpent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useCertificate(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["certificate", courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;

      const { data, error } = await supabase
        .from("certificates")
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

export function useGenerateCertificate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("Not authenticated");

      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data, error } = await supabase
        .from("certificates")
        .insert({
          user_id: user.id,
          course_id: courseId,
          certificate_number: certificateNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["certificate", courseId] });
    },
  });
}
