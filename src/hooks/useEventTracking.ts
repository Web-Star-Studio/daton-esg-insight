import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { getRoutePattern } from "@/lib/routePattern";
import {
  trackEvent,
  type EventType,
  type TrackEventArgs,
} from "@/lib/eventTracking";

export type { EventType, TrackEventArgs };

/**
 * Wrapper de `trackEvent` que injeta o `route_pattern` derivado da rota
 * atual via `useLocation`. Em código não-React (services/utils),
 * importe `trackEvent` direto de `@/lib/eventTracking`.
 */
export const useEventTracking = () => {
  const location = useLocation();

  const track = useCallback(
    (args: TrackEventArgs) =>
      trackEvent({
        ...args,
        routePattern: args.routePattern ?? getRoutePattern(location.pathname),
      }),
    [location.pathname],
  );

  return { track };
};
