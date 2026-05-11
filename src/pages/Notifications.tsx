import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Bell, 
  User, 
  Search,
  UserPlus,
  MessageCircle,
  ThumbsUp,
  CheckCircle2,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { NotificationsSkeleton } from "@/components/NotificationsSkeleton";
import { AppHeader } from "@/components/AppHeader";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-5 w-5" />;
      case "friend_accepted":
        return <CheckCircle2 className="h-5 w-5" />;
      case "new_message":
      case "message":
        return <MessageCircle className="h-5 w-5" />;
      case "post_like":
        return <ThumbsUp className="h-5 w-5" />;
      case "post_comment":
        return <MessageSquare className="h-5 w-5" />;
      case "mention":
        return <User className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend_request":
        return "bg-blue-500";
      case "friend_accepted":
        return "bg-green-500";
      case "new_message":
      case "message":
        return "bg-primary";
      case "post_like":
        return "bg-red-500";
      case "post_comment":
        return "bg-orange-500";
      case "mention":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getNotificationAction = (notification: any) => {
    const type = notification.type;
    const metadata = notification.metadata || {};
    
    switch (type) {
      case "friend_request":
        return { label: "View Requests", path: "/pending-requests" };
      case "new_message":
      case "message":
        if (metadata.sender_id) {
          return { label: "View Messages", path: `/messages?user=${metadata.sender_id}` };
        }
        return { label: "View Messages", path: "/messages" };
      case "friend_accepted":
        return { label: "View Friends", path: "/friends" };
      case "post_like":
      case "post_comment":
      case "mention":
        if (metadata.post_id) {
          return { label: "View Post", path: `/campus?post=${metadata.post_id}` };
        }
        return null;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    const action = getNotificationAction(notification);
    if (action) {
      navigate(action.path);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <AppHeader currentPage="notifications" />

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {isLoading ? (
              <NotificationsSkeleton />
            ) : notifications.length === 0 ? (
              <Card className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No notifications yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  When you get notifications, they'll show up here
                </p>
              </Card>
            ) : (
              notifications.map((notification) => {
                const action = getNotificationAction(notification);
                
                return (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-md ${
                      !notification.is_read ? "bg-accent border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full ${getNotificationColor(
                            notification.type
                          )} flex items-center justify-center flex-shrink-0 text-white`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p
                                className={`text-sm ${
                                  !notification.is_read ? "font-semibold" : ""
                                }`}
                              >
                                {notification.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() => deleteNotification.mutate(notification.id)}
                              disabled={deleteNotification.isPending}
                            >
                              {deleteNotification.isPending ? (
                                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {action && (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                {action.label}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-100 py-6 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg font-semibold text-primary">
              SkillShare<span className="text-sm align-top">Campus</span>
            </span>
          </div>
          <p className="text-sm text-foreground/80">
            © 2025 SkillShareCampus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Notifications;
