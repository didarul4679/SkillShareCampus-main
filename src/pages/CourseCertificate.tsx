import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseDetails } from "@/hooks/useCourseDetails";
import { useCertificate } from "@/hooks/useLessonProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Award, ArrowLeft, Download, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const CourseCertificate = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourseDetails(id);
  const { data: certificate, isLoading: certLoading } = useCertificate(id);
  const { profile } = useUserProfile(user?.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificate of Completion - ${course?.title}`,
        text: `I've completed ${course?.title} on SkillShareCampus!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    toast.info("Certificate download feature coming soon!");
  };

  if (courseLoading || certLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="aspect-[1.4/1] max-w-3xl mx-auto rounded-lg" />
        </main>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Certificate Not Found</h1>
          <p className="text-muted-foreground mb-6">
            You need to complete the course to earn a certificate.
          </p>
          <Button asChild>
            <Link to={`/courses/${id}`}>Back to Course</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to={`/courses/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Link>
        </Button>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Certificate */}
          <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-2">
            <div className="text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <Award className="h-16 w-16 mx-auto text-primary" />
                <h1 className="text-2xl md:text-3xl font-serif text-primary">
                  Certificate of Completion
                </h1>
              </div>

              {/* Body */}
              <div className="space-y-4 py-8">
                <p className="text-muted-foreground">This is to certify that</p>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {profile?.full_name || "Student"}
                </h2>
                <p className="text-muted-foreground">
                  has successfully completed the course
                </p>
                <h3 className="text-xl md:text-2xl font-semibold text-primary">
                  {course?.title}
                </h3>
                {course?.instructor_profile && (
                  <p className="text-muted-foreground">
                    Instructed by{" "}
                    <span className="font-medium">
                      {course.instructor_profile.full_name || course.instructor}
                    </span>
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="pt-8 border-t space-y-2">
                <p className="text-sm text-muted-foreground">
                  Issued on{" "}
                  {format(new Date(certificate.issued_at), "MMMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  Certificate ID: {certificate.certificate_number}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Certificate
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseCertificate;
