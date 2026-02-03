import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// Markdown: import as raw string with ?raw (e.g. "./docs/foo.md?raw") for the in-app docs viewer.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
