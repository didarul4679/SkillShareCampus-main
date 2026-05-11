import { usePresence } from "@/hooks/usePresence";
import { formatDistanceToNow } from "date-fns";

interface OnlineStatusProps {
  userId: string;
  lastSeenAt?: string | null;
  showDot?: boolean;
  showText?: boolean;
  className?: string;
}

const OnlineStatus = ({ 
  userId, 
  lastSeenAt, 
  showDot = true, 
  showText = true,
  className = "" 
}: OnlineStatusProps) => {
  const { isUserOnline } = usePresence("global-presence");
  const isOnline = isUserOnline(userId);

  if (!showText && !showDot) return null;

  const getLastSeenText = () => {
    if (isOnline) return "Active now";
    if (!lastSeenAt) return "Offline";
    
    try {
      const date = new Date(lastSeenAt);
      return `Active ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch {
      return "Offline";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDot && (
        <div 
          className={`w-2 h-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
      {showText && (
        <span className={`text-xs ${
          isOnline ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"
        }`}>
          {getLastSeenText()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
