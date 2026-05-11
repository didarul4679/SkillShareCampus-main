import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Home, Users, BookOpen, MessageSquare, Bell, User, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useFriends } from "@/hooks/useFriends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PendingRequests = () => {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-background border-b px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-primary">
              SkillShare<span className="text-sm align-top">Campus</span>
            </h1>
          </Link>
          
          <div className="flex-1 max-w-md mx-8">
            <Link to="/search">
              <div className="relative cursor-pointer">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10 bg-muted"
                  readOnly
                />
              </div>
            </Link>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/campus" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/pending-requests" className="flex flex-col items-center gap-1 text-primary">
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Requests</span>
            </Link>
            <Link to="/courses" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Courses</span>
            </Link>
            <Link to="/messages" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </Link>
            <Link to="/notifications" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="text-xs">Notifications</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <User className="h-5 w-5" />
              <span className="text-xs">Me</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">Catch up with my friends</h2>
            <div className="flex gap-3">
              <Link to="/friends">
                <Button variant="outline">
                  Friends
                </Button>
              </Link>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Pending Requests
              </Button>
            </div>
          </div>

          {/* Pending Requests Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No pending friend requests</p>
              </div>
            ) : (
              pendingRequests.map((request: any) => (
                <Card key={request.id} className="p-6 bg-card">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16 flex-shrink-0">
                      <AvatarImage src={request.profile?.avatar_url || ""} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">
                        {request.profile?.full_name || "Unknown User"}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-0.5">{request.profile?.bio || "No bio"}</p>
                      <p className="text-xs text-muted-foreground mb-0.5">{request.profile?.location || "No location"}</p>
                      <p className="text-xs text-muted-foreground">{request.profile?.company || "No company"}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => rejectFriendRequest.mutate(request.id)}
                      disabled={rejectFriendRequest.isPending}
                    >
                      {rejectFriendRequest.isPending ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : null}
                      {rejectFriendRequest.isPending ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button 
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => acceptFriendRequest.mutate(request.id)}
                      disabled={acceptFriendRequest.isPending}
                    >
                      {acceptFriendRequest.isPending ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : null}
                      {acceptFriendRequest.isPending ? "Accepting..." : "Accept"}
                    </Button>
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

export default PendingRequests;