import { createContext, useContext, ReactNode, useState } from "react";

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user for development - replace with real authentication
const MOCK_USER: User = {
  _id: "6759e1a62b00b1e6ed3b84f0",
  email: "user@example.com",
  name: "Test User",
  role: 'USER',
  preferences: {
    defaultKey: 'G',
    fontSize: 16,
    theme: 'light',
  },
  profile: {
    bio: "Music enthusiast and worship leader",
    location: "Local Church",
  },
  favorites: [],
  stats: {
    songsCreated: 0,
    arrangementsCreated: 0,
    setlistsCreated: 0,
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: MOCK_USER, // Start with mock user for development
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });

  const login = async (email: string, _password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // TODO: Replace with actual authentication API call
      // For now, simulate login with mock user
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      setAuthState({
        currentUser: { ...MOCK_USER, email },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
    }
  };

  const logout = (): void => {
    setAuthState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const updateUser = (updates: Partial<User>): void => {
    setAuthState(prev => ({
      ...prev,
      currentUser: prev.currentUser ? { ...prev.currentUser, ...updates } : null,
    }));
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.currentUser) return;

    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Replace with actual API call to refresh user data
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
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