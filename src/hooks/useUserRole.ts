import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/lib/roles";

/**
 * Custom hook to access user roles
 * Returns the user's roles array and helper functions
 */
export const useUserRole = () => {
  const { userRoles, user } = useAuth();

  const hasRole = (role: AppRole): boolean => {
    return userRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return userRoles.includes('admin');
  };

  const isModerator = (): boolean => {
    return userRoles.includes('moderator');
  };

  const isStaff = (): boolean => {
    return userRoles.includes('admin') || userRoles.includes('moderator');
  };

  const getPrimaryRole = (): AppRole => {
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('moderator')) return 'moderator';
    return 'user';
  };

  return {
    userRoles,
    userId: user?.id,
    hasRole,
    isAdmin: isAdmin(),
    isModerator: isModerator(),
    isStaff: isStaff(),
    primaryRole: getPrimaryRole(),
  };
};