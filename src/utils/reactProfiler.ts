/**
 * React Profiler Utility
 * Wraps components with performance profiling in development mode
 */

import React, { Profiler, ProfilerOnRenderCallback } from 'react';

// Store profiling data for analysis
interface ProfileData {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: Date;
}

const profileHistory: ProfileData[] = [];
const MAX_HISTORY = 100;

// Threshold for logging slow renders (in ms)
const SLOW_RENDER_THRESHOLD = 16; // ~60fps

/**
 * Profiler callback that logs slow renders in development
 */
const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  const data: ProfileData = {
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    timestamp: new Date(),
  };
  
  // Store in history
  profileHistory.push(data);
  if (profileHistory.length > MAX_HISTORY) {
    profileHistory.shift();
  }
  
  // Log slow renders in development
  if (process.env.NODE_ENV === 'development' && actualDuration > SLOW_RENDER_THRESHOLD) {
    console.warn(
      `⚠️ Slow render: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`
    );
  }
};

/**
 * HOC to wrap a component with React Profiler
 */
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string
): React.FC<P> {
  // Only wrap in development
  if (process.env.NODE_ENV !== 'development') {
    return Component as React.FC<P>;
  }
  
  const WrappedComponent: React.FC<P> = (props: P) => {
    return React.createElement(
      Profiler,
      { id, onRender: onRenderCallback },
      React.createElement(Component, props)
    );
  };
  
  WrappedComponent.displayName = `withProfiler(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

/**
 * Get profiling statistics for a component
 */
export function getProfileStats(id: string): {
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  mountCount: number;
  updateCount: number;
} | null {
  const componentData = profileHistory.filter(p => p.id === id);
  
  if (componentData.length === 0) {
    return null;
  }
  
  const durations = componentData.map(p => p.actualDuration);
  const sum = durations.reduce((acc, val) => acc + val, 0);
  
  return {
    count: componentData.length,
    avgDuration: sum / componentData.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
    mountCount: componentData.filter(p => p.phase === 'mount').length,
    updateCount: componentData.filter(p => p.phase === 'update').length,
  };
}

/**
 * Get all profiling history
 */
export function getProfileHistory(): ProfileData[] {
  return [...profileHistory];
}

/**
 * Clear profiling history
 */
export function clearProfileHistory(): void {
  profileHistory.length = 0;
}

/**
 * Get slow renders (above threshold)
 */
export function getSlowRenders(threshold: number = SLOW_RENDER_THRESHOLD): ProfileData[] {
  return profileHistory.filter(p => p.actualDuration > threshold);
}
