import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonList } from "@/components/courses/LessonList";
import { ProgressBar } from "@/components/courses/ProgressBar";
import {
  useCourseDetails,
  useCourseLessons,
  useEnrollment,
  Lesson,
} from "@/hooks/useCourseDetails";
import {
  useLessonProgressForCourse,
  useMarkLessonComplete,
  useGenerateCertificate,
  useCertificate,
} from "@/hooks/useLessonProgress";
import {
  ArrowLeft,
  ArrowRight,
  Menu,
  CheckCircle,
  Award,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CourseLearn = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get("lesson");

  const { data: course, isLoading: courseLoading } = useCourseDetails(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(id);
  const { data: enrollment } = useEnrollment(id);
  const { data: progress = [] } = useLessonProgressForCourse(id);
  const { data: certificate } = useCertificate(id);
  const markComplete = useMarkLessonComplete();
  const generateCertificate = useGenerateCertificate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLesson = lessons.find((l) => l.id === lessonId) || lessons[0];
  const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const isLessonCompleted = progress.find(
    (p) => p.lesson_id === currentLesson?.id && p.is_completed
  );

  const completedCount = progress.filter((p) => p.is_completed).length;
  const isAllCompleted = completedCount === lessons.length && lessons.length > 0;

  useEffect(() => {
    if (!lessonId && lessons.length > 0) {
      setSearchParams({ lesson: lessons[0].id });
    }
  }, [lessonId, lessons, setSearchParams]);

  const handleLessonClick = (lesson: Lesson) => {
    setSearchParams({ lesson: lesson.id });
    setSidebarOpen(false);
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !id) return;
    await markComplete.mutateAsync({ lessonId: currentLesson.id, courseId: id });

    // Check if this was the last lesson
    const newCompletedCount = completedCount + 1;
    if (newCompletedCount === lessons.length && !certificate) {
      toast.success("Congratulations! You've completed the course!");
      generateCertificate.mutate(id);
    } else if (nextLesson) {
      setSearchParams({ lesson: nextLesson.id });
    }
  };

  if (courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex h-[calc(100vh-56px)]">
          <div className="hidden lg:block w-80 border-r">
            <Skeleton className="h-full" />
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!enrollment && !currentLesson?.is_free_preview) {
    navigate(`/courses/${id}`);
    return null;
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold line-clamp-2">{course?.title}</h2>
        <ProgressBar
          value={enrollment?.progress_percentage || 0}
          size="sm"
          className="mt-3"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <LessonList
            lessons={lessons}
            progress={progress}
            currentLessonId={currentLesson?.id}
            onLessonClick={handleLessonClick}
            isEnrolled={!!enrollment}
            showProgress
          />
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b px-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/courses/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-medium text-sm md:text-base line-clamp-1">
            {course?.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAllCompleted && certificate && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/courses/${id}/certificate`}>
                <Award className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Certificate</span>
              </Link>
            </Button>
          )}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-80 border-r bg-card">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
              {currentLesson ? (
                <div className="space-y-6">
                  {/* Video/Content */}
                  {currentLesson.content_type === "video" &&
                    currentLesson.content_url && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={currentLesson.content_url}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    )}

                  {currentLesson.content_type === "text" && (
                    <div className="prose prose-sm md:prose dark:prose-invert max-w-none">
                      {currentLesson.content_text ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: currentLesson.content_text,
                          }}
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          No content available for this lesson.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Lesson Info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold">
                          {currentLesson.title}
                        </h2>
                        {currentLesson.description && (
                          <p className="text-muted-foreground mt-1">
                            {currentLesson.description}
                          </p>
                        )}
                      </div>
                      {isLessonCompleted && (
                        <div className="flex items-center gap-1 text-green-600 shrink-0">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    Select a lesson to start learning.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Navigation */}
          {currentLesson && (
            <div className="border-t p-4 bg-card">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  disabled={!previousLesson}
                  onClick={() =>
                    previousLesson && handleLessonClick(previousLesson)
                  }
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-2">
                  {!isLessonCompleted && enrollment && (
                    <Button
                      onClick={handleMarkComplete}
                      disabled={markComplete.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>

                <Button
                  variant={isLessonCompleted ? "default" : "outline"}
                  disabled={!nextLesson}
                  onClick={() => nextLesson && handleLessonClick(nextLesson)}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CourseLearn;
