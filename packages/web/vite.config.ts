import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7332,
    proxy: {
      "/api": {
        target: "http://localhost:7334",
        changeOrigin: true,
      },
    },
  },
});
