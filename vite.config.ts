import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Plugin que carimba a versão do build em duas formas:
//   1. `__BUILD_VERSION__` injetado no bundle JS (cliente compara
//      contra `/build-version.json` em runtime)
//   2. `dist/build-version.json` emitido junto do build (servido pelo
//      mesmo deploy, com `no-cache` no vercel.json pra sempre revalidar)
//
// Quando o cliente detecta versão diferente, mostra toast pedindo
// reload. Resolve o cenário de user logado com bundle antigo em cache.
const buildVersionPlugin = (): PluginOption => {
  const version = `${Date.now()}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  return {
    name: "build-version",
    config() {
      return {
        define: {
          __BUILD_VERSION__: JSON.stringify(version),
        },
      };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "build-version.json",
        source: JSON.stringify({
          version,
          built_at: new Date().toISOString(),
        }),
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    buildVersionPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean) as PluginOption[],
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
    include: ["react", "react-dom", "leaflet", "react-leaflet", "@react-leaflet/core"],
    exclude: ["react-quill", "quill"],
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
