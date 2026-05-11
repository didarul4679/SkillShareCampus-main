import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
};