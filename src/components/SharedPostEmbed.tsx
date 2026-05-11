import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Repeat2 } from "lucide-react";
import type { SharedPost } from "@/hooks/usePosts";

interface SharedPostEmbedProps {
  sharedPost: SharedPost;
}

export const SharedPostEmbed = ({ sharedPost }: SharedPostEmbedProps) => {
  return (
    <Card className="bg-muted/50 border overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Repeat2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Shared post</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/user/${sharedPost.author.id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={sharedPost.author.avatar_url || ""} />
              <AvatarFallback>
                {sharedPost.author.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link to={`/user/${sharedPost.author.id}`}>
              <p className="text-sm font-semibold hover:text-primary transition-colors">
                {sharedPost.author.full_name || "Unknown User"}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(sharedPost.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
          {sharedPost.content}
        </p>
      </div>
      
      {sharedPost.image_url && (
        <div className="border-t">
          <img
            src={sharedPost.image_url}
            alt="Shared post image"
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}
    </Card>
  );
};
