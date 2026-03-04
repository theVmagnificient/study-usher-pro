import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    proxy: {
      "/api": {
        target: "https://api.platform.xaidos.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [vue(), mode === "development" && componentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".vue", ".ts", ".js", ".json"], // Exclude .tsx and .jsx
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
}));
