import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Award, Trophy, Medal } from "lucide-react";

interface ProfileData {
  avatar_url?: string | null;
  cover_image_url?: string | null;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
}

interface ProfileCompletenessWidgetProps {
  profile: ProfileData | null | undefined;
  education: any[];
  skills: any[];
  experience: any[];
}

export const ProfileCompletenessWidget = ({
  profile,
  education,
  skills,
  experience,
}: ProfileCompletenessWidgetProps) => {
  const calculateScore = () => {
    let score = 0;
    const checks: { label: string; completed: boolean; weight: number }[] = [
      { label: "Profile Picture", completed: !!profile?.avatar_url, weight: 15 },
      { label: "Cover Image", completed: !!profile?.cover_image_url, weight: 10 },
      { label: "Bio (50+ characters)", completed: (profile?.bio?.length || 0) >= 50, weight: 15 },
      { label: "Location", completed: !!profile?.location, weight: 10 },
      { label: "Company", completed: !!profile?.company, weight: 10 },
      { label: "Education (1+ entry)", completed: education.length > 0, weight: 15 },
      { label: "Experience (1+ entry)", completed: experience.length > 0, weight: 15 },
      { label: "Skills (3+ entries)", completed: skills.length >= 3, weight: 10 },
    ];

    score = checks.reduce((acc, check) => acc + (check.completed ? check.weight : 0), 0);

    return { score, checks };
  };

  const { score, checks } = calculateScore();

  const getBadge = () => {
    if (score === 100) {
      return { label: "Gold", icon: Trophy, color: "text-yellow-600", bgColor: "bg-yellow-100" };
    } else if (score >= 75) {
      return { label: "Silver", icon: Medal, color: "text-gray-600", bgColor: "bg-gray-100" };
    } else if (score >= 50) {
      return { label: "Bronze", icon: Award, color: "text-orange-600", bgColor: "bg-orange-100" };
    }
    return null;
  };

  const badge = getBadge();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Profile Strength
          {badge && (
            <Badge variant="secondary" className={`${badge.bgColor} ${badge.color} border-0`}>
              <badge.icon className="h-3 w-3 mr-1" />
              {badge.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{score}% Complete</span>
            <span className="text-muted-foreground text-xs">
              {checks.filter(c => c.completed).length}/{checks.length} items
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center gap-2">
              {check.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-xs ${check.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {score < 100 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Complete your profile to unlock more opportunities and connect with others!
            </p>
          </div>
        )}

        {score === 100 && (
          <div className="pt-2 border-t bg-gradient-to-r from-yellow-50 to-orange-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
            <p className="text-xs font-medium text-yellow-900 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Perfect! Your profile is complete!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};