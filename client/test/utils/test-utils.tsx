import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Create a custom render function that includes common providers
interface CustomRenderOptions extends Omit<RenderOptions, "queries"> {
  // Router options
  initialRoute?: string;
  routerProps?: Omit<MemoryRouterProps, "children">;
  // Query client options
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: CustomRenderOptions,
) {
  const {
    initialRoute = "/",
    routerProps = {},
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: Infinity, // Prevent automatic refetches in tests
        },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter 
        initialEntries={[initialRoute]} 
        {...routerProps}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override the default render with our custom one
export { renderWithProviders as render };