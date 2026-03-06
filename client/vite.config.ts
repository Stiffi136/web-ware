import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function analyticsPlugin(): Plugin {
  return {
    name: "inject-analytics",
    transformIndexHtml() {
      const src = process.env.VITE_ANALYTICS_SRC;
      const id = process.env.VITE_ANALYTICS_SITE_ID;
      if (!src || !id) return [];
      return [
        {
          tag: "script",
          attrs: { defer: true, src, "data-website-id": id },
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), analyticsPlugin()],
  server: {
    host: true,
    proxy: {
      "/ws": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
