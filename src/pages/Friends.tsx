import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Users, BookOpen, MessageSquare, Bell, User, Search, UserMinus } from "lucide-react";
import { Link } from "react-router-dom";
import { useFriends } from "@/hooks/useFriends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import OnlineStatus from "@/components/OnlineStatus";
import { FriendsSkeleton } from "@/components/FriendsSkeleton";
import { AppHeader } from "@/components/AppHeader";
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
import { useState } from "react";

const Friends = () => {
  const { friends, isLoading, removeFriend } = useFriends();
  const { unreadCount } = useNotifications();
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  const handleRemoveFriend = async (friendId: string) => {
    await removeFriend.mutateAsync(friendId);
    setRemovingFriendId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader currentPage="friends" />
        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Catch up with my friends</h2>
            </div>
            <FriendsSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <AppHeader currentPage="friends" />

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Catch up with my friends</h2>
            <div className="flex gap-3">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Friends
              </Button>
              <Link to="/pending-requests">
                <Button variant="outline">
                  Pending Requests
                </Button>
              </Link>
            </div>
          </div>

          {/* Friends Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {friends.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No friends yet. Start connecting with people!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id} className="overflow-hidden">
                  <div className="relative h-24 bg-gradient-to-r from-blue-600 to-blue-800">
                    <div className="absolute inset-0 opacity-30" 
                      style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
                      }}
                    />
                  </div>
                  
                  <div className="p-4 relative">
                    <Link to={`/user/${friend.profile.id}`} className="absolute -top-8 left-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-4 border-white">
                          <AvatarImage src={friend.profile.avatar_url || ""} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <OnlineStatus 
                          userId={friend.profile.id}
                          lastSeenAt={friend.profile.last_seen_at}
                          showText={false}
                          className="absolute bottom-0 right-0"
                        />
                      </div>
                    </Link>
                    
                    <div className="mt-10">
                      <Link to={`/user/${friend.profile.id}`}>
                        <h3 className="font-semibold text-foreground mb-1 hover:text-primary">
                          {friend.profile.full_name || "Unknown User"}
                        </h3>
                      </Link>
                      <OnlineStatus 
                        userId={friend.profile.id}
                        lastSeenAt={friend.profile.last_seen_at}
                        showDot={false}
                        className="mb-1"
                      />
                      <p className="text-xs text-muted-foreground mb-1">{friend.profile.bio || "No bio"}</p>
                      <p className="text-xs text-muted-foreground mb-1">{friend.profile.location || "No location"}</p>
                      <p className="text-xs text-muted-foreground mb-3">{friend.profile.company || "No company"}</p>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-destructive hover:text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Friend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {friend.profile.full_name || "this user"} from your friends list? 
                              You can always send them a friend request again later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveFriend(friend.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={removeFriend.isPending}
                            >
                              {removeFriend.isPending ? "Removing..." : "Remove"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg font-semibold text-primary">
              SkillShare<span className="text-sm align-top">Campus</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 SkillShareCampus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Friends;