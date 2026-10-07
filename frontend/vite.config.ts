import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The backend runs on :8000 by default (override with BACKEND_PORT). In development,
// Vite proxies /api so the frontend can use relative URLs and no CORS setup is needed.
const backend = `http://127.0.0.1:${process.env.BACKEND_PORT ?? "8000"}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": backend,
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": backend,
    },
  },
});
