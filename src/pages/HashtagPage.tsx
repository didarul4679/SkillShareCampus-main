import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Home, Users, BookOpen, MessageSquare, User, MessageCircle, Share2, Hash, ArrowLeft, Heart } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { PostComments } from "@/components/PostComments";
import { SharePostDialog } from "@/components/SharePostDialog";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { useState, useMemo } from "react";
import NotificationBadge from "@/components/NotificationBadge";
import { Input } from "@/components/ui/input";
import { ReactionPicker, type ReactionType } from "@/components/ReactionPicker";

const HashtagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const { user } = useAuth();
  const { posts, isLoading, toggleReaction } = usePosts();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);

  // Filter posts by hashtag
  const filteredPosts = useMemo(() => {
    if (!tag) return [];
    const normalizedTag = tag.toLowerCase().replace(/^#/, '');
    return posts.filter(post => 
      post.hashtags?.some((hashtag: string) => 
        hashtag.toLowerCase().replace(/^#/, '') === normalizedTag
      )
    );
  }, [posts, tag]);

  const displayTag = tag?.replace(/^#/, '') || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[hsl(var(--link-blue))] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">SkillShareCampus</h1>
            </Link>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Link to="/search">
                <Input 
                  placeholder="Search users, posts, hashtags..." 
                  className="pl-10 bg-gray-50 border-gray-200"
                  readOnly
                />
              </Link>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link to="/campus" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-6 h-6" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/pending-requests" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Users className="w-6 h-6" />
              <span className="text-xs">Requests</span>
            </Link>
            <Link to="/campus" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="w-6 h-6" />
              <span className="text-xs">Courses</span>
            </Link>
            <Link to="/messages" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs">Messages</span>
            </Link>
            <div className="flex flex-col items-center gap-1">
              <NotificationBadge />
              <span className="text-xs text-muted-foreground">Notifications</span>
            </div>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <User className="w-6 h-6" />
              <span className="text-xs">Me</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <Link to="/activity" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Activity
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                #{displayTag}
              </h1>
              <p className="text-muted-foreground mt-1">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card className="p-12 text-center">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium mb-2">No posts found</p>
            <p className="text-sm text-muted-foreground">
              Be the first to post with #{displayTag}!
            </p>
            <Link to="/activity">
              <Button className="mt-4">
                Create Post
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Link to={`/user/${post.author.id}`}>
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={post.author.avatar_url || ""} />
                      <AvatarFallback>
                        {post.author.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/user/${post.author.id}`}>
                          <h4 className="font-semibold text-sm hover:text-[hsl(var(--link-blue))] transition-colors">
                            {post.author.full_name || "Unknown User"}
                          </h4>
                        </Link>
                        {post.author.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {post.author.bio}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          {post.edited_at && (
                            <span className="ml-2">· Edited</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {post.content.trim() && (
                  <p className="text-sm mb-3 whitespace-pre-wrap">
                    {post.content.split(/(\s+)/).map((word, i) => {
                      if (word.match(/^#\w+/)) {
                        const tag = word.replace(/^#/, '');
                        return (
                          <Link 
                            key={i}
                            to={`/hashtag/${tag}`}
                            className="text-[hsl(var(--link-blue))] hover:underline font-medium"
                          >
                            {word}
                          </Link>
                        );
                      }
                      return word;
                    })}
                  </p>
                )}

                {post.image_url && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img src={post.image_url} alt="Post attachment" className="w-full max-h-96 object-cover" />
                  </div>
                )}

                {/* Embedded shared post */}
                {post.shared_post ? (
                  <div className="mb-3">
                    <SharedPostEmbed sharedPost={post.shared_post} />
                  </div>
                ) : post.shared_post_id ? (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg border text-sm text-muted-foreground">
                    Original post is no longer available
                  </div>
                ) : null}
                
                <div className="flex items-center justify-between py-2 border-t border-b border-gray-200 mb-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likes_count} {post.likes_count === 1 ? "reaction" : "reactions"}
                  </span>
                  <div className="flex gap-3">
                    <span className="text-sm text-muted-foreground">
                      {post.comments_count} {post.comments_count === 1 ? "comment" : "comments"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {post.shared_count || 0} {post.shared_count === 1 ? "share" : "shares"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <ReactionPicker
                    postId={post.id}
                    userReaction={post.user_reaction || null}
                    reactionCounts={post.reaction_counts || {
                      like: 0,
                      celebrate: 0,
                      support: 0,
                      love: 0,
                      insightful: 0,
                      funny: 0,
                    }}
                    onReact={(postId, reactionType, currentReaction) => {
                      toggleReaction.mutate({ postId, reactionType, currentReaction });
                    }}
                    disabled={toggleReaction.isPending}
                  />
                  <button 
                    onClick={() => {
                      setSelectedPostForShare(post);
                      setShareDialogOpen(true);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:bg-gray-50 px-4 py-2 rounded-md flex-1 justify-center transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Share</span>
                  </button>
                </div>

                <PostComments postId={post.id} commentsCount={post.comments_count} />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      {selectedPostForShare && (
        <SharePostDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          post={selectedPostForShare}
        />
      )}
    </div>
  );
};

export default HashtagPage;