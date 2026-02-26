import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDemo } from '@/contexts/DemoContext';
import { getAllDemoMockData } from '@/data/demo';
import { createDemoQueryResolver } from '@/data/demo/queryResolver';
import { supabase } from '@/integrations/supabase/client';
import { triggerDemoBlocked } from '@/utils/demoGuard';
import { toast } from 'sonner';

// ─── Supabase write stub ──────────────────────────────────────────────────────
// Infinitely chainable PromiseLike that resolves to a no-op Supabase response.
// Absorbs all PostgREST filter calls (.eq, .neq, .in, .order, etc.) via Proxy.
const DEMO_OK_RESPONSE = {
  // Retorna um objeto para previnir crashes de TypeError: Cannot read properties of null (reading 'X')
  // em chamadas de Edge Functions ou RPCs que usam `if (data.success)` etc.
  data: { success: true, data: {} },
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
};

function createDemoWriteStub(): unknown {
  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol) {
      if (prop === 'then') {
        return (
          onfulfilled?: (v: unknown) => unknown,
          _onrejected?: (e: unknown) => unknown
        ) => Promise.resolve(DEMO_OK_RESPONSE).then(onfulfilled);
      }
      // Absorb all chained calls (.eq, .neq, .in, .order, .limit, .select, etc.)
      return () => stub;
    },
  };
  const stub = new Proxy({}, handler);
  return stub;
}

const WRITE_METHODS = new Set(['insert', 'update', 'upsert', 'delete']);
const STORAGE_WRITE_METHODS = new Set(['upload', 'remove', 'delete', 'createSignedUploadUrl']);

/**
 * Seeds and enforces mock data in demo mode.
 * Also overrides new query instances to avoid live queryFns for dynamic keys.
 * Intercepts all Supabase write operations and navigation away from /demo/*.
 *
 * Architecture note — two-phase setup:
 *   Sync phase (component body): seeds the React Query cache and patches
 *   queryClient.defaultQueryOptions BEFORE children render. This is critical
 *   because React fires useEffect bottom-up (children before parents), so by
 *   the time DemoDataSeeder's useEffect would run, Dashboard's React Query
 *   observers have already subscribed and scheduled live fetches.
 *
 *   Async phase (useEffect): applies the remaining side-effects that are safe
 *   to run after paint (Supabase proxies, toast suppressor, pushState, etc.)
 *   and handles cleanup on demo mode exit.
 */
export function DemoDataSeeder({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();

  // syncDone: prevents double-patching on re-renders before the effect's cleanup resets it.
  const syncDone = useRef(false);
  // seeded: guards the async phase (useEffect) from running more than once.
  const seeded = useRef(false);

  // Shared across both phases via refs.
  const resolverRef = useRef<ReturnType<typeof createDemoQueryResolver> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origDefaultQueryOptionsRef = useRef<((opts: unknown) => unknown) | null>(null);

  // ── Sync phase: runs during render, before any child component mounts ──────
  // setQueryData + defaultQueryOptions patch must happen here so that mock data
  // is already in cache when child useQuery hooks register their observers.
  if (isDemo && !syncDone.current) {
    const mockEntries = getAllDemoMockData();
    const resolver = createDemoQueryResolver(mockEntries);
    resolverRef.current = resolver;

    mockEntries.forEach(({ queryKey, data }) => {
      queryClient.setQueryData(queryKey, data);
    });

    // Patch defaultQueryOptions — called by RQ v5 on every observer setup
    // (every useQuery render). Overriding it here means our demo settings win
    // over any individual hook's options (refetchInterval, queryFn, etc.).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orig = (queryClient as any).defaultQueryOptions.bind(queryClient);
    origDefaultQueryOptionsRef.current = orig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (queryClient as any).defaultQueryOptions = (options: unknown) => {
      const merged = orig(options);
      return {
        ...merged,
        queryFn: async ({ queryKey }: { queryKey: readonly unknown[] }) =>
          resolver(queryKey),
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        retry: false,
      };
    };

    syncDone.current = true;
  }

  useEffect(() => {
    if (!isDemo || seeded.current) return;

    const resolveDemoQuery = resolverRef.current!;

    // ── Apply overrides to any queries already in the cache ───────────────────
    const applyDemoQueryOverrides = (query: unknown) => {
      const typedQuery = query as {
        queryKey?: readonly unknown[];
        options?: Record<string, unknown>;
        setOptions?: (options: Record<string, unknown>) => void;
      };

      const key = typedQuery.queryKey || [];
      if (!key.length) return;

      if (queryClient.getQueryData(key) === undefined) {
        queryClient.setQueryData(key, resolveDemoQuery(key));
      }

      if (typeof typedQuery.setOptions === 'function') {
        typedQuery.setOptions({
          ...(typedQuery.options || {}),
          queryFn: async () => resolveDemoQuery(key),
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          refetchInterval: false,
        });
      }
    };

    // Belt-and-suspenders: also set client-level defaults and apply to existing queries.
    queryClient.setDefaultOptions({
      queries: {
        queryFn: async ({ queryKey }) => resolveDemoQuery(queryKey),
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
      },
    });

    const queryCache = queryClient.getQueryCache();
    queryCache.getAll().forEach(applyDemoQueryOverrides);

    const unsubscribe = queryCache.subscribe((event) => {
      const typedEvent = event as { type?: string; query?: unknown };
      if (typedEvent.type === 'added' && typedEvent.query) {
        applyDemoQueryOverrides(typedEvent.query);
      }
    });

    // ── 2a. Toast success suppressor ─────────────────────────────────────────
    // The write stub resolves with { data: null, error: null }, which causes
    // onSuccess callbacks to fire and show spurious success toasts (e.g. "Cargo
    // criado com sucesso"). Suppress toast.success for a short window after each
    // intercepted write — long enough for the async onSuccess to fire (~50ms),
    // short enough not to affect unrelated success toasts.
    let suppressUntil = 0;
    const originalToastSuccess = toast.success;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (toast as any).success = (...args: Parameters<typeof toast.success>) => {
      if (Date.now() < suppressUntil) return;
      return originalToastSuccess(...args);
    };

    // ── 2b. Supabase write proxy ──────────────────────────────────────────────
    // Intercept .insert/.update/.upsert/.delete on any table.
    // Read operations (.select, .eq used in selects, etc.) pass through normally.
    const originalFrom = supabase.from.bind(supabase);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from = (relation: string) => {
      const realBuilder = originalFrom(relation as never);

      return new Proxy(realBuilder as object, {
        get(target, prop: string | symbol) {
          if (WRITE_METHODS.has(String(prop))) {
            return (..._args: unknown[]) => {
              suppressUntil = Date.now() + 2000;
              triggerDemoBlocked();
              return createDemoWriteStub();
            };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value = (target as any)[prop];
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };

    // ── 3. Supabase RPC proxy ─────────────────────────────────────────────────
    // RPCs used for reads are already served by React Query mock data.
    // Silently no-op all RPC calls without showing the modal (they're rarely
    // triggered by explicit user actions and can't be distinguished read vs write).
    const originalRpc = supabase.rpc.bind(supabase);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc = (..._args: unknown[]) =>
      createDemoWriteStub() as ReturnType<typeof supabase.rpc>;

    // ── 4. Edge function (functions.invoke) proxy ─────────────────────────────
    // supabase.functions.invoke() bypasses supabase.from entirely.
    // Silently no-op all invocations — many are read-type (AI insights, analytics)
    // so no modal is shown. Reads through React Query are already intercepted.
    const originalFunctionsInvoke = supabase.functions.invoke.bind(supabase.functions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.functions as any).invoke = (..._args: unknown[]) =>
      createDemoWriteStub() as ReturnType<typeof supabase.functions.invoke>;

    // ── 5. Storage write proxy ────────────────────────────────────────────────
    // Intercept file upload/delete operations — not covered by supabase.from proxy.
    const originalStorageFrom = supabase.storage.from.bind(supabase.storage);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.storage as any).from = (bucketId: string) => {
      const realBucket = originalStorageFrom(bucketId);
      return new Proxy(realBucket as object, {
        get(target, prop: string | symbol) {
          if (STORAGE_WRITE_METHODS.has(String(prop))) {
            return (..._args: unknown[]) => {
              suppressUntil = Date.now() + 2000;
              triggerDemoBlocked();
              return createDemoWriteStub();
            };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const value = (target as any)[prop];
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };

    // ── 6. Navigation interceptor ─────────────────────────────────────────────
    // Block React Router navigation (which uses pushState) to non-demo routes.
    const originalPushState = window.history.pushState.bind(window.history);

    window.history.pushState = (
      state: unknown,
      title: string,
      url?: string | URL | null
    ) => {
      const path = url == null ? '' : String(url);
      const allowed =
        path.startsWith('/demo') ||
        path.startsWith('/auth') ||
        path.startsWith('/onboarding') ||
        path.startsWith('#') ||
        path.includes('://') ||
        path === '';

      if (!allowed) {
        triggerDemoBlocked();
        return;
      }
      originalPushState(state, title, url);
    };

    seeded.current = true;

    // ── Cleanup: restore all patches when demo mode exits ─────────────────────
    return () => {
      unsubscribe();

      if (origDefaultQueryOptionsRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queryClient as any).defaultQueryOptions = origDefaultQueryOptionsRef.current;
        origDefaultQueryOptionsRef.current = null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from = originalFrom;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).rpc = originalRpc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.functions as any).invoke = originalFunctionsInvoke;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.storage as any).from = originalStorageFrom;
      window.history.pushState = originalPushState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (toast as any).success = originalToastSuccess;

      queryClient.setDefaultOptions({
        queries: {
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 30,
          refetchOnMount: true,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        },
      });

      seeded.current = false;
      syncDone.current = false;
    };
  }, [isDemo, queryClient]);

  return <>{children}</>;
}
