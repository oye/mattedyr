/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Mattedyr",
        short_name: "Mattedyr",
        description: "Sveip deg gjennom matte og la kjæledyret ditt vokse!",
        lang: "nb",
        theme_color: "#6c4cf5",
        background_color: "#1b1340",
        display: "standalone",
        orientation: "portrait",
        // start_url and scope default to Vite's `base`, so the app also works under a subpath
        // (e.g. GitHub Pages: `npm run build -- --base=/mattedyr/`).
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
  },
});

