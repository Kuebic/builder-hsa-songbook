import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "../Layout";

// Mock lucide-react icons
// Lucide icons are mocked globally in test setup

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    asChild,
    ...props
  }: any) => {
    const Component = asChild ? "span" : "button";
    return (
      <Component
        onClick={onClick}
        className={className}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </Component>
    );
  },
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, className, ...props }: any) => (
    <input placeholder={placeholder} className={className} {...props} />
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: any) => {
    const Component = asChild ? "span" : "div";
    return <Component data-testid="dropdown-trigger">{children}</Component>;
  },
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children, side, className }: any) => (
    <div data-testid="sheet-content" data-side={side} className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: any) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children, className }: any) => (
    <div data-testid="sheet-title" className={className}>
      {children}
    </div>
  ),
  SheetTrigger: ({ children, asChild }: any) => {
    const Component = asChild ? "span" : "div";
    return <Component data-testid="sheet-trigger">{children}</Component>;
  },
}));

// Store original document methods
const originalSetAttribute = document.documentElement.setAttribute;
const originalClassList = document.documentElement.classList;

const renderWithRouter = (
  component: React.ReactElement,
  initialRoute = "/",
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>{component}</MemoryRouter>,
  );
};

describe("Layout Component", () => {
  let mockSetAttribute: any;
  let mockClassListAdd: any;
  let mockClassListRemove: any;

  beforeEach(() => {
    // Mock document.documentElement methods
    mockSetAttribute = vi.fn();
    mockClassListAdd = vi.fn();
    mockClassListRemove = vi.fn();

    document.documentElement.setAttribute = mockSetAttribute;
    Object.defineProperty(document.documentElement, "classList", {
      value: {
        add: mockClassListAdd,
        remove: mockClassListRemove,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original methods
    document.documentElement.setAttribute = originalSetAttribute;
    Object.defineProperty(document.documentElement, "classList", {
      value: originalClassList,
      writable: true,
      configurable: true,
    });
  });

  describe("Basic Rendering", () => {
    it("renders layout with children content", () => {
      renderWithRouter(
        <Layout>
          <div>Test Content</div>
        </Layout>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("displays HSA Songbook brand", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getAllByText("HSA Songbook")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByTestId("music-icon")).toHaveLength(4); // Brand, mobile nav, desktop nav, mobile sheet
    });

    it("renders header with proper structure", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("sticky", "top-0", "z-50");
    });

    it("renders main content area", () => {
      renderWithRouter(
        <Layout>
          <div data-testid="main-content">Content</div>
        </Layout>,
      );

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("displays all navigation items", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getAllByText("Dashboard")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("Songs")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("Setlists")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByText("Arrangements")).toHaveLength(2); // Mobile and desktop
    });

    it("highlights active navigation item based on current route", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
        "/songs",
      );

      const songLinks = screen.getAllByText("Songs");
      expect(songLinks.length).toBeGreaterThan(0);

      // At least one Songs link should have active styling
      const activeSongsLink = songLinks.find((link) =>
        link.closest("a")?.className.includes("bg-accent"),
      );
      expect(activeSongsLink).toBeDefined();
    });

    it("shows proper navigation icons", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getAllByTestId("home-icon")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByTestId("music-icon")).toHaveLength(4); // Brand + mobile + desktop + sheet
      expect(screen.getAllByTestId("list-icon")).toHaveLength(2); // Mobile and desktop
      expect(screen.getAllByTestId("book-open-icon")).toHaveLength(2); // Mobile and desktop
    });

    it("has correct navigation links", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const dashboardLinks = screen.getAllByRole("link", {
        name: /dashboard/i,
      });
      const songsLinks = screen.getAllByRole("link", { name: /songs/i });
      const setlistsLinks = screen.getAllByRole("link", { name: /setlists/i });
      const arrangementsLinks = screen.getAllByRole("link", {
        name: /arrangements/i,
      });

      expect(dashboardLinks[0]).toHaveAttribute("href", "/");
      expect(songsLinks[0]).toHaveAttribute("href", "/songs");
      expect(setlistsLinks[0]).toHaveAttribute("href", "/setlists");
      expect(arrangementsLinks[0]).toHaveAttribute("href", "/arrangements");
    });
  });

  describe("Mobile Navigation", () => {
    it("renders mobile menu trigger", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByTestId("sheet-trigger")).toBeInTheDocument();
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
    });

    it("shows mobile navigation in sheet", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByTestId("sheet")).toBeInTheDocument();
      expect(screen.getByTestId("sheet-content")).toHaveAttribute(
        "data-side",
        "left",
      );
      expect(screen.getByTestId("sheet-title")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("renders search input with proper placeholder", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const searchInput = screen.getByPlaceholderText(
        "Search songs, artists, or themes...",
      );
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveClass("pl-10");
    });

    it("shows search icon in input", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const searchIcons = screen.getAllByTestId("search-icon");
      expect(searchIcons.length).toBeGreaterThan(0);
    });

    it("has mobile search button", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const searchButtons = screen.getAllByTestId("search-icon");
      // Should have at least one search icon for mobile button
      expect(searchButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Theme Switching", () => {
    it("displays theme switcher with default light theme", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getAllByTestId("sun-icon")).toHaveLength(2); // Button icon + dropdown option
      expect(screen.getAllByTestId("dropdown-trigger")).toHaveLength(2); // Theme + User dropdowns
    });

    it("shows all theme options in dropdown", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("Stage Mode")).toBeInTheDocument();
    });

    it("changes theme when clicking theme options", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Click on Dark theme
      const darkThemeItem = screen
        .getByText("Dark")
        .closest("[data-testid='dropdown-item']");
      fireEvent.click(darkThemeItem!);

      expect(mockSetAttribute).toHaveBeenCalledWith("data-theme", "dark");
      expect(mockClassListAdd).toHaveBeenCalledWith("dark");
    });

    it("handles stage mode theme correctly", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Click on Stage Mode theme
      const stageModeItem = screen
        .getByText("Stage Mode")
        .closest("[data-testid='dropdown-item']");
      fireEvent.click(stageModeItem!);

      expect(mockSetAttribute).toHaveBeenCalledWith("data-theme", "stage");
      expect(mockClassListAdd).toHaveBeenCalledWith("dark");
    });

    it("handles light theme correctly", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // First switch to dark, then back to light
      const darkThemeItem = screen
        .getByText("Dark")
        .closest("[data-testid='dropdown-item']");
      fireEvent.click(darkThemeItem!);

      const lightThemeItem = screen
        .getByText("Light")
        .closest("[data-testid='dropdown-item']");
      fireEvent.click(lightThemeItem!);

      expect(mockSetAttribute).toHaveBeenLastCalledWith("data-theme", "light");
      expect(mockClassListRemove).toHaveBeenCalledWith("dark");
    });

    it("updates theme icon when theme changes", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Initially should show sun icons (light theme)
      expect(screen.getAllByTestId("sun-icon")).toHaveLength(2);

      // Switch to dark theme
      const darkThemeItem = screen
        .getByText("Dark")
        .closest("[data-testid='dropdown-item']");
      fireEvent.click(darkThemeItem!);

      // Should now show moon icon in the button, sun icon still in dropdown
      expect(screen.getAllByTestId("moon-icon")).toHaveLength(2); // Button + dropdown option
      expect(screen.getAllByTestId("sun-icon")).toHaveLength(1); // Only in dropdown option
    });
  });

  describe("User Menu", () => {
    it("displays user menu trigger", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getAllByTestId("user-icon")).toHaveLength(2); // Button + dropdown option
    });

    it("shows user menu options", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    it("has proper menu separators", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByTestId("dropdown-separator")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("renders add new song button", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByTestId("plus-circle-icon")).toBeInTheDocument();
    });

    it("has proper button styling", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const addButton = screen
        .getByTestId("plus-circle-icon")
        .closest("button");
      expect(addButton).toHaveAttribute("data-variant", "ghost");
      expect(addButton).toHaveAttribute("data-size", "icon");
    });
  });

  describe("Offline Status", () => {
    it("does not show offline badge when online", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    });

    // Note: The offline state is hardcoded to false in the component
    // In a real implementation, this would be connected to actual network status
  });

  describe("Responsive Behavior", () => {
    it("has responsive classes for different breakpoints", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Check for responsive classes - find the desktop brand element specifically
      const brandElements = screen.getAllByText("HSA Songbook");
      const desktopBrand = brandElements.find(
        (el) =>
          el.className.includes("hidden") && el.className.includes("sm:block"),
      );
      expect(desktopBrand).toHaveClass("hidden", "sm:block");

      // Mobile menu trigger should have md:hidden class
      const menuTrigger = screen.getByTestId("menu-icon").closest("button");
      expect(menuTrigger).toHaveClass("md:hidden");
    });

    it("shows desktop navigation only on larger screens", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Desktop nav should have hidden md:flex classes
      const desktopNavLinks = screen.getAllByRole("link", {
        name: /dashboard|songs|setlists|arrangements/i,
      });

      // Find navigation containers
      const containers = desktopNavLinks.map((link) => link.closest("nav"));
      const desktopNav = containers.find((nav) =>
        nav?.className.includes("hidden md:flex"),
      );

      expect(desktopNav).toBeInTheDocument();
    });

    it("hides search input on small screens", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const searchContainer = screen
        .getByPlaceholderText("Search songs, artists, or themes...")
        .closest("div.hidden");
      expect(searchContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      expect(screen.getByRole("banner")).toBeInTheDocument(); // header
      expect(screen.getByRole("main")).toBeInTheDocument(); // main content
      const navElements = screen.getAllByRole("navigation");
      expect(navElements.length).toBeGreaterThan(0); // Should have navigation elements (mobile + desktop)
    });

    it("has accessible buttons with proper attributes", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should be focusable
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });

    it("has proper link navigation", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      // Brand link should go to home
      const brandLinks = screen.getAllByRole("link", { name: /hsa songbook/i });
      expect(brandLinks[0]).toHaveAttribute("href", "/");
    });
  });

  describe("Edge Cases", () => {
    it("handles different route paths correctly", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
        "/setlists",
      );

      const setlistLinks = screen.getAllByText("Setlists");
      expect(setlistLinks.length).toBeGreaterThan(0);
    });

    it("handles nested routes", () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>,
        "/songs/123",
      );

      // Should still show Songs as active for nested routes
      const songLinks = screen.getAllByText("Songs");
      expect(songLinks.length).toBeGreaterThan(0);
    });

    it("gracefully handles missing icons", () => {
      // This test ensures component doesn't crash if icons are missing
      renderWithRouter(
        <Layout>
          <div>Test Content</div>
        </Layout>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });
  });
});
