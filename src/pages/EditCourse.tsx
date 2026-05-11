import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourseDetails } from "@/hooks/useCourseDetails";
import { useUpdateCourse } from "@/hooks/useCourses";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";

const categories = [
  "Web Development",
  "Programming",
  "Data Science",
  "Design",
  "Business",
  "Marketing",
  "Personal Development",
  "Other",
];

const EditCourse = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { data: course, isLoading } = useCourseDetails(id);
  const updateCourse = useUpdateCourse();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    duration_hours: 0,
    price: 0,
    thumbnail_url: "",
    is_published: false,
    instructor: "",
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        category: course.category || "",
        difficulty_level: course.difficulty_level || "beginner",
        duration_hours: course.duration_hours || 0,
        price: Number(course.price) || 0,
        thumbnail_url: course.thumbnail_url || "",
        is_published: course.is_published || false,
        instructor: course.instructor || "",
      });
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await updateCourse.mutateAsync({
      id,
      ...formData,
    });

    navigate("/admin/courses");
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
              Only administrators can edit courses.
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="courses" />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
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

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/admin/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course Management
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                />
              </div>

              {/* Instructor Name */}
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor Name</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => updateField("instructor", e.target.value)}
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => updateField("difficulty_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration_hours}
                    onChange={(e) => updateField("duration_hours", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (৳ BDT)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => updateField("thumbnail_url", e.target.value)}
                />
                {formData.thumbnail_url && (
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail preview"
                    className="h-32 w-auto object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="publish">Publish Course</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this course visible to students
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => updateField("is_published", checked)}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/admin/courses")}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={!formData.title || updateCourse.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateCourse.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default EditCourse;
