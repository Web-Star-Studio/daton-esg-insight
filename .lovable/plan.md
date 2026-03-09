

## Problem
The `package.json` scripts use `npm exec --yes node@24 -- ./node_modules/vite/bin/vite.js` which fails with `code 127` because the cached node binary at `/.npm/_npx/...` is missing or corrupted.

## Fix
Replace all 4 scripts (`dev`, `build`, `build:dev`, `preview`) to call `vite` directly:

```json
"dev": "vite",
"build": "vite build",
"build:dev": "vite build --mode development",
"preview": "vite preview"
```

This is a single-line change in `package.json` lines 7-11. No other files affected.

