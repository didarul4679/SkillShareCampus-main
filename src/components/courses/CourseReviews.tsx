import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { CourseReview, useSubmitReview } from "@/hooks/useCourseDetails";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface CourseReviewsProps {
  courseId: string;
  reviews: CourseReview[];
  isEnrolled: boolean;
  averageRating?: number;
}

export function CourseReviews({
  courseId,
  reviews,
  isEnrolled,
  averageRating = 0,
}: CourseReviewsProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitReview = useSubmitReview();

  const existingReview = reviews.find((r) => r.user_id === user?.id);

  const handleSubmit = () => {
    if (rating === 0) return;
    submitReview.mutate({ courseId, rating, reviewText });
    setRating(0);
    setReviewText("");
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage: reviews.length > 0 
      ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100 
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col md:flex-row gap-8 p-6 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-sm w-12">{stars} stars</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Review Form */}
      {isEnrolled && !existingReview && (
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium">Write a Review</h4>
          
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </span>
            )}
          </div>

          <Textarea
            placeholder="Share your experience with this course..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
          />

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitReview.isPending}
          >
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      )}

      {existingReview && (
        <div className="p-4 border rounded-lg bg-primary/5">
          <p className="text-sm text-muted-foreground">
            You've already reviewed this course.
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {review.user_profile?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {review.user_profile?.full_name || "Anonymous"}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {review.review_text && (
              <p className="text-sm text-muted-foreground">{review.review_text}</p>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this course!
          </div>
        )}
      </div>
    </div>
  );
}
