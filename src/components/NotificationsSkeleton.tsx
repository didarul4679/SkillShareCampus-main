import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const NotificationsSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
};
