import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/courses/ProgressBar";
import { useMyEnrolledCourses } from "@/hooks/useCourses";
import { BookOpen, PlayCircle, Award, ArrowRight } from "lucide-react";

const MyCourses = () => {
  const { data: enrollments = [], isLoading } = useMyEnrolledCourses();

  const inProgress = enrollments.filter(
    (e) => e.progress_percentage !== null && e.progress_percentage < 100
  );
  const completed = enrollments.filter(
    (e) => e.progress_percentage === 100
  );

  const CourseListItem = ({
    enrollment,
  }: {
    enrollment: (typeof enrollments)[0];
  }) => {
    const course = enrollment.course;
    if (!course) return null;

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-48 shrink-0">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-32 sm:h-full object-cover"
              />
            ) : (
              <div className="w-full h-32 sm:h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary/40" />
              </div>
            )}
          </div>
          <CardContent className="flex-1 p-4">
            <div className="flex flex-col h-full justify-between gap-3">
              <div>
                <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                {course.instructor && (
                  <p className="text-sm text-muted-foreground">
                    by {course.instructor}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <ProgressBar
                  value={enrollment.progress_percentage || 0}
                  size="sm"
                />

                <div className="flex items-center justify-between gap-2">
                  {enrollment.progress_percentage === 100 ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/courses/${course.id}/certificate`}>
                        <Award className="h-4 w-4 mr-2" />
                        Certificate
                      </Link>
                    </Button>
                  ) : null}

                  <Button size="sm" className="ml-auto" asChild>
                    <Link
                      to={`/courses/${course.id}/learn`}
                    >
                      {enrollment.progress_percentage === 0 ? (
                        <>
                          Start Course
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : enrollment.progress_percentage === 100 ? (
                        <>
                          Review
                          <PlayCircle className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Continue
                          <PlayCircle className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="text-center py-16">
      <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button asChild>
        <Link to="/courses">Browse Courses</Link>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Track your learning progress
            </p>
          </div>
          <Button asChild>
            <Link to="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse More
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <div className="flex">
                  <Skeleton className="w-48 h-32" />
                  <div className="flex-1 p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="You haven't enrolled in any courses. Start learning today!"
          />
        ) : (
          <Tabs defaultValue="in-progress" className="space-y-6">
            <TabsList>
              <TabsTrigger value="in-progress">
                In Progress ({inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completed.length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({enrollments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="in-progress" className="space-y-4">
              {inProgress.length > 0 ? (
                inProgress.map((enrollment) => (
                  <CourseListItem key={enrollment.id} enrollment={enrollment} />
                ))
              ) : (
                <EmptyState
                  title="No courses in progress"
                  description="You've completed all your courses or haven't started any yet."
                />
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completed.length > 0 ? (
                completed.map((enrollment) => (
                  <CourseListItem key={enrollment.id} enrollment={enrollment} />
                ))
              ) : (
                <EmptyState
                  title="No completed courses"
                  description="Keep learning! Complete a course to see it here."
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {enrollments.map((enrollment) => (
                <CourseListItem key={enrollment.id} enrollment={enrollment} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyCourses;
