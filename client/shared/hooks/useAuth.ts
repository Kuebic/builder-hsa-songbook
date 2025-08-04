import { useAuthContext, User, AuthState } from "@/shared/contexts/AuthContext";

// Main authentication hook
export function useAuth() {
  return useAuthContext();
}

// Convenience hooks for specific auth state
export function useCurrentUser(): User | null {
  const { currentUser } = useAuth();
  return currentUser;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}

export function useAuthError(): string | null {
  const { error } = useAuth();
  return error;
}

// User ID convenience hook - returns null if not authenticated
export function useUserId(): string | null {
  const { currentUser } = useAuth();
  return currentUser?._id || null;
}

// User preferences hook
export function useUserPreferences() {
  const { currentUser, updateUser } = useAuth();
  
  const updatePreferences = (preferences: Partial<User['preferences']>) => {
    if (currentUser) {
      updateUser({
        preferences: { ...currentUser.preferences, ...preferences }
      });
    }
  };

  return {
    preferences: currentUser?.preferences || null,
    updatePreferences,
  };
}

// User profile hook
export function useUserProfile() {
  const { currentUser, updateUser } = useAuth();
  
  const updateProfile = (profile: Partial<User['profile']>) => {
    if (currentUser) {
      updateUser({
        profile: { ...currentUser.profile, ...profile }
      });
    }
  };

  return {
    profile: currentUser?.profile || null,
    updateProfile,
  };
}

// Authentication status hook with all states
export function useAuthStatus(): AuthState {
  const { currentUser, isAuthenticated, isLoading, error } = useAuth();
  return { currentUser, isAuthenticated, isLoading, error };
}