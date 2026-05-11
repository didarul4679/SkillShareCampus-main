import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  thumbnail_url: string | null;
  category: string | null;
  difficulty_level: string | null;
  duration_hours: number | null;
  price: number | null;
  is_published: boolean | null;
  instructor_id: string | null;
  students_count: number | null;
  rating: number | null;
  created_at: string;
  updated_at: string | null;
  instructor_profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  lessons_count?: number;
}

export interface CourseFilters {
  category?: string;
  difficulty?: string;
  priceType?: "all" | "free" | "paid";
  search?: string;
  sortBy?: "newest" | "popular" | "rating";
}

export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select(`
          *,
          instructor_profile:profiles!courses_instructor_id_fkey(id, full_name, avatar_url)
        `)
        .eq("is_published", true);

      if (filters.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }

      if (filters.difficulty && filters.difficulty !== "all") {
        query = query.eq("difficulty_level", filters.difficulty);
      }

      if (filters.priceType === "free") {
        query = query.eq("price", 0);
      } else if (filters.priceType === "paid") {
        query = query.gt("price", 0);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      switch (filters.sortBy) {
        case "popular":
          query = query.order("students_count", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Course[];
    },
  });
}

export function useCourseCategories() {
  return useQuery({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("category")
        .eq("is_published", true)
        .not("category", "is", null);

      if (error) throw error;
      
      const categories = [...new Set(data.map(c => c.category).filter(Boolean))];
      return categories as string[];
    },
  });
}

export function useMyEnrolledCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-enrolled-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(
            *,
            instructor_profile:profiles!courses_instructor_id_fkey(id, full_name, avatar_url)
          )
        `)
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: courseData.title!,
          description: courseData.description,
          category: courseData.category,
          difficulty_level: courseData.difficulty_level,
          duration_hours: courseData.duration_hours,
          price: courseData.price,
          thumbnail_url: courseData.thumbnail_url,
          is_published: courseData.is_published,
          instructor_id: user.id,
          instructor: courseData.instructor || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create course: " + error.message);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...courseData }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from("courses")
        .update({ ...courseData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", data.id] });
      toast.success("Course updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update course: " + error.message);
    },
  });
}
