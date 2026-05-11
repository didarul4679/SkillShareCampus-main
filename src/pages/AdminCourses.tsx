import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUserRole } from "@/hooks/useUserRole";
import { useAllCourses, useDeleteCourse, useToggleCoursePublish } from "@/hooks/useAdminCourses";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  ShieldAlert,
  ArrowLeft,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const AdminCourses = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { data: courses, isLoading } = useAllCourses();
  const deleteCourse = useDeleteCourse();
  const togglePublish = useToggleCoursePublish();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (courseId: string) => {
    setCourseToDelete(courseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteCourse.mutate(courseToDelete);
    }
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
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
              Only administrators can access course management.
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Management
              </CardTitle>
              <Button onClick={() => navigate("/courses/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">{courses?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">
                  {courses?.filter((c) => c.is_published).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">
                  {courses?.filter((c) => !c.is_published).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">
                  {courses?.reduce((acc, c) => acc + (c.students_count || 0), 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCourses?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No courses match your search." : "No courses yet. Create your first course!"}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses?.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="h-10 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium line-clamp-1">{course.title}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {course.difficulty_level || "Not set"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.category || "Uncategorized"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {course.price === null || Number(course.price) === 0 ? (
                              <span className="text-green-600 font-medium">Free</span>
                            ) : (
                              <span>৳{Number(course.price)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.students_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.is_published ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(course.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/courses/${course.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}>
                                <BookOpen className="h-4 w-4 mr-2" />
                                Manage Lessons
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  togglePublish.mutate({
                                    courseId: course.id,
                                    isPublished: !course.is_published,
                                  })
                                }
                              >
                                {course.is_published ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(course.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Course</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this course, including all lessons, enrollments, and reviews. This action cannot be undone.
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

export default AdminCourses;
