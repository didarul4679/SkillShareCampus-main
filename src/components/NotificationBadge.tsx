import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1.5 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px] font-medium"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default NotificationBadge;
