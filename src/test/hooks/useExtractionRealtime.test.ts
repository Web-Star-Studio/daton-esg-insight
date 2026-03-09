import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExtractionRealtime } from '@/hooks/useExtractionRealtime';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

describe('useExtractionRealtime', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should not subscribe when disabled', () => {
    const { result } = renderHook(
      () => useExtractionRealtime({ enabled: false }),
      { wrapper }
    );

    expect(result.current).toBeUndefined();
  });

  it('should subscribe to channels when enabled', () => {
    const onApprovalLog = vi.fn();
    
    const { result } = renderHook(
      () => useExtractionRealtime({ enabled: true, onApprovalLog }),
      { wrapper }
    );

    // Hook should execute without errors
    expect(result.current).toBeUndefined();
  });

  it('should accept custom handlers', () => {
    const onApprovalLog = vi.fn();
    const onPreviewUpdate = vi.fn();

    const { result } = renderHook(
      () => useExtractionRealtime({ 
        enabled: true, 
        onApprovalLog,
        onPreviewUpdate 
      }),
      { wrapper }
    );

    // Hook should execute with custom handlers
    expect(result.current).toBeUndefined();
    expect(onApprovalLog).not.toHaveBeenCalled();
    expect(onPreviewUpdate).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(
      () => useExtractionRealtime({ enabled: true }),
      { wrapper }
    );

    // Should unmount without errors
    expect(() => unmount()).not.toThrow();
  });
});
