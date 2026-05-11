import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Home, Users, BookOpen, MessageSquare, Bell, User, Search, UserPlus, UserMinus, UserCheck } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useFriendSuggestions } from "@/hooks/useFriendSuggestions";
import OnlineStatus from "@/components/OnlineStatus";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const UserProfile = () => {
  const { id: userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, education, skills, experience, friendCount, isLoading } = useUserProfile(userId);
  const { sendFriendRequest, removeFriend, checkFriendshipStatus } = useFriends();
  const { getMutualFriends } = useFriendSuggestions();
  const [friendshipStatus, setFriendshipStatus] = useState<any>(null);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);

  // Fetch user's recent posts (FR-PROFILE-004 requirement)
  const { data: recentPosts = [] } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, full_name, avatar_url),
          post_likes(user_id)
        `)
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (userId && user) {
      checkFriendshipStatus(userId).then(setFriendshipStatus);
      getMutualFriends(userId).then(setMutualFriends);
    }
  }, [userId, user]);

  if (!userId) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
      </div>
    );
  }

  const handleFriendAction = async () => {
    if (!friendshipStatus) {
      await sendFriendRequest.mutateAsync(userId);
      const status = await checkFriendshipStatus(userId);
      setFriendshipStatus(status);
    } else if (friendshipStatus.status === "accepted") {
      await removeFriend.mutateAsync(friendshipStatus.id);
      setFriendshipStatus(null);
    }
  };

  const getFriendButtonContent = () => {
    const isLoading = sendFriendRequest.isPending || removeFriend.isPending;
    
    if (isLoading) {
      return (
        <>
          <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {sendFriendRequest.isPending ? "Adding..." : "Removing..."}
        </>
      );
    }
    
    if (!friendshipStatus) {
      return (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </>
      );
    } else if (friendshipStatus.status === "pending") {
      return (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Request Sent
        </>
      );
    } else if (friendshipStatus.status === "accepted") {
      return (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Remove Friend
        </>
      );
    }
  };

  const isFriendButtonDisabled = friendshipStatus?.status === "pending";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-[hsl(var(--header-bg))] py-3 px-6 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              SkillShare<span className="text-sm align-top">Campus</span>
            </h1>
          </Link>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search" 
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/pending-requests" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <Users className="h-5 w-5" />
              <span className="text-xs">Requests</span>
            </Link>
            <Link to="/campus" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Courses</span>
            </Link>
            <Link to="/messages" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </Link>
            <Link to="/notifications" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="text-xs">Notifications</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-foreground/70 hover:text-foreground transition-colors">
              <User className="h-5 w-5" />
              <span className="text-xs">Me</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-4xl font-bold">WEB</div>
                      <div className="text-white text-2xl font-light ml-2">Development</div>
                    </div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800')] bg-cover bg-center opacity-60"></div>
                  </div>

                  {/* Profile Info */}
                  <div className="px-6 pb-6">
                     <div className="relative -mt-16 mb-4">
                      <UserAvatar
                        avatarUrl={profile.avatar_url}
                        fullName={profile.full_name}
                        className="h-32 w-32 border-4 border-background text-4xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">{profile.full_name || "Unknown User"}</h2>
                      <OnlineStatus userId={userId} lastSeenAt={profile.last_seen_at} />
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground">{profile.bio}</p>
                      )}
                      {profile.location && (
                        <p className="text-xs text-muted-foreground">{profile.location}</p>
                      )}
                       {profile.company && (
                        <p className="text-xs text-muted-foreground">{profile.company}</p>
                      )}
                      <p className="text-sm text-primary font-medium">{friendCount} connections</p>
                      {mutualFriends.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Users className="h-4 w-4" />
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{mutualFriends.length}</span>
                            <span>mutual {mutualFriends.length === 1 ? "friend" : "friends"}</span>
                          </div>
                          {mutualFriends.length <= 3 && (
                            <div className="flex -space-x-2 ml-2">
                              {mutualFriends.slice(0, 3).map((friend: any) => (
                                <Avatar key={friend.friend_id} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={friend.profile?.avatar_url || ""} />
                                  <AvatarFallback className="text-xs">
                                    <User className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Link to={`/messages?user=${userId}`}>
                        <Button variant="default">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                      <Button 
                        variant="outline"
                        onClick={handleFriendAction}
                        disabled={isFriendButtonDisabled || sendFriendRequest.isPending || removeFriend.isPending}
                      >
                        {getFriendButtonContent()}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About Section */}
              {profile.bio && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Education Section */}
              {education.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Education</h3>
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <div key={edu.id}>
                          <h4 className="font-semibold text-foreground">{edu.institution}</h4>
                          {edu.degree && (
                            <p className="text-sm text-muted-foreground">{edu.degree}</p>
                          )}
                          {edu.period && (
                            <p className="text-xs text-muted-foreground">{edu.period}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills Section */}
              {skills.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary">
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience Section */}
              {experience.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Experience</h3>
                    <div className="space-y-4">
                      {experience.map((exp) => (
                        <div key={exp.id}>
                          <h4 className="font-semibold text-foreground">{exp.position}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          {exp.period && (
                            <p className="text-xs text-muted-foreground">{exp.period}</p>
                          )}
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Posts Section (FR-PROFILE-004 requirement) */}
              {recentPosts.length > 0 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Recent Posts</h3>
                    <div className="space-y-4">
                      {recentPosts.map((post: any) => (
                        <Card key={post.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <UserAvatar
                                avatarUrl={post.author?.avatar_url}
                                fullName={post.author?.full_name}
                                className="h-10 w-10"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{post.author?.full_name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </span>
                                  {/* FR-CONTENT-002: Show "Edited" badge for edited posts */}
                                  {post.edited_at && (
                                    <>
                                      <span>•</span>
                                      <span className="italic">Edited</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                              {post.content}
                            </p>
                            {post.image_url && (
                              <img
                                src={post.image_url}
                                alt="Post"
                                className="w-full rounded-lg mb-3 max-h-96 object-cover"
                              />
                            )}
                            <div className="flex items-center gap-4 pt-2 border-t">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Heart className="h-4 w-4" />
                                <span className="text-xs">{post.likes_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-xs">{post.comments_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Share2 className="h-4 w-4" />
                                <span className="text-xs">{post.shared_count || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
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

      <Footer />
    </div>
  );
};

export default UserProfile;
