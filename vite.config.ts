import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/TimeX/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        website: "index.html",
        app: "app.html",
      },
    },
  },
});
