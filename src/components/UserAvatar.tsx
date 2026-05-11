import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  className?: string;
}

/**
 * UserAvatar component that displays user avatar with initials fallback
 * Implements FR-PROFILE-001 requirement: "Avatar with fallback to initials"
 */
export const UserAvatar = ({ avatarUrl, fullName, email, className }: UserAvatarProps) => {
  const getInitials = () => {
    if (fullName) {
      const names = fullName.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };

  const initials = getInitials();

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl || ""} alt={fullName || "User"} />
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
