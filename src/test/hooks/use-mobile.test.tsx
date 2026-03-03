import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useIsMobile, useIsTablet, useIsDesktop, useBreakpointValue } from '@/hooks/use-mobile';

// Mock window.matchMedia
const createMatchMedia = (width: number) => (query: string) => ({
  matches: (() => {
    const match = query.match(/max-width:\s*(\d+)px/);
    if (match) {
      return width <= parseInt(match[1]);
    }
    const minMatch = query.match(/min-width:\s*(\d+)px/);
    if (minMatch) {
      return width >= parseInt(minMatch[1]);
    }
    return false;
  })(),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('use-mobile hooks', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    listeners = [];
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    listeners = [];
  });

  const setWindowWidth = (width: number) => {
    window.matchMedia = createMatchMedia(width) as any;
    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
  };

  describe('useIsMobile', () => {
    it('should return true when viewport width is less than 768px', () => {
      setWindowWidth(767);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false when viewport width is 768px or greater', () => {
      setWindowWidth(768);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return false when viewport width is greater than 768px', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should update when window is resized from desktop to mobile', () => {
      setWindowWidth(1024);
      const { result, rerender } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      setWindowWidth(500);
      rerender();
      expect(result.current).toBe(true);
    });

    it('should update when window is resized from mobile to desktop', () => {
      setWindowWidth(500);
      const { result, rerender } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      setWindowWidth(1024);
      rerender();
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true when viewport width is between 768px and 1023px', () => {
      setWindowWidth(900);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return true at lower boundary (768px)', () => {
      setWindowWidth(768);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return true just below upper boundary (1023px)', () => {
      setWindowWidth(1023);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('should return false when viewport width is less than 768px', () => {
      setWindowWidth(767);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });

    it('should return false when viewport width is 1024px or greater', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });

    it('should update when window is resized into tablet range', () => {
      setWindowWidth(500);
      const { result, rerender } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);

      setWindowWidth(800);
      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('useIsDesktop', () => {
    it('should return true when viewport width is 1280px or greater', () => {
      setWindowWidth(1280);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return true when viewport width is much larger', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false when viewport width is less than 1280px', () => {
      setWindowWidth(1279);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should return false on tablet size', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should return false on mobile size', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should update when window is resized to desktop size', () => {
      setWindowWidth(1024);
      const { result, rerender } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);

      setWindowWidth(1280);
      rerender();
      expect(result.current).toBe(true);
    });
  });

  describe('useBreakpointValue', () => {
    it('should return mobile value on mobile viewport', () => {
      setWindowWidth(500);
      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: 'mobile-value',
          tablet: 'tablet-value',
          desktop: 'desktop-value',
        })
      );
      expect(result.current).toBe('mobile-value');
    });

    it('should return tablet value on tablet viewport', () => {
      setWindowWidth(800);
      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: 'mobile-value',
          tablet: 'tablet-value',
          desktop: 'desktop-value',
        })
      );
      expect(result.current).toBe('tablet-value');
    });

    it('should return desktop value on desktop viewport', () => {
      setWindowWidth(1920);
      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: 'mobile-value',
          tablet: 'tablet-value',
          desktop: 'desktop-value',
        })
      );
      expect(result.current).toBe('desktop-value');
    });

    it('should work with numeric values', () => {
      setWindowWidth(500);
      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: 1,
          tablet: 2,
          desktop: 3,
        })
      );
      expect(result.current).toBe(1);
    });

    it('should work with object values', () => {
      setWindowWidth(800);
      const mobileObj = { size: 'small' };
      const tabletObj = { size: 'medium' };
      const desktopObj = { size: 'large' };

      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: mobileObj,
          tablet: tabletObj,
          desktop: desktopObj,
        })
      );
      expect(result.current).toBe(tabletObj);
    });

    it('should update when window is resized across breakpoints', () => {
      setWindowWidth(500);
      const { result, rerender } = renderHook(() =>
        useBreakpointValue({
          mobile: 'mobile',
          tablet: 'tablet',
          desktop: 'desktop',
        })
      );
      expect(result.current).toBe('mobile');

      setWindowWidth(800);
      rerender();
      expect(result.current).toBe('tablet');

      setWindowWidth(1920);
      rerender();
      expect(result.current).toBe('desktop');
    });

    it('should handle boundary conditions correctly', () => {
      // At 767px - mobile
      setWindowWidth(767);
      const { result: result1 } = renderHook(() =>
        useBreakpointValue({ mobile: 'M', tablet: 'T', desktop: 'D' })
      );
      expect(result1.current).toBe('M');

      // At 768px - tablet
      setWindowWidth(768);
      const { result: result2 } = renderHook(() =>
        useBreakpointValue({ mobile: 'M', tablet: 'T', desktop: 'D' })
      );
      expect(result2.current).toBe('T');

      // At 1279px - tablet
      setWindowWidth(1279);
      const { result: result3 } = renderHook(() =>
        useBreakpointValue({ mobile: 'M', tablet: 'T', desktop: 'D' })
      );
      expect(result3.current).toBe('T');

      // At 1280px - desktop
      setWindowWidth(1280);
      const { result: result4 } = renderHook(() =>
        useBreakpointValue({ mobile: 'M', tablet: 'T', desktop: 'D' })
      );
      expect(result4.current).toBe('D');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle rapid resize events correctly', () => {
      setWindowWidth(500);
      const { result, rerender } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate rapid resizes
      setWindowWidth(1000);
      rerender();
      setWindowWidth(500);
      rerender();
      setWindowWidth(1500);
      rerender();

      expect(result.current).toBe(false);
    });

    it('should work correctly when multiple hooks are used together', () => {
      setWindowWidth(800);
      const { result } = renderHook(() => ({
        mobile: useIsMobile(),
        tablet: useIsTablet(),
        desktop: useIsDesktop(),
      }));

      expect(result.current.mobile).toBe(false);
      expect(result.current.tablet).toBe(true);
      expect(result.current.desktop).toBe(false);
    });

    it('should handle undefined breakpoint values gracefully', () => {
      setWindowWidth(500);
      const { result } = renderHook(() =>
        useBreakpointValue({
          mobile: undefined,
          tablet: 'tablet',
          desktop: 'desktop',
        })
      );
      expect(result.current).toBe(undefined);
    });
  });
});