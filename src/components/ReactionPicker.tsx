import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, PartyPopper, Lightbulb, HandHeart, Laugh } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionType = "like" | "celebrate" | "support" | "love" | "insightful" | "funny";

export interface ReactionCounts {
  like: number;
  celebrate: number;
  support: number;
  love: number;
  insightful: number;
  funny: number;
}

interface ReactionPickerProps {
  postId: string;
  userReaction: ReactionType | null;
  reactionCounts: ReactionCounts;
  onReact: (postId: string, reactionType: ReactionType, currentReaction: ReactionType | null) => void;
  disabled?: boolean;
}

const reactionConfig: Record<ReactionType, { icon: any; label: string; color: string }> = {
  like: { icon: Heart, label: "Like", color: "text-red-500" },
  celebrate: { icon: PartyPopper, label: "Celebrate", color: "text-yellow-500" },
  support: { icon: HandHeart, label: "Support", color: "text-blue-500" },
  love: { icon: Heart, label: "Love", color: "text-pink-500" },
  insightful: { icon: Lightbulb, label: "Insightful", color: "text-amber-500" },
  funny: { icon: Laugh, label: "Funny", color: "text-green-500" },
};

export const ReactionPicker = ({
  postId,
  userReaction,
  reactionCounts,
  onReact,
  disabled,
}: ReactionPickerProps) => {
  const [open, setOpen] = useState(false);

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  const handleReactionClick = (reactionType: ReactionType) => {
    onReact(postId, reactionType, userReaction);
    setOpen(false);
  };

  // Get the top reactions to display
  const topReactions = (Object.entries(reactionCounts) as [ReactionType, number][])
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "gap-2",
              userReaction && reactionConfig[userReaction].color
            )}
          >
            {userReaction ? (
              <>
                {(() => {
                  const Icon = reactionConfig[userReaction].icon;
                  return <Icon className={cn("h-4 w-4", reactionConfig[userReaction].color)} fill="currentColor" />;
                })()}
                <span>{reactionConfig[userReaction].label}</span>
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                <span>React</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {(Object.entries(reactionConfig) as [ReactionType, typeof reactionConfig[ReactionType]][]).map(
              ([type, config]) => {
                const Icon = config.icon;
                const isActive = userReaction === type;
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex flex-col gap-1 h-auto py-2 px-3 hover:bg-accent",
                      isActive && "bg-accent"
                    )}
                    onClick={() => handleReactionClick(type)}
                  >
                    <Icon className={cn("h-6 w-6", config.color)} fill={isActive ? "currentColor" : "none"} />
                    <span className="text-xs">{config.label}</span>
                  </Button>
                );
              }
            )}
          </div>
        </PopoverContent>
      </Popover>

      {totalReactions > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <div className="flex -space-x-1">
            {topReactions.map(([type]) => {
              const Icon = reactionConfig[type].icon;
              return (
                <div
                  key={type}
                  className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center"
                >
                  <Icon className={cn("h-3 w-3", reactionConfig[type].color)} fill="currentColor" />
                </div>
              );
            })}
          </div>
          <span>{totalReactions}</span>
        </div>
      )}
    </div>
  );
};
