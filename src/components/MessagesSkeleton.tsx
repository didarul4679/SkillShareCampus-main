import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const MessagesSkeleton = () => {
  return (
    <div className="col-span-6">
      <Card className="flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Received message */}
            <div className="flex items-start gap-3 max-w-[70%]">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Sent message */}
            <div className="flex items-start gap-3 max-w-[70%] ml-auto">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>

            {/* Received message */}
            <div className="flex items-start gap-3 max-w-[70%]">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            {/* Sent message */}
            <div className="flex items-start gap-3 max-w-[70%] ml-auto">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
};
