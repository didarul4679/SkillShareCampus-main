import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users, Clock, BookOpen } from "lucide-react";
import { Course } from "@/hooks/useCourses";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <Link to={`/courses/${course.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative aspect-video overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {(course.price === null || Number(course.price) === 0) && (
            <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
              Free
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            {course.category && (
              <Badge variant="secondary" className="text-xs">
                {course.category}
              </Badge>
            )}
            {course.difficulty_level && (
              <Badge 
                variant="outline" 
                className={`text-xs ${difficultyColors[course.difficulty_level] || ""}`}
              >
                {course.difficulty_level}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          
          {course.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {course.instructor_profile && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={course.instructor_profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {course.instructor_profile.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[120px]">
                  {course.instructor_profile.full_name || course.instructor || "Instructor"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {course.rating !== null && course.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{Number(course.rating).toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.students_count || 0}</span>
            </div>
            {course.duration_hours !== null && course.duration_hours > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration_hours}h</span>
              </div>
            )}
          </div>
          
          {course.price !== null && Number(course.price) > 0 && (
            <span className="font-bold text-primary">৳{Number(course.price)}</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
