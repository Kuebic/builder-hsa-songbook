import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

// Lazy load all route components for code splitting
const DashboardPage = lazy(() => import("@features/dashboard").then(m => ({ default: m.DashboardPage })));
const SongsPage = lazy(() => import("@features/songs").then(m => ({ default: m.SongsPage })));
const SongDetailPage = lazy(() => import("@features/songs").then(m => ({ default: m.SongDetailPage })));
const CategoryBrowser = lazy(() => import("@features/categories").then(m => ({ default: m.CategoryBrowser })));
const SetlistsPage = lazy(() => import("@features/setlists").then(m => ({ default: m.SetlistsPage })));
const ArrangementsPage = lazy(() => import("@features/arrangements").then(m => ({ default: m.ArrangementsPage })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/songs" element={<SongsPage />} />
                <Route path="/songs/:slug" element={<SongDetailPage />} />
                <Route path="/categories/:categoryId" element={<CategoryBrowser />} />
                <Route path="/setlists" element={<SetlistsPage />} />
                <Route path="/arrangements" element={<ArrangementsPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(<App />);
