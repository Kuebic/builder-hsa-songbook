import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "ui-vendor": ["lucide-react", "clsx", "tailwind-merge", "class-variance-authority"],
          // Radix UI components (heavy)
          "radix-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-slot",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group"
          ],
          // Data fetching and state
          "data-vendor": ["@tanstack/react-query", "@clerk/clerk-react"],
          // Form handling
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Notification and theming
          "notification-vendor": ["sonner", "next-themes"],
          // Heavy UI components (lazy loaded if possible)
          "heavy-ui-vendor": ["recharts", "embla-carousel-react", "react-resizable-panels", "react-day-picker", "cmdk", "vaul"],
          // Chord functionality
          "chord-vendor": ["chordsheetjs"]
        }
      }
    }
  },
  plugins: [
    react(), 
    expressPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          // Cache API responses with network-first strategy
          {
            urlPattern: /^.*\/api\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Cache songs with cache-first strategy (offline-first)
          {
            urlPattern: /^.*\/api\/songs\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "songs-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
            },
          },
          // Cache static assets
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "HSA Songbook",
        short_name: "HSA Songbook",
        description: "Offline-capable worship songbook for chord charts and setlists",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
        ],
        categories: ["music", "productivity", "utilities"],
        shortcuts: [
          {
            name: "Songs",
            short_name: "Songs",
            description: "Browse chord charts",
            url: "/songs",
            icons: [{ src: "favicon.ico", sizes: "64x64" }],
          },
          {
            name: "Setlists",
            short_name: "Setlists",
            description: "Manage setlists",
            url: "/setlists",
            icons: [{ src: "favicon.ico", sizes: "64x64" }],
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in development
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@features": path.resolve(__dirname, "./client/features"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@/shared": path.resolve(__dirname, "./client/shared"),
    },
  },
  });
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      try {
        // Load environment variables first
        const envModule = await import("./server/env");
        console.log("📋 Environment info:", envModule.envInfo);
        
        // Check if MongoDB URI is available before proceeding
        if (!process.env.MONGODB_URI) {
          console.error("❌ Cannot start server: MONGODB_URI is not configured");
          console.error("Please check your .env file in the project root");
          
          // Create a minimal Express app that returns helpful errors
          const express = await import("express");
          const errorApp = express.default();
          
          errorApp.use((req, res) => {
            if (req.path.startsWith("/api/")) {
              res.status(503).json({
                success: false,
                error: {
                  code: "ENV_CONFIG_ERROR",
                  message: "Server is not properly configured. MONGODB_URI is missing.",
                  details: "Please check the server console for setup instructions."
                }
              });
            } else {
              res.status(503).send(`
                <h1>Configuration Error</h1>
                <p>The server is not properly configured. Please check:</p>
                <ul>
                  <li>Your .env file exists in the project root</li>
                  <li>MONGODB_URI is set in the .env file</li>
                  <li>The MongoDB connection string is valid</li>
                </ul>
                <p>Check the server console for more details.</p>
              `);
            }
          });
          
          server.middlewares.use(errorApp);
          return;
        }
        
        // Import the initializeServer function
        const { initializeServer } = await import("./server");

        // Initialize database connection with error handling
        console.log("🔌 Initializing database connection...");
        await initializeServer().catch((error) => {
          console.error("❌ Failed to initialize database:", error);
          throw error;
        });

        // Then create and add the Express app
        const app = await createServer();
        server.middlewares.use(app);
        
        console.log("✅ Express server configured successfully");
        
      } catch (error) {
        console.error("❌ Failed to configure Express server:", error);
        
        // Create error handling middleware
        const express = await import("express");
        const errorApp = express.default();
        
        errorApp.use((req, res) => {
          if (req.path.startsWith("/api/")) {
            res.status(503).json({
              success: false,
              error: {
                code: "SERVER_INIT_ERROR",
                message: "Server initialization failed",
                details: error instanceof Error ? error.message : "Unknown error"
              }
            });
          } else {
            res.status(503).send(`
              <h1>Server Initialization Error</h1>
              <p>The server failed to start properly.</p>
              <p>Error: ${error instanceof Error ? error.message : "Unknown error"}</p>
              <p>Check the server console for more details.</p>
            `);
          }
        });
        
        server.middlewares.use(errorApp);
      }
    },
  };
}
