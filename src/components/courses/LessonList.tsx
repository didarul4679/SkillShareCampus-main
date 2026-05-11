import { CheckCircle2, Circle, PlayCircle, FileText, HelpCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lesson } from "@/hooks/useCourseDetails";
import { LessonProgress } from "@/hooks/useLessonProgress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LessonListProps {
  lessons: Lesson[];
  progress?: LessonProgress[];
  currentLessonId?: string;
  onLessonClick?: (lesson: Lesson) => void;
  isEnrolled?: boolean;
  showProgress?: boolean;
}

export function LessonList({
  lessons,
  progress = [],
  currentLessonId,
  onLessonClick,
  isEnrolled = false,
  showProgress = true,
}: LessonListProps) {
  const getProgressForLesson = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId);
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case "video":
        return PlayCircle;
      case "text":
        return FileText;
      case "quiz":
        return HelpCircle;
      default:
        return FileText;
    }
  };

  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const completedCount = progress.filter((p) => p.is_completed).length;

  return (
    <div className="space-y-4">
      {showProgress && lessons.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{lessons.length} lessons</span>
          <span>
            {completedCount}/{lessons.length} completed • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
          </span>
        </div>
      )}

      <Accordion type="single" collapsible className="w-full" defaultValue="curriculum">
        <AccordionItem value="curriculum" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-semibold">Course Curriculum</span>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="divide-y">
              {lessons.map((lesson, index) => {
                const lessonProgress = getProgressForLesson(lesson.id);
                const isCompleted = lessonProgress?.is_completed;
                const isCurrent = lesson.id === currentLessonId;
                const canAccess = isEnrolled || lesson.is_free_preview;
                const ContentIcon = getContentIcon(lesson.content_type);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => canAccess && onLessonClick?.(lesson)}
                    className={cn(
                      "flex items-center gap-3 p-4 transition-colors",
                      canAccess && onLessonClick && "cursor-pointer hover:bg-muted/50",
                      isCurrent && "bg-primary/5",
                      !canAccess && "opacity-60"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {showProgress && isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : showProgress && isCurrent ? (
                        <Circle className="h-5 w-5 text-primary fill-primary/20" />
                      ) : !canAccess ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center text-xs text-muted-foreground font-medium">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ContentIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isCurrent && "text-primary"
                          )}
                        >
                          {lesson.title}
                        </span>
                        {lesson.is_free_preview && !isEnrolled && (
                          <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    {lesson.duration_minutes && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {lesson.duration_minutes} min
                      </span>
                    )}
                  </div>
                );
              })}

              {lessons.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No lessons available yet.
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
