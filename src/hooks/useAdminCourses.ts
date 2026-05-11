import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Course } from "./useCourses";

export function useAllCourses() {
  return useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor_profile:profiles!courses_instructor_id_fkey(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      // First delete all lessons
      await supabase
        .from("course_lessons")
        .delete()
        .eq("course_id", courseId);

      // Then delete enrollments
      await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId);

      // Delete reviews
      await supabase
        .from("course_reviews")
        .delete()
        .eq("course_id", courseId);

      // Finally delete the course
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;
      return courseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete course: " + error.message);
    },
  });
}

export function useToggleCoursePublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, isPublished }: { courseId: string; isPublished: boolean }) => {
      const { data, error } = await supabase
        .from("courses")
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq("id", courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", data.id] });
      toast.success(data.is_published ? "Course published" : "Course unpublished");
    },
    onError: (error) => {
      toast.error("Failed to update course: " + error.message);
    },
  });
}
