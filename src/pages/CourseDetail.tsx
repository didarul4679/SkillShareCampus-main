import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonList } from "@/components/courses/LessonList";
import { CourseReviews } from "@/components/courses/CourseReviews";
import { ProgressBar } from "@/components/courses/ProgressBar";
import { PaymentModal } from "@/components/courses/PaymentModal";
import {
  useCourseDetails,
  useCourseLessons,
  useCourseReviews,
  useEnrollment,
  useEnrollInCourse,
} from "@/hooks/useCourseDetails";
import { useLessonProgressForCourse } from "@/hooks/useLessonProgress";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  PlayCircle,
  ArrowLeft,
  CheckCircle,
  Award,
  ShoppingCart,
  Loader2,
} from "lucide-react";

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading, refetch: refetchCourse } = useCourseDetails(id);
  const { data: lessons = [] } = useCourseLessons(id);
  const { data: reviews = [] } = useCourseReviews(id);
  const { data: enrollment, refetch: refetchEnrollment } = useEnrollment(id);
  const { data: progress = [] } = useLessonProgressForCourse(id);
  const enrollMutation = useEnrollInCourse();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const isEnrolled = !!enrollment;
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

  const isFree = course?.price === null || Number(course?.price) === 0;

  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus) {
      if (paymentStatus === "success") {
        toast.success("Payment successful! You are now enrolled in this course.");
        refetchEnrollment();
        refetchCourse();
      } else if (paymentStatus === "failed") {
        toast.error("Payment failed. Please try again.");
      } else if (paymentStatus === "cancelled") {
        toast.info("Payment was cancelled.");
      }
      // Clear the query param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refetchEnrollment, refetchCourse]);

  // Listen for payment success messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "payment_success" && event.data?.url) {
        window.location.href = event.data.url;
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleEnroll = () => {
    if (!user) {
      navigate("/signin");
      return;
    }
    
    if (isFree) {
      // Free course - enroll directly
      if (id) {
        enrollMutation.mutate(id);
      }
    } else {
      // Paid course - show payment modal
      setShowPaymentModal(true);
    }
  };

  const handleContinueLearning = () => {
    const firstIncomplete = lessons.find(
      (l) => !progress.find((p) => p.lesson_id === l.id && p.is_completed)
    );
    const lessonId = firstIncomplete?.id || lessons[0]?.id;
    if (lessonId) {
      navigate(`/courses/${id}/learn?lesson=${lessonId}`);
    }
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" size="sm" className="mb-4" asChild>
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {course.category && (
                    <Badge variant="secondary">{course.category}</Badge>
                  )}
                  {course.difficulty_level && (
                    <Badge variant="outline" className="capitalize">
                      {course.difficulty_level}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>

                {course.description && (
                  <p className="text-lg text-muted-foreground">
                    {course.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {course.rating !== null && Number(course.rating) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {Number(course.rating).toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({reviews.length} reviews)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.students_count || 0} students</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                    </span>
                  </div>
                </div>

                {course.instructor_profile && (
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={course.instructor_profile.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {course.instructor_profile.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Instructor
                      </div>
                      <div className="font-medium">
                        {course.instructor_profile.full_name || course.instructor}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enrollment Card */}
              <div className="lg:row-start-1">
                <div className="bg-card border rounded-lg overflow-hidden sticky top-24">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {isEnrolled ? (
                      <>
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Enrolled</span>
                        </div>
                        <ProgressBar value={enrollment?.progress_percentage || 0} />
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleContinueLearning}
                        >
                          <PlayCircle className="h-5 w-5 mr-2" />
                          {enrollment?.progress_percentage && enrollment.progress_percentage > 0
                            ? "Continue Learning"
                            : "Start Course"}
                        </Button>
                        {enrollment?.progress_percentage === 100 && (
                          <Button variant="outline" className="w-full" asChild>
                            <Link to={`/courses/${id}/certificate`}>
                              <Award className="h-4 w-4 mr-2" />
                              View Certificate
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-bold">
                          {isFree
                            ? "Free"
                            : `৳${Number(course.price)}`}
                        </div>
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleEnroll}
                          disabled={enrollMutation.isPending}
                        >
                          {enrollMutation.isPending ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : isFree ? (
                            "Enroll Now"
                          ) : (
                            <>
                              <ShoppingCart className="h-5 w-5 mr-2" />
                              Buy Course
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="curriculum" className="space-y-6">
            <TabsList>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum">
              <LessonList
                lessons={lessons}
                progress={progress}
                isEnrolled={isEnrolled}
                onLessonClick={(lesson) => {
                  if (isEnrolled || lesson.is_free_preview) {
                    navigate(`/courses/${id}/learn?lesson=${lesson.id}`);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="reviews">
              <CourseReviews
                courseId={id!}
                reviews={reviews}
                isEnrolled={isEnrolled}
                averageRating={Number(course.rating) || 0}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Payment Modal */}
      {course && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          course={{
            id: course.id,
            title: course.title,
            price: Number(course.price),
            thumbnail_url: course.thumbnail_url,
            instructor: course.instructor,
          }}
        />
      )}
    </div>
  );
};

export default CourseDetail;
