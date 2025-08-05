import { vi } from "vitest";
import React from "react";

// Mock all Clerk components and hooks
vi.mock("@clerk/clerk-react", () => ({
  // Provider component
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  
  // Control components for conditional rendering
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  
  // Authentication components
  SignInButton: ({ children, mode, ...props }: any) => (
    <button data-testid="sign-in-button" data-mode={mode} {...props}>
      {children || "Sign In"}
    </button>
  ),
  SignOutButton: ({ children, ...props }: any) => (
    <button data-testid="sign-out-button" {...props}>
      {children || "Sign Out"}
    </button>
  ),
  UserButton: ({ afterSignOutUrl, ...props }: any) => (
    <div data-testid="user-button" data-after-sign-out-url={afterSignOutUrl} {...props}>
      User
    </div>
  ),
  
  // Hooks
  useUser: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    user: null,
  })),
  useAuth: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    sessionId: null,
    getToken: vi.fn(),
  })),
  useClerk: vi.fn(() => ({
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
    redirectToSignIn: vi.fn(),
    redirectToSignUp: vi.fn(),
  })),
  useSession: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    session: null,
  })),
}));

// Get the mocked hooks for manipulation in tests
const { useUser, useAuth, useClerk, useSession } = await import("@clerk/clerk-react");

// Helper function to mock an authenticated user
export const mockAuthenticatedUser = (userData: any = {}) => {
  const user = {
    id: "user_test_123",
    firstName: "Test",
    lastName: "User",
    fullName: "Test User",
    primaryEmailAddress: {
      emailAddress: "test@example.com",
    },
    emailAddresses: [{ emailAddress: "test@example.com" }],
    ...userData,
  };
  
  vi.mocked(useUser).mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    user,
  });
  
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    userId: user.id,
    sessionId: "session_test_123",
    getToken: vi.fn().mockResolvedValue("mock-token"),
    sessionClaims: {},
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: vi.fn().mockReturnValue(false),
    signOut: vi.fn().mockResolvedValue(undefined),
  } as any);
  
  vi.mocked(useSession).mockReturnValue({
    isSignedIn: true,
    isLoaded: true,
    session: {
      id: "session_test_123",
      user,
      status: "active",
      lastActiveAt: new Date(),
      expireAt: new Date(Date.now() + 3600000), // 1 hour from now
    } as any,
  });
  
  return user;
};

// Helper function to mock an unauthenticated user
export const mockUnauthenticatedUser = () => {
  vi.mocked(useUser).mockReturnValue({
    isSignedIn: false,
    isLoaded: true,
    user: null,
  });
  
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    sessionId: null,
    getToken: vi.fn().mockResolvedValue(null),
    sessionClaims: null,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: vi.fn().mockReturnValue(false),
    signOut: vi.fn().mockResolvedValue(undefined),
  } as any);
  
  vi.mocked(useSession).mockReturnValue({
    isSignedIn: false,
    isLoaded: true,
    session: null,
  });
};

// Helper function to mock loading state
export const mockLoadingState = () => {
  vi.mocked(useUser).mockReturnValue({
    isSignedIn: false,
    isLoaded: false,
    user: undefined,
  } as any);
  
  vi.mocked(useAuth).mockReturnValue({
    isSignedIn: false,
    isLoaded: false,
    userId: undefined,
    sessionId: undefined,
    getToken: undefined,
    sessionClaims: undefined,
    actor: undefined,
    orgId: undefined,
    orgRole: undefined,
    orgSlug: undefined,
    has: undefined,
    signOut: undefined,
  } as any);
  
  vi.mocked(useSession).mockReturnValue({
    isSignedIn: false,
    isLoaded: false,
    session: undefined,
  } as any);
};

// Reset all mocks to default unauthenticated state
export const resetClerkMocks = () => {
  mockUnauthenticatedUser();
  vi.mocked(useClerk).mockReturnValue({
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
    redirectToSignIn: vi.fn(),
    redirectToSignUp: vi.fn(),
  } as any);
};