import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  User, 
  Search, 
  MessageCircle,
  Trash2,
  Image as ImageIcon,
  Hash,
  Share2,
  Edit,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { CampusNews } from "@/components/CampusNews";
import { usePosts } from "@/hooks/usePosts";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ReactionPicker, type ReactionType } from "@/components/ReactionPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { EditPostDialog } from "@/components/EditPostDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PostsFeedSkeleton } from "@/components/PostsFeedSkeleton";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SharedPostEmbed } from "@/components/SharedPostEmbed";

const Activity = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.id);
  const { posts, isLoading, createPost, toggleReaction, deletePost, editPost } = usePosts();
  const { unreadCount } = useNotifications();
  const [postContent, setPostContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPostForDelete, setSelectedPostForDelete] = useState<any>(null);

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
      }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    
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
      }
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

  const canEditPost = (postCreatedAt: string) => {
    const now = new Date();
    const createdAt = new Date(postCreatedAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return diffMinutes <= 15; // 15-minute edit window
  };

  // Extract unique hashtags from all posts
  const allHashtags = Array.from(
    new Set(posts.flatMap((post) => post.hashtags || []))
  ).slice(0, 10);

  const filteredPosts = selectedHashtag
    ? posts.filter((post) => post.hashtags?.includes(selectedHashtag))
    : posts;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <AppHeader currentPage="activity" />

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <OfflineBanner />
          <EmailVerificationBanner />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Activity Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <UserAvatar 
                      avatarUrl={profile?.avatar_url} 
                      fullName={profile?.full_name} 
                      email={user?.email}
                      className="h-10 w-10"
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start text-muted-foreground"
                        >
                          What's on your mind?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                          <DialogTitle>Create a post</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <UserAvatar 
                              avatarUrl={profile?.avatar_url} 
                              fullName={profile?.full_name} 
                              email={user?.email}
                              className="h-10 w-10"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {user?.user_metadata?.full_name || user?.email}
                              </p>
                            </div>
                          </div>
                          <Textarea
                            placeholder="What's on your mind? Use #hashtags to categorize..."
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            className="min-h-[150px] text-base resize-none border-0 focus-visible:ring-0 p-0"
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
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{postContent.length}/5000 characters</span>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="activity-post-image-upload"
                              />
                              <label htmlFor="activity-post-image-upload">
                                <Button variant="ghost" size="icon" asChild>
                                  <span>
                                    <ImageIcon className="h-5 w-5" />
                                  </span>
                                </Button>
                              </label>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setPostContent(postContent + " #")}
                              >
                                <Hash className="h-5 w-5" />
                              </Button>
                            </div>
                            <Button
                              onClick={handleCreatePost}
                              disabled={!postContent.trim() || createPost.isPending}
                            >
                              {createPost.isPending ? "Posting..." : "Post"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="flex-1" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Write article
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <Button variant="ghost" className="flex-1" size="sm">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="activity-quick-image-upload"
                      />
                      <label htmlFor="activity-quick-image-upload" className="flex items-center cursor-pointer">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add photo
                      </label>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Filter by hashtag */}
              {allHashtags.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">Trending Hashtags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedHashtag === null ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedHashtag(null)}
                      >
                        All Posts
                      </Badge>
                      {allHashtags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedHashtag === tag ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedHashtag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posts Feed */}
              <ErrorBoundary fallbackMessage="Unable to load posts">
                <div className="space-y-4">
                  {isLoading ? (
                    <PostsFeedSkeleton />
                  ) : filteredPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground font-medium mb-2">
                        {selectedHashtag ? `No posts with ${selectedHashtag}` : "No posts yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedHashtag
                          ? "Try a different hashtag"
                          : "Be the first to share your thoughts!"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3 mb-3">
                          <Link to={`/user/${post.author.id}`}>
                            <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                              <AvatarImage src={post.author.avatar_url || ""} />
                              <AvatarFallback>
                                {post.author.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <Link to={`/user/${post.author.id}`}>
                                  <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                                    {post.author.full_name || "Unknown User"}
                                  </h3>
                                </Link>
                                 {post.author.bio && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {post.author.bio}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                  </p>
                                  {post.edited_at && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground italic">Edited</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {user?.id === post.author_id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <span className="sr-only">Open menu</span>
                                      <span className="text-lg">•••</span>
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

                        <div className="mb-4">
                          <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                            {post.content}
                          </p>
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.hashtags.map((tag, index) => (
                                <Link
                                  key={index}
                                  to={`/hashtag/${tag.replace(/^#/, '')}`}
                                >
                                  <Badge
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  >
                                    {tag}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          )}
                          {post.image_url && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                              <img 
                                src={post.image_url} 
                                alt="Post attachment" 
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Shared/Embedded Post */}
                          {post.shared_post && (
                            <div className="mt-3">
                              <SharedPostEmbed sharedPost={post.shared_post} />
                            </div>
                          )}
                        </div>

                        <Separator className="mb-3" />

                        <div className="flex items-center gap-6 mb-3">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPostForShare(post);
                              setShareDialogOpen(true);
                            }}
                            className="gap-2 text-muted-foreground hover:text-primary"
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {post.shared_count > 0 ? post.shared_count : "Share"}
                            </span>
                          </Button>
                        </div>

                        <PostComments postId={post.id} commentsCount={post.comments_count} />
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              </ErrorBoundary>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campus News */}
              <CampusNews />

              {/* Trending Hashtags */}
              <TrendingHashtags />

              {/* Friend Suggestions */}
              <FriendSuggestions />

              {/* Ad Card */}
              <Card>
                <CardContent className="p-0">
                  <img 
                    src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400" 
                    alt="Mindset Course"
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=NC" />
                        <AvatarFallback>NC</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Nijercart</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Visit: www.nijercart.com<br />
                      Mail: nijercart@gmail.com
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      অর্ডার করতে মেসেজে আসুন, অর্ডার নিতে মেসেজ করুন আমাদের,
                      Nijercart সবার জন্য একটা পরিবার ভাই বোনদের কথা ভেবে সহজ মূল্যে
                    </p>
                    <Button className="w-full" variant="default">Explore</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Share Post Dialog */}
      {selectedPostForShare && (
        <SharePostDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          post={selectedPostForShare}
        />
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
                <span className="block mt-2 text-sm">
                  The attached image will also be permanently deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>
              Cancel
            </AlertDialogCancel>
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

      <Footer />
    </div>
  );
};

export default Activity;
