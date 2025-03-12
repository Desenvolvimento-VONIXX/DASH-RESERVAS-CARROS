import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { plugin } from "web-dash-builder";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), plugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
