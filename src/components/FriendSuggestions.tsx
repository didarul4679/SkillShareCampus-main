import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Users } from "lucide-react";
import { useFriendSuggestions } from "@/hooks/useFriendSuggestions";
import { useFriends } from "@/hooks/useFriends";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const FriendSuggestions = () => {
  const { suggestions, isLoading } = useFriendSuggestions();
  const { sendFriendRequest } = useFriends();

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-4">People You May Know</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">People You May Know</h3>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-start gap-3">
            <Link to={`/user/${suggestion.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={suggestion.avatar_url || ""} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/user/${suggestion.id}`}>
                <h4 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                  {suggestion.full_name || "Unknown User"}
                </h4>
              </Link>
              {suggestion.bio && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {suggestion.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-2">
                {suggestion.mutual_friends_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {suggestion.mutual_friends_count} mutual
                  </Badge>
                )}
                {suggestion.same_company && (
                  <Badge variant="secondary" className="text-xs">
                    🏢 Same company
                  </Badge>
                )}
                {suggestion.shared_skills_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.shared_skills_count} shared skills
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => sendFriendRequest.mutate(suggestion.id)}
                disabled={sendFriendRequest.isPending}
              >
                {sendFriendRequest.isPending ? (
                  <div className="h-3 w-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="h-3 w-3 mr-1" />
                )}
                {sendFriendRequest.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
