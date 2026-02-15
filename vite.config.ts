import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
// Markdown: import as raw string with ?raw (e.g. "./docs/foo.md?raw") for the in-app docs viewer.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Street Keeper",
        short_name: "StreetKeeper",
        theme_color: "#10b981",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/api\/v1\/map\/streets/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "map-streets-cache" },
          },
        ],
      },
    }),
  ],
});
