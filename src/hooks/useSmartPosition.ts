import { useState, useEffect, RefObject } from 'react';
import { TourPlacement } from '@/types/tour';

interface PositionConfig {
  preferred: TourPlacement;
  fallbacks?: TourPlacement[];
  padding?: number;
  offset?: number;
}

interface Position {
  top: number;
  left: number;
  placement: TourPlacement;
}

export function useSmartPosition(
  targetRef: RefObject<HTMLElement>,
  tooltipRef: RefObject<HTMLElement>,
  config: PositionConfig
): Position | null {
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const calculatePosition = () => {
      const target = targetRef.current;
      const tooltip = tooltipRef.current;
      if (!target || !tooltip) return null;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const padding = config.padding || 16;
      const offset = config.offset || 12;

      // Tentar todas as posições possíveis
      const placements = [config.preferred, ...(config.fallbacks || [])];
      
      for (const placement of placements) {
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'top':
            top = targetRect.top - tooltipRect.height - offset;
            left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
            break;
          case 'bottom':
            top = targetRect.bottom + offset;
            left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
            break;
          case 'left':
            top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
            left = targetRect.left - tooltipRect.width - offset;
            break;
          case 'right':
            top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
            left = targetRect.right + offset;
            break;
          case 'center':
            top = (viewport.height - tooltipRect.height) / 2;
            left = (viewport.width - tooltipRect.width) / 2;
            break;
        }

        // Ajustar para manter dentro do viewport
        left = Math.max(padding, Math.min(left, viewport.width - tooltipRect.width - padding));
        top = Math.max(padding, Math.min(top, viewport.height - tooltipRect.height - padding));

        // Verificar se a posição é válida (tooltip visível completamente)
        const isValid = 
          left >= padding &&
          left + tooltipRect.width <= viewport.width - padding &&
          top >= padding &&
          top + tooltipRect.height <= viewport.height - padding;

        if (isValid || placement === 'center') {
          return { top, left, placement: placement as TourPlacement };
        }
      }

      // Fallback para centro se nada funcionar
      return {
        top: (viewport.height - tooltipRect.height) / 2,
        left: (viewport.width - tooltipRect.width) / 2,
        placement: 'center' as TourPlacement,
      };
    };

    const updatePosition = () => {
      const newPosition = calculatePosition();
      if (newPosition) {
        setPosition(newPosition);
      }
    };

    updatePosition();

    // Recalcular em resize e scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [targetRef, tooltipRef, config]);

  return position;
}
