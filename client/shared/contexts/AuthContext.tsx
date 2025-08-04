import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";

// User interface matching the backend User model
export interface User {
  _id: string;
  clerkId?: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  preferences: {
    defaultKey?: string;
    fontSize: number;
    theme: 'light' | 'dark' | 'stage';
  };
  profile: {
    bio?: string;
    website?: string;
    location?: string;
  };
  favorites: string[];
  stats: {
    songsCreated: number;
    arrangementsCreated: number;
    setlistsCreated: number;
  };
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: () => void; // Clerk handles login via SignIn component
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to create user object from Clerk user
function createUserFromClerk(clerkUser: any, backendUser?: Partial<User>): User {
  return {
    _id: backendUser?._id || clerkUser.id,
    clerkId: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    role: backendUser?.role || 'USER',
    preferences: backendUser?.preferences || {
      defaultKey: 'G',
      fontSize: 16,
      theme: 'light',
    },
    profile: backendUser?.profile || {},
    favorites: backendUser?.favorites || [],
    stats: backendUser?.stats || {
      songsCreated: 0,
      arrangementsCreated: 0,
      setlistsCreated: 0,
    },
    isActive: backendUser?.isActive ?? true,
    lastLoginAt: new Date().toISOString(),
    createdAt: backendUser?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [backendUser, setBackendUser] = useState<Partial<User> | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Sync Clerk user with backend and local state
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      if (!isSignedIn || !clerkUser) {
        setAuthState({
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        // Get auth token for API calls
        await getToken(); // Ready for future backend API calls
        
        // TODO: Fetch user data from backend API
        // const token = await getToken();
        // const response = await fetch('/api/users/me', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const userData = await response.json();
        
        // For now, create user from Clerk data
        const user = createUserFromClerk(clerkUser, backendUser || undefined);
        
        setAuthState({
          currentUser: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to sync user data',
        }));
      }
    };

    syncUser();
  }, [clerkUser, clerkLoaded, isSignedIn, getToken, backendUser]);

  const login = (): void => {
    // Login is handled by Clerk's SignIn component
    // This function is kept for interface compatibility
  };

  const logout = (): void => {
    signOut();
  };

  const updateUser = (updates: Partial<User>): void => {
    // Update local state
    setAuthState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? { ...prev.currentUser, ...updates } : null,
    }));
    
    // Save updates to backend state
    if (authState.currentUser) {
      setBackendUser(prev => ({ ...prev, ...updates }));
    }
    
    // TODO: Persist updates to backend API
  };

  const refreshUser = async (): Promise<void> => {
    if (!clerkUser || !isSignedIn) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // const token = await getToken();
      await getToken(); // Ready for when we need to fetch from backend
      
      // TODO: Fetch fresh user data from backend
      // const response = await fetch('/api/users/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const userData = await response.json();
      // setBackendUser(userData);
      
      const user = createUserFromClerk(clerkUser, backendUser || undefined);
      setAuthState(prev => ({
        ...prev,
        currentUser: user,
        isLoading: false,
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh user data',
      }));
    }
  };

  const contextValue: AuthContextValue = {
    ...authState,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}