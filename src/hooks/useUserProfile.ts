import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/auth';

// Type for the GraphQL response wrapper - the user query returns this structure
export type UserProfileResponse = User | null;

/**
 * Custom hook for fetching user profile data using the API barrel exports
 * Provides user information for the user menu and authentication
 */
export const useUserProfile = () => {
  const { user: profile } = useAuthStore();

  return {
    // Convenience accessors for the nested data structure
    userProfile: profile,
    isSuccess: true,
    errorMessage: null,
    // Helper methods for user info
    getDisplayName: () => {
      if (!profile) return 'Demo User';
      return profile.email || 'Demo User';
    },
    getInitials: () => {
      if (!profile) return 'DU';

      if (profile.email) {
        return profile.email.substring(0, 2).toUpperCase();
      }

      return 'DU';
    },
  };
};

export default useUserProfile;
