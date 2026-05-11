import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserPosts } from "@/hooks/useUserPosts";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface ProfileRecentPostsProps {
  userId: string | undefined;
}

export const ProfileRecentPosts = ({ userId }: ProfileRecentPostsProps) => {
  const { posts, isLoading } = useUserPosts(userId, 3);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Recent Posts</h3>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">Recent Posts</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate("/activity")}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
              onClick={() => navigate("/activity")}
            >
              <p className="text-sm text-foreground line-clamp-2 mb-2">
                {post.content}
              </p>
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.comments_count}
                  </span>
                </div>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
