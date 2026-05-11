import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, MessageSquare, Repeat2, User, X } from "lucide-react";
import { usePostShare } from "@/hooks/usePostShare";
import { useFriends } from "@/hooks/useFriends";
import { useMessages } from "@/hooks/useMessages";
import { toast } from "sonner";

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    image_url?: string | null;
    author: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export const SharePostDialog = ({ open, onOpenChange, post }: SharePostDialogProps) => {
  const [repostText, setRepostText] = useState("");
  const [showRepostInput, setShowRepostInput] = useState(false);
  const [showMessageSelect, setShowMessageSelect] = useState(false);
  const { copyPostLink, repostToFeed } = usePostShare();
  const { friends } = useFriends();
  const { sendMessage } = useMessages();

  const handleCopyLink = async () => {
    await copyPostLink(post.id);
    onOpenChange(false);
  };

  const handleRepost = () => {
    repostToFeed.mutate(
      {
        postId: post.id,
        content: repostText.trim(), // Only use user-typed content, empty string if none
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRepostText("");
          setShowRepostInput(false);
        },
      }
    );
  };

  const handleShareToFriend = async (friendId: string) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    sendMessage.mutate(
      {
        receiverId: friendId,
        content: `Check out this post: ${postUrl}`,
      },
      {
        onSuccess: () => {
          toast.success("Post shared via message!");
          onOpenChange(false);
          setShowMessageSelect(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Choose how you want to share this post
          </DialogDescription>
        </DialogHeader>

        {!showRepostInput && !showMessageSelect ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowRepostInput(true)}
            >
              <Repeat2 className="h-4 w-4" />
              Repost to Your Feed
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowMessageSelect(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Share via Message
            </Button>
          </div>
        ) : showRepostInput ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRepostInput(false)}
              className="mb-2"
            >
              <X className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="p-3 bg-accent rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={post.author.avatar_url || ""} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{post.author.full_name}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.content}
              </p>
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post image" 
                  className="mt-2 w-full h-24 object-cover rounded"
                />
              )}
            </div>

            <Textarea
              placeholder="Add your thoughts (optional)..."
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              className="min-h-[100px]"
              maxLength={5000}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRepostInput(false)}>
                Cancel
              </Button>
              <Button onClick={handleRepost} disabled={repostToFeed.isPending}>
                {repostToFeed.isPending ? "Sharing..." : "Share to Feed"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMessageSelect(false)}
              className="mb-2"
            >
              <X className="h-4 w-4 mr-2" />
              Back
            </Button>

            <ScrollArea className="h-[300px]">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No friends to share with yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleShareToFriend(friend.friend_id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.profile?.avatar_url || ""} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.profile?.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
