import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'moderator' | 'user';

/**
 * Fetches all roles for a given user
 * Uses server-side security definer function for safe role checking
 */
export const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_roles', {
      _user_id: userId
    });

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserRoles:', error);
    return [];
  }
};

/**
 * Checks if a user has a specific role
 * Uses server-side security definer function to prevent RLS recursion
 */
export const hasRole = async (userId: string, role: AppRole): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role
    });

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in hasRole:', error);
    return false;
  }
};

/**
 * Checks if a user is an admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  return hasRole(userId, 'admin');
};

/**
 * Checks if a user is a moderator
 */
export const isModerator = async (userId: string): Promise<boolean> => {
  return hasRole(userId, 'moderator');
};

/**
 * Checks if a user has admin OR moderator role
 */
export const isStaff = async (userId: string): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes('admin') || roles.includes('moderator');
};

/**
 * Gets the highest priority role for a user
 * Priority: admin > moderator > user
 */
export const getPrimaryRole = async (userId: string): Promise<AppRole> => {
  const roles = await getUserRoles(userId);
  
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('moderator')) return 'moderator';
  return 'user';
};