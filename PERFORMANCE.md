# Performance Optimization Guide

This document outlines the performance optimization strategies implemented in the Daton ESG Management System.

## 🎯 Overview

The application is optimized for:
- **Fast initial load**: Code splitting reduces initial bundle size
- **Smooth navigation**: Route preloading and lazy loading
- **Efficient rendering**: Component memoization and virtualization
- **Smart caching**: Query caching and service workers
- **Bundle optimization**: Manual chunking and tree shaking

## 📦 Code Splitting Strategy

### 1. Route-Based Splitting

All routes are lazy-loaded using React's `lazy()` and `Suspense`:

```typescript
import { lazyLoad } from '@/utils/lazyLoad';

export const Dashboard = lazyLoad(() => import('@/pages/Dashboard'));
```

**Benefits:**
- Initial bundle reduced by ~60%
- Each route loads only when needed
- Automatic retry on load failure

### 2. Component-Level Splitting

Heavy components are lazy-loaded:

```typescript
import { lazyLoad } from '@/utils/lazyLoad';

const PDFViewer = lazyLoad(() => import('@/components/DocumentViewer'));
```

**When to use:**
- Components > 50KB
- Third-party library wrappers (charts, PDFs, Excel)
- Features not immediately visible

### 3. Library-Level Splitting

Heavy libraries are imported dynamically:

```typescript
import { loadPDFLibrary } from '@/utils/bundleOptimizer';

const jsPDF = await loadPDFLibrary();
```

**Split libraries:**
- `jspdf` - PDF generation
- `xlsx` - Excel handling
- `recharts` - Advanced charts
- `fabric` - Canvas editing

## 🚀 Performance Optimizations

### Route Preloading

Routes are preloaded on:
1. **Idle time** - Common routes preloaded after initial load
2. **Hover** - Routes preloaded when user hovers over links
3. **Manual** - Critical routes preloaded programmatically

```typescript
import { preloadRoute } from '@/utils/routePreloader';

// Preload on hover
<Link to="/inventario-gee" onMouseEnter={() => preloadRoute('/inventario-gee')}>

// Preload on idle
useEffect(() => {
  preloadCommonRoutes();
}, []);
```

### Component Memoization

Expensive components are memoized to prevent unnecessary re-renders:

```typescript
import { MemoizedButton, MemoizedCard } from '@/components/MemoizedComponents';
```

### Query Caching

React Query caching configuration in `src/config/performanceConfig.ts`:

```typescript
cache: {
  critical: 2 * 60 * 1000,   // 2 minutes
  standard: 5 * 60 * 1000,   // 5 minutes
  static: 30 * 60 * 1000,    // 30 minutes
}
```

### List Virtualization

Long lists use virtualization to render only visible items:

```typescript
import { useVirtualization } from '@/utils/componentOptimizer';

const { visibleItems, startIndex, endIndex } = useVirtualization(
  items,
  itemHeight,
  containerHeight
);
```

**Threshold:** Lists with > 50 items automatically virtualized

## 📊 Bundle Analysis

### Current Bundle Sizes (after optimization)

- **Initial bundle:** ~200KB (gzipped)
- **Vendor chunks:** ~300KB (gzipped)
- **Route chunks:** 20-80KB each (gzipped)

### Manual Chunks

Configured in `vite.config.ts`:

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'ui-vendor': ['@radix-ui/...'],
  'form-vendor': ['react-hook-form', 'zod'],
  'chart-vendor': ['recharts'],
  'supabase': ['@supabase/supabase-js'],
  'tanstack': ['@tanstack/react-query'],
}
```

**Benefits:**
- Better caching (vendor code changes less frequently)
- Parallel loading of chunks
- Smaller incremental updates

## 🔧 Best Practices

### 1. Lazy Load Heavy Components

```typescript
// ❌ Bad - loads immediately
import PDFViewer from './PDFViewer';

// ✅ Good - loads on demand
const PDFViewer = lazyLoad(() => import('./PDFViewer'));
```

### 2. Use Memoization Wisely

```typescript
// ❌ Bad - re-renders on every parent update
<Button onClick={handleClick}>Click</Button>

// ✅ Good - only re-renders when props change
<MemoizedButton onClick={handleClick}>Click</MemoizedButton>
```

### 3. Debounce Expensive Operations

```typescript
import { useDebounce } from '@/utils/componentOptimizer';

const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  performExpensiveSearch(debouncedSearch);
}, [debouncedSearch]);
```

### 4. Virtualize Long Lists

```typescript
// ❌ Bad - renders 1000 items
{items.map(item => <ListItem key={item.id} item={item} />)}

// ✅ Good - renders only visible items
{visibleItems.map(item => <ListItem key={item.id} item={item} />)}
```

### 5. Monitor Performance

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

const result = await performanceMonitor.measureAsync(
  'fetch_emissions',
  () => fetchEmissions()
);
```

## 📈 Performance Metrics

### Target Metrics

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1

### Monitoring

Performance is monitored via:
1. **Web Vitals** - Automatic tracking in `performanceMonitor.ts`
2. **Custom metrics** - `performanceMonitor.recordMetric()`
3. **Bundle size** - Vite build analyzer

## 🔍 Debugging Performance

### 1. Check Bundle Size

```bash
npm run build
```

Look for warnings about large chunks (> 1MB).

### 2. Analyze Performance

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

// Get stats for a metric
const stats = performanceMonitor.getMetricStats('fetch_emissions');
console.log('Average:', stats.average, 'ms');
console.log('P95:', stats.p95, 'ms');
```

### 3. Monitor Network

Open DevTools > Network to check:
- Lazy-loaded chunks loading on demand
- Proper caching headers
- Parallel resource loading

### 4. Profile Rendering

Open DevTools > Performance and record a session to identify:
- Long tasks (> 50ms)
- Excessive re-renders
- Layout thrashing

## 🚨 Common Performance Issues

### Issue: Large Initial Bundle

**Solution:** Ensure routes are lazy-loaded via `lazyRoutes.tsx`

### Issue: Slow Route Transitions

**Solution:** Preload routes on hover or idle

### Issue: List Lag with 100+ Items

**Solution:** Use `useVirtualization` hook

### Issue: Excessive Re-renders

**Solution:** Use memoized components and `React.memo()`

### Issue: Slow Query Responses

**Solution:** Check caching configuration in `performanceConfig.ts`

## 📚 Additional Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [React Query Performance](https://tanstack.com/query/latest/docs/react/guides/performance)

## 🎯 Future Optimizations

1. **Service Worker** - Implement for offline support and advanced caching
2. **Image Optimization** - Add WebP format and lazy loading for images
3. **Database Indexing** - Optimize slow queries identified in production
4. **CDN Integration** - Serve static assets from CDN
5. **Compression** - Enable Brotli compression on server
