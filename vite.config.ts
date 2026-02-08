import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: true,
    port: 8080,
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 8080,
    allowedHosts: ["safefall-kmgd.onrender.com"]
  },
  
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
