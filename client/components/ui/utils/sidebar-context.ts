import * as React from "react";

/**
 * Sidebar context type definition.
 */
export type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

/**
 * Context for sidebar state management.
 */
export const SidebarContext = React.createContext<SidebarContext | null>(null);

/**
 * Hook to access sidebar context and state.
 * Must be used within a SidebarProvider component.
 *
 * @returns Sidebar context with state and handlers
 * @throws Error if used outside of SidebarProvider
 */
export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}
