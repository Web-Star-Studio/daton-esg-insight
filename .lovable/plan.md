

## Fix: Leaflet "DomUtil" Export Error on Map Tab

### Problem
The map tab in `/configuracao-organizacional` (and `/gestao-filiais`) crashes with:
```
SyntaxError: The requested module 'leaflet' doesn't provide an export named: 'DomUtil'
```

This happens because `leaflet`, `react-leaflet`, and `@react-leaflet/core` are listed in `optimizeDeps.exclude` in `vite.config.ts` (line 24). This tells Vite **not** to pre-bundle these libraries, forcing the browser to load them as raw ESM -- but Leaflet's source is CommonJS and doesn't export `DomUtil` as a named ESM export.

### Solution
Move `leaflet`, `react-leaflet`, and `@react-leaflet/core` from `optimizeDeps.exclude` to `optimizeDeps.include` so Vite properly pre-bundles them into ESM-compatible modules.

### Technical Changes

**File: `vite.config.ts`**
- **Line 23**: Add `"leaflet"`, `"react-leaflet"`, and `"@react-leaflet/core"` to the `include` array
- **Line 24**: Remove those three entries from the `exclude` array (keep only `"react-quill"` and `"quill"`)

Result:
```ts
optimizeDeps: {
  force: true,
  include: ["react", "react-dom", "leaflet", "react-leaflet", "@react-leaflet/core"],
  exclude: ["react-quill", "quill"],
},
```

This is a one-file, two-line change that should resolve the crash immediately.

