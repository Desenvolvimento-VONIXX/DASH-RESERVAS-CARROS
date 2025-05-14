import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { convertToSankhyaBI } from "@insulino/vite-plugin-2sankhyabi";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), { ...convertToSankhyaBI(), apply: "build" }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
