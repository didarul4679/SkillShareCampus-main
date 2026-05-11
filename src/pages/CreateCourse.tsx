import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateCourse } from "@/hooks/useCourses";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ArrowLeft, BookOpen, ShieldAlert } from "lucide-react";

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

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const createCourse = useCreateCourse();
  const { profile } = useUserProfile(user?.id);

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
              Only administrators can create courses. If you believe you should have access, please contact an administrator.
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty_level: "beginner",
    duration_hours: 0,
    price: 0,
    thumbnail_url: "",
    is_published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const course = await createCourse.mutateAsync({
      ...formData,
      instructor: profile?.full_name || "Instructor",
    });

    if (course) {
      navigate(`/courses/${course.id}`);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Create New Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Web Development"
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
                  placeholder="Describe what students will learn..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
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
                    onValueChange={(value) =>
                      updateField("difficulty_level", value)
                    }
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
                    onChange={(e) =>
                      updateField("duration_hours", parseInt(e.target.value) || 0)
                    }
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
                    onChange={(e) =>
                      updateField("price", parseFloat(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to 0 for a free course
                  </p>
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.thumbnail_url}
                  onChange={(e) => updateField("thumbnail_url", e.target.value)}
                />
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
                  onCheckedChange={(checked) =>
                    updateField("is_published", checked)
                  }
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/courses")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.title || createCourse.isPending}
                >
                  {createCourse.isPending ? "Creating..." : "Create Course"}
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

export default CreateCourse;
