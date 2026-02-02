import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    force: true,
    include: ["react", "react-dom"],
    exclude: ["react-quill", "quill", "react-leaflet", "@react-leaflet/core", "leaflet"],
  },
  build: {
    commonjsOptions: {
      include: [/react-quill/, /node_modules/]
    },
    // Use esbuild for production minification with console removal
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts'],
          'supabase': ['@supabase/supabase-js'],
          'tanstack': ['@tanstack/react-query'],
          // Separate framer-motion for better tree-shaking
          'animation': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    sourcemap: false, // Disable sourcemaps in production for smaller builds
  },
}));
