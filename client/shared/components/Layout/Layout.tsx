import { useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Music,
  Search,
  List,
  Moon,
  Sun,
  Monitor,
  Menu,
  Home,
  PlusCircle,
  User,
} from "lucide-react";

export interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "stage">("light");
  const [isOffline] = useState(false);
  const location = useLocation();

  const navigation = useMemo(
    () => [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Songs", href: "/songs", icon: Music },
      { name: "Setlists", href: "/setlists", icon: List },
      { name: "Profile", href: "/profile", icon: User },
    ],
    [],
  );

  const themeIcon = useMemo(() => {
    switch (theme) {
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "stage":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  }, [theme]);

  // Simple theme cycling handler
  const cycleTheme = useCallback(() => {
    const themes: ("light" | "dark" | "stage")[] = ["light", "dark", "stage"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark" || newTheme === "stage") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Music className="h-6 w-6 text-worship" />
                    <span>HSA Songbook</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                          location.pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-worship" />
              <span className="text-xl font-bold hidden sm:block">
                HSA Songbook
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      location.pathname === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, or themes..."
                className="pl-10 focus-ring"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Offline indicator */}
            {isOffline && (
              <Badge variant="secondary" className="hidden sm:flex">
                Offline
              </Badge>
            )}

            {/* Search button for mobile */}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-4 w-4" />
            </Button>

            {/* Add new song */}
            <Button variant="ghost" size="icon">
              <PlusCircle className="h-4 w-4" />
            </Button>

            {/* Theme switcher - simple cycling button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              title={`Current: ${theme}. Click to cycle themes.`}
            >
              {themeIcon}
            </Button>

            {/* User menu - with Clerk authentication */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
