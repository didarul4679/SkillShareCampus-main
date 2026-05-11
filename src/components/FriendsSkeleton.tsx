import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const FriendsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-24 w-full" />
          <div className="p-4 relative">
            <Skeleton className="absolute -top-8 left-4 h-16 w-16 rounded-full" />
            <div className="mt-10 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-9 w-full mt-3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
