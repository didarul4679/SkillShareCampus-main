import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Home,
  Users,
  BookOpen,
  MessageSquare,
  Bell,
  User,
  MessageCircle,
  Share2,
  MoreVertical,
  Trash2,
  Edit,
  X,
  ImageIcon,
  Eye,
  Heart,
} from "lucide-react";
import { EditPostDialog } from "@/components/EditPostDialog";
import { Link, useSearchParams } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { ReactionPicker, type ReactionType } from "@/components/ReactionPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostComments } from "@/components/PostComments";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { useNotifications } from "@/hooks/useNotifications";
import { SharePostDialog } from "@/components/SharePostDialog";
import { FriendSuggestions } from "@/components/FriendSuggestions";
import { TrendingHashtags } from "@/components/TrendingHashtags";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PostsFeedSkeleton } from "@/components/PostsFeedSkeleton";
import { AppHeader } from "@/components/AppHeader";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";
import { toast } from "sonner";

const Campus = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, isLoading, createPost, toggleReaction, deletePost, editPost } = usePosts();
  const { unreadCount } = useNotifications();
  const [postContent, setPostContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPostForDelete, setSelectedPostForDelete] = useState<any>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle scrolling to a specific post from notification
  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId && posts.length > 0) {
      setHighlightedPostId(postId);

      // Scroll to the post after a short delay to ensure render
      setTimeout(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedPostId(null);
        setSearchParams({}, { replace: true });
      }, 3000);
    }
  }, [searchParams, posts]);

  const handleCreatePost = () => {
    if (!postContent.trim()) return;

    const hashtags = postContent.match(/#\w+/g) || [];
    createPost.mutate(
      { content: postContent, hashtags, image: selectedImage || undefined },
      {
        onSuccess: () => {
          setPostContent("");
          setSelectedImage(null);
          setImagePreview(null);
          setIsDialogOpen(false);
        },
      },
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const canEditPost = (createdAt: string) => {
    const postDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
    return diffInMinutes <= 15;
  };

  const handleEditPost = (postId: string, content: string, hashtags: string[], image?: File, removeImage?: boolean) => {
    editPost.mutate(
      {
        postId,
        content,
        hashtags,
        image,
        removeImage,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedPostForEdit(null);
        },
      },
    );
  };

  const handleDeletePost = () => {
    if (!selectedPostForDelete) return;

    deletePost.mutate(selectedPostForDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedPostForDelete(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      {/* Header */}
      <AppHeader currentPage="campus" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <OfflineBanner />
        <EmailVerificationBanner />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            {/* <Card className="overflow-hidden">
              <div className="relative h-24 bg-gradient-to-r from-blue-900 to-blue-700">
                <img 
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop" 
                  alt="Web Development"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white font-bold text-lg">WEB Development</h3>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm mb-1">Md. Dasarul Islam</h4>
                <p className="text-xs text-muted-foreground">Undergraduate CSE Student | Entrepreneurship | B2C E-commerce</p>
                <p className="text-xs text-muted-foreground mt-1">Beula Juwel Odhika</p>
                <p className="text-xs text-muted-foreground">Exponent NanGain Ltd</p>
              </div>
            </Card> */}
          </aside>

          {/* Main Feed */}
          <main className="col-span-1 lg:col-span-6">
            {/* Create Post */}
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  fullName={profile?.full_name}
                  email={user?.email}
                  className="h-10 w-10"
                />
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Input
                      placeholder="Start a post"
                      className="flex-1 rounded-full bg-gray-50 border-gray-300 cursor-pointer"
                      readOnly
                    />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create a post</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="write" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="write">Write</TabsTrigger>
                        <TabsTrigger value="preview">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="write" className="space-y-4 mt-4">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                            <AvatarFallback>
                              {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{user?.user_metadata?.full_name || user?.email}</p>
                          </div>
                        </div>
                        <Textarea
                          placeholder="What's on your mind? Use #hashtags to categorize..."
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          className="min-h-[150px] text-base resize-none"
                          maxLength={5000}
                        />
                        {imagePreview && (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-cover w-full" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{postContent.length}/5000 characters</span>
                          {postContent.match(/#\w+/g) && (
                            <span>{postContent.match(/#\w+/g)?.length} hashtag(s) detected</span>
                          )}
                        </div>
                        <div className="flex items-center justify-end pt-4 border-t gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="post-image-upload"
                          />
                          <label htmlFor="post-image-upload">
                            <Button variant="outline" size="icon" asChild>
                              <span>
                                <ImageIcon className="h-4 w-4" />
                              </span>
                            </Button>
                          </label>
                          <Button
                            onClick={handleCreatePost}
                            disabled={!postContent.trim() || createPost.isPending}
                            className="bg-[hsl(var(--link-blue))] hover:bg-[hsl(var(--link-blue))]/90"
                          >
                            {createPost.isPending ? "Posting..." : "Post"}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="preview" className="mt-4">
                        <Card className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                              <AvatarFallback>
                                {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{user?.user_metadata?.full_name || user?.email}</h4>
                              <p className="text-xs text-muted-foreground">Just now</p>
                            </div>
                          </div>

                          {postContent.trim() ? (
                            <p className="text-sm mb-3 whitespace-pre-wrap">
                              {postContent.split(/(\s+)/).map((word, i) => {
                                if (word.match(/^#\w+/)) {
                                  return (
                                    <span key={i} className="text-[hsl(var(--link-blue))] font-medium">
                                      {word}
                                    </span>
                                  );
                                }
                                return word;
                              })}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-3 italic">
                              Your post content will appear here...
                            </p>
                          )}

                          {imagePreview && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                              <img src={imagePreview} alt="Post preview" className="w-full max-h-96 object-cover" />
                            </div>
                          )}

                          <div className="flex items-center justify-between py-2 border-t border-gray-200 mb-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Heart className="w-4 h-4" />0 reactions
                            </span>
                            <div className="flex gap-3">
                              <span className="text-sm text-muted-foreground">0 comments</span>
                              <span className="text-sm text-muted-foreground">0 shares</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-around">
                            <button className="flex items-center gap-2 text-muted-foreground px-4 py-2 rounded-md flex-1 justify-center">
                              <Heart className="w-5 h-5" />
                              <span className="text-sm font-medium">React</span>
                            </button>
                            <button className="flex items-center gap-2 text-muted-foreground px-4 py-2 rounded-md flex-1 justify-center">
                              <Share2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Share</span>
                            </button>
                          </div>
                        </Card>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                          <Button
                            onClick={handleCreatePost}
                            disabled={!postContent.trim() || createPost.isPending}
                            className="bg-[hsl(var(--link-blue))] hover:bg-[hsl(var(--link-blue))]/90"
                          >
                            {createPost.isPending ? "Posting..." : "Post"}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Posts Feed */}
            <ErrorBoundary fallbackMessage="Unable to load posts">
              {isLoading ? (
                <PostsFeedSkeleton />
              ) : posts.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium mb-2">No posts yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      ref={(el) => {
                        postRefs.current[post.id] = el;
                      }}
                      className={`p-4 transition-all duration-300 ${
                        highlightedPostId === post.id ? "ring-2 ring-primary bg-primary/5 animate-pulse" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Link to={`/user/${post.author.id}`}>
                          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src={post.author.avatar_url || ""} />
                            <AvatarFallback>{post.author.full_name?.[0] || "U"}</AvatarFallback>
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
                                <p className="text-xs text-muted-foreground line-clamp-1">{post.author.bio}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                {post.edited_at && <span className="ml-2 text-xs text-muted-foreground">· Edited</span>}
                              </p>
                            </div>
                            {user?.id === post.author_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canEditPost(post.created_at) && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPostForEdit(post);
                                        setEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit post
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPostForDelete(post);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete post
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>

                      {post.content.trim() && (
                        <p className="text-sm mb-3 whitespace-pre-wrap">
                          {post.content.split(/(\s+)/).map((word, i) => {
                            if (word.match(/^#\w+/)) {
                              const tag = word.replace(/^#/, "");
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

                      <div className="flex items-center justify-around mb-3">
                        <ReactionPicker
                          postId={post.id}
                          userReaction={post.user_reaction || null}
                          reactionCounts={
                            post.reaction_counts || {
                              like: 0,
                              celebrate: 0,
                              support: 0,
                              love: 0,
                              insightful: 0,
                              funny: 0,
                            }
                          }
                          onReact={(postId, reactionType, currentReaction) => {
                            toggleReaction.mutate({ postId, reactionType, currentReaction });
                          }}
                          disabled={toggleReaction.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground flex-1 justify-center"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments_count} Comments</span>
                        </Button>
                        <button
                          onClick={() => {
                            setSelectedPostForShare(post);
                            setShareDialogOpen(true);
                          }}
                          className="flex items-center gap-2 text-muted-foreground hover:bg-accent px-4 py-2 rounded-md flex-1 justify-center transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Share</span>
                        </button>
                      </div>

                      <PostComments
                        postId={post.id}
                        commentsCount={post.comments_count}
                        showToggleButton={false}
                        isExpanded={expandedCommentsPostId === post.id}
                        onToggle={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                      />
                    </Card>
                  ))}
                </div>
              )}
            </ErrorBoundary>
          </main>

          {/* Right Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <TrendingHashtags />

            <div className="mt-4">
              <FriendSuggestions />
            </div>

            <Card className="p-4 mt-4">
              <h3 className="font-semibold text-sm mb-4">Campus News</h3>
              <div className="space-y-3">
                <div className="text-xs">
                  <p className="text-muted-foreground">12 days ago</p>
                  <p className="font-medium text-foreground">Appoint new VC</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">15 days ago</p>
                  <p className="font-medium text-foreground">Appoint new Department Head of CSE</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">15 days ago</p>
                  <p className="font-medium text-foreground">5 days Micro-scientist Courses</p>
                </div>
              </div>
            </Card>

            <Card className="p-0 mt-4 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop"
                alt="Mindset"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="font-semibold text-sm mb-2">Nijercart</h4>
                <p className="text-xs text-muted-foreground mb-3">Old Books | Real Value | New Readers</p>
                <Button className="w-full bg-[hsl(var(--link-blue))] hover:bg-[hsl(var(--link-blue))]/90">
                  Mobile: 01725929393
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Share Dialog */}
      {selectedPostForShare && (
        <SharePostDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} post={selectedPostForShare} />
      )}

      {/* Edit Post Dialog */}
      {selectedPostForEdit && (
        <EditPostDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={selectedPostForEdit}
          onEditSuccess={handleEditPost}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              {selectedPostForDelete?.image_url && (
                <span className="block mt-2 text-sm">The attached image will also be permanently deleted.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Campus;
