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
      const app = await createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
