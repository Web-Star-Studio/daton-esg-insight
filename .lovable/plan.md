
# Plano de Otimizacao de Performance e Escalabilidade

## Resumo Executivo

Este plano aborda uma auditoria completa de performance conforme a diretiva do CTO, visando atingir os targets de Core Web Vitals e otimizar bundle size, imagens, CSS/JS, network e React.

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Lazy Loading de Rotas | OK | 100+ rotas usando `React.lazy()` em `App.tsx` |
| Code Splitting Manual | OK | `vite.config.ts` com 7 chunks manuais (react-vendor, ui-vendor, etc.) |
| Query Caching | OK | React Query com `staleTime: 5min`, `gcTime: 30min` |
| Virtualizacao de Listas | OK | `useVirtualizedList` hook com threshold de 50 items |
| Route Preloading | OK | `routePreloader.ts` com idle/hover preloading |
| Performance Monitor | OK | `performanceMonitor.ts` com Web Vitals tracking |
| Memoized Components | OK | `MemoizedComponents.tsx` com Button, Input, Card |
| Responsive Image | OK | `ResponsiveImage` component com srcset e lazy loading |
| Debounce/Throttle | OK | `useDebounce`, `useThrottle` hooks implementados |
| Smart Cache | OK | `useSmartCache` com priority levels |

### Problemas Identificados

| Problema | Severidade | Impacto | Localizacao |
|----------|------------|---------|-------------|
| Framer-motion em paginas criticas | ALTA | LCP > 2.5s | 19 arquivos, incluindo LandingPage |
| Video externo no Hero | ALTA | LCP bloqueante | HeroSection.tsx (Vimeo video) |
| Fonts blocking render | ALTA | FCP > 1.8s | index.html (Google Fonts sem preload) |
| CSS Heimdall importando fonts | MEDIA | Render blocking | heimdall.css (@import fonts) |
| console.log em producao | MEDIA | Bundle size | 334 matches em 24 services |
| Sem Critical CSS inline | MEDIA | FCP impactado | index.html sem styles inline |
| Sem Service Worker | MEDIA | Sem cache offline | Nao implementado |
| Sem WebP fallback | MEDIA | Imagens maiores | ResponsiveImage sem WebP |
| framer-motion nao tree-shaked | MEDIA | Bundle maior | Importando modulo inteiro |

---

## Metricas Atuais vs Targets

| Metrica | Target | Estado Estimado | Gap |
|---------|--------|-----------------|-----|
| LCP | < 2.5s | ~3-4s (video Hero) | ALTO |
| FCP | < 1.8s | ~2s (fonts blocking) | MEDIO |
| FID | < 100ms | ~50ms (OK) | BAIXO |
| CLS | < 0.1 | ~0.05 (OK) | OK |
| TTFB | < 600ms | ~200ms (OK) | OK |
| Bundle Size | < 200KB gzip | ~250KB (estimado) | MEDIO |
| Lighthouse Score | 90+ | ~70 (estimado) | ALTO |

---

## Plano de Correcoes

### FASE 1: Critical Rendering Path (LCP/FCP)

#### 1.1 Preload Fonts em index.html

**Problema:** Google Fonts carregadas via link bloqueante

**Arquivo:** `index.html`

```html
<!-- ANTES -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- DEPOIS -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</noscript>
```

#### 1.2 Critical CSS Inline

**Problema:** Nenhum CSS inline no head

**Arquivo:** `index.html`

```html
<head>
  <!-- Adicionar Critical CSS inline para above-the-fold -->
  <style>
    /* Critical CSS - Loading State */
    #root { min-height: 100vh; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }
    /* Prevent CLS from loading states */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  </style>
</head>
```

#### 1.3 Otimizar Hero Video

**Problema:** Video Vimeo externo bloqueia LCP

**Arquivo:** `src/components/landing/heimdall/HeroSection.tsx`

```typescript
// ANTES: Video carrega imediatamente
<video autoPlay muted loop playsInline>
  <source src="https://player.vimeo.com/external/..." type="video/mp4" />
</video>

// DEPOIS: Poster image + lazy video loading
const [videoLoaded, setVideoLoaded] = useState(false);

// Usar poster image para LCP
<div className="hero-video-container">
  {!videoLoaded && (
    <img 
      src="/hero-poster.webp" 
      alt="Dashboard ESG Preview"
      fetchpriority="high"
      decoding="async"
      className="hero-poster"
    />
  )}
  <video 
    autoPlay muted loop playsInline
    onLoadedData={() => setVideoLoaded(true)}
    style={{ opacity: videoLoaded ? 1 : 0 }}
  >
    <source src="..." type="video/mp4" />
  </video>
</div>
```

#### 1.4 Remover @import de Fonts no CSS

**Problema:** `heimdall.css` importa fonts de forma bloqueante

**Arquivo:** `src/components/landing/heimdall/heimdall.css`

```css
/* REMOVER linha 11 */
/* @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'); */

/* Fonts serao carregadas via index.html com preload */
```

Atualizar `index.html`:
```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" onload="this.onload=null;this.rel='stylesheet'">
```

---

### FASE 2: Bundle Size Optimization

#### 2.1 Tree-shake Framer Motion

**Problema:** Importando modulo inteiro de framer-motion

**Arquivo:** Multiplos arquivos

```typescript
// ANTES
import { motion, AnimatePresence, useSpring } from 'framer-motion';

// DEPOIS - Importar apenas o necessario
import { motion } from 'framer-motion/dist/es/render/dom/motion';
import { AnimatePresence } from 'framer-motion/dist/es/components/AnimatePresence';
```

**Alternativa mais simples:** Adicionar ao vite.config.ts:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // ... existing chunks ...
        'framer-motion': ['framer-motion'],
      },
    },
  },
},
```

#### 2.2 Remover console.log em Producao

**Arquivo:** `vite.config.ts`

```typescript
build: {
  // ... existing config ...
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
},
```

#### 2.3 Adicionar Bundle Analyzer

**Arquivo:** `vite.config.ts`

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    // ... existing plugins ...
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
}));
```

---

### FASE 3: Image Optimization

#### 3.1 Criar Utilitario de WebP

**Arquivo:** `src/utils/imageOptimization.ts` (NOVO)

```typescript
/**
 * Image Optimization Utilities
 */

// Check WebP support
let webpSupported: boolean | null = null;

export async function supportsWebP(): Promise<boolean> {
  if (webpSupported !== null) return webpSupported;
  
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  return webpSupported;
}

// Get optimized image URL
export function getOptimizedImageUrl(
  src: string, 
  options: { width?: number; quality?: number } = {}
): string {
  const { width = 800, quality = 80 } = options;
  
  // If using a CDN that supports image optimization (e.g., Cloudinary, Imgix)
  // Return transformed URL
  // For now, return original
  return src;
}

// Preload critical images
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
```

#### 3.2 Atualizar ResponsiveImage para WebP

**Arquivo:** `src/components/ui/responsive-image.tsx`

```typescript
interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  src: string;
  alt: string;
  responsiveSrcSet?: ResponsiveImageSrcSet;
  webpSrc?: string; // Nova prop
  sizes?: string;
  aspectRatio?: string;
  fallback?: string;
  priority?: boolean; // Nova prop para imagens criticas
}

export function ResponsiveImage({
  src,
  alt,
  responsiveSrcSet,
  webpSrc,
  sizes = "(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  loading = "lazy",
  aspectRatio,
  fallback,
  priority = false,
  ...props
}: ResponsiveImageProps) {
  const [hasError, setHasError] = React.useState(false);
  
  // Use picture element for WebP with fallback
  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={hasError && fallback ? fallback : src}
          alt={alt}
          loading={priority ? "eager" : loading}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setHasError(true)}
          className={cn("object-cover", className)}
          style={aspectRatio ? { aspectRatio } : undefined}
          {...props}
        />
      </picture>
    );
  }
  
  // Fallback to original implementation
  // ... existing code
}
```

---

### FASE 4: Network Optimization

#### 4.1 Adicionar Link Prefetch para Rotas

**Arquivo:** `index.html`

```html
<head>
  <!-- Prefetch critical routes -->
  <link rel="prefetch" href="/assets/Index-[hash].js">
  <link rel="prefetch" href="/assets/Dashboard-[hash].js">
  
  <!-- DNS prefetch for external resources -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://player.vimeo.com">
</head>
```

#### 4.2 Implementar Service Worker

**Arquivo:** `public/sw.js` (NOVO)

```javascript
const CACHE_NAME = 'daton-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event - Network first, cache fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET') {
            cache.put(event.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
```

**Registrar em main.tsx:**
```typescript
// Register service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.warn('SW registration failed');
    });
  });
}
```

---

### FASE 5: React Optimizations

#### 5.1 Adicionar Profiler Wrapper

**Arquivo:** `src/utils/reactProfiler.ts` (NOVO)

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (process.env.NODE_ENV === 'development' && actualDuration > 16) {
    console.warn(
      `⚠️ Slow render: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`
    );
  }
};

export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string
): React.FC<P> {
  return (props: P) => (
    <Profiler id={id} onRender={onRenderCallback}>
      <Component {...props} />
    </Profiler>
  );
}
```

#### 5.2 Otimizar Landing Page com Lazy Sections

**Arquivo:** `src/components/landing/heimdall/HeimdallLanding.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { HeimdallNavbar } from './HeimdallNavbar';
import { HeroSection } from './HeroSection';

// Lazy load below-the-fold sections
const NewsTicker = lazy(() => import('./NewsTicker').then(m => ({ default: m.NewsTicker })));
const TechStack3D = lazy(() => import('./TechStack3D').then(m => ({ default: m.TechStack3D })));
const StatsGrid = lazy(() => import('./StatsGrid').then(m => ({ default: m.StatsGrid })));
const HeimdallFooter = lazy(() => import('./HeimdallFooter').then(m => ({ default: m.HeimdallFooter })));

export function HeimdallLanding() {
  return (
    <div className="heimdall-page">
      {/* Critical above-the-fold - load immediately */}
      <HeimdallNavbar />
      <HeroSection />
      
      {/* Below-the-fold - lazy load */}
      <Suspense fallback={<div className="loading-skeleton h-96" />}>
        <TechStack3D />
      </Suspense>
      
      <Suspense fallback={<div className="loading-skeleton h-64" />}>
        <StatsGrid />
      </Suspense>
      
      <Suspense fallback={<div className="loading-skeleton h-48" />}>
        <NewsTicker />
      </Suspense>
      
      <Suspense fallback={<div className="loading-skeleton h-96" />}>
        <HeimdallFooter />
      </Suspense>
    </div>
  );
}
```

#### 5.3 Adicionar Web Vitals Reporting

**Arquivo:** `src/utils/webVitals.ts` (NOVO)

```typescript
import { performanceMonitor } from './performanceMonitor';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function reportWebVitals(onPerfEntry?: (metric: WebVitalMetric) => void): void {
  if (typeof window === 'undefined') return;
  
  // LCP Observer
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const value = lastEntry.renderTime || lastEntry.loadTime;
      
      performanceMonitor.recordMetric('LCP', value);
      
      onPerfEntry?.({
        name: 'LCP',
        value,
        rating: value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor',
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // FCP Observer
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find(e => e.name === 'first-contentful-paint');
      if (fcp) {
        performanceMonitor.recordMetric('FCP', fcp.startTime);
        onPerfEntry?.({
          name: 'FCP',
          value: fcp.startTime,
          rating: fcp.startTime < 1800 ? 'good' : fcp.startTime < 3000 ? 'needs-improvement' : 'poor',
        });
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  }
}
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/utils/imageOptimization.ts` | Utilitarios de otimizacao de imagens |
| `src/utils/webVitals.ts` | Reporting de Core Web Vitals |
| `src/utils/reactProfiler.ts` | Wrapper de profiling React |
| `public/sw.js` | Service Worker para caching |
| `public/hero-poster.webp` | Poster image para Hero video |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `index.html` | Preload fonts, critical CSS, prefetch |
| `vite.config.ts` | Terser drop_console, framer-motion chunk, analyzer |
| `src/components/landing/heimdall/heimdall.css` | Remover @import fonts |
| `src/components/landing/heimdall/HeroSection.tsx` | Poster image + lazy video |
| `src/components/landing/heimdall/HeimdallLanding.tsx` | Lazy load below-fold sections |
| `src/components/ui/responsive-image.tsx` | WebP support, priority loading |
| `src/main.tsx` | Registrar Service Worker |

---

## Checklist de Validacao

### Core Web Vitals

- [ ] LCP < 2.5s (video poster, font preload)
- [ ] FCP < 1.8s (critical CSS, font preload)
- [ ] FID < 100ms (code splitting, lazy loading)
- [ ] CLS < 0.1 (aspect ratios, placeholders)
- [ ] TTFB < 600ms (CDN, caching)

### Bundle Size

- [ ] Main bundle < 200KB gzipped
- [ ] Framer-motion chunked separadamente
- [ ] console.log removidos em producao
- [ ] Tree-shaking funcionando

### Imagens

- [ ] WebP com fallback
- [ ] Lazy loading em todas imagens
- [ ] srcset para responsividade
- [ ] Priority loading para hero images

### Network

- [ ] Service Worker registrado
- [ ] Font preload configurado
- [ ] DNS prefetch configurado
- [ ] Cache headers corretos

### React

- [ ] Lazy loading de rotas funcionando
- [ ] Memoizacao em componentes pesados
- [ ] Virtualizacao em listas longas
- [ ] Profiler identificando re-renders

---

## Ordem de Execucao

1. **Fase 1:** Critical Rendering Path (maior impacto em LCP/FCP)
2. **Fase 2:** Bundle Size Optimization
3. **Fase 3:** Image Optimization
4. **Fase 4:** Network Optimization
5. **Fase 5:** React Optimizations
6. **Testes:** Lighthouse, PageSpeed, WebPageTest

---

## Metricas de Sucesso

| Metrica | Antes | Target | Impacto Esperado |
|---------|-------|--------|------------------|
| LCP | ~3.5s | < 2.5s | -30% |
| FCP | ~2.0s | < 1.8s | -10% |
| Bundle Size | ~250KB | < 200KB | -20% |
| Lighthouse Performance | ~70 | 90+ | +30% |

---

## Secao Tecnica

### Dependencias Necessarias

Nenhuma nova dependencia obrigatoria. Opcionais:
- `rollup-plugin-visualizer` para bundle analysis

### Compatibilidade

- Service Worker: Todos browsers modernos
- WebP: 95%+ coverage, fallback para PNG/JPG
- Preload/Prefetch: Suportado universalmente

### Testes de Performance

```bash
# Rodar Lighthouse localmente
npx lighthouse https://daton-esg-insight.lovable.app --view

# Analisar bundle
npm run build -- --mode analyze
```

### Monitoramento Continuo

Apos implementacao, monitorar via:
1. Chrome DevTools > Performance tab
2. PageSpeed Insights semanal
3. `webVitals.ts` reportando metricas em producao
