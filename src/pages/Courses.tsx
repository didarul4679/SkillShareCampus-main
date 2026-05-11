import { useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses, CourseFilters as Filters } from "@/hooks/useCourses";
import { useUserRole } from "@/hooks/useUserRole";
import { BookOpen, Plus, Settings } from "lucide-react";

const Courses = () => {
  const { isAdmin } = useUserRole();
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    difficulty: "all",
    priceType: "all",
    search: "",
    sortBy: "newest",
  });

  const { data: courses = [], isLoading } = useCourses(filters);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Course Catalog</h1>
            <p className="text-muted-foreground mt-1">
              Discover and enroll in courses to boost your skills
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/courses/my-courses">
                <BookOpen className="h-4 w-4 mr-2" />
                My Courses
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" asChild>
                  <Link to="/admin/courses">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <h2 className="font-semibold">Filters</h2>
              <CourseFilters filters={filters} onFiltersChange={setFilters} />
            </div>
          </aside>

          {/* Mobile Filters */}
          <div className="lg:hidden">
            <CourseFilters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Course Grid */}
          <div>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {courses.length} course{courses.length !== 1 ? "s" : ""} found
                </p>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      category: "all",
                      difficulty: "all",
                      priceType: "all",
                      search: "",
                      sortBy: "newest",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
