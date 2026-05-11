import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCourseDetails,
  useCourseLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  Lesson,
} from "@/hooks/useCourseDetails";
import { useUserRole } from "@/hooks/useUserRole";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  GripVertical,
  ShieldAlert,
  Eye,
} from "lucide-react";

const initialLessonForm = {
  title: "",
  description: "",
  content_type: "video",
  content_url: "",
  content_text: "",
  duration_minutes: 0,
  is_free_preview: false,
  order_index: 0,
};

const ManageLessons = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { isAdmin } = useUserRole();
  const { data: course, isLoading: courseLoading } = useCourseDetails(courseId);
  const { data: lessons = [], isLoading: lessonsLoading } = useCourseLessons(courseId);
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState(initialLessonForm);

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "text":
        return FileText;
      case "quiz":
        return HelpCircle;
      default:
        return FileText;
    }
  };

  const openCreateDialog = () => {
    setEditingLesson(null);
    setFormData({
      ...initialLessonForm,
      order_index: lessons.length,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      content_type: lesson.content_type,
      content_url: lesson.content_url || "",
      content_text: lesson.content_text || "",
      duration_minutes: lesson.duration_minutes || 0,
      is_free_preview: lesson.is_free_preview || false,
      order_index: lesson.order_index,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    if (editingLesson) {
      await updateLesson.mutateAsync({
        id: editingLesson.id,
        ...formData,
      });
    } else {
      await createLesson.mutateAsync({
        course_id: courseId,
        ...formData,
      });
    }

    setDialogOpen(false);
    setEditingLesson(null);
    setFormData(initialLessonForm);
  };

  const confirmDelete = () => {
    if (lessonToDelete && courseId) {
      deleteLesson.mutate({ id: lessonToDelete.id, courseId });
    }
    setDeleteDialogOpen(false);
    setLessonToDelete(null);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              Only administrators can manage lessons.
            </p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (courseLoading || lessonsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
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
          <Button asChild>
            <Link to="/admin/courses">Back to Course Management</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/admin/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course Management
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Manage Lessons</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{course.title}</p>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No lessons yet. Add your first lesson to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const ContentIcon = getContentIcon(lesson.content_type);
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <ContentIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{lesson.title}</span>
                          {lesson.is_free_preview && (
                            <Badge variant="secondary" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {lesson.duration_minutes || 0} min • {lesson.content_type}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setLessonToDelete(lesson);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Lesson Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">Lesson Title *</Label>
                <Input
                  id="lesson-title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-description">Description</Label>
                <Textarea
                  id="lesson-description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => updateField("content_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text/Article</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration_minutes}
                    onChange={(e) => updateField("duration_minutes", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {formData.content_type === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="content-url">Video URL</Label>
                  <Input
                    id="content-url"
                    type="url"
                    placeholder="https://youtube.com/... or https://vimeo.com/..."
                    value={formData.content_url}
                    onChange={(e) => updateField("content_url", e.target.value)}
                  />
                </div>
              )}

              {formData.content_type === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="content-text">Lesson Content</Label>
                  <Textarea
                    id="content-text"
                    placeholder="Write your lesson content here..."
                    value={formData.content_text}
                    onChange={(e) => updateField("content_text", e.target.value)}
                    rows={8}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="free-preview">Free Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow non-enrolled users to view this lesson
                  </p>
                </div>
                <Switch
                  id="free-preview"
                  checked={formData.is_free_preview}
                  onCheckedChange={(checked) => updateField("is_free_preview", checked)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.title || createLesson.isPending || updateLesson.isPending}
                >
                  {createLesson.isPending || updateLesson.isPending
                    ? "Saving..."
                    : editingLesson
                    ? "Save Changes"
                    : "Add Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{lessonToDelete?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
    </div>
  );
};

export default ManageLessons;
